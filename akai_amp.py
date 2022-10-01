# python program to control relays via a serial port, which, in turn, control
# the power to an Akai amplifier and also turn up/down its volume
#
# Dependencies:
#   pip install filelock
#   pip install pyserial
#
# Command line:
#   akai_amp power <on|off>
#   akai_amp volume <up|down> [1|2|3]
#   akai_amp reset
# The reset command is a "power off" followed by three "volume down 3" commands
#
# Exit codes:
#   0 - normal successful completion
#   1 - an error
#   2 - unable to acquire the lock

import sys
import os
import argparse
import time
from os.path import expanduser
from filelock import Timeout, FileLock
import serial
import serial.tools.list_ports
from serial.serialutil import SerialException

# constant configuration
HOME = expanduser("~")
LOCK_FILE = os.path.join (HOME, ".akai_amp.lock")

# process the command line to find out what to do
parser = argparse.ArgumentParser()
parser.add_argument("command", choices=["power", "volume", "reset"],
                    help="what you want the program to do: power, volume or reset")
parser.add_argument("state", choices=["on", "up", "off", "down"], default="off", nargs="?",
                    help="'power' command: 'on' or 'off'; 'volume' command: 'up' or 'down'; 'reset' command: not used")
parser.add_argument("amount", choices=[1, 2, 3], default=1, type=int, nargs="?",
                    help="'volume' command: the amount to turn up/down by; other commands: not used")
parser.add_argument("--wait_for_lock", action="store_true", default=False,
                    help="Wait for the lock to be available rather than exiting with an error if it's not available")
parser.add_argument("--serial_port",
                    help="The serial port to use")
args = parser.parse_args()
# the required action is now stored in args.command, args.state and args.amount
# optional parameters: args.wait_for_lock either True or False
#                      args.serial_port either "default" or the serial port to use

# if neccessary, find the default serial port
if not args.serial_port:
    ports = serial.tools.list_ports.comports(include_links=False)
    if len (ports) <= 0:
        print ("No serial ports found on this computer")
        sys.exit (1)
    serial_port = ports[0].device
    print ("Default port: " + serial_port)
else:
    serial_port = args.serial_port

# try to claim the lock
if args.wait_for_lock:
    lock = FileLock(LOCK_FILE)
else:
    lock = FileLock(LOCK_FILE, timeout=0)
try:
    with lock.acquire():
        # try to open the serial port
        try:
            with serial.Serial(serial_port, 9600, timeout=0, parity=serial.PARITY_EVEN):
                pass
        except SerialException:
            print ("Unable to open serial port: " + serial_port)
            sys.exit (1)
except Timeout:
    print("Another instance of this application currently holds the lock")
    sys.exit (2)

# normal succesful completion
sys.exit (0)
