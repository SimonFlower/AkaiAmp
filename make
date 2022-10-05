#!/bin/sh
#
# A simple installation script that mimics the "make" command

# process the command line
if [ $# -le 0 ] ; then
	echo "This program installs the AkaiAmp components on a Raspberry PI system that"
	echo "has been loaded with HifiBerryOS. To install, type 'make install'."
	exit 1
elif [ $# -gt 1 ] ; then
	echo "make: unrecognised command line: $@"
	exit 1
fi
if [ "$1" != "install" ] ; then
	echo  "make: unrecognised command line: $@"
        exit 1
fi

# check we are running as root
if [ `id -u` -ne 0 ] ; then
	echo "make: must be run as root"
	exit 1
fi

# perform the install
install -m755 akai_amp.py /usr/bin

install -m644 radio.json /etc/beocreate/

install -d -m755 /etc/beocreate/beo-extensions/akai_amp
install -d -m755 /etc/beocreate/beo-extensions/akai_amp/symbols-black
install -d -m755 /etc/beocreate/beo-extensions/akai_amp/symbols-white

install -m644 beocreate_extension/menu.html /etc/beocreate/beo-extensions/akai_amp/
install -m644 beocreate_extension/akai_amp.css /etc/beocreate/beo-extensions/akai_amp/
install -m644 beocreate_extension/symbols-black/akai_amp-signature.svg /etc/beocreate/beo-extensions/akai_amp/symbols-black/
install -m644 beocreate_extension/symbols-white/akai_amp-signature.svg /etc/beocreate/beo-extensions/akai_amp/symbols-white/


