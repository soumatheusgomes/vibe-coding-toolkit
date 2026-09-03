"use strict";

const { maxLines, noDirectConsole } = require("./core-rules.cjs");

module.exports = {
  rules: {
    "max-lines": maxLines,
    "no-direct-console": noDirectConsole,
  },
};
