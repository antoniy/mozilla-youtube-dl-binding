/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict';

const { Cc, Ci, Cu, components } = require('chrome');
const { id } = require('sdk/self');
const unload = require('sdk/system/unload');
const { defer } = require('sdk/core/promise');

const { Instances } = require('./chrome/instances');
const { Services } = require('./chrome/services');
const { NetUtil } = require('./chrome/net-utils');

const { FileUtils } = Cu.import('resource://gre/modules/FileUtils.jsm', {});

const JETPACK_DIR_BASENAME = "jetpack";

let saving = false;

function getStorageFile() {
  const file = Services.dirsvc.get('ProfD', Ci.nsIFile);
  file.append(JETPACK_DIR_BASENAME);
  file.append(id);
  file.append('pathfinder');
  file.append('storage');

  if (!file.exists())
    file.create(Ci.nsIFile.DIRECTORY_TYPE, parseInt('0755', 8));

  file.append('storage.blob');
  return file;
}

function get(options) {
  options = options || {};
  let charset = options.charset || 'UTF-8';

  const { promise, resolve } = defer();
  const file = getStorageFile();
  const channel = NetUtil.newChannel(file);

  if (!file.exists()) {
    resolve({ data: '' });
  }
  else {
    NetUtil.asyncFetch(channel, function(iStream, aResult) {
      if (!components.isSuccessCode(aResult)) {
        reject();
      }
      else {
        let text = NetUtil.readInputStreamToString(iStream, iStream.available());

        let conv = Instances.suc;
        conv.charset = charset;

        text = conv.ConvertToUnicode(text);

        resolve({
          data: text,
          charset: charset
        });
      }
    });
  }

  return promise;
}
exports.get = get;

function set({ data, charset }) {
  charset = charset || 'UTF-8';
  data = data || '';
  const { promise, resolve, reject } = defer();
  const file = getStorageFile();

  if (data == '') {
    if (file.exists()) {
      file.remove(false);
    }

    resolve({
      data: '',
      charset: charset
    });
  }
  else {
    const converter = Instances.suc;
    converter.charset = "UTF-8";

    if (isSaving()) {
      throw Error('Storage is currently in the process of saving..');
    }
    saving = true;

    let iStream = converter.convertToInputStream(data);
    let oStream = FileUtils.openSafeFileOutputStream(file);

    NetUtil.asyncCopy(
      iStream,
      oStream,
      function(aResult) {
        FileUtils.closeSafeFileOutputStream(oStream);
        saving = false;

        if (!components.isSuccessCode(aResult)) {
          reject();
        }
        else {
          resolve({
            data: data,
            charset: charset
          });
        }
      }
    );
  }

  return promise;
}
exports.set = set;

function isSaving() {
  return saving;
}
exports.isSaving = isSaving;
