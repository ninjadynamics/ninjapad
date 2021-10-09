// 2021 Ninja Dynamics
// Creative Commons Attribution 4.0 International Public License

ninjapad.recorder = function() {
    var status = "STOP";
    var userInput;
    var inputIndex;
    var lastFrame;
    var saveData;
    var endFrame;

    return {
        start: function() {
            status = "REC";
            userInput = [];
            lastFrame = 0;
            endFrame = lastFrame;
            saveData = ninjapad.emulator.saveState();
            // ninjapad.emulator.reloadROM();
            // ninjapad.emulator.loadState(saveData);
            ninjapad.emulator.resetFrameCount();
        },

        stop: function() {
            status = "STOP";
            endFrame = ninjapad.emulator.frameCount();
            console.log(endFrame, sha256(ninjapad.emulator.core.cpu.mem));
        },

        play: function() {
            if (userInput.length == 0) return;
            // - - - - - - - - - - - - - - - - - - - - - - - -
            status = "PLAY";
            inputIndex = 0;
            lastFrame = 0;
            ninjapad.emulator.loadState(saveData);
            ninjapad.emulator.resetFrameCount();
            ninjapad.pause.resumeEmulation();
        },

        read: function() {
            if (status != "PLAY") return;
            // - - - - - - - - - - - - - - - - - - - - - - - -
            const input = userInput[inputIndex];
            const frame = lastFrame + input.offset;
            const currentFrame = ninjapad.emulator.frameCount();
            if (currentFrame == frame) {
                for (const button of input.buttons) {
                    const fn = button.pressed ?
                        ninjapad.emulator.buttonDown :
                        ninjapad.emulator.buttonUp;
                    fn(button.id);
                    console.log(fn, button.id);
                }
                lastFrame = frame;
                inputIndex = Math.min(inputIndex + 1, userInput.length - 1);
                // if (++inputIndex == userInput.length) {
                //     status = "STOP";
                //     console.log(ninjapad.emulator.frameCount(), sha256(ninjapad.emulator.core.cpu.mem));
                // }
            }
            if (ninjapad.emulator.frameCount() == endFrame) {
                status = "STOP";
                console.log(endFrame, sha256(ninjapad.emulator.core.cpu.mem));
                ninjapad.pause.pauseEmulation();
            }
        },

        write: function(button, pressed) {
            if (status != "REC") return;
            // - - - - - - - - - - - - - - - - - - - - - - - -
            const currentFrame = ninjapad.emulator.frameCount();
            if (currentFrame > lastFrame) {
                userInput.push({
                    offset: ninjapad.emulator.frameCount() - lastFrame,
                    buttons: []
                });
                lastFrame = currentFrame;
            }
            const i = userInput.length - 1;
            userInput[i].buttons.push({
                id: button, pressed: pressed
            });
        },

        export: function() {
            return userInput;
        }
    }
}();
