/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict';

const { Ci, Cc, Cu } = require('chrome');
const { Class } = require('sdk/core/heritage');
const { on, off, emit, setListeners } = require('sdk/event/core');
const { EventTarget } = require("sdk/event/target");
const { ns } = require("sdk/core/namespace");
const { validateOptions } = require("sdk/deprecated/api-utils");
const { isValidURI } = require("sdk/url");

const PROGRESS_LISTENER_NS = ns();

const { Services } = Cu.import('resource://gre/modules/Services.jsm', {});

const rules = {
  url: {
    // Also converts a URL instance to string, bug 857902
    map: function (url) url.toString(),
    ok: isValidURI
  },
  destination: {
    is: ['string']
  }
};

const Download = Class({
  extends: EventTarget,
  initialize: function(options) {
    // Setup listeners.
    setListeners(this, options);

    options = validateOptions(options, rules);

    const wbp = Cc["@mozilla.org/embedding/browser/nsWebBrowserPersist;1"]
                  .createInstance(Ci.nsIWebBrowserPersist);
    let listener = ProgressListener({
      download: this
    });

    wbp.progressListener = listener;

    let localFile = Cc["@mozilla.org/file/local;1"]
                    .createInstance(Ci.nsILocalFile);
    localFile.initWithPath(options.destination);
    localFile.createUnique(Ci.nsIFile.NORMAL_FILE_TYPE, parseInt("0666", 8));
    localFile = localFile.QueryInterface(Ci.nsIFile);

    let uri = Services.io.newURI(options.url, null, null);
    wbp.saveURI(uri, null, null, null, null, localFile, null);
  }
});
exports.Download = Download;

const ProgressListener = Class({
  initialize: function(options) {
    const internals = PROGRESS_LISTENER_NS(this);
    internals.options = options;
    this.onStateChange = this.onStateChange.bind(this);
  },
  get options() PROGRESS_LISTENER_NS(this).options,
  get download() this.options.download,
  onLocationChange: function(aWebProgress, aRequest, aLocation, aFlags) {
  },
  onProgressChange: function(aWebProgress, aRequest, aCurSelfProgress, aMaxSelfProgress, aCurTotalProgress, aMaxTotalProgress) {
    emit(this.download, 'progress', {
      current: aCurTotalProgress,
      total: aMaxTotalProgress
    })
  },
  onSecurityChange: function(aWebProgress, aRequest, aState) {
  },
  onStateChange: function(aWebProgress, aRequest, aStateFlags, aStatus) {
    if (!(aStateFlags & Ci.nsIWebProgressListener.STATE_STOP))
      return;

    try {
      var { responseStatus, requestSucceeded } = aRequest.QueryInterface(Ci.nsIHttpChannel);
    }
    catch (e) {
      //console.exception(e);
    }

    emit(this.download, 'complete', {
      responseStatus: responseStatus,
      requestSucceeded: requestSucceeded
    });

    return;
  },
  onStatusChange: function(aWebProgress, aRequest, aStatus, aMessage) {
  }
});
