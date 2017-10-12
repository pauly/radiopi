#!/usr/bin/env python3
import sys
import os
import subprocess
from time import sleep
import pifacecad
from mpd import MPDClient
from contextlib import contextmanager
from mutagen.id3 import ID3, POPM, TCON
from mutagen.easyid3 import EasyID3
import tagr
from connection import connection, client
import json
import random

UPDATE_INTERVAL = 10 # seconds

mode = 'playing'

def save_favourites(favourites):
    with open('favourites.json', 'w') as outfile:
        json.dump(favourites, outfile)

def load_favourites():
    try:
        with open('favourites.json') as data_file:    
            return json.load(data_file)
    except:
        e = sys.exc_info()[0]
        print('error loading favourites', e, sys.exc_info())
        return dict()

def write_on_line_one(text):
    cad.lcd.set_cursor(0, 0)
    try:
        cad.lcd.write('{0: <16}\n'.format(text))
    except:
        pass

def write_on_line_two(text):
    cad.lcd.set_cursor(0, 1)
    try:
        cad.lcd.write('{0: <14}\n'.format(text))
    except:
        pass

def show_sysinfo():
    global mode
    while True:
        if mode != 'recording':
            with connection():
                try:
                    write_on_line_one(client.currentsong()['artist'])
                except KeyError:
                    write_on_line_one('hmm, unknown')
            with connection():
                try:
                    write_on_line_two(client.currentsong()['title'])
                except KeyError:
                    write_on_line_one('hmm, unknown')
            sleep(UPDATE_INTERVAL)

def record_favourite(event):
    global mode
    if mode == 'recording':
        mode = 'playing'
        write_on_line_two('cancel')
    else:
        mode = 'recording'
        write_on_line_two('recording')

def favourite(event):
    global mode
    favourites = load_favourites()
    if mode == 'recording':
        mode = 'playing'
        print(event.ir_code)
        write_on_line_one(event.ir_code)
        with connection():
            write_on_line_two('FAVE: ' + client.currentsong()['artist'])
        with connection():
            favourites[event.ir_code] = client.currentsong()['artist']
        save_favourites(favourites)
    else:
        print('play track by artist saved as', event.ir_code)
        try:
            print(event.ir_code, favourites[event.ir_code])
            play_now(favourites[event.ir_code])
        except KeyError:
            print('nothing saved as', event.ir_code)
            pass
    print(favourites)

def repeat(event):
    write_on_line_one('repeat:')
    with connection():
        write_on_line_two(client.currentsong()['artist'])
        for index, song in enumerate(client.playlistsearch('artist', client.currentsong()['artist'])):
            with connection():
                new_pos = index + 1
                print('move', song['id'], 'to', new_pos)
                client.moveid(song['id'], new_pos)
        print('now play at position 1')
        client.play(1)

def shuffle(event):
    write_on_line_one('shuffle!')
    with connection():
        client.shuffle()
        client.next()

def print_ir_code(event):
    write_on_line_one(event.ir_code)
    print(event.ir_code)
    with connection():
        client.status()

def next_track(event):
    write_on_line_one('skip >>')
    with connection():
        client.next()

def pause(event):
    write_on_line_one('paused ||')
    with connection():
        client.pause()

def rate_up(event):
    rating = rate_it(1)
    write_on_line_one('rate it ' + str(rating))

def rate_down(event):
    rating = rate_it(-1)
    write_on_line_one('hate it ' + str(rating))
    next_track(event)

def rate_it(delta):
    rating = None
    file = None
    with connection():
        file = '/mnt/share/' + client.currentsong()['file']
    if file != None:
        tagr.rate_it(file, delta)
    return rating

def stats(event):
    with connection():
        print(client.stats())

def play_now(artist):
    with connection():
        try:
            tracks = client.find('artist', artist)
        except:
            pass
    if len(tracks):
        print(len(tracks), 'tracks')
        track = random.choice(tracks)['file']
        print('so adding', track)
        with connection():
            id = client.addid(track)
    if id:
        print('added track, id is', id)
        with connection():
            client.playid(id)

def reboot(event):
    subprocess.call(['sudo', 'reboot'])

if __name__ == '__main__':
    cad = pifacecad.PiFaceCAD()
    cad.lcd.blink_off()
    cad.lcd.cursor_off()

    with connection():
        print('version', client.mpd_version)

    listener = pifacecad.IREventListener(prog='radio')
    listener.register('KEY_INFO', stats)
    listener.register('KEY_FASTFORWARD', next_track)
    listener.register('KEY_PLAY', pause)
    listener.register('KEY_MUTE', pause)
    listener.register('KEY_EJECTCD', reboot)
    listener.register('KEY_UP', rate_up)
    listener.register('KEY_DOWN', rate_down)
    listener.register('KEY_RECORD', record_favourite)
    listener.register('KEY_1', favourite)
    listener.register('KEY_2', favourite)
    listener.register('KEY_3', favourite)
    listener.register('KEY_4', favourite)
    listener.register('KEY_5', favourite)
    listener.register('KEY_6', favourite)
    listener.register('KEY_7', favourite)
    listener.register('KEY_8', favourite)
    listener.register('KEY_9', favourite)
    listener.register('KEY_0', favourite)
    listener.register('KEY_MEDIA_REPEAT', repeat)
    listener.register('KEY_SHUFFLE', shuffle)

    # listener.register('WILDCARD', print_ir_code)
    listener.register('KEY_REWIND', print_ir_code)
    listener.register('KEY_MENU', print_ir_code)
    listener.register('KEY_RADIO', print_ir_code)
    listener.register('KEY_EQUAL', print_ir_code)
    listener.register('KEY_TIME', print_ir_code)
    listener.activate()

    os.system('/bin/bash -c \'[[ -z $(pgrep mpdas) ]]\' && /usr/local/bin/mpdas &')
    print(os.system('ps faux | grep mp'))

    if 'clear' in sys.argv:
        cad.lcd.clear()
        cad.lcd.display_off()
        cad.lcd.backlight_off()
    else:
        cad.lcd.backlight_on()
        show_sysinfo()
