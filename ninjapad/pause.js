ninjapad.pause = function() {
    var state = {
        isEmulationPaused: false,
        cannotResume: false
    };

    var pauseScreen = {
        visibility: "hidden",
        content: ""
    };

    function pauseText(content, resumable) {
        if (!content) {
            let msg = "Emulation paused";
            let resumeMsg = ninjapad.utils.isMobileDevice() ? "Tap" : "Click";
            resumeMsg += " to resume";
            content = "<span>" + msg + "<br/>" + resumeMsg + "</span>";
            resumable = true;
        }
        if (resumable) {
            ninjapad.utils.assignNoPropagation(ninjapad.pause.resumeEmulation, "OSD", "end");
            ninjapad.utils.assignClick(ninjapad.pause.resumeEmulation, "OSD");
        }
        return ninjapad.utils.html("div", "pauseScreenContent", content);
    }

    return {
        state: state,

        pauseScreen: pauseScreen,

        setScreenContent: function(content) {
            pauseScreen.content = content;
            $("#pauseScreenContent").html(pauseScreen.content);
        },

        pauseEmulation: function(content=null, resumable=false) {
            ninjapad.emulator.pause();
            pauseScreen.visibility = "visible";
            pauseScreen.content = pauseText(content, resumable);
            ninjapad.jQElement.osd.empty();
            ninjapad.jQElement.osd.append(pauseScreen.content);
            ninjapad.jQElement.osd.css("visibility", pauseScreen.visibility);
            ninjapad.jQElement.osd.css("transform", "translateZ(0)");
            ninjapad.utils.assign(null, "pauseScreenContent");
            state.isEmulationPaused = true;
            DEBUG && console.log("NinjaPad: Emulation paused");
        },

        resumeEmulation: function(event) {
            if (event) event.stopPropagation();
            if (state.cannotResume) return;
            ninjapad.emulator.resume();
            pauseScreen.visibility = "hidden";
            ninjapad.jQElement.osd.css("visibility", pauseScreen.visibility);
            state.isEmulationPaused = false;
            ninjapad.menu.close();
            ninjapad.utils.assignClick(null, "OSD");
            ninjapad.utils.assignNoPropagation(null, "OSD", "end");
            DEBUG && console.log("NinjaPad: Emulation resumed");
        }
    };
}();
