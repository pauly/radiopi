#!/usr/bin/env python3

'''
Tag the currently playing song on mpd
'''

__copyright__ = 'Copyright 2016 Paul Clarke'
__licence__ = 'GPL'

import sys
from connection import connection, client
from tagr import tag_it, untag_it

with connection():
    print(client.currentsong())
    file = '/mnt/share/' + client.currentsong()['file']
    tag = None
    if len(sys.argv) == 1:
        tag_it(file, tag)
    if len(sys.argv) == 2:
        tag = sys.argv[1]
        tag_it(file, tag)
    if len(sys.argv) == 3:
        tag = sys.argv[2]
        untag_it(file, tag)

