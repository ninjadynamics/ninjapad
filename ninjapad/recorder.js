// 2021 Ninja Dynamics
// Creative Commons Attribution 4.0 International Public License

ninjapad.recorder = function() {
    var status = "STOP";
    var userInput;
    var inputIndex;
    var lastFrame;
    var saveData;
    var endFrame;
    var writeBuffer;
    var fnButtonPress;

    var hash, ok, f;

    return {
        initialize: function(fnButtonUp, fnButtonDown) {
            fnButtonPress = {
                false: fnButtonUp,
                true: fnButtonDown
            }
        },

        start: function() { ok = false; f = -1;
            ninjapad.pause.pauseEmulation();
            ninjapad.emulator.resetFrameCount();
            saveData = ninjapad.emulator.saveState();
            lastFrame = 0; endFrame = lastFrame;
            userInput = []; writeBuffer = [];
            console.log(sha256(ninjapad.emulator.core.cpu.mem));
            status = "REC";
        },

        stop: function() {
            //endFrame = ninjapad.emulator.frameCount();
            ninjapad.pause.pauseEmulation();
            hash = sha256(ninjapad.emulator.core.cpu.mem);
            console.log(endFrame, hash);
            status = "STOP";
        },

        play: function() {
            if (!endFrame) return;
            // - - - - - - - - - - - - - - - - - - - - - - - -
            ninjapad.pause.pauseEmulation();
            ninjapad.emulator.resetFrameCount();
            ninjapad.emulator.loadState(saveData);
            ninjapad.pause.resumeEmulation();
            inputIndex = 0; lastFrame = 0;
            status = "PLAY";
        },

        read: function(frameIndex) {
            if (status != "PLAY") return false;
            // - - - - - - - - - - - - - - - - - - - - - - - -
            if (inputIndex < userInput.length) {
                const input = userInput[inputIndex];
                const frame = lastFrame + input.offset;
                if (frameIndex == frame) {
                    for (const button of input.buttons) {
                        fnButtonPress[button.pressed](button.id);
                        console.log(button.pressed, button.id);
                    }
                    lastFrame = frame;
                    ++inputIndex;
                }
            }

            var h = sha256(ninjapad.emulator.core.cpu.mem);
            if (h == hash) { ok = true; f = frameIndex; }

            if (frameIndex == endFrame) {
                status = "STOP";
                ninjapad.pause.pauseEmulation();
                console.log(f, ok);
            }

            return true;
        },

        buffer: function(button, pressed) {
            if (status != "REC") return false;
            // - - - - - - - - - - - - - - - - - - - - - - - -
            writeBuffer.push({
                id: button,
                pressed: pressed
            });
            return true;
        },

        write: function(frameIndex) {
            if (status != "REC") return false;
            // - - - - - - - - - - - - - - - - - - - - - - - -
            if (writeBuffer.length > 0 && frameIndex > lastFrame) {
                status = "PAUSE";
                for (const button of writeBuffer) {
                    fnButtonPress[button.pressed](button.id);
                }
                status = "REC";
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
