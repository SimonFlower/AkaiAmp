#!/bin/sh
#
# A simple installation script that mimics the "make" command

# configuration
TARGET_FOLDER=/etc/beocreate/beo-extensions/akai_amp

install_folder ()
{
        install -v -d -m755 $1
}

install_file ()
{
        install -v -m644 $1 $2
}

install_exe_file ()
{
        install -v -m755 $1 $2
}

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
install_exe_file akai_amp.py /usr/bin

install_file radio.json /etc/beocreate/

install_folder $TARGET_FOLDER
install_folder $TARGET_FOLDER/symbols-black
install_folder $TARGET_FOLDER/symbols-white

install_file beocreate_extension/menu.html $TARGET_FOLDER
install_file beocreate_extension/akai_amp.css $TARGET_FOLDER
install_file beocreate_extension/akai_amp-client.js $TARGET_FOLDER
install_file beocreate_extension/index.js $TARGET_FOLDER
install_file beocreate_extension/package.json $TARGET_FOLDER
install_file beocreate_extension/symbols-black/akai_amp-signature.svg $TARGET_FOLDER/symbols-black/
install_file beocreate_extension/symbols-black/power.svg $TARGET_FOLDER/symbols-black/
install_file beocreate_extension/symbols-white/akai_amp-signature.svg $TARGET_FOLDER/symbols-white/
install_file beocreate_extension/symbols-white/power.svg $TARGET_FOLDER/symbols-white/


