/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict';

const { Cr, Cu, Ci, Cc, Cm } = require('chrome');
const { when: unload } = require('sdk/system/unload');
const { validateOptions : validate } = require('sdk/deprecated/api-utils');
const { uuid } = require('sdk/util/uuid');
const { URL, isValidURI } = require('sdk/url');
const tabs = require('sdk/tabs');

Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

const validOptions = {
  what: {
    is: ['string'],
    ok: function(what) {
      if (what.match(/^[a-z0-9-]+$/i))
        return true;
      return false;
    },
    map: function(url) url.toLowerCase()
  },
  url: {
    map: function(url) url.toString(),
    ok: isValidURI
  },
  useChrome: {
    is: ['undefined', 'null', 'boolean'],
    map: function(use) !!use
  }
};

function add(options) {
  let { what, url, useChrome } = validate(options, validOptions);
  let classID = uuid();

  let aboutModule = {
    QueryInterface: XPCOMUtils.generateQI([Ci.nsIAboutModule]),
     newChannel: function (aURI) {
       let chan = Services.io.newChannel(url, null, null);
       if (useChrome)
         chan.owner = Services.scriptSecurityManager.getSystemPrincipal();
       return chan;
     },
    getURIFlags: function () Ci.nsIAboutModule.ALLOW_SCRIPT
  };

  let factory = {
    createInstance: function(aOuter, aIID) {
      if (aOuter)
        throw Cr.NS_ERROR_NO_AGGREGATION;
      return aboutModule.QueryInterface(aIID);
    },
    QueryInterface: XPCOMUtils.generateQI([Ci.nsIFactory])
  };

  // register about:what
  Cm.QueryInterface(Ci.nsIComponentRegistrar).
    registerFactory(classID, '', '@mozilla.org/network/protocol/about;1?what='+what, factory);

  let remover = unloader.bind(null, what, factory, classID);
  unload(remover);

  return undefined;
}
exports.add = add;

function unloader(what, factory, classID) {
  // unregister about:what
  Cm.QueryInterface(Ci.nsIComponentRegistrar).unregisterFactory(classID, factory);
  let regEx = new RegExp('^' + what, 'i');

  // AMO policy, see http://maglione-k.users.sourceforge.net/bootstrapped.xhtml
  // close about:what tabs
  for each (let tab in tabs) {
    let url = URL(tab.url);
    if (url.scheme === 'about' && url.path.match(regEx)) {
      tab.close();
    }
  }
}
