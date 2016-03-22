'use strict';

var { Cc, Ci, Cu } = require('chrome');
var {GM_API} = require("./greasemonkey-api");

exports.createSandbox = function createSandbox(safeWin, userScript, aURL) {
  var script = userScript.source;
  var sandbox = new Cu.Sandbox(safeWin);
  sandbox.window = safeWin;
  sandbox.document = sandbox.window.document;
  sandbox.__proto__ = safeWin;
  var api = new GM_API(userScript, aURL, null, safeWin, safeWin.wrappedJSObject);

  for (var key in api) {
    sandbox[key] = api[key];
  }

  return sandbox;
};

exports.evalInSandbox = function(code, sandbox, jsVersion) {
  jsVersion = jsVersion || "1.8";
  Cu.evalInSandbox("(function(){"+code+"})();", sandbox, jsVersion);
};