Akai Amp Project
================

An Akai AM75 Amp has had its volume control changed to use
a motor controlled potentiometer. This project uses hardware
controlled by a Rapsberry Pi B+ and a relay card to control
the volume potentiometer and also to switch the mains for
the amplifier.

Relay card details
------------------

http://www.chinalctech.com/cpzx/32.html

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