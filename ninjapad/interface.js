ninjapad.interface = {

    // JSNES INTERFACE
    jsnes: function() {
        // This code is a modified port of the JSNES example:
        // https://github.com/bfirsh/jsnes/tree/master/example

        // Additional contributions by Matt Hughson
        // https://twitter.com/matthughson

        const BUTTON_A = 0;
        const BUTTON_B = 2;

        const SCREEN_WIDTH = 256;
        const SCREEN_HEIGHT = 240;
        const FRAMEBUFFER_SIZE = SCREEN_WIDTH*SCREEN_HEIGHT;

        const AUDIO_BUFFERING = 512;
        const SAMPLE_COUNT = 4*1024;
        const SAMPLE_MASK = SAMPLE_COUNT - 1;

        var canvas_ctx, image;
        var framebuffer_u8, framebuffer_u32;

        var audio_ctx, script_processor;
        var audio_samples_L = new Float32Array(SAMPLE_COUNT);
        var audio_samples_R = new Float32Array(SAMPLE_COUNT);
        var audio_write_cursor = 0, audio_read_cursor = 0;

        var frameCounter = 0;

        var controllerMappings = {  // DualShock 4
            12: "BUTTON_UP",        // DPAD Up
            13: "BUTTON_DOWN",      // DPAD Down
            14: "BUTTON_LEFT",      // DPAD Left
            15: "BUTTON_RIGHT",     // DPAD Right
             0: "BUTTON_A",         // Cross
             2: "BUTTON_B",         // Square
             8: "BUTTON_SELECT",    // Share
             9: "BUTTON_START"      // Options
        }

        var keyboardMappings = {
            38: "BUTTON_UP",        // Up
            87: "BUTTON_UP",        // W
            40: "BUTTON_DOWN",      // Down
            83: "BUTTON_DOWN",      // S
            37: "BUTTON_LEFT",      // Left
            65: "BUTTON_LEFT",      // A
            39: "BUTTON_RIGHT",     // Right
            68: "BUTTON_RIGHT",     // D
            18: "BUTTON_A",         // Alt
            88: "BUTTON_A",         // X
            17: "BUTTON_B",         // Ctrl
            90: "BUTTON_B",         // Z
            32: "BUTTON_SELECT",    // Space
            16: "BUTTON_SELECT",    // Right Shift
            13: "BUTTON_START"      // Enter
        }

        var gpButtonPresses = {
            "BUTTON_UP": false,
            "BUTTON_DOWN": false,
            "BUTTON_LEFT": false,
            "BUTTON_RIGHT": false,
            "BUTTON_A": false,
            "BUTTON_B": false,
            "BUTTON_SELECT": false,
            "BUTTON_START": false
        };

        var kbButtonPresses = {
            "BUTTON_UP": false,
            "BUTTON_DOWN": false,
            "BUTTON_LEFT": false,
            "BUTTON_RIGHT": false,
            "BUTTON_A": false,
            "BUTTON_B": false,
            "BUTTON_SELECT": false,
            "BUTTON_START": false
        };

        const nes = new jsnes.NES({
            onFrame: function(framebuffer_24) {
                for (var i = 0; i < FRAMEBUFFER_SIZE; i++) framebuffer_u32[i] = 0xFF000000 | framebuffer_24[i];
                ninjapad.recorder.read(frameCounter) || ninjapad.recorder.write(frameCounter);
                ++frameCounter;
            },
            onAudioSample: function(l, r) {
                audio_samples_L[audio_write_cursor] = l;
                audio_samples_R[audio_write_cursor] = r;
                audio_write_cursor = (audio_write_cursor + 1) & SAMPLE_MASK;
            },
            // sampleRate: getSampleRate()
        });

        function getSampleRate()
        {
            if (!window.AudioContext) {
                return 44100;
            }
            var myCtx = new window.AudioContext();
            var sampleRate = myCtx.sampleRate;
            myCtx.close();
            return sampleRate;
        }

        function onAnimationFrame() {
            window.setTimeout(onAnimationFrame, 1000/60);
            image.data.set(framebuffer_u8);
            canvas_ctx.putImageData(
                image, 0, 0,
                0, OVERSCAN_TOP, SCREEN_WIDTH, SCREEN_HEIGHT - OVERSCAN_TOP - OVERSCAN_BOTTOM);
            if (!ninjapad.pause.state.isEmulationPaused) nes.frame();
        }

        function audio_remain() {
            return (audio_write_cursor - audio_read_cursor) & SAMPLE_MASK;
        }

        function audio_callback(event) {
            if (nes.rom == null) return;

            var dst = event.outputBuffer;
            var len = dst.length;

            // Attempt to avoid buffer underruns
            if(audio_remain() < AUDIO_BUFFERING && !ninjapad.pause.state.isEmulationPaused) nes.frame();

            var dst_l = dst.getChannelData(0);
            var dst_r = dst.getChannelData(1);
            for (var i = 0; i < len; i++) {
                var src_idx = (audio_read_cursor + i) & SAMPLE_MASK;
                dst_l[i] = audio_samples_L[src_idx];
                dst_r[i] = audio_samples_R[src_idx];
            }

            audio_read_cursor = (audio_read_cursor + len) & SAMPLE_MASK;
        }

        function keyboard(callback, event) {
            var id = event.keyCode;
            var button = keyboardMappings[event.keyCode];
            var isPressed = callback == buttonDown;
            if (isPressed && kbButtonPresses[id])
            {
                // The button is already active so don't trigger callback() however,
                // it should still be "captured" by this app so that things like holding
                // arrow keys don't trigger the brower to scroll.
                event.preventDefault();
                return;
            }
            if (typeof(button) === "undefined") return;
            callback(button);
            kbButtonPresses[id] = isPressed;
            event.preventDefault();
        }

        function nes_init(canvas_id) {
            var canvas = document.getElementById(canvas_id);
            canvas_ctx = canvas.getContext("2d");
            image = canvas_ctx.getImageData(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

            canvas_ctx.fillStyle = "black";
            canvas_ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

            // Allocate framebuffer array.
            var buffer = new ArrayBuffer(image.data.length);
            framebuffer_u8 = new Uint8ClampedArray(buffer);
            framebuffer_u32 = new Uint32Array(buffer);

            // Setup audio.
            audio_ctx = new window.AudioContext();
            script_processor = audio_ctx.createScriptProcessor(AUDIO_BUFFERING, 0, 2);
            script_processor.onaudioprocess = audio_callback;
            script_processor.connect(audio_ctx.destination);
            document.addEventListener('touchstart',       () => { audio_ctx.resume() });
            document.addEventListener('keydown',          () => { audio_ctx.resume() });
        }

        function nes_boot(rom_data) {
            nes.loadROM(rom_data);
            window.requestAnimationFrame(onAnimationFrame);
        }

        function nes_load_data(canvas_id, rom_data) {
            nes_init(canvas_id);
            nes_boot(rom_data);
        }

        function nes_load_url(canvas_id, path, callback, ...args) {
            var req = new XMLHttpRequest();
            req.open("GET", path);
            req.overrideMimeType("text/plain; charset=x-user-defined");
            req.onerror = () => console.log(`Error loading ${path}`);
            req.onload = function() {
                if (this.status === 200 && this.response.startsWith("NES")) {
                    nes_init(canvas_id);
                    nes_boot(this.responseText);
                    DEBUG && console.log(
                        `NinjaPad: ROM loaded [${
                            ninjapad.gameList[getROMHash()] ||
                            path.split("/").pop()
                        }]`,
                    );
                    if (callback) callback(...args);
                }
                else if (this.status === 0) {
                    // Aborted, so ignore error
                }
                else {
                    req.onerror();
                }
            };
            req.send();
        }

        document.addEventListener('keydown', (event) => {keyboard(buttonDown, event)});
        document.addEventListener('keyup', (event) => {keyboard(buttonUp, event)});

        /////////////////////
        // GAMEPAD SUPPORT
        //
        // Based on documentation here: https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API
        /////////////////////

        var haveEvents = 'ongamepadconnected' in window;
        var controllers = {};

        // Once the presses a button on one of the controllers, this will store
        // the index of that controller so that only that controller is checked
        // each frame. This is to avoid additional controllers triggering key_up
        // events when they are just sitting there inactive.
        var cur_controller_index = -1;

        function connecthandler(e) {
          addgamepad(e.gamepad);
        }

        function addgamepad(gamepad) {
          controllers[gamepad.index] = gamepad;
          requestAnimationFrame(updateStatus);
        }

        function disconnecthandler(e) {
          removegamepad(e.gamepad);
        }

        function removegamepad(gamepad) {
          delete controllers[gamepad.index];
        }

        // Check all controllers to see if player has pressed any buttons.
        // If they have, store that as the current controller.
        function findController() {
            for (var j in controllers) {
                var controller = controllers[j];
                for (var i = 0; i < controller.buttons.length; ++i) {
                    var val = controller.buttons[i];
                    var pressed = val == 1.0;
                    if (typeof(val) == "object") {
                        pressed = val.pressed;
                        val = val.value;
                    }
                    if (pressed) {
                        cur_controller_index = j;
                    }
                }
            }
        }

        function updateStatus() {
            if (!haveEvents) {
                scangamepads();
            }

            // If a controller has not yet been chosen, check for one now.
            if (cur_controller_index == -1) {
                findController();
            }

            // Allow for case where controller was chosen this frame
            if (cur_controller_index != -1) {
                var controller = controllers[cur_controller_index];
                for (var i = 0; i < controller.buttons.length; i++) {
                    if (typeof(controllerMappings[i]) === "undefined") {
                        continue;
                    }
                    var button = controller.buttons[i];
                    var id = controllerMappings[i];
                    if (button.pressed) {
                        if (gpButtonPresses[id]) continue;
                        // - - - - - - - - - - - - - - - -
                        if (audio_ctx) audio_ctx.resume();
                        buttonDown(id);
                        gpButtonPresses[id] = true;
                    }
                    else {
                        if (!gpButtonPresses[id]) continue;
                        // - - - - - - - - - - - - - - - -
                        buttonUp(id);
                        gpButtonPresses[id] = false;
                    }
                }
            }
            requestAnimationFrame(updateStatus);
        }

        function scangamepads() {
          var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
          for (var i = 0; i < gamepads.length; i++) {
            if (gamepads[i]) {
              if (gamepads[i].index in controllers) {
                controllers[gamepads[i].index] = gamepads[i];
              } else {
                addgamepad(gamepads[i]);
              }
            }
          }
        }

        window.addEventListener("gamepadconnected", connecthandler);
        window.addEventListener("gamepaddisconnected", disconnecthandler);

        if (!haveEvents) {
         setInterval(scangamepads, 500);
        }

        function buttonDown(b) {
            if (ninjapad.recorder.buffer(b, true)) return;
            nes.buttonDown(1, eval("jsnes.Controller." + b));
            ninjapad.layout.showButtonPress(b, true);
        }

        function buttonUp(b) {
            if (ninjapad.recorder.buffer(b, false)) return;
            nes.buttonUp(1, eval("jsnes.Controller." + b));
            ninjapad.layout.showButtonPress(b, false);
        }

        function getROMHash() {
            const data = nes.romData;
            const arr = [];
            for (var i = 16; i < data.length; ++i) {
                arr.push(data.charCodeAt(i));
            }
            return sha1(arr);
        }

        // If you wish to create your own interface,
        // you need to provide the exact same keys
        return {
            display: {
                width: SCREEN_WIDTH,
                height: SCREEN_HEIGHT
            },

            core: function() {
                return nes;
            }(),

            buttonDown: function(b) {
                buttonDown(b);
            },

            buttonUp: function(b) {
                buttonUp(b);
            },

            releaseAllButtons: function() {
                buttonUp("BUTTON_UP");
                buttonUp("BUTTON_DOWN");
                buttonUp("BUTTON_LEFT");
                buttonUp("BUTTON_RIGHT");
                buttonUp("BUTTON_SELECT");
                buttonUp("BUTTON_START");
                buttonUp("BUTTON_A");
                buttonUp("BUTTON_B");
            },

            pause: function() {
                function _pause() {
                    if (nes.break) return;
                    // - - - - - - - - - - - - - - - - - - - - - - -
                    nes.break = true;
                    if (audio_ctx && audio_ctx.suspend) {
                        audio_ctx.suspend();
                    }
                    audio_ctx = {
                        resume: function() {},
                        isNull: true
                    };
                    if (typeof enforcePause === 'undefined') {
                        enforcePause = setInterval(_pause, 16);
                    }
                }
                _pause();
            },

            resume: function() {
                if (!nes.rom.header) return;
                clearInterval(enforcePause);
                enforcePause = undefined;
                if (audio_ctx.isNull) {
                    audio_ctx = new window.AudioContext();
                    script_processor = audio_ctx.createScriptProcessor(AUDIO_BUFFERING, 0, 2);
                    script_processor.onaudioprocess = audio_callback;
                    script_processor.connect(audio_ctx.destination);
                }
                audio_ctx.resume();
                nes.break = false;
            },

            loadROMData: function(d) {
                nes.loadROM(d);
            },

            reloadROM: function() {
                nes.reloadROM();
            },

            getROMData: function() {
                return nes.romData;
            },

            getROMHash: function() {
                return getROMHash();
            },

            getROMName: function() {
                const hash = getROMHash();
                return ninjapad.gameList[hash];
            },

            saveState: function() {
                const o = nes.toJSON();
                const s = JSON.stringify(o);
                return ninjapad.utils.zip(s);
            },

            loadState: function(z) {
                const s = ninjapad.utils.unzip(z);
                const o = JSON.parse(s);
                nes.fromJSON(o);
            },

            isROMLoaded: function() {
                return !!nes.rom.header;
            },

            frameCount: function() {
                return frameCounter;
            },

            resetFrameCount: function() {
                frameCounter = 0;
            },

            memory: function() {
                return nes.cpu.mem;
            },

            initialize: function(callback, ...args) {
                var expr = /^\?rom=(.*\.nes)/;
                var url = expr.exec(window.location.search);
                url = url ? "roms/" + url.pop() : DEFAULT_ROM;
                nes_load_url(EMULATION_DISPLAY, url, callback, ...args);
            }
        };
    },

    // BINJNES INTERFACE
    binjnes: async function() {
        // This code is a modified port of the binjnes example:
        // https://github.com/binji/binjnes/tree/main/docs/simple.js
        "use strict";

        const SCREEN_WIDTH = 256;
        const SCREEN_HEIGHT = 240;
        const AUDIO_FRAMES = 4096;
        const AUDIO_LATENCY_SEC = 0.1;
        const MAX_UPDATE_SEC = 5 / 60;
        const PPU_TICKS_PER_SECOND = 5369318;
        const EVENT_NEW_FRAME = 1;
        const EVENT_AUDIO_BUFFER_FULL = 2;
        const EVENT_UNTIL_TICKS = 4;

        // TODO: copied from definitions in jsnes interface, find a way to share
        const controllerMappings = {  // DualShock 4
            12: "BUTTON_UP",        // DPAD Up
            13: "BUTTON_DOWN",      // DPAD Down
            14: "BUTTON_LEFT",      // DPAD Left
            15: "BUTTON_RIGHT",     // DPAD Right
             0: "BUTTON_A",         // Cross
             2: "BUTTON_B",         // Square
             8: "BUTTON_SELECT",    // Share
             9: "BUTTON_START"      // Options
        }

        const keyboardMappings = {
            38: "BUTTON_UP",        // Up
            87: "BUTTON_UP",        // W
            40: "BUTTON_DOWN",      // Down
            83: "BUTTON_DOWN",      // S
            37: "BUTTON_LEFT",      // Left
            65: "BUTTON_LEFT",      // A
            39: "BUTTON_RIGHT",     // Right
            68: "BUTTON_RIGHT",     // D
            18: "BUTTON_A",         // Alt
            88: "BUTTON_A",         // X
            17: "BUTTON_B",         // Ctrl
            90: "BUTTON_B",         // Z
            32: "BUTTON_SELECT",    // Space
            16: "BUTTON_SELECT",    // Right Shift
            13: "BUTTON_START"      // Enter
        }

        let nes = null;
        let frameCounter = 0;

        let gpButtonPresses = {
            "BUTTON_UP": false,
            "BUTTON_DOWN": false,
            "BUTTON_LEFT": false,
            "BUTTON_RIGHT": false,
            "BUTTON_A": false,
            "BUTTON_B": false,
            "BUTTON_SELECT": false,
            "BUTTON_START": false
        };

        let kbButtonPresses = {
            "BUTTON_UP": false,
            "BUTTON_DOWN": false,
            "BUTTON_LEFT": false,
            "BUTTON_RIGHT": false,
            "BUTTON_A": false,
            "BUTTON_B": false,
            "BUTTON_SELECT": false,
            "BUTTON_START": false
        };

        const binjnes = await Binjnes();

        function resumeAudio() { if (nes) nes.audio.resume(); }
        document.addEventListener('touchstart', resumeAudio);
        document.addEventListener('keydown',    resumeAudio);

        function makeWasmBuffer(ptr, size) {
            return new Uint8Array(binjnes.HEAP8.buffer, ptr, size);
        }

        class BinjnesEmulator {
            static start(romBuffer) {
                BinjnesEmulator.stop();
                nes = new BinjnesEmulator(romBuffer);
                nes.run();
            }

            static stop() {
                if (nes) {
                    nes.destroy();
                    nes = null;
                }
            }

            constructor(romBuffer) {
                this.romData = romBuffer;
                this.romDataPtr = binjnes._malloc(romBuffer.byteLength);
                let buf = makeWasmBuffer(this.romDataPtr, romBuffer.byteLength);
                buf.set(new Uint8Array(romBuffer));
                this.e = binjnes._emulator_new_simple(
                    this.romDataPtr, romBuffer.byteLength, Audio.ctx.sampleRate,
                    AUDIO_FRAMES);
                if (this.e == 0) {
                    throw new Error('Invalid ROM.');
                }

                this.audio = new Audio(this.e);
                this.video = new Video(this.e);
                this.joypadPtr = binjnes._joypad_new_simple(this.e);
                this.lastRafSec = 0;
                this.leftoverTicks = 0;
                this.bindKeys();
                this.bindGamepads();
            }

            loadState(u8a) {
                let dataPtr = binjnes._malloc(u8a.length);
                let buf = makeWasmBuffer(dataPtr, u8a.length);
                buf.set(u8a);
                let fileDataPtr = binjnes._state_file_data_new();
                binjnes._set_file_data_ptr(fileDataPtr, dataPtr);
                binjnes._set_file_data_size(u8a.length);
                binjnes._emulator_read_state(this.e, fileDataPtr);
                binjnes._file_data_delete2(fileDataPtr);
            }

            saveState() {
                let fileDataPtr = binjnes._state_file_data_new();
                binjnes._emulator_write_state(this.e, fileDataPtr);
                let buf = makeWasmBuffer(
                    binjnes._get_file_data_ptr(fileDataPtr),
                    binjnes._get_file_data_size(fileDataPtr)).slice();
                binjnes._file_data_delete2(fileDataPtr);
                return buf;
            }

            getROMHash() {
                return sha1(this.romData);
            }

            destroy() {
                this.unbindGamepads();
                this.unbindKeys();
                this.cancelAnimationFrame();
                binjnes._joypad_delete(this.joypadPtr);
                binjnes._emulator_delete(this.e);
                binjnes._free(this.romDataPtr);
            }

            withNewFileData(cb) {
                const buffer = makeWasmBuffer(
                    binjnes._get_file_data_ptr(fileDataPtr),
                    binjnes._get_file_data_size(fileDataPtr));
                const result = cb(fileDataPtr, buffer);
                binjnes._file_data_delete(fileDataPtr);
                return result;
            }

            get isPaused() {
                return this.rafCancelToken === null;
            }

            pause() {
                if (!this.isPaused) {
                    this.cancelAnimationFrame();
                    this.audio.pause();
                }
            }

            resume() {
                if (this.isPaused) {
                    this.requestAnimationFrame();
                    this.audio.resume();
                }
            }

            requestAnimationFrame() {
                this.rafCancelToken = requestAnimationFrame(this.rafCallback.bind(this));
            }

            cancelAnimationFrame() {
                cancelAnimationFrame(this.rafCancelToken);
                this.rafCancelToken = null;
            }

            run() {
                this.requestAnimationFrame();
            }

            get ticks() {
                return binjnes._emulator_get_ticks_f64(this.e);
            }

            runUntil(ticks) {
                while (true) {
                    const event = binjnes._emulator_run_until_f64(this.e, ticks);
                    if (event & EVENT_NEW_FRAME) {
                        this.video.uploadTexture();
                        ninjapad.recorder.read(frameCounter) ||
                            ninjapad.recorder.write(frameCounter);
                        ++frameCounter;
                    }
                    if (event & EVENT_AUDIO_BUFFER_FULL) {
                        this.audio.pushBuffer();
                    }
                    if (event & EVENT_UNTIL_TICKS) {
                        break;
                    }
                }
            }

            rafCallback(startMs) {
                this.requestAnimationFrame();
                let deltaSec = 0;
                const startSec = startMs / 1000;
                deltaSec = Math.max(startSec - (this.lastRafSec || startSec), 0);
                const startTicks = this.ticks;
                const deltaTicks =
                    Math.min(deltaSec, MAX_UPDATE_SEC) * PPU_TICKS_PER_SECOND;
                const runUntilTicks = (startTicks + deltaTicks - this.leftoverTicks);
                this.runUntil(runUntilTicks);
                this.leftoverTicks = (this.ticks - runUntilTicks) | 0;
                this.lastRafSec = startSec;
                this.video.renderTexture();
                this.updateGamepadStatus();
            }

            bindKeys() {
                this.keyFuncs = {
                    'BUTTON_A': binjnes._set_joyp_A.bind(null, this.e, 0),
                    'BUTTON_B': binjnes._set_joyp_B.bind(null, this.e, 0),
                    'BUTTON_SELECT': binjnes._set_joyp_select.bind(null, this.e, 0),
                    'BUTTON_START': binjnes._set_joyp_start.bind(null, this.e, 0),
                    'BUTTON_UP': binjnes._set_joyp_up.bind(null, this.e, 0),
                    'BUTTON_DOWN': binjnes._set_joyp_down.bind(null, this.e, 0),
                    'BUTTON_LEFT': binjnes._set_joyp_left.bind(null, this.e, 0),
                    'BUTTON_RIGHT': binjnes._set_joyp_right.bind(null, this.e, 0),
                };

                this.boundKeyDown = this.keyDown.bind(this);
                this.boundKeyUp = this.keyUp.bind(this);

                window.addEventListener('keydown', this.boundKeyDown);
                window.addEventListener('keyup', this.boundKeyUp);
            }

            unbindKeys() {
                window.removeEventListener('keydown', this.boundKeyDown);
                window.removeEventListener('keyup', this.boundKeyUp);
            }

            keyDown(event) {
                if (event.keyCode in keyboardMappings) {
                    event.preventDefault();
                    let button = keyboardMappings[event.keyCode];
                    if (kbButtonPresses[button]) return;
                    this.buttonChanged(button, true);
                    kbButtonPresses[button] = true;
                }
            }

            keyUp(event) {
                if (event.keyCode in keyboardMappings) {
                    event.preventDefault();
                    let button = keyboardMappings[event.keyCode];
                    if (!kbButtonPresses[button]) return;
                    this.buttonChanged(button, false);
                    kbButtonPresses[button] = false;
                }
            }

            buttonChanged(b, state) {
                if (ninjapad.recorder.buffer(b, state)) return;
                this.keyFuncs[b](state);
                ninjapad.layout.showButtonPress(b, state);
            }

            bindGamepads() {
                // TODO: copied from definitions in jsnes interface, find a way
                // to share
                this.controllers = {};

                // Once the presses a button on one of the controllers, this
                // will store the index of that controller so that only that
                // controller is checked each frame. This is to avoid additional
                // controllers triggering key_up events when they are just
                // sitting there inactive.
                this.curControllerIndex = -1;
                this.boundAddGamepad = this.addGamepad.bind(this);
                this.boundRemoveGamepad = this.removeGamepad.bind(this);
                window.addEventListener("gamepadconnected", this.boundAddGamepad);
                window.addEventListener("gamepaddisconnected", this.boundRemoveGamepad);
                const haveEvents = 'ongamepadconnected' in window;
            }

            unbindGamepads() {
                window.removeEventListener("gamepadconnected", this.boundAddGamepad);
                window.removeEventListener("gamepaddisconnected", this.boundRemoveGamepad);
            }

            // Check all controllers to see if player has pressed any
            // buttons. If they have, store that as the current controller.
            findController() {
                for (let j in this.controllers) {
                    const controller = this.controllers[j];
                    for (let i = 0; i < controller.buttons.length; ++i) {
                        let val = controller.buttons[i];
                        let pressed = val == 1.0;
                        if (typeof(val) == "object") {
                            pressed = val.pressed;
                            val = val.value;
                        }
                        if (pressed) {
                            this.curControllerIndex = j;
                        }
                    }
                }
            }

            updateGamepadStatus() {
                const haveEvents = 'ongamepadconnected' in window;
                if (!haveEvents) {
                    this.scanGamepads();
                }

                // If a controller has not yet been chosen, check for one
                // now.
                if (this.curControllerIndex == -1) {
                    this.findController();
                }

                // Allow for case where controller was chosen this frame
                if (this.curControllerIndex != -1) {
                    const controller = this.controllers[this.curControllerIndex];
                    for (let i = 0; i < controller.buttons.length; i++) {
                        if (typeof(controllerMappings[i]) === "undefined") {
                            continue;
                        }
                        const button = controller.buttons[i];
                        const id = controllerMappings[i];
                        if (button.pressed) {
                            if (gpButtonPresses[id]) continue;
                            this.audio.resume();
                            buttonDown(id);
                            gpButtonPresses[id] = true;
                        } else {
                            if (!gpButtonPresses[id]) continue;
                            buttonUp(id);
                            gpButtonPresses[id] = false;
                        }
                    }
                }
            }

            addGamepad(gamepad) {
                this.controllers[gamepad.index] = gamepad;
            }

            removeGamepad(gamepad) {
                delete this.controllers[gamepad.index];
            }

            scanGamepads() {
                const gamepads = navigator.getGamepads ? navigator.getGamepads()
                                 : navigator.webkitGetGamepads
                                     ? navigator.webkitGetGamepads()
                                     : [];
                for (let i = 0; i < gamepads.length; i++) {
                    if (gamepads[i]) {
                        if (gamepads[i].index in this.controllers) {
                            this.controllers[gamepads[i].index] = gamepads[i];
                        } else {
                            this.addGamepad(gamepads[i]);
                        }
                    }
                }
            }
        }

        class Audio {
            constructor(e) {
                this.buffer = new Float32Array(binjnes.HEAP8.buffer,
                  binjnes._get_audio_buffer_ptr(e),
                  binjnes._get_audio_buffer_capacity(e));
                this.startSec = 0;
                this.volume = 0.5;
                this.resume();
            }

            get sampleRate() { return Audio.ctx.sampleRate; }

            pushBuffer() {
                const nowSec = Audio.ctx.currentTime;
                const nowPlusLatency = nowSec + AUDIO_LATENCY_SEC;
                const volume = this.volume;
                this.startSec = (this.startSec || nowPlusLatency);
                if (this.startSec >= nowSec) {
                    const buffer = Audio.ctx.createBuffer(1, AUDIO_FRAMES, this.sampleRate);
                    const channel = buffer.getChannelData(0);
                    for (let i = 0; i < AUDIO_FRAMES; i++) {
                      channel[i] = this.buffer[i] * volume;
                    }
                    const bufferSource = Audio.ctx.createBufferSource();
                    bufferSource.buffer = buffer;
                    bufferSource.connect(Audio.ctx.destination);
                    bufferSource.start(this.startSec);
                    const bufferSec = AUDIO_FRAMES / this.sampleRate;
                    this.startSec += bufferSec;
                } else {
                    this.startSec = nowPlusLatency;
                }
            }

            pause() {
                Audio.ctx.suspend();
            }

            resume() {
                Audio.ctx.resume();
            }
        }

        Audio.ctx = new AudioContext;

        class Video {
            constructor(e) {
                let el = document.getElementById(EMULATION_DISPLAY);
                this.e = e;
                this.ctx = el.getContext('2d');
                this.imageData = this.ctx.createImageData(SCREEN_WIDTH, SCREEN_HEIGHT);
                this.rgbaBuffer = new Uint32Array(binjnes.HEAP32.buffer,
                    binjnes._get_rgba_frame_buffer_ptr(e),
                    binjnes._get_rgba_frame_buffer_size(e) >> 2);
            }

            uploadTexture() {
                binjnes._emulator_convert_frame_buffer_simple(this.e);
                this.imageData.data.set(new Uint8ClampedArray(
                    this.rgbaBuffer.buffer, this.rgbaBuffer.byteOffset,
                    this.rgbaBuffer.byteLength));
            }

            renderTexture() {
                this.ctx.putImageData(
                    this.imageData, 0, 0,
                    0, OVERSCAN_TOP, SCREEN_WIDTH, SCREEN_HEIGHT - OVERSCAN_TOP - OVERSCAN_BOTTOM);
            }
        }

        // TODO: copied from definitions in jsnes interface, find a way to share
        function nes_load_url(path, callback, ...args) {
            const req = new XMLHttpRequest();
            req.open("GET", path);
            req.overrideMimeType("text/plain; charset=x-user-defined");
            req.onerror = () => console.log(`Error loading ${path}`);
            req.responseType = "arraybuffer";
            req.onload = function() {
                if (this.status === 200) {
                    BinjnesEmulator.start(this.response);
                    DEBUG && console.log(
                        `NinjaPad: ROM loaded [${
                            ninjapad.gameList[nes.getROMHash()] ||
                            path.split("/").pop()
                        }]`,
                    );
                    if (callback) callback(...args);
                }
                else if (this.status === 0) {
                    // Aborted, so ignore error
                }
                else {
                    req.onerror();
                }
            };
            req.send();
        }

        function stringToUint8Array(s) {
            const buffer = new Uint8Array(s.length);
            for (let i = 0; i < s.length; ++i) {
                buffer[i] = s.charCodeAt(i);
            }
            return buffer;
        }

        function uint8ArrayToString(u8a) {
            let s = "";
            for (let i = 0; i < u8a.length; ++i) {
                s += String.fromCharCode(u8a[i]);
            }
            return s;
        }

        // If you wish to create your own interface,
        // you need to provide the exact same keys
        return {
            display: {
                width: SCREEN_WIDTH,
                height: SCREEN_HEIGHT
            },

            core: function() {
                throw "unimplemented core"
            },

            buttonDown: function(b) {
                if (nes) nes.buttonChanged(b, true);
            },

            buttonUp: function(b) {
                if (nes) nes.buttonChanged(b, false);
            },

            releaseAllButtons: function() {
                if (nes) {
                    nes.buttonChanged("BUTTON_UP");
                    nes.buttonChanged("BUTTON_DOWN");
                    nes.buttonChanged("BUTTON_LEFT");
                    nes.buttonChanged("BUTTON_RIGHT");
                    nes.buttonChanged("BUTTON_SELECT");
                    nes.buttonChanged("BUTTON_START");
                    nes.buttonChanged("BUTTON_A");
                    nes.buttonChanged("BUTTON_B");
                }
            },

            pause: function() {
                if (nes) nes.pause();
            },

            resume: function() {
                if (nes) nes.resume();
            },

            loadROMData: function(s) {
                BinjnesEmulator.start(stringToUint8Array(s));
            },

            reloadROM: function() {
                if (nes) BinjnesEmulator.start(nes.romData);
            },

            getROMData: function() {
                if (nes) return nes.romData;
            },

            getROMHash: function() {
                if (nes) return nes.getROMHash();
            },

            getROMName: function() {
                if (nes) {
                    const hash = nes.getROMHash();
                    return ninjapad.gameList[hash];
                }
            },

            saveState: function() {
                if (nes) {
                    const u8a = nes.saveState();
                    const s = uint8ArrayToString(u8a);
                    return ninjapad.utils.zip(s);
                }
            },

            loadState: function(z) {
                if (nes) {
                    const s = ninjapad.utils.unzip(z);
                    const u8a = stringToUint8Array(s);
                    nes.loadState(u8a);
                }
            },

            isROMLoaded: function() {
                return nes !== null;
            },

            frameCount: function() {
                return frameCounter;
            },

            resetFrameCount: function() {
                frameCounter = 0;
            },

            memory: function() {
                // TODO: return something better here?
                return '';
            },

            initialize: function(callback, ...args) {
                const expr = /^\?rom=(.*\.nes)/;
                let url = expr.exec(window.location.search);
                url = url ? "roms/" + url.pop() : DEFAULT_ROM;
                nes_load_url(url, callback, ...args);
            }
        };
    },
};
