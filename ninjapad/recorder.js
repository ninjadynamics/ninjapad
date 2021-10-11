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
    var hash, ok, f;

    return {
        status: function() {
            return status;
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
            if (status != "PLAY") return;
            // - - - - - - - - - - - - - - - - - - - - - - - -
            if (inputIndex < userInput.length) {
                const input = userInput[inputIndex];
                const frame = lastFrame + input.offset;
                if (frameIndex == frame) {
                    for (const button of input.buttons) {
                        const fn = button.pressed ?
                            ninjapad.emulator.buttonDown :
                            ninjapad.emulator.buttonUp;
                        fn(button.id);
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
        },

        buffer: function(button, pressed) {
            if (status != "REC") return;
            // - - - - - - - - - - - - - - - - - - - - - - - -
            writeBuffer.push({
                id: button, pressed: pressed
            });
        },

        // buffer: function(button, pressed, fn) {
        //     if (status != "REC") return;
        //     // - - - - - - - - - - - - - - - - - - - - - - - -
        //     fn(1, eval("jsnes.Controller." + button));
        //     writeBuffer.push({
        //         id: button, pressed: pressed
        //     });
        // },

        write: function(frameIndex) {
            if (status != "REC") return;
            // - - - - - - - - - - - - - - - - - - - - - - - -
            if (writeBuffer.length > 0 && frameIndex > lastFrame) {
                userInput.push({
                    offset: frameIndex - lastFrame,
                    buttons: writeBuffer
                });
                lastFrame = frameIndex;
                writeBuffer = [];
            }
            endFrame = frameIndex;
        },

        export: function() {
            return userInput;
        }
    }
}();
