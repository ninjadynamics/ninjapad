// 2021 Ninja Dynamics
// Creative Commons Attribution 4.0 International Public License

ninjapad.recorder = function() {
    const STOP  = 0;
    const PAUSE = 1;
    const PLAY  = 2;
    const REC   = 3;

    var status = STOP;
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

        status: function() {
            return status;
        },

        start: function() {
            ninjapad.pause.pauseEmulation();
            ninjapad.emulator.resetFrameCount();
            saveData = ninjapad.emulator.saveState();
            lastFrame = 0; endFrame = lastFrame;
            userInput = []; writeBuffer = [];
            status = REC;
        },

        stop: function() {
            ninjapad.pause.pauseEmulation();
            var memory = ninjapad.emulator.memory();
            memoryHash = sha256(memory);
            status = STOP;
        },

        play: function() {
            if (!endFrame) return;
            // - - - - - - - - - - - - - - - - - - - - - - - -
            ninjapad.pause.pauseEmulation();
            ninjapad.emulator.resetFrameCount();
            ninjapad.emulator.loadState(saveData);
            ninjapad.pause.resumeEmulation();
            inputIndex = 0; lastFrame = 0;
            status = PLAY;
        },

        read: function(frameIndex) {
            if (status != PLAY) return false;
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
                status = STOP;
                ninjapad.pause.pauseEmulation();
                var memory = ninjapad.emulator.memory();
                var result = (sha256(memory) == memoryHash);
                DEBUG && console.log(
                    "NinjaPad: Playback consistency check:",
                    result ? "PASS" : "FAIL"
                );
            }
            return true;
        },

        buffer: function(button, pressed) {
            if (status != REC) return false;
            // - - - - - - - - - - - - - - - - - - - - - - - -
            writeBuffer.push({
                id: button,
                pressed: pressed
            });
            return true;
        },

        write: function(frameIndex) {
            if (status != REC) return false;
            // - - - - - - - - - - - - - - - - - - - - - - - -
            if (writeBuffer.length > 0 && frameIndex > lastFrame) {
                status = PAUSE;
                for (const button of writeBuffer) {
                    fnButtonPress[button.pressed](button.id);
                }
                status = REC;
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
