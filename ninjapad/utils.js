ninjapad.utils = function() {
    const TOUCH_EVENTS = ["start", "move", "end"];

    Number.prototype.mod = function(n) {
        return ((this%n)+n)%n;
    };

    String.prototype.strip = function (string) {
        var escaped = string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
        return this.replace(RegExp("^[" + escaped + "]+|[" + escaped + "]+$", "gm"), '');
    };

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
                element.webkitEnterFullscreen(); //for iphone this code worked
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

        html: function(obj, id, text) {
            return `<${obj} id='${id}'>${text}</${obj}>`;
        },

        link: function(content, js, hide) {
            js = `${js}; return false;`;
            return hide || `<a href="#" onclick="${js}">${content}</a>`;
        },

        createMenu: function(title, ...opts) {
            opts = opts.filter(e => e !== true);
            title = title ? `${title}<br/>` : "";
            return (
                `<div style="line-height: 2.2em;">
                    ${title}
                    ${opts.join("<br/>")}
                </div>`
            );
        },

        assign: function(fn, elementName, ...touchEvents) {
            // Prevent default on all events
            let element = document.getElementById(elementName);
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
            let element = document.getElementById(elementName);
            for (const e of TOUCH_EVENTS) {
                eval("element.ontouch" + e + " = ninjapad.utils.preventDefaultWithoutPropagation");
            }
            // Assign function call to events
            for (const e of touchEvents) {
                eval("element.ontouch" + e + " = fn");
            }
        },

        allowInteraction: function(elementName) {
            let element = document.getElementById(elementName);
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
            let w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
            return (v * w) / 100;
        },

        dist: function(dx, dy) {
            return Math.sqrt((dx * dx) + (dy * dy));
        },

        angle: function(dx, dy) {
            return Math.atan2(dy, dx);
        }
    }
}();
