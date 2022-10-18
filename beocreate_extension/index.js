/* Server side code for the akai_amp extension */

var exec = require('child_process').exec;
var version = require("./package.json").version;

beo.bus.on('akai_amp', function(event) {
        switch (event.header) {
                case "power_on":
                        if (debug) console.log ("User-requested power_up");
                        exec("akai_amp.py power on", function(error, stdout, stderr) {
                                if (error) console.error ("Unable to call akai_amp.py power on");
                        });
                        break;
                case "power_off":
                        if (debug) console.log ("User-requested power_down");
                        exec("akai_amp.py power off", function(error, stdout, stderr) {
                                if (error) console.error ("Unable to call akai_amp.py power off");
                        });
                        break;
                default:
                        console.error ("Unknown user request: " + event.header);
                        break;
        }
});
		
module.exports = {
	version: version,
};




