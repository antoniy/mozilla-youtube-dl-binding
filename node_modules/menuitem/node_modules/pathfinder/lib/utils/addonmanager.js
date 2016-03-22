/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict';

const {Cc, Ci, Cu} = require("chrome");

Cu.import("resource://gre/modules/AddonManager.jsm", this);

exports.AddonManager = AddonManager;
exports.AddonManagerPrivate = AddonManagerPrivate;

exports.AddonType = AddonManagerPrivate.AddonType;
exports.AddonAuthor =
    AddonManagerPrivate.AddonAuthor || function AddonAuthor(name, url) {
  this.name = name;
  this.url = url;
  this.toString = function() this.name
};
