'use strict';

const JETPACK_DIR_BASENAME = "jetpack";

const FOLDER = require('pathfinder/addon/folder');

const { Loader } = require('sdk/test/loader');
const { Cc, Ci } = require('chrome');
const file = require('sdk/io/file');
const jpSelf = require('sdk/self');

let storeFile = Cc['@mozilla.org/file/directory_service;1']
                  .getService(Ci.nsIProperties)
                  .get('ProfD', Ci.nsIFile);
storeFile.append(JETPACK_DIR_BASENAME);
storeFile.append(jpSelf.id);
storeFile.append('addon-folder');

const ADDON_FOLDER_PATH = storeFile.path;

exports.testFolderCreated = function(assert) {
  let loader = Loader(module);
  assert.ok(file.exists(ADDON_FOLDER_PATH), ADDON_FOLDER_PATH + ' was created');
  FOLDER.destroy();
  assert.ok(!file.exists(ADDON_FOLDER_PATH), ADDON_FOLDER_PATH + ' was destroyed');
  loader.require('pathfinder/addon/folder');
  assert.ok(file.exists(ADDON_FOLDER_PATH), ADDON_FOLDER_PATH + ' was created');
  loader.unload();
  assert.ok(file.exists(ADDON_FOLDER_PATH), ADDON_FOLDER_PATH + 'exists after unload');
}

exports.testFileLifecycle = function(assert, done) {
  let filename = 'test.json';
  let fileStream = FOLDER.write(filename);
  try {
    fileStream.writeAsync('{}', function(err) {
      assert.equal(FOLDER.exists(filename), true, 'the file was created');

      if (err)
        assert.fail(err);
      else
        assert.equal(FOLDER.read(filename), '{}', 'the file was written correctly');

      let entries = FOLDER.list();
      assert.ok(entries.length > 0, 'there is more than one entry');
      for each (let entry in entries) {
      	assert.equal(entry, filename, filename + ' is the only entry listed');
      }

      let testFile = Cc['@mozilla.org/file/directory_service;1']
                        .getService(Ci.nsIProperties)
                        .get('ProfD', Ci.nsIFile);
      testFile.append(JETPACK_DIR_BASENAME);
      testFile.append(jpSelf.id);
      testFile.append('addon-folder');
      testFile.append(filename);

      assert.ok(testFile.exists(), 'the test file does exist.')

      FOLDER.remove(filename);

      assert.equal(FOLDER.exists(filename), false, 'the file was removed');

      done();
    });
  }
  catch(e) {
  	assert.fail(e);
  	fileStream.close();
  	done();
  }
}

exports.testBackPath = function(assert, done) {
  let filename = '../../test.json';
  let fileStream = { close: function(){} };
  try {
    fileStream = FOLDER.write(filename);
  	assert.fail(filename + ' should not be useable');
  }
  catch(e) {
  	assert.pass(e);
  }

  fileStream.close();
  done();
}


require('sdk/test').run(exports);
