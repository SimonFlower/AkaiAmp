/* Client side code for the akai_amp extension 
 *
 * Client side functions (power, volume, reset, request_status) call
 * a handler on the server side. The server side then calls exec to
 * run akai_amp.py (with approriate arguments) to send requests to
 * the relay card. The stdout and stderr from the exec call are
 * returned to the client once the call has completed on the "akai_amp"
 * handler in this script */

/* function to display an error message */
function show_error (err_title, err_msg) {
    if (err_title) {
        document.getElementById ("error_message_title").innerText = err_title;
        document.getElementById ("error_message_body").innerText = err_msg;
        document.getElementById ("error_message").classList.remove ("hidden");
    } else {
        document.getElementById ("error_message").classList.add ("hidden");
    }
}

var akai_amp = (function() {
        
    /* this event handler receives messages from the server side code */
    $(document).on("akai_amp", function(event, data) {
        if (data.content.err_title) {
            show_error (data.content.err_title, data.content.err_msg);
        } else {
            show_error (null, null);
            switch (data.header) {
                case "power":
                    break;
                case "volume":
                    break;
                case "reset":
                    break;
                case "request_status":
                    if (data.content.stdout.substring (1,2) == "1") {
                    } else if (data.content.stdout.substring (1,2) == "0") {
                    } else {
                        show_error ("Software Error", "Relay status unrecognised: " + data.content.stdout);
                    }
                    break;
                default:
                    show_error ("Software Error", "Unrecognised message received from akai_amp server code: " + data.header);
                    break;
           }
        }
    });
        
    /* function to set the power state of the amplifier */
    function power(on) {
        beo.ask();
        beo.send({target: "akai_amp", header: "power", content: {on: on}});
    }
        
    /* function to set the volume of the amplifier */
    function volume(up, amount) {
        beo.send({target: "akai_amp", header: "volume", content: {up: up, amount: amount}});
    }
        
    /* function to send a reset "all" request to the amplifier */
    function reset() {
        beo.send({target: "akai_amp", header: "reset"});
    }

    /* function to request status of relays - the response will be returned
     * via the event handler above */
    function request_status() {
        beo.send({target: "akai_amp", header: "request_status"});
    }

    /* the returned structure maps functions in the "akai_amp" object
     * that can be called from the html code in "menu.html", e.g. to
     * call the power method:
     *   onclick="akai_amp.power('on')" */
    return {
        power: power,
        volume: volume,
        reset: reset,
        request_status: request_status
    };
})();

/* request the status of the relays when the page loads */
document.addEventListener("load", function(){
    akai_amp.request_status();
});
