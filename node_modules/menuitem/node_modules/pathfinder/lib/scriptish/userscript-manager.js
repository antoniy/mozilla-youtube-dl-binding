'use strict';

var { Services } = require("../chrome/services");
var obs = require("sdk/deprecated/observer-service");

var sandboxFactory = require("./userscript-sandbox");

var userscripts = [];

// TODO: register obs only when there is a userscript
obs.add("content-document-global-created", docReady);
obs.add("chrome-document-global-created", docReady);

function docReady(safeWin, data) {
  let href = (safeWin.location.href
      || (safeWin.frameElement && safeWin.frameElement.src)) || "";

  safeWin.addEventListener("load", function() {
    userscripts.forEach(function(script) {
      // check that the userscript should be run on this page
      if (!script.matchesURL(href))
        return;

      sandboxFactory.evalInSandbox(
          script._source,
          sandboxFactory.createSandbox(safeWin, script, href),
          script.jsversion);
    });
  }, true);
}

exports.register = function(aScript) {
  unregister(aScript);
  userscripts.push(aScript);
};

var unregister = exports.unregister = function unregister(aScript) {
  for (var i = userscripts.length - 1; ~i; i--) {
    if (userscripts[i] == aScript) {
      userscripts.splice(i, 1);
      break;
    }
  }
};
