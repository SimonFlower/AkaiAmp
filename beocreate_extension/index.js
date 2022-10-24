/* Server side code for the akai_amp extension
 *
 * For details of how the client interacts with the server see
 * comments in the client side code (akai_amp-client.js) */

var exec = require('child_process').exec;
var version = require("./package.json").version;

// global state for the server
// this variable shows whether there is an active communication session with the relay card
var relays_busy = false;
// this variable is updated to hold the status of the mains power relay
var power_on = false;

// get the initial state of the power relay
exec("akai_amp.py status short", function(error, stdout, stderr) {
    console.log ("akai_amp: power request data: " + stdout);
    if (stdout.length < 4)
        console.error ("akai_amp: bad response from 'akai_amp.py status short': " + stdout);
    else if (stdout.substring (0,1) == "1")
        power_on = true;
    else if (stdout.substring (0,1) == "0")
        power_on = false;
    else
        console.error ("akai_amp: bad response from 'akai_amp.py status short': " + stdout);
    console.log ("akai_amp: initial power relay state: " + String (power_on));
});


function make_status_msg (client_msg, response) {
    status_msg = {header: "status",
                  content: {client_id: client_msg.content.client_id,
                            orig_request: client_msg.content.request,
                  response: response}};
    return status_msg;
}

function make_acknowledge_msg (client_msg) {
    // construct the command for the akai_amp.py script
    cmd = client_msg.content.command;
    if (client_msg.content && client_msg.content.params)
        cmd += " " + client_msg.content.params;
    // construct the acknowledgement message
    ack_msg = {header: "acknowledgement", 
               content: {client_id: client_msg.content.client_id,
                         orig_command: client_msg.content.command,
                         orig_params: client_msg.content.params,
                         cmd: cmd}};
    return ack_msg;
}

function make_completion_msg (client_msg, error, stderr) {
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
    comp_msg = {header: "completion", 
                content: {client_id: client_msg.content.client_id,
                          orig_command: client_msg.content.command,
                          orig_params: client_msg.content.params,
                          err_title: err_title, 
                          err_msg: err_msg}};
    return comp_msg;
}

/* Code that is called when the client side sends messages to the server side */
beo.bus.on('akai_amp', function(client_msg) {
    // what type of request is it?
    switch (client_msg.header) {
        case "status":
            // what parameter is status required for?
            switch (client_msg.content.request) {
                case "power":
                    response = make_status_msg (client_msg, power_on);
                    beo.sendToUI("akai_amp", response);
                    console.log (response);
                    break;
                default:
                    console.error ("akai_amp: unrecognised action request: " + client_msg.content.request);
                    break;
            }
            break;
        case "action":
            // are the relays busy?
            if (relays_busy) {
                error = "Amplifier busy processing another request.";
                beo.sendToUI("akai_amp", make_completion_msg (client_msg, true, error));
            } else {
                // build the acknowledge message, which also contains the command to run
                ack_msg = make_acknowledge_msg (client_msg);
                beo.sendToUI("akai_amp", ack_msg);
                // run the command
                relays_busy = true;
                exec("akai_amp.py " + ack_msg.content.cmd, function(error, stdout, stderr) {
                    relays_busy = false;
                    // check for a power on/off message and update the power status variable
                    if (client_msg.content.command === "power") {
                        if (client_msg.content.params.startsWith ("on"))
                            power_on = true;
                        else if (client_msg.content.params.startsWith ("off"))
                            power_on = false;
                    }
                    // check for a reset message and update the power status variable
                    // process the output from the script and send a completion message
                    if (client_msg.content.command === "reset")
                        power_on = false;
                    // send the completion message to the client
                    beo.sendToUI("akai_amp", make_completion_msg (client_msg, error, stderr));
                });
            }
            break;            
        default:
            console.error ("akai_amp: unrecognised request type: " + client_msg.header);
            break;
    }
});
		
module.exports = {
    version: version,
};




