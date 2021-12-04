// 2021 Ninja Dynamics
// Creative Commons Attribution 4.0 International Public License

ninjapad.layout = function() {
    var coldStart = true;

    function setOSDLayout() {
        // Setup menu screen
        var osd = ninjapad.jQElement.osd;
        ninjapad.jQElement.osd.empty();
        ninjapad.jQElement.osd.detach().appendTo(ninjapad.jQElement.screen);
        ninjapad.jQElement.osd.css("top", 0);
        ninjapad.jQElement.osd.css("left", 0);
        ninjapad.jQElement.osd.css("height", ninjapad.jQElement.screen.height());
        ninjapad.jQElement.osd.css("width", ninjapad.jQElement.screen.width());
        ninjapad.jQElement.osd.css("visibility", ninjapad.pause.pauseScreen.visibility);
        ninjapad.jQElement.osd.append(ninjapad.pause.pauseScreen.content);

        // Setup input recorder menu and status
        var offset = `${ninjapad.jQElement.screen.width() * 0.06}px`;
        ninjapad.jQElement.recMenu.css("right", offset);
        ninjapad.jQElement.recMenu.css("bottom", offset);
        ninjapad.jQElement.recStatus.css("left", offset);
        ninjapad.jQElement.recStatus.css("bottom", offset);
        ninjapad.menu.inputRecorder.show();
        ninjapad.menu.inputRecorder.ready();
        ninjapad.menu.inputRecorder.selectMode(-1);
    }

    function setEmulationScreenLayout() {
        ninjapad.jQElement.screen.removeAttr("style");
        ninjapad.jQElement.screen.css("width", ninjapad.emulator.display.width);
        ninjapad.jQElement.screen.css("height", ninjapad.emulator.display.height);
        ninjapad.jQElement.screen.css("margin", "auto");
        ninjapad.jQElement.screen.css("position", "relative");
    }

    function setDesktopLayout() {
        DEBUG && console.log("NinjaPad: Desktop mode selected");

        let useJQuery = !ninjapad.utils.isFullScreen() || ninjapad.utils.isIOSDevice();
        let width = useJQuery ? $(window).width() : window.innerWidth;
        let height = useJQuery ? $(window).height() : window.innerHeight;

        if (width > height) {
            ninjapad.jQElement.screen.height("100%");
            let newHeight = ninjapad.jQElement.screen.height();
            ninjapad.jQElement.screen.width(256 * (newHeight / 240));
        }
        else {
            ninjapad.jQElement.screen.width("100%");
            let newWidth = ninjapad.jQElement.screen.width();
            ninjapad.jQElement.screen.height(240 * (newWidth / 256));
        }
        ninjapad.jQElement.gamepad.height("0%");
        ninjapad.jQElement.controller.hide();

        $("#REC_MENU").detach().appendTo(ninjapad.jQElement.screen);
        $("#REC_STATUS").detach().appendTo(ninjapad.jQElement.screen);
        var fontSize = `${ninjapad.jQElement.screen.width() * 0.05}px`;
        ninjapad.jQElement.osd.css("font-size", fontSize);
    }

    function setMobileLayout() {
        DEBUG && console.log("NinjaPad: Mobile mode selected");

        if (coldStart) {
            DEBUG && console.log("NinjaPad: Mobile mode: Cold start");
            $("#ninjaPad").css("height", "100%");
            $("body").removeAttr("style").css("margin", "0%");
            setEmulationScreenLayout();
            ninjapad.jQElement.screen.detach().appendTo("#SCREEN");
            $("#REC_MENU").detach().appendTo(ninjapad.jQElement.screen);
            $("#REC_STATUS").detach().appendTo(ninjapad.jQElement.screen);
            $("body *").not("#ninjaPad *").not("#ninjaPad").remove();
            coldStart = false;
        }

        let useJQuery = !ninjapad.utils.isFullScreen() || ninjapad.utils.isIOSDevice();
        let width = useJQuery ? $(window).width() : window.innerWidth;
        let height = useJQuery ? $(window).height() : window.innerHeight;

        if (height >= width || window.matchMedia("(orientation: portrait)").matches) {

            $("#SCREEN").removeClass("verticalCenter");
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

            let opacity = 1;
            let bottom = "auto";

            ninjapad.jQElement.screen.width(window.innerWidth);
            //ninjapad.jQElement.screen.css("top", "0vh");
            let newWidth = ninjapad.jQElement.screen.width();
            ninjapad.jQElement.screen.height(240 * (newWidth / 256));

            let padHeight = ninjapad.utils.vw(47.5);
            let remainingHeight = height - ninjapad.jQElement.screen.height();
            ninjapad.jQElement.gamepad.height(Math.max(padHeight, remainingHeight));

            let difference = remainingHeight - padHeight;
            if (difference < 0) {
                opacity += (difference / (padHeight * 2));
                bottom = 0;
            }
            ninjapad.jQElement.gamepad.css("bottom", bottom);
            ninjapad.jQElement.gamepad.css("display", "block");

            ninjapad.jQElement.controller.css("opacity", opacity);
            ninjapad.jQElement.controller.show();

            if (ninjapad.pause.state.cannotResume) {
                ninjapad.pause.state.cannotResume = false;
                ninjapad.pause.pauseEmulation();
            }
            DEBUG && console.log("NinjaPad: Touch controls enabled");
        }
        else {
            //setDesktopLayout();

            ninjapad.jQElement.gamepad.height(window.innerHeight);
            ninjapad.jQElement.controller.show();

            $("#GAMEPAD").show();
            $("#SCREEN").detach().appendTo("#GAMEPAD");
            //$("#SCREEN").addClass("verticalCenter");

            ninjapad.jQElement.screen.height("100%"); //("90%");
            let newHeight = ninjapad.jQElement.screen.height();
            ninjapad.jQElement.screen.width(256 * (newHeight / 240));

            var w = ((width - ninjapad.jQElement.screen.width()) / 2);

            var s = w * 0.85;
            var o = (w / 2) - (s / 2);

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
