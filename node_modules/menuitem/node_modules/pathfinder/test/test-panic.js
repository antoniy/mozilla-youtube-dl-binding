/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict';

const panic = require('pathfinder/panic');
const prefs = require('sdk/preferences/service');
const { Loader } = require('sdk/test/loader');

const PREF_END_NAME = 'security.addon.panic_end';

// TEST: the inPanic variable and panic events
exports.testPanicInPanic = function(assert, done) {
  assert.equal(panic.inPanic, false, "not in a panic");
  panic.once('start', function() {
    assert.pass('"start" event was fired');
    assert.equal(panic.inPanic, true, "in a panic");

    panic.once('end', function() {
      assert.pass('"end" event was fired');
      assert.equal(panic.inPanic, false, "not in a panic");

      done();
    });
  });

  panic.panic();
};

// TEST: on and off methods
exports.testPanicOnOff = function(assert, done) {
  let count = 0;

  panic.on('start', function panicOn() {
    panic.off('start', panicOn);
    count++;

    panic.once('start', function() {
      if (count > 1) {
        assert.fail('panic.on was called too many times');
      }
      else {
        assert.pass('panic.on was only called once');
      }

      panic.once('end', function() {
        done();
      });
    });

    panic.once('end', function() {
      panic.panic(50);
    });
  });

  panic.panic();
};

// TEST: panic emits in multiple instances
exports.testPanicFiresInMultipleInstances = function(assert, done) {
  let count = 0;

  let loader = Loader(module);
  let panic2 = loader.require('panic');

  let testCounter = function() {
    if (++count < 2) return;
    assert.pass('panic was fired on multiple instances');

    panic.once('end', function() {
      loader.unload();
      done();
    });
  };
  panic.once('start', testCounter);
  panic2.once('start', testCounter);

  panic.panic();
};

exports.testEndTimestamp = function(assert, done) {
  let ms = 0;
  let min = Date.now() + ms;
  let endTimestamp;

  panic.once('end', function() {
    let now = Date.now();
    let max = (now + ms);

    assert.ok(min <= endTimestamp, endTimestamp + ' is gte ' + min);
    assert.ok(min <= now, now + ' event is gte to ' + min);
    assert.ok(max >= endTimestamp, 'timestamp is lte to max');
    assert.ok(max >= now, 'end event is lte to max');

    done();
  });

  panic.panic(ms);

  endTimestamp = prefs.get(PREF_END_NAME);
};

require('sdk/test').run(exports);
