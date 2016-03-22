/*jshint asi:true globalstrict:true*/
'use strict';

const { Cc, Ci } = require('chrome')
const ioService = Cc['@mozilla.org/network/io-service;1'].
                getService(Ci.nsIIOService);
const resourceHandler = ioService.getProtocolHandler('resource').
                        QueryInterface(Ci.nsIResProtocolHandler)

function get(root) {
  /**
  Gets the substitution for the `root` key.
  **/
  try {
    return resourceHandler.getSubstitution(root).spec;
  }
  catch (error) {}
  return null;
}
exports.get = get;

function has(root) {
  /**
  Returns `true` if the substitution exists and `false` otherwise.
  **/
  return resourceHandler.hasSubstitution(root);
}
exports.has = has;

function set(root, uri) {
  /**
  Sets the substitution for the root key:

      resource://root/path ==> baseURI.resolve(path)

  A `null` `uri` removes substitution. A root key should
  always be lowercase. However, this may not be enforced.
  **/
  uri = !uri ? null :
        uri instanceof Ci.nsIURI ? uri : ioService.newURI(uri, null, null);
  resourceHandler.setSubstitution(root, uri);
}
exports.set = set;
