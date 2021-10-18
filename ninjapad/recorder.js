// 2021 Ninja Dynamics
// Creative Commons Attribution 4.0 International Public License

ninjapad.recorder = function() {
    const states = {
        STOP  : 0,
        PAUSE : 1,
        PLAY  : 2,
        REC   : 3
    }
    var status = states.STOP;
    var userInput;
    var inputIndex;
    var lastFrame;
    var saveData;
    var endFrame;
    var writeBuffer;
    var fnButtonPress;
    var memoryHash;

    return {
        initialize: function(fnButtonUp, fnButtonDown) {
            fnButtonPress = {
                false: fnButtonUp,
                true: fnButtonDown
            }
        },

        hasData: function() {
            return typeof(memoryHash) !== "undefined";
        },

        clear: function(callback) {
            memoryHash = undefined;
            if (callback) callback();
        },

        states: function() {
            return states;
        },

        status: function() {
            return status;
        },

        start: function() {
            var secs = 3;
            memoryHash = undefined;
            ninjapad.pause.pauseEmulation(
                ninjapad.utils.html(
                    "span", "pauseScreenContent", "3"
                )
            );
            function _start() {
                $("#pauseScreenContent").html(--secs);
                if (secs) return;
                clearInterval(startID);
                ninjapad.emulator.resetFrameCount();
                saveData = ninjapad.emulator.saveState();
                lastFrame = 0; endFrame = lastFrame;
                userInput = []; writeBuffer = [];
                status = states.REC;
                ninjapad.pause.resumeEmulation();
            }
            var startID = setInterval(_start, 1000);
        },

        stop: function(callback=ninjapad.pause.pauseEmulation) {
            ninjapad.emulator.pause();
            var memory = ninjapad.emulator.memory();
            memoryHash = sha256(memory);
            status = states.STOP;
            callback();
        },

        play: function() {
            if (!endFrame) return;
            // - - - - - - - - - - - - - - - - - - - - - - - -
            ninjapad.pause.pauseEmulation();
            ninjapad.emulator.resetFrameCount();
            ninjapad.emulator.loadState(saveData);
            ninjapad.pause.resumeEmulation();
            inputIndex = 0; lastFrame = 0;
            status = states.PLAY;
        },

        read: function(frameIndex) {
            if (status != states.PLAY) return false;
            // - - - - - - - - - - - - - - - - - - - - - - - -
            if (inputIndex < userInput.length) {
                const input = userInput[inputIndex];
                const frame = lastFrame + input.offset;
                if (frameIndex == frame) {
                    for (const button of input.buttons) {
                        fnButtonPress[button.pressed](button.id);
                        console.log("Playback:", button.id, button.pressed ? "pressed" : "released");
                    }
                    lastFrame = frame;
                    ++inputIndex;
                }
            }
            if (frameIndex == endFrame) {
                status = states.STOP;
                ninjapad.emulator.pause();
                var memory = ninjapad.emulator.memory();
                var result = (sha256(memory) == memoryHash);
                DEBUG && console.log(
                    "NinjaPad: Playback consistency check:",
                    result ? "PASS" : "FAIL"
                );
                ninjapad.pause.pauseEmulation(
                    ninjapad.utils.html(
                        "span", "pauseScreenContent",
                        "Playback " + (result ? "OK" : "ERROR")
                    )
                );
            }
            return true;
        },

        buffer: function(button, pressed) {
            if (status != states.REC) return false;
            // - - - - - - - - - - - - - - - - - - - - - - - -
            writeBuffer.push({
                id: button,
                pressed: pressed
            });
            return true;
        },

        write: function(frameIndex) {
            if (status != states.REC) return false;
            // - - - - - - - - - - - - - - - - - - - - - - - -
            if (writeBuffer.length > 0 && frameIndex > lastFrame) {
                status = states.PAUSE;
                for (const button of writeBuffer) {
                    fnButtonPress[button.pressed](button.id);
                }
                status = states.REC;
                userInput.push({
                    offset: frameIndex - lastFrame,
                    buttons: writeBuffer
                });
                lastFrame = frameIndex;
                writeBuffer = [];
            }
            endFrame = frameIndex;
            return true;
        },

        export: function() {
            return userInput;
        }
    }
}();
