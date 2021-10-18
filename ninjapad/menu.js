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

    function recMenu() {
        const states = ninjapad.recorder.states();
        const status = ninjapad.recorder.status();
        const hasData = ninjapad.recorder.hasData();
        const isStopped = status == states.STOP;
        return ninjapad.utils.createMenu(null,
            ninjapad.utils.link(
                isStopped && !hasData ? "Start" : "Restart",
                js="ninjapad.recorder.start(); ninjapad.jQElement.rec.css('opacity', '1.0')"
            ),
            ninjapad.utils.link(
                "Play",
                js="ninjapad.recorder.play();",
                hide=!hasData
            ),
            ninjapad.utils.link(
                "Stop",
                js="ninjapad.recorder.stop(ninjapad.menu.recorder); ninjapad.jQElement.rec.css('opacity', '0.5')",
                hide=(status == states.STOP)
            ),
            ninjapad.utils.link(
                "Clear",
                js="ninjapad.recorder.clear(ninjapad.menu.recorder)",
                hide=!hasData
            ),
            ninjapad.utils.link(
                "Import",
                js="ninjapad.recorder.import()"
            ),
            ninjapad.utils.link(
                "Export",
                js="ninjapad.recorder.import()",
                hide=!hasData
            )
        );
    }

    function optionsMenu() {
        return ninjapad.utils.createMenu(null,
            ninjapad.utils.link("Import save data"),
            ninjapad.utils.link("Export save data"),
            ninjapad.utils.link(
                `Input recorder ${inColor("lime", iRStates[iRState])}`,
                js=`ninjapad.menu.cycleIRState();
                    ninjapad.menu.options()`
            )
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

    function showMenu(fnMenu, backtap=null) {
        $("#pauseScreenContent").html(
            fnMenu()
        );
        allowUserInteraction(backtap);
    }

    function openMenu(menu, backtap=null) {
        ninjapad.pause.pauseEmulation(
            ninjapad.utils.html(
                "span", "pauseScreenContent", menu()
            )
        );
        allowUserInteraction(backtap);
        state.isOpen = true;
    }

    function returnToMainMenu(event) {
        event.stopPropagation();
        showMenu(mainMenu);
    }

    function closeMenuAndResumeEmulation() {
        var color_off = ninjapad.utils.getCSSVar("#menu", "color");
        ninjapad.utils.changeButtonColor("#menu", color_off);
        ninjapad.pause.state.isEmulationPaused && ninjapad.pause.resumeEmulation();
        state.isOpen = false;
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
                closeMenuAndResumeEmulation();
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
                closeMenuAndResumeEmulation();
            }
            catch (e) {
                showError(`Error<br/><br/>${e.message}`);
                DEBUG && console.log(e);
            }
        },

        reset: function() {
            ninjapad.emulator.reloadROM();
            closeMenuAndResumeEmulation();
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
                        ninjapad.recorder.clear();
                        closeMenuAndResumeEmulation();
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

        recorder: function() {
            return showMenu(recMenu);
        },

        options: function() {
            return showMenu(optionsMenu, returnToMainMenu);
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
            iRState ? ninjapad.jQElement.rec.show() : ninjapad.jQElement.rec.hide();
        },

        openRecMenu: function(event) {
            if (event) event.stopPropagation();
            var color_on = ninjapad.utils.getCSSVar("#menu", "color_on");
            ninjapad.utils.changeButtonColor("#menu", color_on, glow=true);
            openMenu(recMenu);
        },

        toggleMenu: function() {
            if (!ninjapad.pause.state.cannotResume && state.isOpen) {
                closeMenuAndResumeEmulation();
                return;
            }
            var color_on = ninjapad.utils.getCSSVar("#menu", "color_on");
            ninjapad.utils.changeButtonColor("#menu", color_on, glow=true);
            openMenu(mainMenu);
        },

        close: function() {
            closeMenuAndResumeEmulation();
        }
    }
}();
