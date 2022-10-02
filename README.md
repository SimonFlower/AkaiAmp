Akai Amp Project
================

An Akai AM75 Amp has had its volume control changed to use
a motor controlled potentiometer. This project uses hardware
controlled by a Rapsberry Pi 3B+ and a relay card to control
the volume potentiometer and also to switch the mains for
the amplifier.

The software runs on a Rasperry Pi 3B+ that has had HiFiBerryOS
installed: 
https://www.hifiberry.com/hifiberryos/
https://github.com/hifiberry/hifiberry-os

Project dependencies
--------------------

The CH341 USB to serial driver.

Python 3.

The following python modules:
        - pip install filelock
        - pip install pyserial


Relay card details
------------------

http://www.chinalctech.com/cpzx/32.html

This boards uses the CH340 UART to USB chip, which needs a driver
(https://learn.sparkfun.com/tutorials/how-to-install-ch340-drivers/all).
The driver seems to be installed on HiFiBerryOS, but the card was not
recognised when plugged in before trying:

        sudo depmod -a
        
As described in the driver installation manual:
https://github.com/juliagoda/CH341SER

The default baud rate is 9600 bps.

Commands for relay operation or status inquiry (in HEX):
- Open 1st channel USB: A0 01 01 A2
- Close 1st channel USB: A0 01 00 A1
- Open 2nd channel USB: A0 02 01 A3
- Close 2nd channel USB: A0 02 00 A2
- Open 3rd channel USB: A0 03 01 A4
- Close 3rd channel USB: A0 03 00 A3
- Open 4th channel USB: A0 04 01 A5
- Close 4th channel USB: A0 04 00 A4
- Status inquiry: FF

Relay card channel usage
------------------------

Channel 1: mains power on/off
Channel 2: not used
Channel 3: motor driver 1
Channel 4: motor driver 2