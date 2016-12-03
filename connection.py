#!/usr/bin/env python3
import sys
import os
import subprocess
from time import sleep
from mpd import MPDClient
from contextlib import contextmanager
from mutagen.id3 import ID3, POPM, TCON
from mutagen.easyid3 import EasyID3
import tagr

client = MPDClient()

@contextmanager
def connection():
    try:
        client.connect('localhost', 6600)
    except:
        pass
    finally:
        yield
    try:
        client.close()
        client.disconnect()
    except:
        pass

