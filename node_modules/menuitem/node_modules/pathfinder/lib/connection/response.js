/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict';

const { Ci } = require('chrome');
const { List, addListItem, removeListItem } = require('sdk/util/list');
const { ns } = require('sdk/core/namespace');
const { Class } = require('sdk/core/heritage');

const events = require('./events');

const RESPONSE_RULES = List();

const requestNS = ns();

function onResponse(evt) {
  for each (let rule in RESPONSE_RULES) {
  	applyResponseHeaders(rule, evt)
  }
}
events.on('examine-response', onResponse);

const ResponseRule = Class({
  initialize: function(details) {
    requestNS(this).details = details;
    addListItem(RESPONSE_RULES, this);
  },
  destroy: function() {
    removeListItem(RESPONSE_RULES, this);
  }
});
exports.ResponseRule = ResponseRule;

function applyResponseHeaders(rule, evt) {
  let channel = evt.subject.QueryInterface(Ci.nsIHttpChannel);
  let requestURL = channel.URI.spec

  let details = requestNS(rule).details;
  let { headers: rules } = details;
  for each (let key in Object.keys(rules)) {
    channel.setResponseHeader(key, rules[key], false);
  }
}