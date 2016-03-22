/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict';

const self = require('sdk/self');
const tabs = require('sdk/tabs');
const { Class } = require('sdk/core/heritage');
const { on, emit, once, off } = require('sdk/event/core');
const { EventTarget } = require('sdk/event/target');

const awNS = require('sdk/core/namespace').ns();

let AddonWarning = Class({
  extends: EventTarget,
  initialize: function initialize(options) {
    EventTarget.prototype.initialize.call(this, options);
    awNS(this).options = options;
  },
  open: function() {
    let self = this;
    let options = awNS(self).options;

    tabs.open({
      url: module.uri.replace(/lib\/addon-warning\.js/, 'data/warning.html'),
      onReady: function(tab) {
        let worker = tab.attach({
          contentScriptFile: module.uri.replace(/lib\/addon-warning\.js/, 'data/warning-mod.js')
        });

        worker.port.on('cancel', function(data) {
          emit(self, 'cancel');
        });
        worker.port.on('accept', function(data) {
          emit(self, 'accept');
        });

        worker.port.emit('load', options);
      }
    });
  }
});
exports.AddonWarning = AddonWarning;
