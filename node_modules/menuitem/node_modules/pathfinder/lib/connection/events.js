/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict';

const events = require('sdk/system/events');
const { on, once, off, emit } = require('sdk/event/core');

function onRequest(evt) {
  emit(exports, 'modify-request', evt);
}
events.on('http-on-modify-request', onRequest);

/*
function onResponse(evt) {
  emit(exports, 'examine-response', evt);
}
events.on('http-on-examine-response', onResponse);
*/

exports.on = on.bind(null, exports);
exports.once = once.bind(null, exports);
exports.off = off.bind(null, exports);
