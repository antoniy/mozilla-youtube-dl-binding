'use strict';

var file = require("sdk/io/file");
var url = require("sdk/url");

var convert2RegExp = require("./scriptish/convert-2-regexp").convert2RegExp;
var userscriptParser = require("./scriptish/userscript-header-parser").parse;
var manager = require("./scriptish/userscript-manager");

const JSVersions = ['1.6', '1.7', '1.8'/*, '1.8.1'*/];

var UserScript = exports.UserScript = function UserScript(aURL) {
  var script = new Script(aURL);
  manager.register(script);

  return {
    destory: function() {
      manager.unregister(script);
    },
    get enabled() script.enabled,
    set enabled(aVal) script.enabled = !!aVal
  };
}

function Script(aURL) {
  this._url = url.URL(aURL);
  this._filepath = url.toFilename(aURL);
  this._source = file.read(this._filepath);
  var header = userscriptParser(this._source);

  this._name = (header.name && header.name[0]) || Script.parseScriptName(aURL);
  this._namespace = (header.namespace && header.namespace[0]) || this.url.host;
  this._description = (header.description && header.description[0]) || "";
  this.enabled = true;
  this._includes = (header.include || []).map(convert2RegExp);
  this._excludes = (header.exclude || []).map(convert2RegExp);
  this._requires = (header.require || []);
  this._resources = (header.resource || []);
  if (header.jsversion) {
    for (var i = header.jsversion.length - 1; ~i; i--) {
      let val = header.jsversion[i];
      if (~JSVersions.indexOf(val)) {
        this.jsversion = val;
        break;
      }
    }
  }
}

Script.prototype = {
  get prefPrefix () {
    return ["greasemonkey.scriptvals.",
             this._namespace,
             "/",
             this._name,
             "."].join("");
  },

  // TODO: actually implement this!
  matchesDomain: function() {
    return true;
  },

  matchesURL: function(url) {
    var test = function(pattern) {
      return pattern.test(url);
    }

    return this.enabled
        && this._includes.some(test)
        && !this._excludes.some(test);
  },

  _changed: function(event, data) {
    if(this._config) {
      this._config._changed(this, event, data);
    }
  },

  get name() { return this._name; },
  get namespace() { return this._namespace; },
  get description() { return this._description; },

  get enabled() { return this._enabled; },
  set enabled(enabled) {
    this._enabled = enabled;
    this._changed("edit-enabled", enabled);
  },

  get includes() { return this._includes.concat(); },
  get excludes() { return this._excludes.concat(); },
  addInclude: function(url) {
    this._includes.push(url);
    this._changed("edit-include-add", url);
  },
  removeIncludeAt: function(index) {
    this._includes.splice(index, 1);
    this._changed("edit-include-remove", index);
  },
  addExclude: function(url) {
    this._excludes.push(url);
    this._changed("edit-exclude-add", url);
  },
  removeExcludeAt: function(index) {
    this._excludes.splice(index, 1);
    this._changed("edit-exclude-remove", index);
  },

  get requires() { return this._requires.concat(); },
  get resources() { return this._resources.concat(); },
  get unwrap() { return this._unwrap; }
};


Script.parseScriptName = function(aURL) ((
    /\/([^\/]+)\.user(?:-\d+)?\.js(?:[\?#].*)?$/.test(aURL || "")) ? RegExp.$1 : "");
