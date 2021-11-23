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

    var errorMessage;
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
    var romHash;

    function execute(callback) {
        if (!callback) return;
        callback.fn(...callback.args);
    }

    function isValidInitialState(replay) {
        const h = ninjapad.emulator.getROMHash();
        if (h != replay.romHash) {
            errorMessage = "ROM file mismatch";
            DEBUG && console.log("NinjaPad:", errorMessage);
            return false;
        }
        const s = ninjapad.emulator.saveState();
        ninjapad.emulator.loadState(replay.saveData);
        const m = ninjapad.emulator.memory();
        ninjapad.emulator.loadState(s);
        if (replay.initialState != sha256(m)) {
            errorMessage = "Invalid memory state";
            DEBUG && console.log("NinjaPad:", errorMessage);
            return false;
        }
        return true;
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
            const snapshot = ninjapad.emulator.memory();
            romHash = ninjapad.emulator.getROMHash();
            initialState = sha256(snapshot);
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
                const snapshot = ninjapad.emulator.memory();
                finalState = sha256(snapshot);
            }
            status = states.STOP;
            execute(fnCallback.stop);
        },

        play: function(verify) {
            if (verify && !isValidInitialState(replay)) return false;
            // - - - - - - - - - - - - - - - - - - - - - - - - - - - -
            if (!endFrame) {
                DEBUG && console.log("NinjaPad: No input data");
                return false;
            }
            // - - - - - - - - - - - - - - - - - - - - - - - - - - - -
            ninjapad.emulator.pause();
            ninjapad.emulator.releaseAllButtons();
            ninjapad.emulator.loadState(saveData);
            ninjapad.emulator.resetFrameCount();
            ninjapad.pause.resumeEmulation();
            inputIndex = 0; lastFrame = 0;
            status = states.PLAY;
            return true;
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
                    }
                    lastFrame = frame;
                    ++inputIndex;
                }
            }
            if (frameIndex == endFrame) {
                status = states.STOP;
                ninjapad.emulator.pause();
                const memory = ninjapad.emulator.memory();
                const result = (sha256(memory) == finalState);
                DEBUG && console.log(
                    "NinjaPad: Playback consistency check:",
                    result ? "PASS" : "FAIL"
                );
                ninjapad.pause.pauseEmulation(
                    `Playback ${result ? "complete" : "error"}`,
                    resumable=true
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
                    buttons: writeBuffer.sortBy("id")
                });
                lastFrame = frameIndex;
                writeBuffer = [];
            }
            endFrame = frameIndex;
            return true;
        },

        import: function(replay, verify=false) {
            if (verify && !isValidInitialState(replay)) return false;
            // - - - - - - - - - - - - - - - - - - - - - - - - - - - -
            const bin = ninjapad.utils.inBinary;
            const data = replay.inputData;
            const buffer = [];
            var currByte = 0x00;
            var offset = 0;
            for (var i = 0; i < data.length; i += 2) {
                offset += data[i];
                const changes = data[i + 1];
                if (!changes) continue;
                const buttons = [];
                var bit = 8; while (bit--) {
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
            userInput = buffer;
            saveData = replay.saveData;
            initialState = replay.initialState;
            finalState = replay.finalState;
            endFrame = replay.endFrame;
            romHash = replay.romHash;
            status = states.STOP;
            return true;
        },

        export: function() {
            const data = [];
            var lastByte, currByte = 0;
            for (const frame of userInput) {
                lastByte = currByte;
                for (const button of frame.buttons) {
                    const i = buttonArray.indexOf(button.id);
                    button.pressed ? currByte |= 1 << i : currByte &= ~(1 << i);
                }
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
                saveData: saveData,
                inputData: new Uint8Array(data),
                initialState: initialState,
                finalState: finalState,
                endFrame: endFrame,
                romHash: romHash
            };
        },

        getErrorMessage: function(clear=false) {
            const msg = errorMessage;
            if (clear) errorMessage = undefined;
            return msg;
        },

        debug: {
            getUserInput: function() {
                return userInput;
            },

            getSaveData: function() {
                return saveData;
            }
        }
    }
}();
