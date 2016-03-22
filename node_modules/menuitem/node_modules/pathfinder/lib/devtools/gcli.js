'use strict';

const { Cu } = require('chrome');
const { when: unload } = require('unload');

try {
  // Starting with FF 23, gcli.jsm moved to another location
  Cu.import("resource://gre/modules/devtools/gcli.jsm");
} catch(e) {
  try {
    Cu.import("resource:///modules/devtools/gcli.jsm");
  } catch(e) {
    console.error("Unable to load gcli.jsm");
  }
}

function addCommand(cmd) {
  let name = cmd.name;
  gcli.addCommand(cmd);
  unload(gcli.removeCommand.bind(gcli, name));
}
exports.addCommand = addCommand;
exports.removeCommand = gcli.removeCommand;
