/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict';

const { Cc, Ci, Cu } = require("chrome");
Cu.import("resource://gre/modules/Services.jsm", this);

const global = this;
var Services = exports.Services = {};
(function(inc, tools){
  inc("resource://gre/modules/XPCOMUtils.jsm", global);
  inc("resource://gre/modules/Services.jsm", tools);
  Services.__proto__ = tools.Services;
})(Cu.import, {});

XPCOMUtils.defineLazyServiceGetter(
     Services, "as", "@mozilla.org/alerts-service;1", "nsIAlertsService");

XPCOMUtils.defineLazyServiceGetter(
    Services, "ass", "@mozilla.org/appshell/appShellService;1",
    "nsIAppShellService");

XPCOMUtils.defineLazyServiceGetter(
    Services, "cb", "@mozilla.org/widget/clipboardhelper;1",
    "nsIClipboardHelper");

XPCOMUtils.defineLazyServiceGetter(
    Services, "cs", "@mozilla.org/consoleservice;1", "nsIConsoleService");

XPCOMUtils.defineLazyServiceGetter(
    Services, "eps", "@mozilla.org/uriloader/external-protocol-service;1",
    "nsIExternalProtocolService");

if (Cc["@mozilla.org/privatebrowsing;1"]) {
  XPCOMUtils.defineLazyServiceGetter(
      Services, "pbs", "@mozilla.org/privatebrowsing;1",
      "nsIPrivateBrowsingService");
} else {
  Services.pbs = {privateBrowsingEnabled: false};
}

XPCOMUtils.defineLazyServiceGetter(
    Services, "sis", "@mozilla.org/scriptableinputstream;1",
    "nsIScriptableInputStream");

XPCOMUtils.defineLazyServiceGetter(
    Services, "suhtml", "@mozilla.org/feed-unescapehtml;1",
    "nsIScriptableUnescapeHTML");

XPCOMUtils.defineLazyServiceGetter(
    Services, "tld", "@mozilla.org/network/effective-tld-service;1",
    "nsIEffectiveTLDService");

XPCOMUtils.defineLazyServiceGetter(
    Services, "uuid", "@mozilla.org/uuid-generator;1",
    "nsIUUIDGenerator");
