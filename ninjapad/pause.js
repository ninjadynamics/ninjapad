ninjapad.pause = function() {
    var state = {
        isEmulationPaused: false,
        cannotResume: false
    };

    var pauseScreen = {
        visibility: "hidden",
        content: ""
    };

    function pauseText() {
        let msg = "Emulation paused";
        let resumeMsg = ninjapad.utils.isMobileDevice() ? "Tap" : "Click";
        resumeMsg += " to resume";
        return ninjapad.utils.html("span", "pauseScreenContent", msg + "<br/>" + resumeMsg);
    }

    return {
        state: state,

        pauseScreen: pauseScreen,

        pauseEmulation: function(content=null) {
            ninjapad.emulator.pause();
            pauseScreen.visibility = "visible";
            pauseScreen.content = content || pauseText();
            ninjapad.jQElement.osd.empty();
            ninjapad.jQElement.osd.append(pauseScreen.content);
            ninjapad.jQElement.osd.css("visibility", pauseScreen.visibility);
            state.isEmulationPaused = true;
            ninjapad.utils.assign(null, "pauseScreenContent");
            ninjapad.utils.assignNoPropagation(ninjapad.pause.resumeEmulation, "OSD", "end");
            DEBUG && console.log("NinjaPad: Emulation paused");
        },

        resumeEmulation: function(event) {
            if (event) event.stopPropagation();
            if (state.cannotResume) return;
            ninjapad.emulator.resume();
            pauseScreen.visibility = "hidden";
            ninjapad.jQElement.osd.css("visibility", pauseScreen.visibility);
            state.isEmulationPaused = false;
            ninjapad.menu.state.isOpen = false;
            DEBUG && console.log("NinjaPad: Emulation resumed");
        }
    };
}();
