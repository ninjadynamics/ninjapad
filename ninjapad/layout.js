// 2021 Ninja Dynamics
// Creative Commons Attribution 4.0 International Public License

ninjapad.layout = function() {
    var coldStart = true;

    function setOSDLayout() {
        ninjapad.jQElement.osd.empty();
        ninjapad.jQElement.osd.detach().appendTo(ninjapad.jQElement.screen);
        ninjapad.jQElement.osd.css("top", 0);
        ninjapad.jQElement.osd.css("left", 0);
        ninjapad.jQElement.osd.css("height", ninjapad.jQElement.screen.height());
        ninjapad.jQElement.osd.css("width", ninjapad.jQElement.screen.width());
        ninjapad.jQElement.osd.css("visibility", ninjapad.pause.pauseScreen.visibility);
        ninjapad.jQElement.osd.append(ninjapad.pause.pauseScreen.content);
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
    }

    function setMobileLayout() {
        DEBUG && console.log("NinjaPad: Mobile mode selected");

        if (coldStart) {
            DEBUG && console.log("NinjaPad: Mobile mode: Cold start");
            $("#ninjaPad").css("height", "100%");
            $("body").removeAttr("style").css("margin", "0%");
            setEmulationScreenLayout();
            ninjapad.jQElement.screen.detach().appendTo("#SCREEN");
            $("body *").not("#ninjaPad *").not("#ninjaPad").remove();
            coldStart = false;
        }

        let useJQuery = !ninjapad.utils.isFullScreen() || ninjapad.utils.isIOSDevice();
        let width = useJQuery ? $(window).width() : window.innerWidth;
        let height = useJQuery ? $(window).height() : window.innerHeight;

        if (height >= width || window.matchMedia("(orientation: portrait)").matches) {
            let opacity = 1;
            let bottom = "auto";

            ninjapad.jQElement.screen.width("100%");
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
            setDesktopLayout();
            handleLandscapeMode();
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
            setOSDLayout();
        }
    };
}();
