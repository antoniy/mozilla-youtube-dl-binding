/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict';

var timer = require("sdk/timers");
var { Cc,Ci } = require("chrome");
const windowUtils = require("sdk/deprecated/window-utils");
const { Loader } = require('sdk/test/loader');

function makeEmptyWindow() {
  var xulNs = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
  var blankXul = ('<?xml version="1.0"?>' +
                  '<?xml-stylesheet href="chrome://global/skin/" ' +
                  '                 type="text/css"?>' +
                  '<window xmlns="' + xulNs + '">' +
                  '</window>');
  var url = "data:application/vnd.mozilla.xul+xml," + escape(blankXul);
  var features = ["chrome", "width=10", "height=10"];

  var ww = Cc["@mozilla.org/embedcomp/window-watcher;1"]
           .getService(Ci.nsIWindowWatcher);
  return ww.openWindow(null, url, null, features.join(","), null);
}

exports.testUnloading = function(assert) {
  var loader = Loader(module);
  var {unload} = loader.require("pathfinder/addon/unload");
  var unloadCalled = 0;

  function unloader() {
    unloadCalled++;
  }
  unload(unloader);

  function unloader2() unloadCalled++;
  var removeUnloader2 = unload(unloader2);

  function unloader3() unloadCalled++;
  unload(unloader3);

  // remove unloader2
  removeUnloader2();

  loader.unload();

  assert.equal(unloadCalled, 2, "Unloader functions are called on unload.");
};

exports.testUnloadingWindow = function(assert, done) {
  var loader = Loader(module);
  var {unload} = loader.require("pathfinder/addon/unload");
  var unloadCalled = 0;
  var finished = false;
  var myWindow;

  var delegate = {
    onTrack: function(window) {
      if (window == myWindow) {
        assert.pass("onTrack() called with our test window");

        let unloader = function unloader() {
          unloadCalled++;
        }
        unload(unloader, window);
        unload(unloader);

        timer.setTimeout(function() {
          window.close();

          assert.equal(unloadCalled, 1, "unloader was still called.");

          if (window.closed) {
            assert.pass("window closed");
          }
          else {
            assert.fail("window is not closed!");
          }

          timer.setTimeout(function() {
            assert.equal(unloadCalled, 1, "unloader was called.");

            unload(function() {
              assert.equal(unloadCalled, 2, "two unloaders called.");

              if (finished) {
                assert.pass("finished");
                done();
              }
              else {
                assert.fail("not finished!");
              }
            });

            loader.unload();
          }, 1);
        }, 1);
      }
    },
    onUntrack: function(window) {
      if (window == myWindow) {
        assert.pass("onUntrack() called with our test window");

        if (!finished) {
          finished = true;
          myWindow = null;
          wt.unload();
        }
        else {
          assert.fail("finishTest() called multiple times.");
        }
      }
    }
  };

  var wt = new windowUtils.WindowTracker(delegate);
  myWindow = makeEmptyWindow();
};

exports.testUnloaderExecutionOnWindowClose = function(assert, done) {
  var loader = Loader(module);
  var {unload} = loader.require("pathfinder/addon/unload");
  var unloadCalled = 0;
  var finished = false;
  var myWindow;
  var unloaderRan = false;

  var delegate = {
    onTrack: function(window) {
      if (window != myWindow) return;

      unload(function() unloaderRan = true, window);
      window.close();
    },
    onUntrack: function(window) {
      if (window != myWindow) return;

      loader.require('sdk/timers').setTimeout(function() {
        assert.ok(unloaderRan, 'test complete');
        loader.unload();
        done();
      }, 0);
    }
  };

  var wt = new windowUtils.WindowTracker(delegate);
  myWindow = makeEmptyWindow();
};

require('sdk/test').run(exports);
