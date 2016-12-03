#!/usr/bin/env python3

'''
ID3 tagging and rating tools
'''

__copyright__ = 'Copyright 2016 Paul Clarke'
__licence__ = 'GPL'

import sys
from os import path, listdir, rename, makedirs
from mutagen.id3 import ID3, POPM, TCON, ID3NoHeaderError
from mutagen.easyid3 import EasyID3
import json
from re import findall, sub

RATING_STEP = 32
RECURSE = True
baseFolder = '/mnt/share'

def save_tags(tag_weight):
    with open('tags.json', 'w') as outfile:
        json.dump(tag_weight, outfile)

def load_tags():
    try:
        with open('tags.json') as data_file:    
            return json.load(data_file)
    except:
        e = sys.exc_info()[0]
        print('error loading tags', e, sys.exc_info())
        return dict(Pop=64)

def get_rating(file):
    try:
        audio = ID3(file)
        for frame in audio.values():
            if frame.FrameID == 'POPM':
                return getattr(frame, 'rating', 0)
    except ID3NoHeaderError:
        print(file, 'not mp3')
    return 0

def rate_it(file, direction, recurse = True):
    if path.isdir(file):
        if recurse == False:
            print(file, 'is a dir, but not recursing, try', sys.argv[0], file, tag)
            return
        for realFile in listdir(file):
            rate_it(file + '/' + realFile, direction, RECURSE)
        return

    delta = RATING_STEP
    rating = 128
    count = 1
    if (direction < 0):
        delta = delta * -1
    audio = ID3(file)
    print('rating', audio.getall('POPM'))
    for frame in audio.values():
        if frame.FrameID == 'POPM':
            count = getattr(frame, 'count', 0)
            rating = getattr(frame, 'rating', 0)
            break
    rating = rating + delta
    if (rating < 0):
        rating = 0
    print('rating is now', rating, 'and count', count)
    audio.add(POPM(email='no@email', rating=rating, count=count))
    audio.save()

    tag_weight = load_tags()
    for tag in get_tags(file):
        print(tag, delta)
        if tag not in tag_weight.keys():
            tag_weight[tag] = 128
        tag_weight[tag] += delta
    print(tag_weight)
    save_tags(tag_weight)
    return rating

def ucfirst(tag):
    return tag[0].upper() + tag[1:]

def get_tags(file):
    tags = []
    try:
        audio = ID3(file)
        for frame in audio.values():
            if frame.FrameID == 'TCON':
                tags = getattr(frame, 'text', 0)
    except ID3NoHeaderError:
        print(file, 'not mp3')
    for i in range(len(tags)):
        tags[i] = tags[i].rstrip()
    tags.sort()
    return tags

def tag_it(file, tag = None, recurse = True):
    if path.isdir(file):
        if recurse == False:
            print(file, 'is a dir, but not recursing, try', sys.argv[0], file, tag)
            return
        for realFile in listdir(file):
            tag_it(file + '/' + realFile, tag, RECURSE)
        return

    tags = get_tags(file)
    if tag == None:
        return tags
    tag = ucfirst(tag)
    if tag not in tags:
        tags.append(tag)
        tags.sort()
    audio = ID3(file)
    audio.add(TCON(encoding=3, text=tags))
    audio.save()
    print('now', tags)

def untag_it(file, tag = None, recurse = True):
    if path.isdir(file):
        if recurse == False:
            print(file, 'is a dir, but not recursing, try', sys.argv[0], file, tag)
            return
        for realFile in listdir(file):
            untag_it(file + '/' + realFile, tag, RECURSE)
        return

    tags = get_tags(file)
    if tag != None:
        tag = ucfirst(tag)
        for i in range(len(tags) - 1, -1, -1):
            print(i, tags[i], '==', tag)
            if tags[i] == tag:
                print('deleting', i)
                del tags[i]
        audio = ID3(file)
        audio.add(TCON(encoding=3, text=tags))
        audio.save()
    print('now', tags)
    return tags

def folderify(name):
    return sub('/', '', ', '.join(name))

def rename_by_tag(file, tag = None, value = None, recurse = True):
    if path.isdir(file):
        for realFile in listdir(file):
            rename_by_tag(file + '/' + realFile, tag, value, True)
        return

    file = sub(r'\/+', '/', file)
    audio = EasyID3(file)
    # print(EasyID3.valid_keys.keys())

    if tag != None and value != None:
        print('changing', tag, 'of', file, 'to', value)
        audio[tag] = value
        audio.save()
        return

    # dict_keys(['musicbrainz_discid', 'musicbrainz_albumtype', 'asin', 'tracknumber', 'version', 'musicbrainz_trmid', 'discnumber', 'musicbrainz_releasegroupid', 'isrc', 'genre', 'date', 'musicbrainz_albumstatus', 'website', 'title', 'performer:*', 'replaygain_*_peak', 'titlesort', 'musicbrainz_workid', 'album', 'composer', 'musicip_fingerprint', 'author', 'albumsort', 'catalognumber', 'musicbrainz_releasetrackid', 'musicbrainz_artistid', 'releasecountry', 'discsubtitle', 'musicip_puid', 'musicbrainz_albumid', 'language', 'barcode', 'mood', 'arranger', 'encodedby', 'musicbrainz_albumartistid', 'conductor', 'copyright', 'musicbrainz_trackid', 'originaldate', 'acoustid_fingerprint', 'artistsort', 'composersort', 'acoustid_id', 'media', 'performer', 'albumartistsort', 'bpm', 'length', 'artist', 'organization', 'replaygain_*_gain', 'compilation', 'lyricist'])
    # print(audio)
    artist = 'Unknown'
    if 'artist' in audio:
        artist = audio['artist']
    albumArtist = artist
    if 'compilation' in audio:
        if '1' in audio['compilation']:
            # print('compilation', audio['compilation'], 'so setting various artists')
            albumArtist = ['Various']
    if 'albumartistsort' in audio:
        albumArtist = audio['albumartistsort']
    track = 0
    if 'tracknumber' in audio:
        track = int(findall(r'\d+', audio['tracknumber'][0])[0]) or 0
    album = ['Unknown']
    if 'album' in audio:
        album = audio['album']
    title = ['Unknown']
    if 'title' in audio:
        title = audio['title']
    newFolder = '/'.join([baseFolder, folderify(albumArtist), folderify(album)])
    try:
        makedirs(newFolder)
    except:
        pass
    newFile = ' - '.join(['%02d' % track, folderify(artist), folderify(title)]) + '.mp3'
    newPath = '/'.join([newFolder, newFile])
    if file != newPath:
        print('renaming,', file, newPath)
        rename(file, newPath)

if __name__ == '__main__':

    file = sys.argv[1]
    tag = None
    print(sys.argv)
    if len(sys.argv) == 3:
        tag = sys.argv[2]
        tag_it(file, tag)
    if len(sys.argv) == 4:
        tag = sys.argv[3]
        untag_it(file, tag)
