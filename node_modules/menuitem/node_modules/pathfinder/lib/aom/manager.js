/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict';

const {AddonManager, AddonManagerPrivate} = require("../utils/addonmanager");
const Addon = require("addon").Addon;

exports.getAddonByID = exports.getAddonById = function(aID, aCallback) {
  // get the addon obj
  AddonManager.getAddonByID(aID, function (addon) {
    // return a wrapped addon
    aCallback(new Addon(addon));
  });
};
