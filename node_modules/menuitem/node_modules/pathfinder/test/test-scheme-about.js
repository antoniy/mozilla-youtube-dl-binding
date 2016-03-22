'use strict';

const { Loader } = require('sdk/test/loader');
const tabs = require('sdk/tabs')

function openTabGetContent(url, callback) {
  tabs.open({
    url: 'about:test',
    inBackground: true,
    onReady: function(tab) {
      let worker = tab.attach({
        contentScript: 'self.port.emit("body", document.body.innerHTML)'
      })
      worker.port.on('body', function(msg) {
        tab.close(function() {
          callback(msg);
        });
      });
    }
  })
}

exports.testAddAboutWhat = function(assert, done) {
  const loader = Loader(module);
  const { add } = loader.require('pathfinder/scheme/about');

  add({
  	what: 'test',
    url: 'data:text/html;charset=utf-8,<body>test</body>'
  });

  openTabGetContent('about:test', function(msg) {
    assert.equal(msg, 'test', 'about:test content is "test"');
    loader.unload();
    openTabGetContent('about:test', function(msg) {
      assert.notEqual(msg, 'test', 'about:test content is "test"');
      done();
    });
  });

}

require('test').run(exports);
