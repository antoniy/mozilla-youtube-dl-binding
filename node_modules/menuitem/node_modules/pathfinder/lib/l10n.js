/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict';

const global = this;
const {Cc,Ci,Cu} = require("chrome");
Cu.import("resource://gre/modules/Services.jsm", global);

exports.locale = Cc["@mozilla.org/chrome/chrome-registry;1"]
    .getService(Ci.nsIXULChromeRegistry).getSelectedLocale("global");

exports.l10n = (function(global) {
  let splitter = /(\w+)-\w+/;

  // get user's locale
  let locale = exports.locale;

  function getStr(aStrBundle, aKey) {
    if (!aStrBundle) return false;
    try {
      return aStrBundle.GetStringFromName(aKey);
    } catch (e) {
      //console.log(e);
    }
    return "";
  }

  function l10n(options) {
    var filename = options.filename;
    var baseURL = options.baseURL;
    var defaultLocale = options.defaultLocale || "en";
    function filepath(locale) {
      var path = baseURL + "/" + locale + "/" + filename;
      //console.log(path);
      return path;
    }

    let defaultBundle = Services.strings.createBundle(filepath(locale));

    let defaultBasicBundle;
    let (locale_base = locale.match(splitter)) {
      if (locale_base) {
        defaultBasicBundle = Services.strings.createBundle(
            filepath(locale_base[1]));
      }
    }

    let addonsDefaultBundle =
        Services.strings.createBundle(filepath(defaultLocale));

    return _ = function l10n_underscore(aKey, aLocale) {
      let localeBundle, localeBasicBundle;
      if (aLocale) {
        localeBundle = Services.strings.createBundle(filepath(aLocale));

        let locale_base = aLocale.match(splitter)
        if (locale_base)
          localeBasicBundle = Services.strings.createBundle(
              filepath(locale_base[1]));
      }

      var x = getStr(localeBundle, aKey)
          || getStr(localeBasicBundle, aKey)
          || getStr(defaultBundle, aKey)
          || getStr(defaultBasicBundle, aKey)
          || getStr(addonsDefaultBundle, aKey);
      return x;
    }
  }

  return l10n;
})(this);

require("unload").when(Services.strings.flushBundles);

