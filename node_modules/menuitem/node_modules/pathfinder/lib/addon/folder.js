'use strict';

const JETPACK_DIR_BASENAME = "jetpack";
const PATH_TEST = /^[\s\.\\\/]/;

const { Cc, Ci } = require('chrome');
const file = require('sdk/io/file');
const jpSelf = require('sdk/self');

let storeFile = Cc['@mozilla.org/file/directory_service;1']
                  .getService(Ci.nsIProperties)
                  .get('ProfD', Ci.nsIFile);
storeFile.append(JETPACK_DIR_BASENAME);
storeFile.append(jpSelf.id);
storeFile.append('addon-folder');

const ADDON_FOLDER_PATH = storeFile.path + '/';

// make the addon-folder container folder
file.mkpath(ADDON_FOLDER_PATH);

function ioFileWrap(funcName, preMode) {
  preMode = preMode || "";
  return function(filepath, mode) {
    filepath = filepath || '';
    if (PATH_TEST.test(filepath)) {
      throw 'The provided filepath "' + filepath + '"" is not valid';
    }
    return file[funcName](ADDON_FOLDER_PATH + filepath, preMode + mode);
  }
}
exports.isFile = ioFileWrap('isFile');
exports.exists = ioFileWrap('exists');

exports.remove = function(filepath) {
  if (exports.isFile(filepath)) {
  	file.remove(ADDON_FOLDER_PATH + filepath);
  }
  else {
  	file.rmdir(ADDON_FOLDER_PATH + filepath);
  }
};
exports.read = ioFileWrap('read');
exports.write = ioFileWrap('open', 'w');
exports.mkpath = ioFileWrap('mkpath');
exports.list = ioFileWrap('list');

exports.destroy = function destroy() {
  // remove the addon-folder container folder
  file.rmdir(ADDON_FOLDER_PATH);
}
