/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict';

const { setTimeout } = require('sdk/timers');
const { get, set } = require('sdk/preferences/service');
const { add, notify } = require('sdk/deprecated/observer-service');
const { on, once, emit, off } = require('sdk/event/core');
const { loadReason } = require('sdk/self');

const { unload } = require('./addon/unload');

const PREF_NAME = 'security.addon.panic';
function inPanic() get(PREF_NAME, false);
function setPanic(value) set(PREF_NAME, value);

const PREF_END_NAME = 'security.addon.panic_end';
function getEndTime() get(PREF_END_NAME, 0) * 1;
function setEndTime(timestamp) set(PREF_END_NAME, timestamp + "");

Object.defineProperty(exports, "inPanic", {
  get: function() inPanic()
});

const panic = function (ms) {
  ms = ms || 0;
  let endTime = Date.now() + ms;

  // check that the current end timestamp is not greater
  if (getEndTime() >= endTime)
    return;

  // set the end timestamp (to handle the reboot situation)
  setEndTime(endTime);

  // notify system of a panic
  notify('panic-start');

  // end the panic
  setTimeout(function() {
    // check that the end timestamp was not extended by another panic
    // NOTE: another instance of panic module could have caused the old panic
    if (getEndTime() != endTime) return;

    notify('panic-end');
  }, ms);
};
exports.panic = panic;

// internal object used to emit on, instead of `exports`, so that outside code
// cannot emit on this object.
const panicEmitter = {};

// create and expose event listener related methods for this module
exports.on = on.bind(null, panicEmitter);
exports.once = once.bind(null, panicEmitter);
exports.off = off.bind(null, panicEmitter);

// listen to 'panic-start' events in the observer-service since they may come
// from other instances of this module
add('panic-start', function () {
  setPanic(true);
  emit(panicEmitter, 'start');
});
// listen to 'panic-end' events for the same reason as for 'panic-start'
add('panic-end', function () {
  setPanic(false);
  emit(panicEmitter, 'end');
});

// cleanup prefs on startup, since the add-on could be installed before or
// during startup
if (loadReason == 'startup') {
  // check the end timestamp (for the reboot situation)
  if (getEndTime() <= Date.now()) {
    setEndTime(0);
  
    if (inPanic()) {
      setPanic(false);
    }
  }
}

// clean up prefs on shutdown, don't do cleanup on other reasons because there
// may be other instances of the module running
unload(function(reason) {
  if (reason == 'shutdown') {
    setPanic(false);
    setEndTime(0);
  }
});
