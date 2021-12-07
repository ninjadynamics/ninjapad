// 2021 Ninja Dynamics
// Creative Commons Attribution 4.0 International Public License

ninjapad.layout = function() {
    var coldStart = true;

    function setOSDLayout() {

        // Cache screen size
        const scrHeight = ninjapad.elements.emuScreen.height();
        const scrWidth = ninjapad.elements.emuScreen.width();

        // Setup menu screen
        var osd = ninjapad.elements.osd;
        ninjapad.elements.osd.empty();
        ninjapad.elements.osd.detach().appendTo(ninjapad.elements.emuScreen);
        ninjapad.elements.osd.css("top", 0);
        ninjapad.elements.osd.css("left", 0);
        ninjapad.elements.osd.css("height", scrHeight);
        ninjapad.elements.osd.css("width", scrWidth);
        ninjapad.elements.osd.css("visibility", ninjapad.pause.pauseScreen.visibility);
        ninjapad.elements.osd.css("font-size", 0.05 * scrHeight);
        ninjapad.elements.osd.css("word-spacing", "0.5em");
        ninjapad.elements.osd.css("padding", "2em");
        ninjapad.elements.osd.append(ninjapad.pause.pauseScreen.content);

        // Setup input recorder menu
        var offset = `${ninjapad.elements.emuScreen.width() * 0.06}px`;
        ninjapad.elements.recMenu.css("right", offset);
        ninjapad.elements.recMenu.css("bottom", offset);
        ninjapad.elements.recMenu.css("font-size", 0.05 * scrHeight);
        ninjapad.elements.recMenu.css("padding", "0.2em");

        // Setup input recorder status
        ninjapad.elements.recStatus.css("left", offset);
        ninjapad.elements.recStatus.css("bottom", offset);
        ninjapad.elements.recStatus.css("font-size", 0.05 * scrHeight);
        ninjapad.elements.recStatus.css("padding", "0.2em");

        // Set visibility
        ninjapad.menu.inputRecorder.show();
        ninjapad.menu.inputRecorder.ready();
        ninjapad.menu.inputRecorder.selectMode(-1);
    }

    function setEmulationScreenLayout() {
        ninjapad.elements.emuScreen.removeAttr("style");
        ninjapad.elements.emuScreen.css("width", ninjapad.emulator.display.width);
        ninjapad.elements.emuScreen.css("height", ninjapad.emulator.display.height);
        ninjapad.elements.emuScreen.css("margin", "auto");
        ninjapad.elements.emuScreen.css("position", "relative");
    }

    function setDesktopLayout() {
        DEBUG && console.log("NinjaPad: Desktop mode selected");

        var useJQuery = !ninjapad.utils.isFullScreen() || ninjapad.utils.isIOSDevice();
        var width = useJQuery ? $(window).width() : window.innerWidth;
        var height = useJQuery ? $(window).height() : window.innerHeight;

        if (width > height) {
            ninjapad.elements.emuScreen.height("100%");
            var newHeight = ninjapad.elements.emuScreen.height();
            ninjapad.elements.emuScreen.width(256 * (newHeight / 240));
        }
        else {
            ninjapad.elements.emuScreen.width("100%");
            var newWidth = ninjapad.elements.emuScreen.width();
            ninjapad.elements.emuScreen.height(240 * (newWidth / 256));
        }
        ninjapad.elements.gamepad.height("0%");
        ninjapad.elements.gamepadButtons.hide();

        $("#REC_MENU").detach().appendTo(ninjapad.elements.emuScreen);
        $("#REC_STATUS").detach().appendTo(ninjapad.elements.emuScreen);
        var fontSize = `${ninjapad.elements.emuScreen.width() * 0.05}px`;
        ninjapad.elements.osd.css("font-size", fontSize);
    }

    function setMobileLayout() {
        DEBUG && console.log("NinjaPad: Mobile mode selected");

        if (coldStart) {
            DEBUG && console.log("NinjaPad: Mobile mode: Cold start");
            $("#ninjaPad").css("height", "100%");
            $("body").removeAttr("style").css("margin", "0%");
            setEmulationScreenLayout();
            ninjapad.elements.emuScreen.detach().appendTo("#SCREEN");
            $("#REC_MENU").detach().appendTo(ninjapad.elements.emuScreen);
            $("#REC_STATUS").detach().appendTo(ninjapad.elements.emuScreen);
            $("body *").not("#ninjaPad *").not("#ninjaPad").remove();
            coldStart = false;
        }

        var useJQuery = !ninjapad.utils.isFullScreen() || ninjapad.utils.isIOSDevice();
        var width = useJQuery ? $(window).width() : window.innerWidth;
        var height = useJQuery ? $(window).height() : window.innerHeight;

        if (height >= width || window.matchMedia("(orientation: portrait)").matches) {

            $("#SCREEN").detach().appendTo("#ninjaPad");
            $("#GAMEPAD").detach().appendTo("#ninjaPad");

            $("#GAMEPAD").removeAttr("style");

            var dPadState = $("#DPAD").css("display");
            $("#DPAD").removeAttr("style").css("display", dPadState);

            var analogState = $("#ANALOG").css("display");
            $("#ANALOG").removeAttr("style").css("display", analogState);

            $("#ACTION").removeAttr("style");

            $("#FUNCTIONAL-TR").removeAttr("style");
            $("#FUNCTIONAL-BL").removeAttr("style");

            $("#BUTTON_SELECT").css("top", "").detach().appendTo("#FUNCTIONAL-TR");
            $("#BUTTON_START").css("top", "").detach().appendTo("#FUNCTIONAL-BL");

            $("#analogSwitch").css("top", "").detach().appendTo("#FUNCTIONAL-TR");
            $("#menu").css("top", "").detach().appendTo("#FUNCTIONAL-BL");

            var opacity = 1;
            var bottom = "auto";

            ninjapad.elements.emuScreen.width(window.innerWidth);
            //ninjapad.elements.emuScreen.css("top", "0vh");
            var newWidth = ninjapad.elements.emuScreen.width();
            ninjapad.elements.emuScreen.height(240 * (newWidth / 256));

            var padHeight = ninjapad.utils.vw(47.5);
            var remainingHeight = height - ninjapad.elements.emuScreen.height();
            ninjapad.elements.gamepad.height(Math.max(padHeight, remainingHeight));

            var difference = remainingHeight - padHeight;
            if (difference < 0) {
                opacity += (difference / (padHeight * 2));
                bottom = 0;
            }
            ninjapad.elements.gamepad.css("bottom", bottom);
            ninjapad.elements.gamepad.css("display", "block");

            ninjapad.elements.gamepadButtons.css("opacity", opacity);
            ninjapad.elements.gamepadButtons.show();

            if (ninjapad.pause.state.cannotResume) {
                ninjapad.pause.state.cannotResume = false;
                ninjapad.pause.pauseEmulation();
            }
            DEBUG && console.log("NinjaPad: Touch controls enabled");
        }
        else {

            // var maxHeight = ninjapad.utils.isIOSDevice() ?
            //     window.innerHeight : "100%";

            // Display the GAMEPAD element and set the height to 100%
            ninjapad.elements.gamepad.css("display", "block");
            ninjapad.elements.gamepad.css("height", window.innerHeight);

            // Nest the SCREEN element on the GAMEPAD element
            $("#SCREEN").detach().appendTo("#GAMEPAD");

            // Set the EMULATION_SCREEN element height to 100%
            ninjapad.elements.emuScreen.height("100%"); //("90%");
            var newHeight = ninjapad.elements.emuScreen.height();
            ninjapad.elements.emuScreen.width(256 * (newHeight / 240));

            // Center the SCREEN element vertically
            ninjapad.elements.gamepad.css("display", "flex");

            // Get the width of the empty sides
            var w = ((width - ninjapad.elements.emuScreen.width()) / 2);

            // Calculate the maximum size for the button areas
            var s = 0.85 * Math.min(w, ninjapad.utils.vmin(55));
            var o = (w / 2) - (s / 2); // Offset

            $("#DPAD").css("top", "auto");
            $("#DPAD").css("bottom", "45%");
            $("#DPAD").css("left", o);
            $("#DPAD").css("width", s);
            $("#DPAD").css("height", s);

            $("#ANALOG").css("top", "auto");
            $("#ANALOG").css("bottom", "45%");
            $("#ANALOG").css("left", o);
            $("#ANALOG").css("width", s);
            $("#ANALOG").css("height", s);

            $("#ACTION").css("top", "auto");
            $("#ACTION").css("bottom", "45%");
            $("#ACTION").css("right", o);
            $("#ACTION").css("width", s);
            $("#ACTION").css("height", s);

            // - - - - - - - - - - - - - - - - - - -

            var bSel = $("#BUTTON_SELECT").detach();
            var bStr = $("#BUTTON_START").detach();

            var bAnl = $("#analogSwitch").detach();
            var bMen = $("#menu").detach();

            var functionalLeft = $("#FUNCTIONAL-BL");
            var functionalRight = $("#FUNCTIONAL-TR");

            bSel.appendTo(functionalLeft);
            bStr.appendTo(functionalRight);

            bAnl.appendTo(functionalLeft);
            bMen.appendTo(functionalRight);

            var fw = s / 3;
            var fh = functionalLeft.height() * (fw / functionalLeft.width());
            o = (w / 2) - (fw / 2);

            functionalLeft.css("width", fw);
            functionalLeft.css("height", fh);
            functionalLeft.css("top", "65%");
            functionalLeft.css("left", o);
            functionalLeft.css("right", "auto");

            functionalRight.css("width", fw);
            functionalRight.css("height", fh);
            functionalRight.css("top", "65%");
            functionalRight.css("left", "auto");
            functionalRight.css("right", o);

            bStr.css("top", bAnl.css("top"));
            bMen.css("top", bSel.css("top"));

            bSel.css("top", bAnl.css("top"));
            bAnl.css("top", bMen.css("top"));

            // Show buttons
            ninjapad.elements.gamepadButtons.show();

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

    return {
        setPageLayout: function() {
            ninjapad.utils.isMobileDevice() ? setMobileLayout() : setDesktopLayout();
            ninjapad.layout.analogStickMovementRadius = $("#ANALOG").width() / 4;
            setOSDLayout();
        },

        showButtonPress: function(id, pressed) {
            var element = document.getElementById(id);
            $(element).css("border-style", pressed ? "inset" : "outset");
            DEBUG && console.log("NinjaPad:", pressed ? "Pressed" : "Released", element.id);
        }
    };
}();
