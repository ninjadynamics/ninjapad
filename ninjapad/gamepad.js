// 2021 Ninja Dynamics
// Creative Commons Attribution 4.0 International Public License

ninjapad.gamepad = function() {
    const PRESSED = true;
    const RELEASED = false;

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

    var buttonPresses = {
        "BUTTON_UP": RELEASED,
        "BUTTON_DOWN": RELEASED,
        "BUTTON_LEFT": RELEASED,
        "BUTTON_RIGHT": RELEASED,
        "BUTTON_A": RELEASED,
        "BUTTON_B": RELEASED,
        "BUTTON_SELECT": RELEASED,
        "BUTTON_START": RELEASED,
        "MULTI_UR": RELEASED,
        "MULTI_DR": RELEASED,
        "MULTI_UL": RELEASED,
        "MULTI_DL": RELEASED,
        "MULTI_AB": RELEASED
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

                        var r = ninjapad.utils.angle(analog.deltaX, analog.deltaY);
                        var d = Math.min(
                            ninjapad.layout.analogStickMovementRadius,
                            ninjapad.utils.dist(analog.deltaX, analog.deltaY)
                        );

                        var dx = Math.cos(r) * d;
                        var dy = Math.sin(r) * d;
                        ninjapad.elements.analogStick.css(
                            "transform",
                            "translate(" + dx + "px, " + dy + "px)"
                        );
                        var btnIndex = Math.floor(((180 + (45/2) + (r * 180 / Math.PI)) % 360) / 45);
                        analog.padBtn && pressButtons(ninjapad.emulator.buttonUp, analog.padBtn);
                        analog.padBtn = d < ninjapad.utils.vmin(DEADZONE) ? null : DPAD_BUTTONS[btnIndex];
                        analog.padBtn && pressButtons(ninjapad.emulator.buttonDown, analog.padBtn);
                        break;

                    default:
                        analog.padBtn && pressButtons(ninjapad.emulator.buttonUp, analog.padBtn);
                        analogReset(ninjapad.elements.analogStick);
                }
            }
        },

        buttonPress: function(event) {
            // Prevent all the shenanigans that happen with a "long-press" on mobile
            event.preventDefault();

            // Get the source element
            target = event.target;

            const bgcolor = "rgba(255, 255, 255, 0.03)"; // TODO: get it from boot

            // Handle the touch
            for (const touch of event.changedTouches) {
                // Ignore any touches where the target
                // element doesn't match the source element
                if (touch.target.id != target.id) continue;
                // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

                // Get the element (either a button or the empty area of the gamepad)
                // the user is physically touching right now
                var element = $(document.elementFromPoint(touch.clientX, touch.clientY))[0];

                // If it's a new touch, set the child button to its parent
                if (event.type == "touchstart") {
                    childButton[target.id] = element;
                }
                // Otherwise, if the user is sliding its finger from one button to another
                // or simply stops touching the screen with that finger
                else if (childButton[target.id].id != element.id) {
                //else if (element.id && childButton[target.id].id != element.id) {
                    // Check which button (if any) the user had its finger on previously
                    var lastButton = childButton[target.id];
                    // If the user was actually pressing a button before
                    if (lastButton.id.startsWith("BUTTON")) {
                        // Tell the emulator to release that button
                        if (buttonPresses[lastButton.id] == PRESSED) {
                            ninjapad.emulator.buttonUp(lastButton.id);
                            buttonPresses[lastButton.id] = RELEASED;
                        }
                    }
                    // Otherwise, if it was a multipress
                    else if (lastButton.id.startsWith("MULTI")) {
                        // Get buttons
                        var key = lastButton.id.split("_").pop();
                        for (const btn of MULTIPRESS[key]) {
                            if (buttonPresses[btn] == RELEASED) continue;
                            // - - - - - - - - - - - - - - - - - - - -
                            ninjapad.emulator.buttonUp(btn);
                            buttonPresses[btn] = RELEASED;
                        }
                        // Show button release (shadow button)
                        if (buttonPresses[lastButton.id] == PRESSED) {
                            $(lastButton).css(
                                "background-color",
                                lastButton.id == "MULTI_AB" ? bgcolor : "transparent"
                            );
                            DEBUG && console.log("NinjaPad: Released", lastButton.id); // Debug
                            buttonPresses[lastButton.id] = RELEASED;
                        }
                    }
                    // Update the child button to be the one the user is touching right now
                    childButton[target.id] = element;
                }

                // If the user is interacting with a single button
                var isPressed = isButtonDown(event.type);
                var interactWith = fnButtonPress(event.type);
                if (element.id.startsWith("BUTTON")) {
                    // Press / release that button
                    if (buttonPresses[element.id] != isPressed) {
                        interactWith(element.id);
                        buttonPresses[element.id] = isPressed;
                    }
                }
                // Otherwise, if the interaction corresponds
                // to two buttons at the same time
                else if (element.id.startsWith("MULTI")) {
                    // Get buttons and press / release them
                    var key = element.id.split("_").pop();
                    for (const btn of MULTIPRESS[key]) {
                        if (buttonPresses[btn] == isPressed) continue;
                        // - - - - - - - - - - - - - - - - - - - - - -
                        interactWith(btn);
                        buttonPresses[btn] = isPressed;
                    }
                    // Show button press / release (shadow button)
                    if (buttonPresses[element.id] == isPressed) continue;
                    // - - - - - - - - - - - - - - - - - - - - - - - - - -
                    $(element).css(
                        "background-color",
                        isPressed ? "#444" : (
                            element.id == "MULTI_AB" ?  bgcolor : "transparent"
                        )
                    );
                    DEBUG && console.log("NinjaPad:", isPressed ? "Pressed" : "Released", element.id);
                    buttonPresses[element.id] = isPressed;
                }
            }
        },

        analogSwitch: function(event) {
            event.preventDefault();
            if (event.type == "touchstart") {
                ninjapad.elements.analogSwitch.css("border-style", "inset");
                return;
            }
            ninjapad.elements.analogSwitch.css("border-style", "outset");

            var color_off = ninjapad.utils.getCSSVar("#analogSwitch", "color");
            var color_on = ninjapad.utils.getCSSVar("#analogSwitch", "color_on");

            if (ninjapad.elements.analog.css("display") == "none") {
                analog.active = true;
                ninjapad.elements.dpad.hide();
                ninjapad.elements.analog.show();
                analogReset(ninjapad.elements.analog);
                ninjapad.utils.changeButtonColor("#analogSwitch", color_on, glow=true);
                return;
            }
            analog.active = false;
            ninjapad.elements.analog.hide();
            ninjapad.elements.dpad.show();
            ninjapad.utils.changeButtonColor("#analogSwitch", color_off);
        },

        toggleMainMenu: function(event) {
            event.preventDefault();
            if (event.type == "touchstart") {
                ninjapad.elements.menu.css("border-style", "inset");
                return;
            }
            ninjapad.elements.menu.css("border-style", "outset");
            ninjapad.menu.toggle.mainMenu();
        },

        // Doesn't work on iOS
        toggleFullScreen: function(event) {
            event.preventDefault();
            var element = document.getElementById("ninjaPad");
            ninjapad.utils.isFullScreen() ?
            ninjapad.utils.exitFullScreen() :
            ninjapad.utils.enterFullscreen(element);
        }
    }
}();
