
const ninjapad = {
    emulator: null,

    elements: null,

    gameList: null,

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
        await loadScript("ninjapad/lib/sha-1/sha-1.js");
        await loadScript("ninjapad/lib/sha256/sha256.js");
        await loadScript("ninjapad/lib/fflate/fflate.min.js");
        await loadScript("ninjapad/lib/uint8-to-utf16/uint8-to-utf16.js");
        await loadScript("ninjapad/utils.js");
        await loadScript("ninjapad/layout.js");
        await loadScript("ninjapad/menu.js");
        await loadScript("ninjapad/pause.js");
        await loadScript("ninjapad/gamepad.js");
        await loadScript("ninjapad/recorder.js");
        await loadScript("ninjapad/interface.js");

        // Load HTML files
        await fetch("ninjapad/ninjapad.html")
            .then(data => data.text())
            .then(html => document.body.innerHTML += html);

        // Load game database
        ninjapad.gameList = JSON.parse(
            await fetch(`ninjapad/db/${SYSTEM}.json`)
                .then(response => response.text())
        );
    },

    initialize: function() {
        ninjapad.elements = {
            root:           $("#ninjaPad"),
            screen:         $("#SCREEN"),
            gamepad:        $("#GAMEPAD"),
            gamepadButtons: $("#GAMEPAD-BUTTONS"),
            actionButtons:  $("#ACTION"),
            analogSwitch:   $("#analogSwitch"),
            menu:           $("#menu"),
            uploadROM:      $("#uploadROM"),
            uploadZIP:      $("#uploadZIP"),
            analogStick:    $("#ANALOG_STICK"),
            analog:         $("#ANALOG"),
            dpad:           $("#DPAD"),
            osd:            $("#OSD"),
            recMenu:        $("#REC_MENU"),
            recStatus:      $("#REC_STATUS"),
            emuScreen:      $("#" + EMULATION_SCREEN),
        };

        // Input recorder
        ninjapad.recorder.initialize(
            ninjapad.emulator.buttonUp,
            ninjapad.emulator.buttonDown
        );

        // Page setup
        ninjapad.layout.setPageLayout();

        // Assign function calls to touch events
        ninjapad.utils.assignNoPropagation(ninjapad.menu.open.inputRecorder, "REC_MENU", "end");
        ninjapad.utils.assign(ninjapad.gamepad.toggleMainMenu, "menu", "start", "end");
        ninjapad.utils.assign(ninjapad.gamepad.analogSwitch, "analogSwitch", "start", "end");
        ninjapad.utils.assign(ninjapad.gamepad.buttonPress, "GAMEPAD-BUTTONS", "start", "move", "end");
        ninjapad.utils.assign(ninjapad.gamepad.analogTouch, "ANALOG_STICK", "start", "move", "end");
        ninjapad.utils.assign(ninjapad.gamepad.toggleFullScreen, EMULATION_SCREEN, "end");
        ninjapad.utils.assign(null, "GAMEPAD"); // Do not remove this line !!!

        DEBUG && console.log("NinjaPad: Ready");
    },

    autosave: function() {
        const isROMLoaded = ninjapad.emulator.isROMLoaded();
        if (isROMLoaded) {
            const output = ninjapad.menu.saveState("auto", resume=false);
            DEBUG && console.log(
                "NinjaPad:", output.result == true ?
                `ROM state saved (auto)` :
                `Unable to save ROM state (auto)`
            );
        }
    },

    autoload: function() {
        const isROMLoaded = ninjapad.emulator.isROMLoaded();
        if (isROMLoaded) {
            const output = ninjapad.menu.loadState("auto", resume=false);
            DEBUG && output.result && console.log(
                `NinjaPad: ROM state loaded (auto)`
            );
        }
    }
};

$(document).ready(async function() {
    // Load NinjaPad modules
    await ninjapad.boot();

    // Load the emulator
    ninjapad.emulator = await ninjapad.interface[EMULATOR]();

    // Pause on loss of focus
    $(window).blur(
        function() {
            const isPaused = ninjapad.pause.state.isEmulationPaused;
            if (!isPaused) ninjapad.pause.pauseEmulation();
            ninjapad.autosave();
        }
    );

    // Reload layout on orientation change
    $(window).resize(function() {
        ninjapad.autosave();
        ninjapad.initialize();
        ninjapad.menu.reload();
    });

    // Use ESC key to open the menu
    $(window).keyup(function(e) {
        if (e.code != "Escape") return;
        ninjapad.menu.pressESC();
    });

    // Load a ROM and setup the page layout
    ninjapad.emulator.initialize(ninjapad.autoload);
    ninjapad.initialize();
});
