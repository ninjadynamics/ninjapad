// 2021 Ninja Dynamics
// Creative Commons Attribution 4.0 International Public License

ninjapad.recorder = function() {
    const fnCallback = {};

    const states = {
        STOP  : 0,
        PAUSE : 1,
        PLAY  : 2,
        REC   : 3
    };

    const buttonArray = [
        "BUTTON_A",
        "BUTTON_B",
        "BUTTON_SELECT",
        "BUTTON_START",
        "BUTTON_UP",
        "BUTTON_DOWN",
        "BUTTON_LEFT",
        "BUTTON_RIGHT"
    ];

    var status = states.STOP;
    var userInput;
    var inputIndex;
    var lastFrame;
    var saveData;
    var endFrame;
    var writeBuffer;
    var fnButtonPress;
    var initialState;
    var finalState;

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
            return typeof(finalState) !== "undefined";
        },

        clear: function(callback) {
            if (status == states.PLAY) {
                ninjapad.emulator.releaseAllButtons();
            }
            userInput = [];
            saveData = null;
            endFrame = undefined;
            initialState = undefined;
            finalState = undefined;
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
            ninjapad.emulator.pause();
            ninjapad.emulator.resetFrameCount();
            saveData = ninjapad.emulator.saveState();
            var memorySnapshot = ninjapad.emulator.memory();
            initialState = sha256(memorySnapshot);
            finalState = undefined;
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
                var memorySnapshot = ninjapad.emulator.memory();
                finalState = sha256(memorySnapshot);
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
            var memorySnapshot = ninjapad.emulator.memory();
            if (initialState != sha256(memorySnapshot)) {
                console.log("Oops!!");
            };
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
                var result = (sha256(memory) == finalState);
                DEBUG && console.log(
                    "NinjaPad: Playback consistency check:",
                    result ? "PASS" : "FAIL"
                );
                ninjapad.pause.pauseEmulation(
                    "Playback " + (result ? "OK" : "ERROR")
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
                    buttons: writeBuffer.sortBy('id')
                });
                lastFrame = frameIndex;
                writeBuffer = [];
            }
            endFrame = frameIndex;
            return true;
        },

        import: function(replay) {
            const bin = ninjapad.utils.inBinary;
            const data = replay.inputData;
            var changes;
            var buttons;
            var offset = 0;
            var currByte = 0x00;
            var buffer = [];
            try {
                for (var i = 0; i < data.length; i += 2) {
                    offset += data[i];
                    changes = data[i + 1];
                    if (!changes) continue;
                    buttons = [];
                    var bit = 8;
                    while (bit--) {
                        if (bin(changes)[bit] == 0) continue;
                        buttons.push({
                            id: buttonArray[7 - bit],
                            pressed: (bin(currByte)[bit] == 0)
                        });
                    }
                    buffer.push({
                        offset: offset,
                        buttons: buttons.sortBy('id')
                    });
                    currByte ^= changes;
                    offset = 0;
                }
            }
            catch (e) {
                ninjapad.pause.pauseEmulation(
                    `Import error:<br/>${e}`
                );
                return false;
            }
            userInput = buffer;
            saveData = new Uint8Array(replay.saveData);
            initialState = replay.initialState;
            finalState = replay.finalState;
            endFrame = replay.endFrame;
            return true;
        },

        export: function() {
            var i, data = [];
            var lastByte, currByte = 0;
            for (const frame of userInput) {
                lastByte = currByte;
                for (const button of frame.buttons) {
                    i = buttonArray.indexOf(button.id);
                    button.pressed ? currByte |= 1 << i : currByte &= ~(1 << i);
                }
                console.log(currByte.toString(2).padStart(8, "0"))
                var offset = frame.offset;
                while (offset > 0xFF) {
                    data.push(0xFF);
                    data.push(0x00);
                    offset -= 0xFF;
                }
                data.push(offset);
                data.push(currByte ^ lastByte);
            }
            return {
                inputData: data,
                saveData: [...saveData],
                initialState: initialState,
                finalState: finalState,
                endFrame: endFrame
            };
        },

        userInput: function() {
            return userInput;
        }
    }
}();
