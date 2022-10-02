# python program to control relays via a serial port, which, in turn, control
# the power to an Akai amplifier and also turn up/down its volume
#
# For details of command line options:
#   akai_amp -h
# The reset command consists of a "power off" followed by three "volume down 3" commands
#
# Exit codes:
#   0 - normal successful completion
#   1 - an error
#   2 - unable to acquire the lock (another instance of the program is running)

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
# where the lock file is stored
LOCK_FILE = os.path.join (HOME, ".akai_amp.lock")
# the length of time to turn the motor for a "volume" command
VOLUME_TURN_LENGTH_SECS = 1

def errExit (msg, status):
    '''
    Print an error message and exit.
    
    Parameters:
    msg (string): the message to print
    status (int): the program exit code
    '''
    print (msg, file=sys.stderr)
    sys.exit (status)
    
def makeBytes (int_array):
    '''
    Make a bytes object from an array of integer ASCII values.
    
    Parameters:
    int_array (int []): An array of ASCII values encoded as integers
    
    Returns:
    bytes: the array as a bytes object
    '''
    return bytes(bytearray(int_array))
    
def receive (ser, max_len):
    '''
    Receive data from the serial port.
    
    Parameters:
    ser (serial.Serial): the opened serial port (from pySerial package)
    max_len: the maximum number off bytes to expect
    
    Returns: A bytes object containing the received data, which may be
             shorter than max_len if the serial port times out
    '''
    rx_array = b''
    while True:
        rx_byte = ser.read (size=1)
        if len (rx_byte) <= 0:
            return rx_array
        rx_array = rx_array + rx_byte
        if len (rx_array) >= max_len:
            return rx_array

def cmd_status (ser):
    '''
    Print the status of the relays on the relay card
    
    Parameters:
    ser (serial.Serial): the opened serial port (from pySerial package)
    '''
    ser.write (makeBytes ([0xff]))
    rx_data = receive (ser, 100)
    print ("Relay status:")
    print (str(rx_data, "UTF-8"))

def cmd_power (ser, state):
    '''
    Turn the power relay on or off
    
    Parameters:
    ser (serial.Serial): the opened serial port (from pySerial package)
    state (string): "on" or "off"
    '''
    if state == "on":
        msg = [0xa0, 0x01, 0x01, 0xa2]
    elif state == "off":
        msg = [0xa0, 0x01, 0x00, 0xa1]
    else:
        errExit ("Unrecognised state for 'power' command: " + state, 1)
    ser.write (makeBytes (msg))
    
def cmd_volume (ser, state, amount):
    '''
    Use the motor driver relays to turn the volume up or down
    
    Parameters:
    ser (serial.Serial): the opened serial port (from pySerial package)
    state (string): "up" or "down"
    amount (int): the length of time to turn the volume motor
    '''
    # TODO - work out how to use the relays to drive the motor
    #        for the moment just turn the relays on/off (ignore state)
    ch3_on_msg =  [0xa0, 0x03, 0x01, 0xa4]
    ch4_on_msg =  [0xa0, 0x04, 0x01, 0xa5]
    ch3_off_msg = [0xa0, 0x03, 0x00, 0xa3]
    ch4_off_msg = [0xa0, 0x04, 0x00, 0xa4]
    ser.write (makeBytes (ch3_on_msg))
    ser.write (makeBytes (ch4_on_msg))
    time.sleep (amount * VOLUME_TURN_LENGTH_SECS)
    ser.write (makeBytes (ch3_off_msg))
    ser.write (makeBytes (ch4_off_msg))

# process the command line to find out what to do
parser = argparse.ArgumentParser()
parser.add_argument("command", choices=["power", "volume", "reset", "status"],
                    help="what you want the program to do: power, volume, status or reset")
parser.add_argument("state", choices=["on", "up", "off", "down"], default="off", nargs="?",
                    help="'power' command: 'on' or 'off'; 'volume' command: 'up' or 'down'; 'reset' command: not used")
parser.add_argument("amount", choices=[1, 2, 3], default=1, type=int, nargs="?",
                    help="'volume' command: the amount to turn up/down by; other commands: not used")
parser.add_argument("--wait_for_lock", action="store_true", default=False,
                    help="Wait for the lock to be available rather than exiting with an error if it's not available")
parser.add_argument("--serial_port", default="/dev/ttyUSB0",
                    help="The serial port to use")
args = parser.parse_args()
# the required action is now stored in args.command, args.state and args.amount
# optional parameters: args.wait_for_lock either True or False
#                      args.serial_port either "default" or the serial port to use

# try to claim the lock
if args.wait_for_lock:
    lock = FileLock(LOCK_FILE)
else:
    lock = FileLock(LOCK_FILE, timeout=0)
try:
    with lock.acquire():
        # try to open the serial port
        try:
            with serial.Serial(args.serial_port, 9600, timeout=1, parity=serial.PARITY_NONE) as ser:
                if args.command == "status":
                    cmd_status (ser)
                elif args.command == "power":
                    cmd_power (ser, args.state)
                elif args.command == "volume":
                    cmd_volume (ser, args.state, args.amount)
                elif args.command == "reset":
                    cmd_power (ser, "off")
                    time.sleep (0.2)
                    cmd_volume (ser, "down", 10)
                else:
                    errExit ("Internal software error: command = " + args.command, 1)
        except SerialException:
            errExit ("Unable to open serial port: " + args.serial_port, 1)
except Timeout:
    errExit ("Another instance of this application currently holds the lock", 2)

# normal succesful completion
sys.exit (0)
