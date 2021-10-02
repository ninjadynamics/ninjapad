// 2021 Ninja Dynamics
// Creative Commons Attribution 4.0 International Public License

ninjapad.menu = function() {
    var state = { isOpen: false };

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

    function mainMenu() {
        const upload = "ninjapad.menu.uploadROM()";
        const save = "ninjapad.menu.saveState();";
        const load = "ninjapad.menu.loadState();";
        const reset = "ninjapad.menu.reset();"
        const about = "ninjapad.menu.showCredits()";
        return ninjapad.utils.createMenu(null,
            ninjapad.utils.link("Load ROM", js=upload, hide=SINGLE_ROM),
            ninjapad.utils.link("Save State", js=save),
            ninjapad.utils.link("Load State", js=load),
            ninjapad.utils.link("Reset", js=reset),
            ninjapad.utils.link("About", js=about)
        );
    }

    function openMainMenu() {
        ninjapad.pause.pauseEmulation(
            ninjapad.utils.html("span", "pauseScreenContent", mainMenu())
        );
        allowUserInteraction();
        state.isOpen = true;
    }

    function returnToMainMenu(event) {
        event.stopPropagation();
        $("#pauseScreenContent").html(
            mainMenu()
        );
        allowUserInteraction();
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

        showCredits: function() {
            $("#pauseScreenContent").html(
                ninjapad.utils.html("div", "about", ABOUT)
            );
            allowUserInteraction(returnToMainMenu)
        },

        toggleMenu: function() {
            if (!ninjapad.pause.state.cannotResume && state.isOpen) {
                ninjapad.pause.resumeEmulation();
                state.isOpen = false;
                return;
            }
            openMainMenu();
        }
    }
}();
