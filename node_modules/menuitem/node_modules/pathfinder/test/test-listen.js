/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict';

const { Loader } = require('sdk/test/loader');
const { getMostRecentBrowserWindow } = require('sdk/window/utils');
const { open, close, promise: windowPromise } = require('sdk/window/helpers');
const NS_XUL = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

const { listen: gListen } = require('pathfinder/xul/listen');

// from https://developer.mozilla.org/en-US/docs/Web/API/document.createEvent
function simulateClick(ele) {
  let window = ele.ownerDocument.defaultView;
  let { document } = window;
  var evt = document.createEvent("MouseEvents");
  evt.initMouseEvent("click", true, true, window,
    0, 0, 0, 0, 0, false, false, false, false, 0, null);
  ele.dispatchEvent(evt);
}

function makeEle(window) {
  window = window || getMostRecentBrowserWindow();
  let ele = window.document.createElementNS(NS_XUL, 'toolbar');
  return {
  	window: window,
  	document: window.document,
  	ele: ele
  }
}

exports.testSuccessiveListenersCaptureTrue = function(assert, done) {
  const loader = Loader(module);
  const { listen } = loader.require('pathfinder/xul/listen');
  let { window, document, ele } = makeEle();
  let aHappened = false;

  listen(window, ele, 'click', function() {
  	aHappened = true;
  }, true);
  listen(window, ele, 'click', function() {
  	assert.ok(aHappened, 'the first listener attached was the first called.')
  	loader.unload();
  	done();
  }, true);

  simulateClick(ele);
}

exports.testSuccessiveListeners = function(assert, done) {
  const loader = Loader(module);
  const { listen } = loader.require('pathfinder/xul/listen');
  let { window, document, ele } = makeEle();
  let aHappened = false;

  listen(window, ele, 'click', function() {
  	aHappened = true;
  }, false);
  listen(window, ele, 'click', function() {
  	assert.ok(aHappened, 'the first listener attached was the first called.')
  	loader.unload();
  	done();
  }, false);

  simulateClick(ele);
}

exports.testSuccessiveListenersAcrossLoaders = function(assert, done) {
  const loader = Loader(module);
  const { listen } = loader.require('pathfinder/xul/listen');
  let { window, document, ele } = makeEle();
  let aHappened = false;

  listen(window, ele, 'click', function() {
  	aHappened = true;
  }, false);
  let remover = gListen(window, ele, 'click', function() {
  	assert.ok(aHappened, 'the first listener attached was the first called.');
  	remover();
  	loader.unload();
  	done();
  }, false);

  simulateClick(ele);
}

exports.testRemover = function(assert, done) {
  const loader = Loader(module);
  const { listen } = loader.require('pathfinder/xul/listen');
  let { window, document, ele } = makeEle();
  let aHappened = false;

  let remover1 = listen(window, ele, 'click', function() {
  	aHappened = true;
  }, false);
  let remover = gListen(window, ele, 'click', function() {
  	assert.ok(!aHappened, 'the first listener attached was removed');
  	remover();
  	loader.unload();
  	done();
  }, false);

  remover1();
  simulateClick(ele);
}

exports.testWindowUnloadEvent = function(assert, done) {
  let eHappened = false;
  let { window, ele: ele1 } = makeEle();
  let remover2, remover1 = gListen(window, ele1, 'click', function() {
  	assert.ok(!eHappened, 'listeners are removed when parent window unloads');
    remover1();
    remover2();
    done();
  });

  open().then(function(window) {
    let { document, ele: ele2 } = makeEle(window);
    
    remover2 = gListen(window, ele2, 'click', function() {
      eHappened = true;
    });

    windowPromise(window, 'unload').then(function() {
      simulateClick(ele2);
      simulateClick(ele1);
    });
    close(window);
  });
}

exports.testListenWorksOnUnload = function(assert, done) {
  const loader = Loader(module);
  const { listen } = loader.require('pathfinder/xul/listen');
  let { window, document, ele } = makeEle();

  listen(window, ele, 'click', function() {
  	assert.fail('should not be here');
  }, false);

  let remover = gListen(window, ele, 'click', function() {
    remover();
    assert.pass('ending listen unload test');
  	done();
  }, false);

  loader.unload();
  simulateClick(ele);
}

require('sdk/test').run(exports);
