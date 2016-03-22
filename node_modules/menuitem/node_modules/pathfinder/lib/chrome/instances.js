/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict';

const { Cc, Ci, Cu } = require("chrome");

var Instances = exports.Instances = {
  get bis() Cc["@mozilla.org/binaryinputstream;1"]
      .createInstance(Ci.nsIBinaryInputStream),
  get ch() Cc["@mozilla.org/security/hash;1"]
      .createInstance(Ci.nsICryptoHash),
  get dp() Cc["@mozilla.org/xmlextras/domparser;1"]
      .createInstance(Ci.nsIDOMParser),
  get ds() Cc["@mozilla.org/xmlextras/xmlserializer;1"]
      .createInstance(Ci.nsIDOMSerializer),
  get fos() Cc["@mozilla.org/network/file-output-stream;1"]
      .createInstance(Ci.nsIFileOutputStream),
  get sfos() Cc["@mozilla.org/network/safe-file-output-stream;1"]
      .createInstance(Ci.nsIFileOutputStream)
      .QueryInterface(Ci.nsISafeOutputStream),
  get fp() Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker),
  get lf() Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile),
  get process() Cc["@mozilla.org/process/util;1"].createInstance(Ci.nsIProcess),
  get se() Cc["@mozilla.org/scripterror;1"].createInstance(Ci.nsIScriptError)
      .QueryInterface(Ci.nsIScriptError2),
  get ss() Cc["@mozilla.org/supports-string;1"]
      .createInstance(Ci.nsISupportsString),
  get suc() Cc["@mozilla.org/intl/scriptableunicodeconverter"]
      .createInstance(Ci.nsIScriptableUnicodeConverter),
  get timer() Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer),
  get wbp() Cc["@mozilla.org/embedding/browser/nsWebBrowserPersist;1"]
      .createInstance(Ci.nsIWebBrowserPersist),
  get xhr() Cc["@mozilla.org/xmlextras/xmlhttprequest;1"]
      .createInstance(Ci.nsIXMLHttpRequest)
};
