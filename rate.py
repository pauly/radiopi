#!/usr/bin/env python3

'''
Rate the currently playing song on mpd
'''

__copyright__ = 'Copyright 2016 Paul Clarke'
__licence__ = 'GPL'

import sys
from connection import connection, client
from tagr import rate_it

with connection():
    file = '/mnt/share/' + client.currentsong()['file']
    print(len(sys.argv), sys.argv)
    if len(sys.argv) == 3:
        if 'down' in sys.argv:
            rate_it(sys.argv[1], -1)
    if len(sys.argv) == 2:
        if 'down' in sys.argv:
            rate_it(file, -1)
        else:
            rate_it(sys.argv[1], 1)
    if len(sys.argv) == 1:
        rate_it(file, 1)
