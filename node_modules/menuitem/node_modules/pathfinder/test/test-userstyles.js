/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict';

const { Loader } = require('sdk/test/loader');

const userstyles = require('userstyles');

const TEST_CSS_URL = module.uri.replace(/\.js$/, '.css');
const TEST_FNF_URL = module.uri.replace(/\.js$/, '.x.css');

// TEST: userstyles.load
exports.testLoad = function(assert) {
  assert.equal(userstyles.registered(TEST_CSS_URL), false, 'css is unregistered.');

  userstyles.load(TEST_CSS_URL);
  assert.ok(userstyles.registered(TEST_CSS_URL), 'css was registered.');

  userstyles.unload(TEST_CSS_URL);
  assert.equal(userstyles.registered(TEST_CSS_URL), false, 'css was unregistered.');
};

// TEST: userstyles.load file not found
exports.testLoadFNF = function(assert) {
  assert.equal(userstyles.registered(TEST_CSS_URL), false, 'css is not registered.');

  try {
    userstyles.load(TEST_FNF_URL);
    assert.fail('trying to load a file that does not exist should throw an error');
 }
 catch(e) {
   assert.pass('trying to load a file that does not exist throws an error');
 }

  assert.equal(userstyles.registered(TEST_CSS_URL), false, 'css was not registered.');
};

// TEST: userstyles.load for 'agent' type
exports.testLoadAgent = function(assert) {
  assert.equal(userstyles.registered(TEST_CSS_URL), false, 'css is not registered.');
  assert.equal(userstyles.registered(TEST_CSS_URL, {type: 'agent'}), false, 'css is not registered.');

  userstyles.load(TEST_CSS_URL, {type: 'AgeNt'});
  assert.ok(userstyles.registered(TEST_CSS_URL, {type: 'AGENT'}), 'css was registered.');

  try {
    userstyles.unload(TEST_CSS_URL);
    assert.fail('unregister did not throw an error');
  }
  catch(e) {
    assert.pass('unregister did throw an error');
  }
  assert.equal(userstyles.registered(TEST_CSS_URL, {type: 'agent'}), true, 'css was not unregistered.');

  userstyles.unload(TEST_CSS_URL, {type: 'agent'});
  assert.equal(userstyles.registered(TEST_CSS_URL, {type: 'agent'}), false, 'css was unregistered.');
};

exports.testUnload = function(assert) {
  assert.equal(userstyles.registered(TEST_CSS_URL), false, 'css is unregistered.');
  let loader = Loader(module);

  loader.require('userstyles').load(TEST_CSS_URL);
  assert.ok(userstyles.registered(TEST_CSS_URL), 'css was registered.');

  loader.unload();
  assert.equal(userstyles.registered(TEST_CSS_URL), false, 'css was unregistered.');
}

exports.testUnloadWithMultipleLoads = function(assert) {
  assert.equal(userstyles.registered(TEST_CSS_URL), false, 'css is unregistered.');
  let loader = Loader(module);

  // first load
  loader.require('userstyles').load(TEST_CSS_URL);
  assert.ok(userstyles.registered(TEST_CSS_URL), 'css was registered.');

  // now unload
  loader.require('userstyles').unload(TEST_CSS_URL);
  assert.equal(userstyles.registered(TEST_CSS_URL), false, 'css is unregistered.');

  // now load again
  loader.require('userstyles').load(TEST_CSS_URL);
  assert.ok(userstyles.registered(TEST_CSS_URL), 'css was registered.');

  // send addon unload message and see if we fail
  loader.unload();
  assert.equal(userstyles.registered(TEST_CSS_URL), false, 'css is unregistered.');
}

exports.testUnloadWithMultipleLoaders = function(assert) {
  assert.equal(userstyles.registered(TEST_CSS_URL), false, 'css is unregistered.');
  let loader = Loader(module);

  // first load
  loader.require('userstyles').load(TEST_CSS_URL);
  assert.ok(userstyles.registered(TEST_CSS_URL), 'css was registered.');

  // now unload
  loader.require('userstyles').unload(TEST_CSS_URL);
  assert.equal(userstyles.registered(TEST_CSS_URL), false, 'css is unregistered.');

  // now load again
  userstyles.load(TEST_CSS_URL);
  assert.ok(userstyles.registered(TEST_CSS_URL), 'css was registered.');

  // send addon unload message and see if we fail
  loader.unload();
  assert.equal(userstyles.registered(TEST_CSS_URL), true, 'css is still registered.');

  userstyles.unload(TEST_CSS_URL);
  assert.equal(userstyles.registered(TEST_CSS_URL), false, 'css was unregistered.');
}

require('sdk/test').run(exports);
