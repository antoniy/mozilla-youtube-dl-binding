/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict';

const tabs = require('sdk/tabs');
const { data } = require('sdk/self');
const { Loader } = require("sdk/test/loader");

const { Redirect } = require('pathfinder/redirect');

function getData(url) {
  return 'data:text/javascript;charset=utf-8,' + encodeURIComponent(url);
}

exports.testRedirect = function(assert, done) {
  const loader = Loader(module);
  const httpd = loader.require('sdk/test/httpd');
  const { startServerAsync } = httpd;

  let serverPort = 8058;
  let server = httpd.startServerAsync(serverPort);
  const contents = "testRedirect";

  server.registerPathHandler("/test.txt", function handle(request, response) {
    response.write(contents);
  });

  let details = {
    from: 'http://localhost:' + serverPort + '/test.txt',
    to: getData('exptected')
  };
  let redirect = Redirect(JSON.parse(JSON.stringify(details)));

  tabs.open({
  	url: details.from,
  	onReady: function(tab) {
      assert.equal(tab.url, details.to, 'The final destination is correct!');
      redirect.destroy();

      server.stop(function() {
        loader.unload();
        tab.close(done);
      });
  	}
  });
}

require('sdk/test').run(exports);
