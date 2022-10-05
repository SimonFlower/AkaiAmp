#!/bin/python
#
# python program to control relays via a serial port, which, in turn, control
# the power to an Akai amplifier and also turn up/down its volume
#
# For details of command line options:
#   akai_amp -h
# The reset command turns off all relays, then does three "volume down 3" commands
# to turn the volume control right down.
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
# the length of time to "turn" the motor for a "volume" command
VOLUME_TURN_LENGTH_SECS = 1
# a delay between sending serial commands to the relay card
# without this delay the card misses commands
INTRA_CMD_SER_DELAY_SECS = 0.1
# codes to turn on and off the individual relays
CH1_ON_MSG =     [0xa0, 0x01, 0x01, 0xa2]
CH1_OFF_MSG =    [0xa0, 0x01, 0x00, 0xa1]
CH2_ON_MSG =     [0xa0, 0x02, 0x01, 0xa3]
CH2_OFF_MSG =    [0xa0, 0x02, 0x00, 0xa2]
CH3_ON_MSG =     [0xa0, 0x03, 0x01, 0xa4]
CH3_OFF_MSG =    [0xa0, 0x03, 0x00, 0xa3]
CH4_ON_MSG =     [0xa0, 0x04, 0x01, 0xa5]
CH4_OFF_MSG =    [0xa0, 0x04, 0x00, 0xa4]
STATUS_REQ_MSG = [0xff]


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
    ser.write (makeBytes (STATUS_REQ_MSG))
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
        ser.write (makeBytes (CH1_ON_MSG))
    elif state == "off":
        ser.write (makeBytes (CH1_OFF_MSG))
    else:
        errExit ("Unrecognised state for 'power' command: " + state, 1)
    
def cmd_volume (ser, state, amount):
    '''
    Use the motor driver relays to turn the volume up or down
    
    Parameters:
    ser (serial.Serial): the opened serial port (from pySerial package)
    state (string): "up" or "down"
    amount (int): the length of time to turn the volume motor
    '''
    if state == "up":
        ser.write (makeBytes (CH3_ON_MSG))
        time.sleep (INTRA_CMD_SER_DELAY_SECS)
        ser.write (makeBytes (CH4_OFF_MSG))
    else:
        ser.write (makeBytes (CH3_OFF_MSG))
        time.sleep (INTRA_CMD_SER_DELAY_SECS)
        ser.write (makeBytes (CH4_ON_MSG))
    time.sleep (amount * VOLUME_TURN_LENGTH_SECS)
    ser.write (makeBytes (CH3_OFF_MSG))
    time.sleep (INTRA_CMD_SER_DELAY_SECS)
    ser.write (makeBytes (CH4_OFF_MSG))

def cmd_reset (ser, state):
    '''
    Reset the relays
    
    Parameters:
    ser (serial.Serial): the opened serial port (from pySerial package)
    state (string): set to "all" to turn the volume right down, anything else just reset the relays
    '''
    ser.write (makeBytes (CH1_OFF_MSG))
    time.sleep (INTRA_CMD_SER_DELAY_SECS)
    ser.write (makeBytes (CH2_OFF_MSG))
    time.sleep (INTRA_CMD_SER_DELAY_SECS)
    ser.write (makeBytes (CH3_OFF_MSG))
    time.sleep (INTRA_CMD_SER_DELAY_SECS)
    ser.write (makeBytes (CH4_OFF_MSG))
    if state == "all":
        time.sleep (INTRA_CMD_SER_DELAY_SECS)
        cmd_volume (ser, "down", 10)


# process the command line to find out what to do
parser = argparse.ArgumentParser()
parser.add_argument("command", choices=["power", "volume", "reset", "status"],
                    help="what you want the program to do: power, volume, status or reset")
parser.add_argument("state", choices=["on", "up", "off", "down", "all"], default="off", nargs="?",
                    help="'power' command: 'on' or 'off'; 'volume' command: 'up' or 'down'; 'reset' command: 'all' or not used")
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
                    cmd_reset (ser, args.state)
                else:
                    errExit ("Internal software error: command = " + args.command, 1)
        except SerialException:
            errExit ("Unable to open serial port: " + args.serial_port, 1)
except Timeout:
    errExit ("Another instance of this application currently holds the lock", 2)

# normal succesful completion
sys.exit (0)
