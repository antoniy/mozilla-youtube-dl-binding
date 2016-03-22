/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict';

const { Loader } = require('sdk/test/loader');
const { before, after } = require('sdk/test/utils');

const { get, set } = require('pathfinder/storage');

exports.testGetNothing = function(assert, done) {
  get().then(function({ data }) {
    assert.equal(data, '', 'the data is blank!');
    done();
  });
};

exports.testSetThenGet = function(assert, done) {
  const randomData = Math.random() + '';

  // SET TO A RANDOM VALUE
  set({ data: randomData }).then(function({ data }) {
    assert.pass('setting was successful');
    assert.equal(data, randomData, 'the data returned from set is correct [' + randomData + ']');
  }, function(e) {
    assert.fail('setting was unsuccessful');
    assert.fail(e);
  }).then(function() get()).then(function({ data }) {
    assert.pass('getting was successful');
    assert.equal(data, randomData, 'the data returned from get is correct [' + randomData + ']');
  }, function(e) {
    assert.fail('getting was unsuccessful');
    assert.fail(e);
  })
  // SET AGAIN
  .then(function() set({ data: 'test' })).then(function({ data }) {
    assert.pass('setting was successful');
    assert.equal(data, 'test', 'the data returned from set is correct [test]');
  }, function(e) {
    assert.fail('setting was unsuccessful');
    assert.fail(e);
  }).then(function() get()).then(function({ data }) {
    assert.pass('getting was successful');
    assert.equal(data, 'test', 'the data returned from get is correct [test]');
  }, function(e) {
    assert.fail('getting was unsuccessful');
    assert.fail(e);
  }).
  // SET TO BLANK
  then(function() set({ data: '' })).then(function({ data }) {
    assert.pass('setting was successful');
    assert.equal(data, '', 'the data returned from set is correct');
  }, function(e) {
    assert.fail('setting was unsuccessful');
    assert.fail(e);
  }).then(function() get()).then(function({ data }) {
    assert.pass('getting was successful');
    assert.equal(data, '', 'the data returned from get is correct');
  }, function(e) {
    assert.fail('getting was unsuccessful');
    assert.fail(e);
  }).
  // SET TO BLANK AGAIN
  then(function() set({ data: '' })).then(function({ data }) {
    assert.pass('setting was successful');
    assert.equal(data, '', 'the data returned from set is correct');
  }, function(e) {
    assert.fail('setting was unsuccessful');
    assert.fail(e);
  }).then(function() get()).then(function({ data }) {
    assert.pass('getting was successful');
    assert.equal(data, '', 'the data returned from get is correct');
  }, function(e) {
    assert.fail('getting was unsuccessful');
    assert.fail(e);
  }).then(done, assert.fail);
};

exports.testSettingJSON = function(assert, done) {
  const json = JSON.stringify({
    num: 1,
    str: 'string',
    bool: true,
    obj: { x: 'x' },
    ary: [ 1, 2, 3 ]
  });

  set({ data: json }).then(function({ data }) {
    assert.pass('setting was successful');
    assert.equal(data, json, 'the data returned from set is correct json');
  }, function(e) {
    assert.fail('setting was unsuccessful');
    assert.fail(e);
  }).then(function() get()).then(function({ data }) {
    assert.pass('getting was successful');
    assert.equal(data, json, 'the data returned from get is correct json');
  }, function(e) {
    assert.fail('getting was unsuccessful');
    assert.fail(e);
  }).
  // SET TO BLANK AGAIN
  then(function() set({ data: '' })).then(function({ data }) {
    assert.pass('setting was successful');
    assert.equal(data, '', 'the data returned from set is correct');
  }, function(e) {
    assert.fail('setting was unsuccessful');
    assert.fail(e);
  }).then(function() get()).then(function({ data }) {
    assert.pass('getting was successful');
    assert.equal(data, '', 'the data returned from get is correct');
  }, function(e) {
    assert.fail('getting was unsuccessful');
    assert.fail(e);
  }).then(done, assert.fail);
};

before(exports, function(name, assert, done) {
  let loader = Loader(module);
  loader.require('pathfinder/storage');
  let file = loader.sandbox('pathfinder/storage').getStorageFile();
  assert.pass(file.exists(), false, 'the storage file DNE');
  loader.unload();
  done();
});
after(exports, function(name, assert, done) {
  let loader = Loader(module);
  loader.require('pathfinder/storage');
  let file = loader.sandbox('pathfinder/storage').getStorageFile();
  assert.pass(file.exists(), false, 'the storage file DNE');
  loader.unload();
  done();
});

require('sdk/test').run(exports);
