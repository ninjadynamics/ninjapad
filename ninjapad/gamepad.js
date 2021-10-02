// 2021 Ninja Dynamics
// Creative Commons Attribution 4.0 International Public License

ninjapad.gamepad = function() {
    // Handle single-touch multiple button presses
    const MULTIPRESS = {
        "UR": ["BUTTON_UP",   "BUTTON_RIGHT"],
        "DR": ["BUTTON_DOWN", "BUTTON_RIGHT"],
        "UL": ["BUTTON_UP",   "BUTTON_LEFT" ],
        "DL": ["BUTTON_DOWN", "BUTTON_LEFT" ],
        "AB": ["BUTTON_A",    "BUTTON_B"    ]
    };

    const DPAD_BUTTONS = [
        ["BUTTON_LEFT"                ],
        ["BUTTON_UP",   "BUTTON_LEFT" ],
        ["BUTTON_UP",                 ],
        ["BUTTON_UP",   "BUTTON_RIGHT"],
        ["BUTTON_RIGHT"               ],
        ["BUTTON_DOWN", "BUTTON_RIGHT"],
        ["BUTTON_DOWN"                ],
        ["BUTTON_DOWN", "BUTTON_LEFT" ],
    ]

    // This object is necessary to handle the user
    // sliding their finger from one button to another
    var childButton = {};

    var analog = {
        active: false,
        touchX: undefined,
        touchY: undefined,
        deltaX: undefined,
        deltaY: undefined,
        padBtn: undefined
    };

    function isButtonDown(eventType) {
        return eventType.endsWith("start") || eventType.endsWith("move");
    }

    function fnButtonPress(eventType) {
        return isButtonDown(eventType) ? ninjapad.emulator.buttonDown : ninjapad.emulator.buttonUp;
    }

    function pressButtons(fn, buttons) {
        for (const b of buttons) fn(b);
    }

    function analogReset(element) {
        element.css("transform", "translate(0, 0)");
    }

    return {
        analogTouch: function(event) {
            event.preventDefault();
            event.stopPropagation();
            for (const touch of event.changedTouches) {
                // Ignore any touches where the target
                // element doesn't match the source element
                if (touch.target.id != event.target.id) continue;

                switch (event.type) {
                    case "touchstart":
                        analog.touchX = touch.clientX;
                        analog.touchY = touch.clientY;
                        break;

                    case "touchmove":
                        analog.deltaX = touch.clientX - analog.touchX;
                        analog.deltaY = touch.clientY - analog.touchY;

                        let r = ninjapad.utils.angle(analog.deltaX, analog.deltaY);
                        let d = Math.min(ninjapad.utils.vw(10), ninjapad.utils.dist(analog.deltaX, analog.deltaY));

                        let dx = Math.cos(r) * d;
                        let dy = Math.sin(r) * d;
                        ninjapad.jQElement.analogStick.css(
                            "transform",
                            "translate(" + dx + "px, " + dy + "px)"
                        );
                        let btnIndex = Math.floor(((180 + (45/2) + (r * 180 / Math.PI)) % 360) / 45);
                        analog.padBtn && pressButtons(ninjapad.emulator.buttonUp, analog.padBtn);
                        analog.padBtn = d < ninjapad.utils.vw(DEADZONE) ? null : DPAD_BUTTONS[btnIndex];
                        analog.padBtn && pressButtons(ninjapad.emulator.buttonDown, analog.padBtn);
                        break;

                    default:
                        analog.padBtn && pressButtons(ninjapad.emulator.buttonUp, analog.padBtn);
                        analogReset(ninjapad.jQElement.analogStick);
                }
            }
        },

        buttonPress: function(event) {
            // Prevent all the shenanigans that happen with a "long-press" on mobile
            event.preventDefault();

            // Get the source element
            target = event.target;

            // Handle the touch
            for (const touch of event.changedTouches) {
                // Ignore any touches where the target
                // element doesn't match the source element
                if (touch.target.id != target.id) continue;
                // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

                // Get the element (either a button or the empty area of the gamepad)
                // the user is physically touching right now
                let element = $(document.elementFromPoint(touch.clientX, touch.clientY))[0];

                // If it's a new touch, set the child button to its parent
                if (event.type == "touchstart") {
                    childButton[target.id] = element;
                }
                // Otherwise, if the user is sliding its finger from one button to another
                // or simply stops touching the screen with that finger
                else if (childButton[target.id].id != element.id) {
                //else if (element.id && childButton[target.id].id != element.id) {
                    // Check which button (if any) the user had its finger on previously
                    let lastButton = childButton[target.id];
                    // If the user was actually pressing a button before
                    if (lastButton.id.startsWith("BUTTON")) {
                        // Tell the emulator to release that button
                        ninjapad.emulator.buttonUp(lastButton.id);
                        $(lastButton).css("border-style", "outset");
                        DEBUG && console.log("NinjaPad: Released", lastButton.id); // Debug
                    }
                    // Otherwise, if it was a multipress
                    else if (lastButton.id.startsWith("MULTI")) {
                        // Get buttons
                        let key = lastButton.id.split("_").pop();
                        for (const d of MULTIPRESS[key]) {
                            ninjapad.emulator.buttonUp(d);
                        }
                        $(lastButton).css("background-color", "transparent");
                        DEBUG && console.log("NinjaPad: Released", lastButton.id); // Debug
                    }
                    // Update the child button to be the one the user is touching right now
                    childButton[target.id] = element;
                }

                // If the user is actually interacting a button right now
                if (element.id.startsWith("BUTTON")) {

                    // Press / release that button
                    fnButtonPress(event.type)(element.id);

                    // Show button presses / releases
                    if (isButtonDown(event.type)) {
                        $(element).css("border-style", "inset");
                        DEBUG && console.log("NinjaPad: Pressed", element.id); // Debug
                    }
                    else {
                        $(element).css("border-style", "outset");
                        DEBUG && console.log("NinjaPad: Released", element.id);  // Debug
                    }
                }
                // Otherwise, if it's actually two buttons at the same time
                else if (element.id.startsWith("MULTI")) {

                    // Get the correct function call
                    let fn = fnButtonPress(event.type)

                    // Get buttons and press / release them
                    let key = element.id.split("_").pop();
                    for (const d of MULTIPRESS[key]) {
                        fn(d);
                    }

                    // Resume emulation and show button presses / releases
                    if (isButtonDown(event.type)) {
                        $(element).css("background-color", "#444");
                        DEBUG && console.log("NinjaPad: Pressed", element.id); // Debug
                    }
                    else {
                        $(element).css("background-color", "transparent");
                        DEBUG && console.log("NinjaPad: Released", element.id); // Debug
                    }
                }
            }
        },

        analogSwitch: function(event) {
            event.preventDefault();
            if (event.type == "touchstart") {
                ninjapad.jQElement.analogSwitch.css("border-style", "inset");
                return;
            }
            ninjapad.jQElement.analogSwitch.css("border-style", "outset");

            if (ninjapad.jQElement.analog.css("display") == "none") {
                analog.active = true;
                ninjapad.jQElement.dpad.hide();
                ninjapad.jQElement.analog.show();
                analogReset(ninjapad.jQElement.analog);
                return;
            }
            analog.active = false;
            ninjapad.jQElement.analog.hide();
            ninjapad.jQElement.dpad.show();
        },

        toggleMenu: function(event) {
            event.preventDefault();
            if (event.type == "touchstart") {
                ninjapad.jQElement.menu.css("border-style", "inset");
                return;
            }
            ninjapad.jQElement.menu.css("border-style", "outset");
            ninjapad.menu.toggleMenu();
        },

        // Doesn't work on iOS
        toggleFullScreen: function(event) {
            event.preventDefault();
            let element = document.getElementById("ninjaPad");
            ninjapad.utils.isFullScreen() ? ninjapad.utils.exitFullScreen() : ninjapad.utils.enterFullscreen(element);
        },
    }
}();
