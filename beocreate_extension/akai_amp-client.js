/* Client side code for the akai_amp extension 
 *
 * Client side functions (toggle_power, set_volume, reset, 
 * get_power_status) call a handler on the server side to
 * request actions and the retrieve information about the
 * state of the amplifier.
 *
 * A message is sent from the client with the following fields
 * (this corresponds to the beocreate2 standard for client/server
 * messaging):
 *
 *   target: "akai_amp"
 *   header: "action" | "status"
 *   content.client_id: a unique ID for the client
 *   content.* other fields in content are dependent on whether an 
 *             "action" or a "status" message is being sent
 *
 * For "action" messages the content is as follows:
 *
 *   content.command: The command verb for the akai_amp.py script
 *   content.params: (optional) any additional parameters for the script
 *
 * For "status" messages the content is as follows:
 *
 *   content.request: "power" - request the status of the power relay
 *
 * The server responds differently to "action" and "status" messages,
 " since "action" messages may require some time to complete. For
 " "status" messages, the server responds immediately with the
 * following response message:
 *
 *   header: "status"
 *   content.client_id: contents of the requesting client's content.id field
 *   content.orig_request: contents of the client's content.request message field
 *   content.response: the servers response
 *
 * For "action" messages, provided it is possible for the server to fulfill
 * the request, the server responds immediately with an acknowledgement message
 * which looks like this:
 *
 *   header: "acknowledgement"
 *   content.client_id: contents of the requesting client's content.id field
 *   content.orig_command: contents of the client's content.command message field
 *   content.orig_params: contents of the client's content.params message field
 *   content.cmd: the command that was sent to the akai_amp.py script
 *
 * The server will always respond with a completion message (whether or not an
 * acknowledgement has been sent). The completion message looks like this:
 *
 *   header: "completion"
 *   content.client_id: contents of the requesting client's content.id field
 *   content.orig_command: contents of the client's content.command message field
 *   content.orig_params: contents of the client's content.params message field
 *   content.cmd: the command that was sent to the akai_amp.py script
 *   content.err_title: null OR a title for an error that occurred while calling the script
 *   content.err_msg: null OR the contents of an error message that occurred while calling the script
 */

// client ID must be unique for each client
client_id = String(Date.now().toString(32) + Math.random().toString(16)).replace(/\./g, '');

// function to set the state of the power on/off widget
function set_power_on_widget (power_on) {
    if (power_on)
        document.getElementById ("akai_amp_power_toggle").classList.add ("on");
    else
        document.getElementById ("akai_amp_power_toggle").classList.remove ("on");
}

// function to update the status area
function show_status (status_msg) {
    if (status_msg) {
        document.getElementById ("status_message_body").innerText = status_msg;
        document.getElementById ("status_message").classList.remove ("hidden");
    } else {
        document.getElementById ("status_message").classList.add ("hidden");
    }
}

// function to display an error message
function show_error (err_title, err_msg) {
    if (err_title) {
        document.getElementById ("error_message_title").innerText = err_title;
        document.getElementById ("error_message_body").innerText = err_msg;
        document.getElementById ("error_message").classList.remove ("hidden");
    } else {
        document.getElementById ("error_message").classList.add ("hidden");
    }
}

// function to create a status request message to send to server
function make_status_msg (request) {
    msg = {target: "akai_amp", header: "status", 
           content: {client_id: client_id, 
                     request: request}};
    return msg;
}

// function to create an action request message to send to server
function make_action_msg (command, params) {
    msg = {target: "akai_amp", header: "action", 
           content: {client_id: client_id, 
                     command: command,
                     params: params}};
    return msg;
}

var akai_amp = (function() {
    /* this event handler receives messages from the server for this extension */
    $(document).on("akai_amp", function(event, data) {
        switch (data.header) {
            case "status":
                switch (data.content.orig_request) {
                    case "power":
                        // this is the response to a request for the status of the mains power relay
                        set_power_on_widget (data.content.response);
                        break;
                    default:
                        console.error (data);
                        break;
                }
                break;
            case "acknowledgement":
                // only update the status where it was this client that sent the request
                if (data.content.client_id == client_id)
                    show_status ("Processing '" + data.content.orig_command + "' request");
                break;
            case "completion":
                // clear the status message and set any error message
                // (provided the request came from this client)
                if (data.content.client_id == client_id) {
                    show_status (null);
                    if (data.content.err_title)
                        show_error (data.content.err_title, data.content.err_msg);
                    else
                        show_error (null, null);
                }
                // if this was a power on/off command or a reset command
                // then update the power toggle widget in the UI
                if (! data.content.err_title) {
                    if (data.content.orig_command === "power") {
                        if (data.content.orig_params.startsWith ("on"))
                            set_power_on_widget (true);
                        else if (data.content.orig_params.startsWith ("off"))
                            set_power_on_widget (false);
                    } else if (data.content.orig_command === "reset")
                        set_power_on_widget (false);
                }
                break;
            default:
                console.error (data);
                break;
        }
    });
    
    /* this event handler receives messages on the "general" channel */
    $(document).on("general", function(event, data) {
        if (data.header === "activatedExtension" && data.content.extension == "akai_amp") {
            // this extension has been started - initialise it by requesting the status of
            // the mains power relay
            beo.send(make_status_msg ("power"));
        }
    });
        
    /* function to set the volume of the amplifier */
    function set_volume(up, amount) {
        beo.send(make_action_msg ("volume", up + " " + amount));
    }
        
    /* function to send a reset "all" request to the amplifier */
    function reset() {
        beo.send(make_action_msg ("reset", "all"));
    }
    
    /* function to change state of power, dependent on current
     * state of power on/off widget in UI - the state of the power on/off
     * widget is changed when the response to the message is received */
    function toggle_power() {
        if (document.getElementById ("akai_amp_power_toggle").classList.contains ("on")) {
            beo.send(make_action_msg ("power", "off"));
        } else {
            beo.send(make_action_msg ("power", "on"));
        }
    }

    /* the returned structure maps functions in the "akai_amp" object
     * that can be called from the html code in "menu.html", e.g. to
     * call the power method:
     *   onclick="akai_amp.power('on')" */
    return {
        set_volume: set_volume,
        reset: reset,
        toggle_power: toggle_power
    };
})();

/* request the status of the relays when the page loads */
/*
function akai_amp_init() {
    beo.send(make_status_msg ("power"));
}
if (window.attachEvent) 
    window.attachEvent('onload', akai_amp_init);
else if (window.addEventListener) 
    window.addEventListener('load', akai_amp_init, false);
else
    document.addEventListener('load', akai_amp_init, false);
*/