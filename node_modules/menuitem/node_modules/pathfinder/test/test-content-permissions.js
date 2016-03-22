'use strict';

const { permissions } = require('pathfinder/content/permissions');

exports.testAddRemovePermission = function(assert) {
  permissions.add({
  	url: 'http://erikvold.com/',
  	permission: 'deny',
  	type: 'images'
  });

  let found = false;
  for each (let permission in permissions.permissions) {
    if (permission.host == 'erikvold.com') {
      found = true;
      assert.equal(permission.permission, 'deny');
      assert.equal(permission.type, 'images');
    }
  }
  assert.ok(found, 'erikvold.com permission was found');

  permissions.remove({
    url: 'http://erikvold.com/',
    type: 'images'
  });

  for each (let permission in permissions.permissions) {
    if (permission.host == 'erikvold.com') {
      assert.fail('there should not be a permission for erikvold.com');
    }
  }
  assert.pass('permission was removed!');
};

require('sdk/test').run(exports);
