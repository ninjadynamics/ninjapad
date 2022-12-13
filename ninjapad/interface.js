ninjapad.interface = {
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
            canvas_ctx.putImageData(image, 0, 0);
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
    }()
};
