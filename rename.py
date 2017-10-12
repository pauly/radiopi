#!/usr/bin/env python3

'''
Rename an mp3 based on the tags
'''

__copyright__ = 'Copyright 2016 Paul Clarke'
__licence__ = 'GPL'

import sys
from connection import connection
from tagr import rename_by_tag

with connection():
    if len(sys.argv) == 2:
        rename_by_tag(sys.argv[1])
    if len(sys.argv) == 4:
        rename_by_tag(sys.argv[1], sys.argv[2], sys.argv[3])
    if len(sys.argv) == 5:
        rename_by_tag(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4])

