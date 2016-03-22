/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict';

const { Cc, Ci, Cu } = require('chrome');
const { List, addListItem } = require('sdk/util/list');
const { URL } = require('sdk/url');

const { Services } = require('../chrome/services');

const { nsIPermissionManager } = Ci;

const UNKNOWN = nsIPermissionManager.UNKNOWN_ACTION;   // 0
const ALLOW = nsIPermissionManager.ALLOW_ACTION;       // 1
const BLOCK = nsIPermissionManager.DENY_ACTION;        // 2
const SESSION = Ci.nsICookiePermission.ACCESS_SESSION;    // 8

function getKey(obj, val) {
  for (let key in obj)
  	if (obj[key] == val)
  	  return key;

  return undefined;
}

const PERMISSIONS = {
  'session': SESSION,
  'allow': ALLOW,
  'deny': BLOCK
};

const TYPES = {
  'images': 'image',
  'popups': 'popup',
  'desktop-notifications': 'desktop-notification',
  'installs': 'install',
  'location': 'geo',
  'fullscreen': 'fullscreen',
  'pointer-lock': 'pointerLock'
}

const PM = Cc['@mozilla.org/permissionmanager;1'].
             getService(nsIPermissionManager);

function add(options) {
  let uri = Services.io.newURI(options.url, null, null);
  if (!/^https?/.test(uri.scheme)) {
  	throw new Error('invalid content url, only https or http schemes are accepted');
  }

  PM.add(uri,
  	     TYPES[options.type],
  	     PERMISSIONS[options.permission]);
}

function remove(options) {
  PM.remove(URL(options.url).host, TYPES[options.type]);
}

function removeAll() {
  PM.removeAll();
}

// TODO: cache entries after first request, and observe new additions with the "perm-changed" event

exports.permissions = {
  add: add,
  remove: remove,
  removeAll: removeAll,
  get permissions() {
    let list = List();
    let permissions = PM.enumerator;
    while (permissions.hasMoreElements()) {
      let permission = permissions.getNext().QueryInterface(Ci.nsIPermission);

      addListItem(list, {
        type: getKey(TYPES, permission.type),
        host: String(permission.host),
        permission: getKey(PERMISSIONS, Number(permission.capability))
        //'expire-time': Number(permission.expireTime),
      });
    }
    return list;
  },
  TYPES: TYPES,
  PERMISSIONS: PERMISSIONS
}
