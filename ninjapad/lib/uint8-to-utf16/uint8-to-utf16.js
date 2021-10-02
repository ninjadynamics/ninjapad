/*
Ninja Dynamics 20-Sep-2021:
- Modified both functions to allow for safe usage with localStorage
*/

var uint8ToUtf16 = (function (exports) {
  'use strict';

  /* Added by Ninja Dynamics */
  function _isInvalidChar(char) {
      /* https://stackoverflow.com/questions/11170716/are-there-any-characters-that-are-not-allowed-in-localstorage */
      return (char < 0x20 || (char >= 0xD800 && char < 0xE000) || char > 0xFFFD);
  }

  /*! (c) Andrea Giammarchi @WebReflection */
  var ceil = Math.ceil;
  var fromCharCode = String.fromCharCode;

  /* Modified by Ninja Dynamics */
  var encode = function encode(uint8array) {
    var char;
    var extra = 0;
    var output = [];
    var modified = "";
    var length = uint8array.length;
    var len = ceil(length / 2);

    for (var j = 0, i = 0; i < len; i++) {
      char = (uint8array[j++] << 8) + (j < length ? uint8array[j++] : extra++);
      if (_isInvalidChar(char)) {
          char = (char + 0x800).mod(0x10000);
          modified += (output.length.toString(16).padStart(4, '0'));
      }
      output.push(fromCharCode(char));
    }

    if (_isInvalidChar(extra)) {
        extra = (extra + 0x800).mod(0x10000);
        modified += (output.length.toString(16).padStart(4, '0'));
    }
    output.push(fromCharCode(extra));

    return modified.length + '!' + modified + output.join('');
  };

  /* Modified by Ninja Dynamics */
  var decode = function decode(chars) {
    var indexes = []
    var separator = chars.indexOf('!');
    var modifiedStart = separator + 1;
    var modifiedLength = parseInt(chars.slice(0, separator));
    var modified = chars.slice(modifiedStart, modifiedStart + modifiedLength);
    for (var i = 0; i < modifiedLength; i += 4) {
        var hex = modified.slice(i, i + 4);
        indexes.push(parseInt(hex, 16));
    }

    chars = chars.slice(modifiedStart + modifiedLength, chars.length);

    var codes = [];
    var length = chars.length - 1;
    for (var i = 0; i < length; i++) {
      var c = chars.charCodeAt(i);
      if (i == indexes[0]) {
          c = (c - 0x800).mod(0x10000);
          indexes.shift();
      }
      codes.push(c >> 8, c & 0xFF);
    }

    c = chars.charCodeAt(length);
    if (i == indexes.shift()) {
        c = (c - 0x800).mod(0x10000);
    }

    if (c) codes.pop();
    return Uint8Array.from(codes);
  };

  exports.decode = decode;
  exports.encode = encode;

  return exports;

}({}));
