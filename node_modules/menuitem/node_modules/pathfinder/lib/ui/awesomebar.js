/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict';

const {Cc, Ci, Cu, Cm, components} = require('chrome');
Cu.import("resource://gre/modules/AddonManager.jsm", this);
Cu.import("resource://gre/modules/Services.jsm", this);
Cu.import("resource://gre/modules/XPCOMUtils.jsm", this);

var {unload} = require("../addon/unload");
var {listen} = require("../xul/listen");
var {watchWindows} = require("window-watcher");
var {clearTimeout, setTimeout} = require("timer");

let handlers = [];

// public api for adding a keyword and search handler
// TODO: validate, yo
exports.AwesomeBarSuggestion = function AwesomeBarSuggestion(options) {
  var i = handlers.push(options) - 1;
  var destroyed = false;

  return {
    destroy: function() {
      if (destroyed) return;
      destroyed = true;
      handlers[i] = null;
    }
  };
};

// Bool check if a given string matches a given handler
function handlerMatch(query, handler) !!(handler && handler.matches.test(query));

// Get first registered handler that matches a given string
function getMatchingHandler(query) handlers.filter(function(handler) handlerMatch(query, handler)).shift()

// Add functionality to search from the location bar and hook up autocomplete
function addAddressBarSearch(window) {
  let {change} = makeWindowHelpers(window);
  let {BrowserUI, gBrowser, gURLBar} = window;

  // Check the input to see if the add-on icon should be shown
  // Called when the location bar fires the input event
  function onLocationBarInput() {
    if (skipCheck())
      return;

    let icon = "";
    let handler = getMatchingHandler(urlbar.value);
    if (handler && handler.icon)
      icon = handler.icon;
    setIcon(icon);
  }

  // Implement these functions depending on the platform
  let setIcon, skipCheck, urlbar;

  // mobile
  if (gBrowser == null) {
    setIcon = function(url) BrowserUI._updateIcon(url);
    skipCheck = function() false;
    urlbar = BrowserUI._edit;

    // Check the input on various events
    listen(window, BrowserUI._edit, "input", onLocationBarInput);

    // Convert inputs to twitter urls
    change(window.Browser, "getShortcutOrURI", function(orig) {
      return function(uri, data) {
        return orig.call(this, uri, data);
      };
    });
  }
  // desktop
  else {
    setIcon = function(url) window.PageProxySetIcon(url);
    skipCheck = function() gURLBar.getAttribute("pageproxystate") == "valid" &&
                           !gURLBar.hasAttribute("focused");
    urlbar = gURLBar;

    // Check the input on various events
    listen(window, gURLBar, "input", onLocationBarInput);
    listen(window, gBrowser.tabContainer, "TabSelect", onLocationBarInput);

    // Convert inputs to twitter urls
    change(gURLBar, "_canonizeURL", function(orig) {
      return function(event) {
        return orig.call(this, event);
      };
    });
  }

  // Provide a way to set the autocomplete search engines and initialize
  function setSearch(engines) {
    urlbar.setAttribute("autocompletesearch", engines);
    urlbar.mSearchNames = null;
    urlbar.initSearchNames();
  };

  // Add in the twitter search and remove on cleanup
  let origSearch = urlbar.getAttribute("autocompletesearch");
  setSearch(require('self').id + " " + origSearch);
  unload(function() setSearch(origSearch));
}

// Add an autocomplete search engine to provide location bar suggestions
function addAutocomplete() {
  const contract = "@mozilla.org/autocomplete/search;1?name=" + require('self').id;
  const desc = "Jetpack Autocomplete";
  const uuid = components.ID("504A8466-8D3D-11E0-A57E-D2F94824019B");

  // Keep a timer to send a delayed no match
  let timer;
  function clearTimer() {
    if (timer != null)
      clearTimeout(timer);
    timer = null;
  }

  // call back in one second
  function setTimer(callback) {
    timer = setTimeout(callback, 1000);
  }

  // Implement the autocomplete search that handles twitter queries
  let search = {
    createInstance: function(outer, iid) search.QueryInterface(iid),

    QueryInterface: XPCOMUtils.generateQI([Ci.nsIAutoCompleteSearch]),

    // Handle searches from the location bar
    startSearch: function(query, param, previous, listener) {

      // Always clear the timer on a new search
      clearTimer();

      function suggest(o, done) {
        listener.onSearchResult(search, {
          getCommentAt: function() o.title,
          getImageAt: function() o.favicon,
          getLabelAt: function() o.label || o.url,
          getValueAt: function() o.url,
          getStyleAt: function() "favicon",
          get matchCount() 1,
          QueryInterface: XPCOMUtils.generateQI([Ci.nsIAutoCompleteResult]),
          removeValueAt: function() {},
          searchResult: Ci.nsIAutoCompleteResult.RESULT_SUCCESS,
          get searchString() query,
        });
      }

      // TODO: if no search yet, but matched keyword, show example text

      // if there's a query string and a match
      if (query.length) {
        let handler = getMatchingHandler(query);
        if (handler) {
          if (query) {
            handler.onSearch(query, suggest);
          }
        }
      }
      // Send a delayed NOMATCH so the autocomplete doesn't close early
      else {
        setTimer(function() {
          listener.onSearchResult(search, {
            searchResult: Ci.nsIAutoCompleteResult.RESULT_NOMATCH,
          });
        });
      }
    },

    // Nothing to cancel other than a delayed search as results are synchronous
    stopSearch: function() {
      clearTimer();
    },
  };

  // Register this autocomplete search service and clean up when necessary
  const registrar = Ci.nsIComponentRegistrar;
  Cm.QueryInterface(registrar).registerFactory(uuid, desc, contract, search);
  unload(function() {
    Cm.QueryInterface(registrar).unregisterFactory(uuid, search);
  });
}

// Add support to the browser
watchWindows(addAddressBarSearch);
addAutocomplete();

// Take a window and create various helper properties and functions
function makeWindowHelpers(window) {
  // Replace a value with another value or a function of the original value
  function change(obj, prop, val) {
    let orig = obj[prop];
    obj[prop] = typeof val == "function" ? val(orig) : val;
    unload(function() obj[prop] = orig, window);
  }

  return {
    change: change,
  };
}
