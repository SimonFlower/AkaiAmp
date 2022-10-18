/* Client side code for the akai_amp extension */

var akai_amp = (function() {
        function power_off() {
                beo.ask();
                beo.send({target: "akai_amp", header: "power_off"});
        }

        function power_on() {
                beo.ask();
                beo.send({target: "akai_amp", header: "power_on"});
        }

        /* the returned structure maps functions in the "akai_amp" object
         * that can be called from the html code in "menu.html", e.g. to
         * call the power_off method:
         *   onclick="akai_amp.power_off()" */
        return {
                power_off: power_off,
                power_on: power_on,
        };
})();