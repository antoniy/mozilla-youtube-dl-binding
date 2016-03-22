/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict';

const { Ci } = require('chrome');
const { List, addListItem, removeListItem } = require('sdk/util/list');
const { ns } = require('sdk/core/namespace');
const { Class } = require('sdk/core/heritage');
const { Disposable } = require('sdk/core/disposable');

const events = require('./events');

const REQUEST_RULES = List();
const requestNS = ns();

function onRequest(evt) {
  for each (let rule in REQUEST_RULES) {
    applyRequestHeaders(rule, evt)
  }
}
events.on('modify-request', onRequest);

const RequestRule = Class({
  implements: [ Disposable ],
  initialize: function(details) {
    requestNS(this).details = details;
    addListItem(REQUEST_RULES, this);
  },
  dispose: function() {
    removeListItem(REQUEST_RULES, this);
  }
});
exports.RequestRule = RequestRule;

function applyRequestHeaders(rule, evt) {
  let channel = evt.subject.QueryInterface(Ci.nsIHttpChannel);
  let requestURL = channel.URI.spec

  let details = requestNS(rule).details;
  let { headers: rules } = details;
  for each (let key in Object.keys(rules)) {
    channel.setRequestHeader(key, rules[key] + '', false);
  }
}