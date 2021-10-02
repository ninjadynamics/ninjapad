const ninjapad = {
    emulator: null,

    jQElement: null,

    boot: async function() {
        function loadScript(url) {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.type = 'text/javascript';
                script.src = url;
                document.head.appendChild(script);
                script.onload = () => resolve();
            });
        }

        // Load JavaScript files
        await loadScript("ninjapad/config/settings.js");
        await loadScript("ninjapad/lib/sha256/sha256.js");
        await loadScript("ninjapad/lib/fflate/fflate.min.js");
        await loadScript("ninjapad/lib/uint8-to-utf16/uint8-to-utf16.js");
        await loadScript("ninjapad/utils.js");
        await loadScript("ninjapad/layout.js");
        await loadScript("ninjapad/menu.js");
        await loadScript("ninjapad/pause.js");
        await loadScript("ninjapad/gamepad.js");
        await loadScript("ninjapad/interface.js");

        // Load HTML files
        await fetch("ninjapad/ninjapad.html")
          .then(data => data.text())
          .then(html => document.body.innerHTML += html);
    },

    initialize: function() {
        ninjapad.jQElement = {
            gamepad:        $("#GAMEPAD"),
            controller:     $("#GAMEPAD-BUTTONS"),
            analogSwitch:   $("#analogSwitch"),
            menu:           $("#menu"),
            upload:         $("#upload"),
            analogStick:    $("#ANALOG_STICK"),
            analog:         $("#ANALOG"),
            dpad:           $("#DPAD"),
            osd:            $("#OSD"),
            screen:         $("#" + SCREEN),
        };

        // Page setup
        ninjapad.layout.setPageLayout();

        // Assign function calls to touch events
        ninjapad.utils.assign(ninjapad.gamepad.toggleMenu, "menu", "start", "end");
        ninjapad.utils.assign(ninjapad.gamepad.analogSwitch, "analogSwitch", "start", "end");
        ninjapad.utils.assign(ninjapad.gamepad.buttonPress, "GAMEPAD-BUTTONS", "start", "move", "end");
        ninjapad.utils.assign(ninjapad.gamepad.analogTouch, "ANALOG_STICK", "start", "move", "end");
        ninjapad.utils.assign(ninjapad.gamepad.toggleFullScreen, SCREEN, "end");
        ninjapad.utils.assign(null, "GAMEPAD"); // Do not remove this line !!!

        DEBUG && console.log("NinjaPad: Ready");
    }
};

$(document).ready(async function() {
    // Load NinjaPad modules
    await ninjapad.boot();

    // Load the emulator
    ninjapad.emulator = ninjapad.interface[EMULATOR];

    // Pause on loss of focus
    $(window).blur(function() {
        !ninjapad.pause.state.isEmulationPaused &&
        ninjapad.utils.isMobileDevice() &&
        ninjapad.pause.pauseEmulation();
    });

    // Reload layout on orientation change
    $(window).resize(function() {
        ninjapad.initialize();
    });

    // Use ESC key to open the menu
    $(window).keyup(function(e) {
      if (e.code == "Escape") ninjapad.menu.toggleMenu();
    });

    // Load a ROM and setup the page layout
    ninjapad.emulator.initialize();
    ninjapad.initialize();
});
