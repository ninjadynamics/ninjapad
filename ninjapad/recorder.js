// 2021 Ninja Dynamics
// Creative Commons Attribution 4.0 International Public License

ninjapad.recorder = function() {
    var status = "STOP";
    var userInput;
    var inputIndex;
    var firstFrame;
    var lastFrame;
    var saveData;

    return {
        start: function() {
            status = "REC";
            userInput = [];
            saveData = ninjapad.emulator.saveState();
            firstFrame = ninjapad.emulator.frameCount();
            lastFrame = firstFrame;
        },

        stop: function() {
            status = "STOP";
        },

        play: function() {
            if (userInput.length == 0) return;
            // - - - - - - - - - - - - - - - - - - - - - - - -
            status = "PLAY";
            inputIndex = 0;
            lastFrame = firstFrame;
            ninjapad.emulator.loadState(saveData);
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
                if (++inputIndex == userInput.length) status = "STOP";
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
