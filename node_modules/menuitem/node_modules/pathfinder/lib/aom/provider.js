/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict';

const unload = require("sdk/system/unload").when;

const {AddonManager, AddonManagerPrivate, AddonType} = require("../utils/addonmanager");

var defaultUIPriority = 6001; // this increases when it is used

exports.AddonProvider = function(options) {
  var types = null;

  // AddonManagerPrivate.AddonType DNE in Gecko (FF) < 6
  if (AddonType) {
      types = [new AddonType(
        options.type,  // TODO: RANDOMIZE?
        null,
        options.localeKey,
        AddonManager.VIEW_TYPE_LIST,
        options.uiPriority || defaultUIPriority++)];
  }

  var provider = {
    getAddonByID: function(aId, aCallback) {
      aCallback(options.getAddonByID(aId));
    },

    getAddonsByTypes: function(aTypes, aCallback) {
      if (aTypes && aTypes.indexOf(options.type) < 0) {
        // not the right type, return nothing
        aCallback([]);
      }
      else {
        // the right type, return all addons
        aCallback(options.getAddons());
      }
    },

    getInstallsByTypes: function(aTypes, aCallback) {
      aCallback([]);
    }
  };
  AddonManagerPrivate.registerProvider(provider, types);

  unload(function() {
    AddonManagerPrivate.unregisterProvider(provider);
  });

  return this;
};
