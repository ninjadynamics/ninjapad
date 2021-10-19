// 2021 Ninja Dynamics
// Creative Commons Attribution 4.0 International Public License

ninjapad.menu = function() {
    const iRModes = [
        "OFF",
        "ON-R",
        "ON-S"
    ];

    var iRMode = 0;

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
                js="ninjapad.menu.inputRecorder.start();"
            ),
            ninjapad.utils.link(
                "Play",
                js="ninjapad.menu.inputRecorder.play();",
                hide=!hasData
            ),
            ninjapad.utils.link(
                "Stop",
                js="ninjapad.menu.inputRecorder.stop()",
                hide=(status == states.STOP)
            ),
            ninjapad.utils.link(
                "Clear",
                js="ninjapad.menu.inputRecorder.clear()",
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
                `Input recorder ${inColor("lime", iRModes[iRMode])}`,
                js=`ninjapad.menu.inputRecorder.cycleMode();
                    ninjapad.menu.show.optionsMenu()`
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
                js="ninjapad.menu.show.optionsMenu()"
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

        show: {
            recorderMenu: function() {
                return showMenu(recMenu);
            },

            optionsMenu: function() {
                return showMenu(optionsMenu, returnToMainMenu);
            }
        },

        about: function() {
            $("#pauseScreenContent").html(
                ninjapad.utils.html("div", "about", ABOUT)
            );
            allowUserInteraction(returnToMainMenu)
        },

        open: {
            inputRecorder: function(event) {
                if (event) event.stopPropagation();
                var color_on = ninjapad.utils.getCSSVar("#menu", "color_on");
                ninjapad.utils.changeButtonColor("#menu", color_on, glow=true);
                openMenu(recMenu);
            }
        },

        close: function() {
            closeMenuAndResumeEmulation();
        },

        toggle: {
            mainMenu: function() {
                if (!ninjapad.pause.state.cannotResume && state.isOpen) {
                    closeMenuAndResumeEmulation();
                    return;
                }
                var color_on = ninjapad.utils.getCSSVar("#menu", "color_on");
                ninjapad.utils.changeButtonColor("#menu", color_on, glow=true);
                openMenu(mainMenu);
            }
        },

        inputRecorder: {
            ready: function() {
                ninjapad.jQElement.recStatus.html(`
                    <div>READY</div>
                `);
            },

            start: function() {
                var secs = 3;
                memoryHash = undefined;
                ninjapad.pause.pauseEmulation(
                    ninjapad.utils.html(
                        "span", "pauseScreenContent", "3"
                    )
                );
                function _start() {
                    $("#pauseScreenContent").html(--secs);
                    if (secs) return;
                    clearInterval(startID);
                    ninjapad.recorder.start();
                    ninjapad.jQElement.recStatus.html(`
                        <div style="font-size: 3vmin;">🔴</div>
                        <div>&nbsp;REC</div>
                    `);
                }
                var secs = 3;
                var startID = setInterval(_start, 1000);
            },

            stop: function() {
                ninjapad.menu.inputRecorder.ready();
                ninjapad.recorder.setCallback("stop", ninjapad.menu.show.recorderMenu);
                ninjapad.recorder.stop();
            },

            play: function() {
                ninjapad.jQElement.recStatus.html(`
                    <div style="font-size: 5vmin; color: lime">▶</div>
                    <div>&nbsp;PLAY</div>
                `);
                ninjapad.recorder.setCallback("play", ninjapad.menu.inputRecorder.ready);
                ninjapad.recorder.play();
            },

            clear: function() {
                ninjapad.menu.inputRecorder.ready();
                ninjapad.recorder.setCallback("clear", ninjapad.menu.show.recorderMenu);
                ninjapad.recorder.clear();
            },

            cycleMode: function() {
                iRMode = ninjapad.utils.nextIndex(iRModes, iRMode);
                if (iRMode) {
                    ninjapad.jQElement.recMenu.show();
                    ninjapad.jQElement.recStatus.show();
                }
                else {
                    ninjapad.jQElement.recMenu.hide();
                    ninjapad.jQElement.recStatus.hide();
                }
            }
        }
    }
}();
