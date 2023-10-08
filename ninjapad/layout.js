// 2021 Ninja Dynamics
// Creative Commons Attribution 4.0 International Public License

ninjapad.layout = function() {

    var elm;
    var emuScrWidth;
    var emuScrHeight;
    var isGBLayout;
    var coldStart = true;
    var pixelMode;
    var aspectRatio;

    function setOSDLayout() {

        // Cache emulation screen size
        const scrHeight = elm.emuScreen.height();
        const scrWidth = elm.emuScreen.width();

        // Setup menu screen
        var osd = elm.osd;
        elm.osd.empty();
        elm.osd.detach().appendTo(elm.emuScreen);
        elm.osd.css("top", 0);
        elm.osd.css("left", 0);
        elm.osd.css("height", scrHeight);
        elm.osd.css("width", scrWidth);
        elm.osd.css("visibility", ninjapad.pause.pauseScreen.visibility);
        elm.osd.css("font-size", 0.05 * scrHeight);
        elm.osd.css("word-spacing", "0.5em");
        elm.osd.css("padding", "2em");
        elm.osd.append(ninjapad.pause.pauseScreen.content);

        // Setup input recorder menu
        var offset = `${elm.emuScreen.width() * 0.06}px`;
        elm.recMenu.css("right", offset);
        elm.recMenu.css("bottom", offset);
        elm.recMenu.css("font-size", 0.05 * scrHeight);
        elm.recMenu.css("padding", "0.2em");

        // Setup input recorder status
        elm.recStatus.css("left", offset);
        elm.recStatus.css("bottom", offset);
        elm.recStatus.css("font-size", 0.05 * scrHeight);
        elm.recStatus.css("padding", "0.2em");

        // Set visibility
        ninjapad.menu.inputRecorder.show();
        ninjapad.menu.inputRecorder.ready();
        ninjapad.menu.inputRecorder.selectMode(-1);
    }

    function setEmulationScreenLayout() {
        elm.emuScreen.removeAttr("style");
        elm.emuScreen.css("width", ninjapad.emulator.display.width);
        elm.emuScreen.css("height", ninjapad.emulator.display.height);
        elm.emuScreen.css("margin", "auto");
        elm.emuScreen.css("position", "relative");
    }

    function updatePixelMode() {
        switch (pixelMode) {
            case "SQUARE":
            default:
                pixelAspectRatio = 1;
                break;
            case "NTSC":
                pixelAspectRatio = 8 / 7;
                break;
        }
        aspectRatio = (256 / 240) * pixelAspectRatio;
        elm.emuScreen.css("max-width", `${256 * MAX_SCREEN_SCALE * pixelAspectRatio}px`);
        elm.emuScreen.css("max-height", `${240 * MAX_SCREEN_SCALE}px`);
        elm.emuScreen.css("aspect-ratio", `${aspectRatio} / 1`);

        // Copied from setOSDLayout() above.
        const scrHeight = elm.emuScreen.height();
        const scrWidth = elm.emuScreen.width();
        elm.osd.css("height", scrHeight);
        elm.osd.css("width", scrWidth);
        elm.osd.css("font-size", 0.05 * scrHeight);
        elm.recMenu.css("font-size", 0.05 * scrHeight);
        elm.recStatus.css("font-size", 0.05 * scrHeight);
    }

    function setDesktopLayout() {
        DEBUG && console.log("NinjaPad: Desktop mode selected");

        var useJQuery = !ninjapad.utils.isFullScreen() || ninjapad.utils.isIOSDevice();
        var width = useJQuery ? $(window).width() : window.innerWidth;
        var height = useJQuery ? $(window).height() : window.innerHeight;
        updatePixelMode();

        if (width / height > aspectRatio) {
            elm.emuScreen.width("auto");
            elm.emuScreen.height("100%");
        }
        else {
            elm.emuScreen.width("100%");
            elm.emuScreen.height("auto");
        }
        elm.gamepad.height("0%");
        elm.gamepadButtons.hide();

        $("#REC_MENU").detach().appendTo(elm.emuScreen);
        $("#REC_STATUS").detach().appendTo(elm.emuScreen);
        var fontSize = `${elm.emuScreen.width() * 0.05}px`;
        elm.osd.css("font-size", fontSize);
    }

    function setABLayout(toggle=false) {
        if (toggle) {
            isGBLayout = !isGBLayout;
        }
        const rem = "x".repeat(isGBLayout);
        const add = "x".repeat(!isGBLayout);
        $("#BUTTON_A")
            .removeClass("button_A" + rem)
            .addClass("button_A" + add);
        $("#MULTI_AB")
            .removeClass("button_AB" + rem)
            .addClass("button_AB" + add);
    }

    function setMobileLayout() {
        DEBUG && console.log("NinjaPad: Mobile mode selected");

        if (coldStart) {
            DEBUG && console.log("NinjaPad: Mobile mode: Cold start");
            elm.root.css("height", "100%");
            $("body").removeAttr("style").css("margin", "0%");
            setEmulationScreenLayout();
            elm.emuScreen.detach().appendTo("#SCREEN");
            elm.recMenu.detach().appendTo(elm.emuScreen);
            elm.recStatus.detach().appendTo(elm.emuScreen);
            $("body *").not("#ninjaPad *").not("#ninjaPad").remove();
            isGBLayout = GAMEBOY_LAYOUT;
            pixelMode = PIXEL_MODE;
            coldStart = false;
        }

        setABLayout();

        var useJQuery = !ninjapad.utils.isFullScreen() || ninjapad.utils.isIOSDevice();
        var width = useJQuery ? $(window).width() : window.innerWidth;
        var height = useJQuery ? $(window).height() : window.innerHeight;
        updatePixelMode();

        const functionalLeft = $("#FUNCTIONAL-BL");
        const functionalRight = $("#FUNCTIONAL-TR");

        if (height >= width || window.matchMedia("(orientation: portrait)").matches) {

            elm.screen.detach().appendTo("#ninjaPad");
            elm.gamepad.detach().appendTo("#ninjaPad");

            elm.gamepad.removeAttr("style");

            var dPadState = elm.dpad.css("display");
            elm.dpad.removeAttr("style").css("display", dPadState);

            var analogState = elm.analog.css("display");
            elm.analog.removeAttr("style").css("display", analogState);

            elm.actionButtons.removeAttr("style");

            functionalLeft.removeAttr("style");
            functionalRight.removeAttr("style");

            $("#BUTTON_SELECT").css("top", "").detach().appendTo("#FUNCTIONAL-TR");
            $("#BUTTON_START").css("top", "").detach().appendTo("#FUNCTIONAL-BL");

            elm.analogSwitch.css("top", "").detach().appendTo("#FUNCTIONAL-TR");
            elm.menu.css("top", "").detach().appendTo("#FUNCTIONAL-BL");

            var opacity = 1;
            var bottom = "auto";

            elm.emuScreen.width(window.innerWidth);
            elm.emuScreen.height("auto");

            var padHeight = ninjapad.utils.vw(47.5);
            var remainingHeight = height - elm.emuScreen.height();
            elm.gamepad.height(Math.max(padHeight, remainingHeight));

            var difference = remainingHeight - padHeight;
            if (difference < 0) {
                opacity += (difference / (padHeight * 2));
                bottom = 0;
            }
            elm.gamepad.css("bottom", bottom);
            elm.gamepad.css("display", "block");

            elm.gamepadButtons.css("opacity", opacity);
            elm.gamepadButtons.show();

            if (ninjapad.pause.state.cannotResume) {
                ninjapad.pause.state.cannotResume = false;
                ninjapad.pause.pauseEmulation();
            }
            DEBUG && console.log("NinjaPad: Touch controls enabled");
        }
        else {
            // Display the GAMEPAD element and set the height to 100%
            elm.gamepad.css("display", "block");
            elm.gamepad.css("height", window.innerHeight);

            // Nest the SCREEN element on the GAMEPAD element
            elm.screen.detach().appendTo("#GAMEPAD");

            // Set the EMULATION_SCREEN element height to 100%
            elm.emuScreen.width("auto");
            elm.emuScreen.height("100%"); //("90%");

            // Center the SCREEN element vertically
            elm.gamepad.css("display", "flex");

            // Get the width of the empty sides
            var w = ((width - elm.emuScreen.width()) / 2);

            // Calculate the maximum size for the button areas
            var s = 0.85 * Math.min(w, ninjapad.utils.vmin(55));
            var o = (w / 2) - (s / 2); // Offset

            // Modify DPAD size and position
            elm.dpad.css("top", "auto");
            elm.dpad.css("bottom", "45%");
            elm.dpad.css("left", o);
            elm.dpad.css("width", s);
            elm.dpad.css("height", s);

            // Modify ANALOG size and position
            elm.analog.css("top", "auto");
            elm.analog.css("bottom", "45%");
            elm.analog.css("left", o);
            elm.analog.css("width", s);
            elm.analog.css("height", s);

            // Modify ACTION BUTTONS size and position
            elm.actionButtons.css("top", "auto");
            elm.actionButtons.css("bottom", "45%");
            elm.actionButtons.css("right", o);
            elm.actionButtons.css("width", s);
            elm.actionButtons.css("height", s);

            // Modify the FUNCTIONAL button's parent elements
            const bSel = $("#BUTTON_SELECT").detach();
            const bStr = $("#BUTTON_START").detach();
            const bAnl = $("#analogSwitch").detach();
            const bMen = $("#menu").detach();
            bSel.appendTo(functionalLeft);
            bStr.appendTo(functionalRight);
            bAnl.appendTo(functionalLeft);
            bMen.appendTo(functionalRight);

            // Calculate the L/R offset for FUNCTIONAL buttons
            const fw = s / 3;
            const fh = functionalLeft.height() * (fw / functionalLeft.width());
            o = (w / 2) - (fw / 2);

            // Modify L FUNCTIONAL size and position
            functionalLeft.css("width", fw);
            functionalLeft.css("height", fh);
            functionalLeft.css("top", "65%");
            functionalLeft.css("left", o);
            functionalLeft.css("right", "auto");

            // Modify R FUNCTIONAL size and position
            functionalRight.css("width", fw);
            functionalRight.css("height", fh);
            functionalRight.css("top", "65%");
            functionalRight.css("left", "auto");
            functionalRight.css("right", o);

            // Re-arrange FUNCTIONAL button positions
            bStr.css("top", bAnl.css("top"));
            bMen.css("top", bSel.css("top"));
            bSel.css("top", bAnl.css("top"));
            bAnl.css("top", bMen.css("top"));

            // Show buttons
            elm.gamepadButtons.show();

            DEBUG && console.log("NinjaPad: Touch controls disabled");
        }
    }

    function handleLandscapeMode() {
        ninjapad.pause.state.cannotResume = true;
        ninjapad.pause.pauseEmulation(
            ninjapad.utils.html(
                "span", "pauseScreenContent",
                `Landscape mode<br/>
                not supported yet<br/>
                <br/>
                Turn your device<br/>
                upright to play`
            )
        );
    }

    function loadVars() {
        elm = ninjapad.elements;
        emuScrWidth = ninjapad.emulator.display.width;
        emuScrHeight = ninjapad.emulator.display.height;
    }

    return {
        toggleABLayout: function() {
            setABLayout(true);
        },

        getPixelMode: function() {
            return pixelMode;
        },

        setPixelMode: function(mode) {
            pixelMode = mode;
            updatePixelMode();
        },

        setPageLayout: function() {
            loadVars();
            ninjapad.utils.isMobileDevice() ? setMobileLayout() : setDesktopLayout();
            ninjapad.layout.analogStickMovementRadius = elm.analog.width() / 4;
            setOSDLayout();
        },

        showButtonPress: function(id, pressed) {
            var element = document.getElementById(id);
            $(element).css("border-style", pressed ? "inset" : "outset");
            DEBUG && console.log("NinjaPad:", pressed ? "Pressed" : "Released", element.id);
        }
    };
}();
