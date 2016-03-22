/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict';

const { Cc, Ci } = require("chrome");

exports.restart = function restart() {
  let canceled = Cc["@mozilla.org/supports-PRBool;1"]
      .createInstance(Ci.nsISupportsPRBool);

  Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService)
      .notifyObservers(canceled, "quit-application-requested", "restart");

  if (canceled.data) return false; // somebody canceled our quit request

  // restart
  Cc['@mozilla.org/toolkit/app-startup;1'].getService(Ci.nsIAppStartup)
      .quit(Ci.nsIAppStartup.eAttemptQuit | Ci.nsIAppStartup.eRestart);

  return true;
}
