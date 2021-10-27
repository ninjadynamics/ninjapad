// 2021 Ninja Dynamics
// Creative Commons Attribution 4.0 International Public License

ninjapad.menu = function() {

    const pop = ninjapad.utils.pop;

    const state = { isOpen: false };

    const iRModes = [
        "OFF",
        "ON-R",
        "ON-S"
    ];

    var countdown = null;

    var iRMode = 2;

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
        ninjapad.pause.setScreenContent(
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
                js="ninjapad.menu.inputRecorder.import()"
            ),
            ninjapad.utils.link(
                "Export",
                js="ninjapad.menu.inputRecorder.export()",
                hide=!hasData
            )
        );
    }

    function optionsMenu() {
        return ninjapad.utils.createMenu(null,
            ninjapad.utils.link(
                "Import save data",
                js="ninjapad.menu.error('Not implemented yet')"
            ),
            ninjapad.utils.link(
                "Export save data",
                js="ninjapad.menu.error('Not implemented yet')"
            ),
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
        ninjapad.pause.setScreenContent(fnMenu());
        allowUserInteraction(backtap);
    }

    function openMenu(menu, backtap=null) {
        ninjapad.pause.pauseEmulation(menu());
        allowUserInteraction(backtap);
        state.isOpen = true;
    }

    function returnToMainMenu(event) {
        event.stopPropagation();
        showMenu(mainMenu, closeMenuAndResumeEmulation);
    }

    function closeMenuAndResumeEmulation(event) {
        if (event) event.stopPropagation();
        if (ninjapad.pause.state.cannotResume) return false;
        var color_off = ninjapad.utils.getCSSVar("#menu", "color");
        ninjapad.utils.changeButtonColor("#menu", color_off);
        ninjapad.pause.state.isEmulationPaused && ninjapad.pause.resumeEmulation();
        state.isOpen = false;
        return true;
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
            ninjapad.menu.inputRecorder.ready();
            ninjapad.recorder.clear();
            closeMenuAndResumeEmulation();
        },

        uploadROM: function() {
            ninjapad.jQElement.uploadROM.trigger("click");

            const inputElement = document.getElementById("uploadROM");
            inputElement.addEventListener("change", handleFiles, false);

            function handleFiles() {
                let saveData = null;
                if (ninjapad.emulator.isROMLoaded()) {
                    saveData = ninjapad.emulator.saveState();
                }
                const f = inputElement.files[0];
                const reader = new FileReader();
                reader.onload = function () {
                    try {
                        ninjapad.emulator.loadROMData(reader.result);
                        ninjapad.menu.inputRecorder.ready();
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
                return showMenu(recMenu, closeMenuAndResumeEmulation);
            },

            optionsMenu: function() {
                return showMenu(optionsMenu, returnToMainMenu);
            }
        },

        about: function() {
            ninjapad.pause.setScreenContent(
                ninjapad.utils.html("div", "about", ABOUT)
            )
            allowUserInteraction(returnToMainMenu)
        },

        open: {
            inputRecorder: function(event) {
                if (event) event.stopPropagation();
                var color_on = ninjapad.utils.getCSSVar("#menu", "color_on");
                ninjapad.utils.changeButtonColor("#menu", color_on, glow=true);
                openMenu(recMenu, closeMenuAndResumeEmulation);
            }
        },

        close: function() {
            closeMenuAndResumeEmulation();
        },

        toggle: {
            mainMenu: function() {
                if (state.isOpen) {
                    closeMenuAndResumeEmulation();
                    clearInterval(countdown);
                    countdown = null;
                    return;
                }
                var color_on = ninjapad.utils.getCSSVar("#menu", "color_on");
                ninjapad.utils.changeButtonColor("#menu", color_on, glow=true);
                openMenu(mainMenu, closeMenuAndResumeEmulation);
            }
        },

        error: function(msg) {
            showError(msg);
        },

        inputRecorder: {
            show: function() {
                ninjapad.jQElement.recMenu.html(`
                    <div><a href="#" onclick="ninjapad.menu.open.inputRecorder();">
                        VCR MENU
                    </a></div>
                `);
            },

            ready: function() {
                ninjapad.jQElement.recStatus.html(`
                    <div>READY</div>
                `);
            },

            start: function() {
                var secs = 3;
                ninjapad.pause.pauseEmulation(secs);
                preventUserInteraction();
                function _start() {
                    ninjapad.pause.setScreenContent(--secs);
                    if (secs) return;
                    clearInterval(countdown);
                    countdown = null;
                    ninjapad.recorder.start();
                    ninjapad.jQElement.recStatus.html(`
                        <div style="font-size: 3vmin;">🔴</div>
                        <div>&nbsp;REC</div>
                    `);
                }
                countdown = setInterval(_start, 1000);
            },

            stop: function() {
                ninjapad.menu.inputRecorder.ready();
                ninjapad.recorder.setCallback("stop", ninjapad.menu.show.recorderMenu);
                ninjapad.recorder.stop();
            },

            cancel: function() {
                if (!countdown) return false;
                // - - - - - - - - - - - - - - - -
                ninjapad.menu.show.recorderMenu();
                clearInterval(countdown);
                countdown = null;
                return true;
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

            import: function() {
                ninjapad.jQElement.uploadRec.trigger("click");

                const inputElement = document.getElementById("uploadRec");
                inputElement.addEventListener("change", handleFiles, false);

                function handleFiles() {
                    const f = inputElement.files[0];
                    const reader = new FileReader();
                    reader.onload = function () {
                        try {
                            const data = new Uint8Array(reader.result);
                            const files = fflate.unzipSync(data);
                            const replay = fflate.objFromU8(files.metaData);
                            replay.inputData = files.inputData;
                            replay.saveData = files.saveData;
                            ninjapad.recorder.import(replay);
                            ninjapad.menu.show.recorderMenu();
                        }
                        catch (e) {
                            showError(`Error<br/><br/>${e.message.strip(".")}`);
                            DEBUG && console.log(e);
                        }
                    }
                    reader.readAsArrayBuffer(f);
                }
            },

            export: function() {
                const exportData = ninjapad.recorder.export();
                const saveData = pop(exportData, "saveData");
                const inputData = pop(exportData, "inputData");
                const metaData = fflate.strToU8(JSON.stringify(exportData));
                const filename = exportData.romHash.substring(48);
                const filedata = fflate.zipSync(
                    {
                        "metaData": metaData,
                        "inputData": inputData,
                        "saveData": saveData
                    },
                    {
                        level: 0
                    }
                );
                ninjapad.utils.downloadBlob(
                    filedata, filename,
                    "application/zip"
                );
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
