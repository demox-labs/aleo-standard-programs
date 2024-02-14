"use strict";
exports.__esModule = true;
var aleoWasmFunctions_1 = require("../src/utils/aleoWasmFunctions");
var programs = ['credits.aleo'];
programs.forEach(function (program) {
    (0, aleoWasmFunctions_1.programToAddress)(program).then(function (address) {
        console.log("".concat(program, " address: ").concat(address));
    });
});
