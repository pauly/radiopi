#!/usr/bin/env python3

'''
Do party shuffle type stuff
'''

__copyright__ = 'Copyright 2016 Paul Clarke'
__licence__ = 'GPL'

import sys
from random import randint
from connection import connection, client
from tagr import tag_it, get_tags, get_rating, load_tags

ignore = ('NSFK', 'Podcast', 'Classical', 'Remix', 'Audiobook', 'Spoken Word', 'Live')
tag_weight = load_tags()

with connection():
    playlist = client.playlist()
    max = min(len(playlist), 25)
    for i in range(max, 0, -1):
        file = playlist[i].replace('file: ', '')
        file = '/mnt/share/' + file
        tags = get_tags(file)
        for tag in ignore:
            if tag.lower() in map(str.lower, tags):
                print('deleting', file, 'because', tag)
                client.delete(i)
        rating = get_rating(file)
        for tag in tags:
            roll = randint(0, 255)
            total = rating
            try:
                total += tag_weight[tag]
            except KeyError:
                pass
            print(tag, 'rated', rating, 'total', total, 'roll', roll)
            if total > roll:
                break
            print('deleting', file, 'because', rating, 'and', tag_weight)
        print(file, tags)

