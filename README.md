Akai Amp Project
================

An Akai AM75 Amp has had its volume control changed to use
a motor controlled potentiometer. This project uses hardware
controlled by a Rapsberry Pi 3B+ and a relay card to control
the volume potentiometer and also to switch the mains for
the amplifier. The Rapsberry PI also uses a HifiBerry DAC+ Pro
card for high quality audio output. The base software for the
system is the HiFiBerryOS Operating System.

Software installation
---------------------

Download HifiberryOS and copy it to a micro-SD card. Get HifiberryOS
from here: https://www.hifiberry.com/hifiberryos/ (use the download 
for Pi 3).

Once running, by default the user interface displays on both the 
console and from the web server started when the OS boots. By default 
the hostname for machine after HifiberryOS is installed will be "hifiberry".
You can connect to the machine either over the network (if networking
is working) or by attaching a monitor, keyboard and mouse to the Raspberry
PI and usin the console.

To prevent HifiberryOS displaying on the console, and to start a terminal
on the console instead, go to the "General" settings and in the "Display"
menu turn "Use connected display" off. This will allow you to login on 
the Raspberry PI console.

While in the settings menu, go to the "Remote login" menu and turn the
"Remote login" on. This will allow you to make an ssh connection to the
machine. You should also change the default root password (which is set 
in this menu).

The default login is user "root", password "hifiberry".

Change the system name from the default of "HiFiBerry". In the top level
menu, click on the 3 dots under the "HiFiBerry" title, then from the menu
select "Change Name". Change the name (e.g. to "Sitting Room HiFi" and click
on the tick icon. Note that the system host name will be changed, converting
the name you have used to all lower case and replacing spaces with hyphens
(e.g. "sitting-room-hifi").

HifiberryOS is created using buildroot. Networking in buildroot is configured 
in /etc/systemd/network/. See https://wiki.archlinux.org/title/systemd-networkd
for more details. To set up networking, edit the files in this folder as follow:

eth0.network:

	[Match]
	Name=eth0
	
	[Network]
	DHCP=both
	
	[DHCP]
	RouteMetric=10

wireless.network:

	[Match]
	Name=wlan0
	
	[Network]
	DHCP=ipv4
	
	[DHCP]
	RouteMetric=20

This configuration could probably be accomplished in the UI, but doing it 
this way ensures it works. This configuration assumes that the DHCP server
the Rapsberry PI uses has had a reserved, static IP address set up,
corresponding to the MAC address that the Raspberry PI uses.

The HifiBerry DAC+ Pro card should be automatically detected and configured
by the HifiBerryOS.

### Installing the Akai Amp add ons ###

The Akai Amp add ons consist of:

- The BBC radio stations configured as favourites in the radio player
- Extensions to the base software to control the power and volume of
  an Akai Amp
  
To install these add ons:

1. Log in as root
2. Copy the add-on software from git:

    git clone https://github.com/SimonFlower/AkaiAmp.git
3. Move to the add-on project directory:

    cd AkaiAmp
4. Install the pyhon dependencies:

    pip install -r requirements.txt
5. Install the software:

    ./make install
6. Enable the serial card drive:

    depmod -a
7. Restart the server:

    systemctl restart beocreate2

Alternative the server can be restarted by rebooting the computer.
No compilation is needed for the add-on software as all the code
is interpreted.

Once the add-ons are installed, BBC radio stations will be listed
in the Sources/Radio menu and a new menu "Akai Amp" will have been
added.

Software Development
--------------------

### Background Information ###

The HifiBerry operating system is available on GitHub:
https://github.com/hifiberry/hifiberry-os.

Details on the HifiBerry DAC+ Pro:
https://www.hifiberry.com/docs/archive/datasheet-dac-pro/.

HifiBerryOS uses the Beocreate2 project to control all
apsects of the user interface and backend server. The
Beocreate2 project is also on GitHub:
https://github.com/bang-olufsen/create.
The README for the project contains partial documentation 
on extending the system, which is based on Node (server
side) and HTML/Javascript (client side).

URLs for BBC radio stations can be found here: 
https://gist.github.com/bpsib/67089b959e4fa898af69fea59ad74bc3#file-bbc-radio-m3u.

### Project dependencies ###

The CH341 USB to serial driver is needed to access the replay card.
This is installed as part of HifiBerry OS.

Python 3 is needed, and also installed as part of HifiBerry OS.
Python modules required by the add-on software are listed in
the requirements.txt file.

### Relay card details ###

http://www.chinalctech.com/cpzx/32.html

This board uses the CH340 UART to USB chip, which needs a driver
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

### Relay card channel usage ###

- Channel 1: mains power on/off
- Channel 2: not used
- Channel 3: motor driver 1
- Channel 4: motor driver 2

The motor is connected via the relay channels as follows:

    +5v ---------+---------------+
                 |               |
             ....|....       ....|....
       Relay .NO o   .       .NO o   . Relay
     channel .   |   .       .   |   . channel
    number 3 .   /-o---Motor---o-/   . number 4
             .   |   .       .   |   .
             .NC o   .       .NC o   .
             ....|....       ....|....
                 |               |
    Gnd ---------+---------------+          
           
### Controlling the relays ###

The relays are controlled by the akai_amp.py
python module, which uses the pyserial module
to send/receive information on the serial port.
By default the serial card installs its drive
file at /dev/ttyUSB0.

### Adding software to Beocreate ###

The add-ons for the Akai Amp are implemented as a beocreate2
extension. The ID for the extension is "akai_amp". The code 
is held in the beocreate_extension folder.
The files in this folder have the following functions:

- akai_amp-client.js holds the client-side javascript code.
- akai_amp.css  holds CSS styling for the add-on. The add-on
  code can also use CSS from the main beocreate2 project.
- index.js holds the server side code, that is run in Node
  as a systemctl service.
- menu.html holds the HTML display page that will be seen
  by the user in the main application.
- package.json describes metadata for the add-on.
- symbols-black/ icons used by the add-on.
- symbols-white/ icons used by the add-on.

To reinstall software after editing:

    ../make install
    systemctl restart beocreate2
    
To view the server side console log:

    journalctl -u beocreate2
