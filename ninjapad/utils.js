ninjapad.utils = function() {
    const TOUCH_EVENTS = ["start", "move", "end"];

    Number.prototype.mod = function(n) {
        return ((this % n) + n) % n;
    };

    String.prototype.strip = function (string) {
        var escaped = string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
        return this.replace(RegExp("^[" + escaped + "]+|[" + escaped + "]+$", "gm"), '');
    };

    Array.prototype.sortBy = function(p) {
        return this.slice(0).sort(function(a,b) {
            return (a[p] > b[p]) ? 1 : (a[p] < b[p]) ? -1 : 0;
        });
    };

    Object.defineProperty(
        Object.prototype, 'pop', {
            enumerable: false,
            value: function(key) {
                const value = this[key];
                delete this[key];
                return value;
            }
        }
    );

    fflate.objFromU8 = function(uint8Array) {
        return JSON.parse(fflate.strFromU8(uint8Array));
    }

    return {

        preventDefaultWithoutPropagation: function(event) {
            event.preventDefault();
            event.stopPropagation();
        },

        preventDefault: function(event) {
            event.preventDefault();
        },

        stopPropagation: function(event) {
            event.stopPropagation();
        },

        isIOSDevice: function(){
            return !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);
        },

        isIOSChrome: function() {
            const isIOS = !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);
            const isChrome = !!navigator.userAgent.match('CriOS');
            return isIOS && isChrome;
        },

        isMobileDevice: function() {
            return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        },

        isFullScreen: function() {
            return (
                document.fullscreenElement ||
                document.mozFullScreenElement ||
                document.webkitFullscreenElement
            );
        },

        enterFullscreen: function(element) {
            if (element.requestFullScreen) {
                 element.requestFullScreen();
            } else if (element.webkitRequestFullScreen) {
                 element.webkitRequestFullScreen();
            } else if (element.mozRequestFullScreen) {
                 element.mozRequestFullScreen();
            } else if (element.msRequestFullscreen) {
                 element.msRequestFullscreen();
            } else if (element.webkitEnterFullscreen) {
                element.webkitEnterFullscreen();
            }
        },

        exitFullScreen: function() {
            if (document.cancelFullScreen) {
                document.cancelFullScreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitCancelFullScreen) {
                document.webkitCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        },

        html: function(obj, id, content) {
            var style = "margin: 0 auto; display: inline-block; transform: translateZ(0);"
            return `<${obj} id="${id}" style="${style}">${content}</${obj}>`;
        },

        link: function(content, js, hide) {
            var js = `${js}; return false;`;
            return hide || `<a href="#" onclick="${js}">${content}</a>`;
        },

        createMenu: function(title, ...opts) {
            var opts = opts.filter(e => e !== true);
            var title = title ? `${title}<br/>` : "";
            var style = "line-height: 2.2em; margin: 0 auto; display: inline-block; transform: translateZ(0);"
            return (
                `<div style="${style}">
                    ${title}
                    ${opts.join("<br/>")}
                </div>`
            );
        },

        assign: function(fn, elementName, ...touchEvents) {
            // Prevent default on all events
            var element = document.getElementById(elementName);
            for (const e of TOUCH_EVENTS) {
                eval("element.ontouch" + e + " = ninjapad.utils.preventDefault");
            }
            // Assign function call to events
            for (const e of touchEvents) {
                eval("element.ontouch" + e + " = fn");
            }
        },

        assignNoPropagation: function(fn, elementName, ...touchEvents) {
            // Prevent default and stop propagation on all events
            var element = document.getElementById(elementName);
            for (const e of TOUCH_EVENTS) {
                eval("element.ontouch" + e + " = ninjapad.utils.preventDefaultWithoutPropagation");
            }
            // Assign function call to events
            for (const e of touchEvents) {
                eval("element.ontouch" + e + " = fn");
            }
        },

        assignClick: function(fn, elementName) {
            // Prevent default on all events
            var element = document.getElementById(elementName);
            element.onclick = fn;
        },

        allowInteraction: function(elementName) {
            var element = document.getElementById(elementName);
            for (const e of TOUCH_EVENTS) {
                eval("element.ontouch" + e + " = ninjapad.utils.stopPropagation");
            }
        },

        zip: function(data) {
            const buf = fflate.strToU8(data);
            return fflate.compressSync(buf, { level: 9, mem: 8 });
        },

        unzip: function(data) {
            const decompressed = fflate.decompressSync(data);
            return fflate.strFromU8(decompressed);
        },

        equal: function(buf1, buf2) {
            var result = true;
            if (buf1.byteLength != buf2.byteLength) {
                DEBUG && console.log("size", buf1.byteLength, buf2.byteLength);
                return false;
            }
            var dv1 = new Int8Array(buf1);
            var dv2 = new Int8Array(buf2);
            for (var i = 0 ; i != buf1.byteLength ; i++)
            {
                if (dv1[i] != dv2[i]) {
                    result = false;
                    DEBUG && console.log(i, dv1[i], dv2[i]);
                }
            }
            return result;
        },

        vw: function(v) {
            var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
            return (v * w) / 100;
        },

        vh: function(v) {
            var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
            return (v * h) / 100;
        },

        vmin: function(v) {
            var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
            var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
            return Math.min(
                (v * w) / 100,
                (v * h) / 100
            );
        },

        dist: function(dx, dy) {
            return Math.sqrt((dx * dx) + (dy * dy));
        },

        angle: function(dx, dy) {
            return Math.atan2(dy, dx);
        },

        nextIndex: function(a, i) {
            return (i + 1) % a.length;
        },

        changeButtonColor: function(e, c, glow=false) {
            var obj = $(e);
            obj.css("background-color", c);
            obj.css("border-top-color", c);
            obj.css("border-left-color", c);
            obj.css("border-right-color", c);
            obj.css("border-bottom-color", c);
            obj.css("box-shadow", glow ? "0 0 8vh 0vh " + c : "");
            obj.css("color", glow ? "white" : "gray");
        },

        getCSSVar: function(e, v) {
            return getComputedStyle($(e)[0]).getPropertyValue("--" + v);
        },

        inBinary: function(v) {
            return v.toString(2).padStart(8, "0");
        },

        download: async function(data, filename, mimeType) {
            const blob = new Blob([data], { type: mimeType });

            // Check if SaveFilePicker is available
            if (window.showSaveFilePicker) {
                const fileHandle = await window.showSaveFilePicker({
                    suggestedName: `${filename}.zip`,
                    types: [{
                        description: 'Input Replay',
                        accept: {
                            'application/zip': ['.zip'],
                        },
                    }],
                });
                const fileStream = await fileHandle.createWritable();
                await fileStream.write(blob);
                await fileStream.close();
                return;
            }

            // Check if it's Chrome on iOS
            const iOS = !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);
            const chrome = !!navigator.userAgent.match('CriOS');
            if (iOS && chrome) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    window.location.href = reader.result;
                }
                reader.readAsDataURL(blob);
                return;
            }

            // Do it the traditional way
            function _download(data, filename) {
                const a = document.createElement('a');
                a.href = data;
                a.download = filename;
                document.body.appendChild(a);
                a.style = 'display: none';
                a.click();
                a.remove();
            }
            const url = window.URL.createObjectURL(blob);
            _download(url, filename);
            setTimeout(function() {
                return window.URL.revokeObjectURL(url);
            }, 1000);
        },

        pop: function(obj, key) {
            if (key == undefined) {
                key = object.length - 1;
            }
            const value = obj[key];
            delete obj[key];
            return value;
        },

        getFile: function(inputElement) {
            const file = inputElement.files[0];
            inputElement.value = "";
            return file;
        },

        inColor: function(color, text) {
            return `<font color='${color}'>${text}</font>`;
        },

        minify: function(s) {
            var inside = 0;
            return s.replace(
                / +|"/g, m => m === '"' ?
                (inside ^= 1, '"') :
                (inside ? m : '')
            ).replace(/(?:\r\n|\r|\n)/g, '');
        }

    }
}();
