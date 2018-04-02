#!/bin/bash
/usr/bin/mpc clear
/usr/bin/mpc add _incoming
/usr/bin/mpc shuffle
/usr/bin/mpc rm _incoming 2>/dev/null # may not exist
/usr/bin/mpc save _incoming

/usr/bin/mpc listall | sort -R | head -200 | grep -v _spoken | grep -v _classical | /usr/bin/mpc add
/usr/bin/mpc add _incoming
/usr/bin/mpc shuffle
/home/pi/radiopi/party.py
/usr/bin/mpc rm _now_playing 2>/dev/null # may not exist
/usr/bin/mpc save _now_playing
/usr/bin/mpc play
