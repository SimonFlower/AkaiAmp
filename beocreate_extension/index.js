/* Server side code for the akai_amp extension
 *
 * For details of how the client interacts with the server see
 * comments in the client side code (akai_amp-client.js) */

var exec = require('child_process').exec;
var version = require("./package.json").version;

/* code that is called when the system initialises the akai_amp extension */
beo.bus.on('general', function(event) {
    if (event.header == "activatedExtension") {
        if (event.content.extension == "akai_amp") {
            /* send the status of the relays to the client */
            handle_client_call ({header: "request_status"});
        }
    }
});

/* code that is called when the client side sends messages to the server side
 * provided the request is recognised, call the akai_amp.py script with
 * appropriate parameters, then return the stdout/stderr from the call to
 * the client */
function handle_client_call (event) {
    switch (event.header) {
        case "power":
            akai_amp_cmd = "power " + event.content.on;
            break;
        case "volume":
            akai_amp_cmd = "volume " + event.content.up + " " + event.content.amount;
            break;
        case "reset":
            akai_amp_cmd = "reset all";
            break;
        case "request_status":
            akai_amp_cmd = "status short";
            break;
        default:
            akai_amp_cmd = "";
            console.error ("AkaiAmp: Unknown user request: " + event.header);
            break;
    }
    if (akai_amp_cmd.length > 0) {
        if (beo.debug) console.log ("AkaiAmp: User requested " + akai_amp_cmd);
        exec("akai_amp.py " + akai_amp_cmd, function(error, stdout, stderr) {
            if (error) {
                err_title = "Error with amplifier";
                if (stderr)
                    err_msg = stderr;
                else
                    err_msg = "Unknown problem";
                console.error (err_title + ": " + err_msg);
            } else {
                err_title = null;
                err_msg = null;
            }
            beo.sendToUI("akai_amp", {header: event.header, 
                                      content: {err_title: err_title, err_msg: err_msg, 
                                                stdout: stdout, stderr: stderr}});
        });
    }
}
beo.bus.on('akai_amp', function(event) {
    handle_client_call (event);
});
		
module.exports = {
    version: version,
};




