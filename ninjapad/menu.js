// 2021 Ninja Dynamics
// Creative Commons Attribution 4.0 International Public License

ninjapad.menu = function() {
    const iRStates = [
        "OFF",
        "ON-R",
        "ON-S"
    ];

    var iRState = 0;

    var state = { isOpen: false };

    function inColor(color, text) {
        return `<font color='${color}'>${text}</font>`;
    }

    function allowUserInteraction(ontap=null) {
        ninjapad.utils.allowInteraction("pauseScreenContent");
        ninjapad.utils.assignNoPropagation(ontap, "OSD", ontap && "end");
    }

    function preventUserInteraction(ontap=null) {
        ninjapad.utils.assign(null, "pauseScreenContent");
        ninjapad.utils.assignNoPropagation(ontap, "OSD", ontap && "end");
    }

    function showError(msg) {
        $("#pauseScreenContent").html(
            ninjapad.utils.html("div", "error", msg)
        );
        preventUserInteraction(returnToMainMenu);
    }

    function optionsMenu() {
        return ninjapad.utils.createMenu(null,
            ninjapad.utils.link("Import save data"),
            ninjapad.utils.link("Export save data"),
            ninjapad.utils.link(
                `Input recorder ${inColor("lime", iRStates[iRState])}`,
                js=`ninjapad.menu.cycleIRState();
                    ninjapad.menu.options()`
            ),
            ninjapad.utils.link(
                `${inColor("yellow", "BACK")}`,
                js="ninjapad.menu.mainMenu()"
            ),
        );
    }

    function mainMenu() {
        return ninjapad.utils.createMenu(null,
            ninjapad.utils.link(
                "Load ROM",
                js="ninjapad.menu.uploadROM()",
                hide=SINGLE_ROM
            ),
            ninjapad.utils.link(
                "Save State",
                js="ninjapad.menu.saveState()"
            ),
            ninjapad.utils.link(
                "Load State",
                js="ninjapad.menu.loadState()"
            ),
            ninjapad.utils.link(
                "Options",
                js="ninjapad.menu.options()"
            ),
            ninjapad.utils.link(
                "Reset",
                js="ninjapad.menu.reset()"
            ),
            ninjapad.utils.link(
                "About",
                js="ninjapad.menu.about()"
            )
        );
    }

    function showMenu(fnMenu) {
        $("#pauseScreenContent").html(
            fnMenu()
        );
        allowUserInteraction();
    }

    function openMainMenu() {
        ninjapad.pause.pauseEmulation(
            ninjapad.utils.html(
                "span", "pauseScreenContent", mainMenu()
            )
        );
        allowUserInteraction();
        state.isOpen = true;
    }

    function returnToMainMenu(event) {
        event.stopPropagation();
        showMenu(mainMenu);
    }

    return {
        state: state,

        loadState: function() {
            const hash = sha256(ninjapad.emulator.getROMData());
            const data = localStorage.getItem(hash);
            if (!data) {
                showError("No save data");
                return;
            }
            try {
                ninjapad.emulator.loadState(
                    uint8ToUtf16.decode(data)
                );
                ninjapad.pause.resumeEmulation();
            }
            catch (e) {
                showError(`Error<br/><br/>${e.message}`);
                DEBUG && console.log(e);
            }
        },

        saveState: function() {
            const hash = sha256(ninjapad.emulator.getROMData());
            const data = ninjapad.emulator.saveState();
            try {
                const optimizedData = uint8ToUtf16.encode(data);
                localStorage.setItem(hash, optimizedData);
                ninjapad.pause.resumeEmulation();
            }
            catch (e) {
                showError(`Error<br/><br/>${e.message}`);
                DEBUG && console.log(e);
            }
        },

        reset: function() {
            ninjapad.emulator.reloadROM();
            ninjapad.pause.resumeEmulation();
        },

        uploadROM: function() {
            ninjapad.jQElement.upload.trigger("click");

            const inputElement = document.getElementById("upload");
            inputElement.addEventListener("change", handleFiles, false);

            function handleFiles() {
                let saveData = null;
                if (ninjapad.emulator.isROMLoaded()) {
                    saveData = ninjapad.emulator.saveState();
                }
                let f = document.getElementById('upload').files[0];
                let reader = new FileReader();
                reader.onload = function () {
                    try {
                        ninjapad.emulator.loadROMData(reader.result);
                        ninjapad.pause.resumeEmulation();
                    }
                    catch (e) {
                        if (saveData) {
                            ninjapad.emulator.reloadROM();
                            ninjapad.emulator.loadState(saveData);
                        }
                        showError(`Error<br/><br/>${e.message.strip(".")}`);
                        DEBUG && console.log(e);
                    }
                }
                reader.readAsBinaryString(f);
            }
        },

        options: function() {
            return showMenu(optionsMenu);
        },

        mainMenu: function() {
            return showMenu(mainMenu);
        },

        about: function() {
            $("#pauseScreenContent").html(
                ninjapad.utils.html("div", "about", ABOUT)
            );
            allowUserInteraction(returnToMainMenu)
        },

        cycleIRState: function() {
            iRState = ninjapad.utils.nextIndex(iRStates, iRState);
        },

        toggleMenu: function() {
            if (!ninjapad.pause.state.cannotResume && state.isOpen) {
                ninjapad.utils.changeButtonColor("#menu", "#830000");
                $("#menu").css("color", "gray");
                ninjapad.pause.resumeEmulation();
                state.isOpen = false;
                return;
            }
            ninjapad.utils.changeButtonColor("#menu", "red", glow=true);            
            openMainMenu();
        }
    }
}();
