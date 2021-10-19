// 2021 Ninja Dynamics
// Creative Commons Attribution 4.0 International Public License

ninjapad.recorder = function() {
    const fnCallback = {};
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

    function execute(callback) {
        console.log(callback);
        if (!callback) return;
        callback.fn(
            ...callback.args
        );
    }

    return {
        initialize: function(fnButtonUp, fnButtonDown) {
            fnButtonPress = {
                false: fnButtonUp,
                true: fnButtonDown
            }
            ninjapad.recorder.setCallback(
                "stop", ninjapad.pause.pauseEmulation
            );
        },

        setCallback: function(key, fn, ...args) {
            fnCallback[key] = {
                fn: fn,
                args: args
            };
        },

        hasData: function() {
            return typeof(memoryHash) !== "undefined";
        },

        clear: function(callback) {
            if (status == states.PLAY) {
                ninjapad.emulator.releaseAllButtons();
            }
            memoryHash = undefined;
            status = states.STOP;
            execute(fnCallback.clear);
        },

        states: function() {
            return states;
        },

        status: function() {
            return status;
        },

        start: function() {
            memoryHash = undefined;
            ninjapad.emulator.pause();
            ninjapad.emulator.resetFrameCount();
            saveData = ninjapad.emulator.saveState();
            lastFrame = 0; endFrame = lastFrame;
            userInput = []; writeBuffer = [];
            status = states.REC;
            ninjapad.pause.resumeEmulation();
        },

        stop: function() {
            if (status == states.PLAY) {
                ninjapad.emulator.releaseAllButtons();
            }
            else {
                ninjapad.emulator.pause();
                var memory = ninjapad.emulator.memory();
                memoryHash = sha256(memory);
            }
            status = states.STOP;
            execute(fnCallback.stop);
        },

        play: function() {
            if (!endFrame) return;
            // - - - - - - - - - - - - - - - - - - - - - - - -
            ninjapad.emulator.releaseAllButtons();
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
                execute(fnCallback.play);
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
