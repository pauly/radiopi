#!/bin/sh

# init.d file
# so copy this file to /etc/init.d/ and restart your pi
# see https://github.com/pauly/radiopi

SERVER="/home/pi/radiopi/bin/radiopi"
PID=`ps -aefw | grep "$SERVER" | grep -v " grep " | awk '{print $2}'`

do_start() {
  if [ ! $PID ] ; then
    echo -n "Starting $SERVER: "
    $SERVER > /tmp/radiopi.out 2> /tmp/radiopi.err &
    RETVAL=$?
  else
    echo "$SERVER is already running (pid is $PID)."
    RETVAL=1
  fi
}
do_stop() {
  echo -n "Stopping $SERVER: "
  kill -9 $PID > /dev/null 2>&1
  RETVAL=$?
}

case "$1" in
  start)
    do_start
    ;;
  stop)
    do_stop
    ;;
  restart)
    do_stop
    do_start
    ;;
  *)
    echo "Usage: $0 {start|stop|restart}"
    RETVAL=1
esac
exit $RETVAL
