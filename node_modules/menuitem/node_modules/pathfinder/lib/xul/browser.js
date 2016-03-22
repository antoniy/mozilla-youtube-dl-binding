/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict';

const { WindowTracker } = require("sdk/deprecated/window-utils");
const { isBrowser, windows } = require('sdk/window/utils');
const { validateOptions } = require("sdk/deprecated/api-utils");
const { Class } = require("sdk/core/heritage");
const { ns } = require("sdk/core/namespace");
const { ensure } = require('sdk/system/unload');

const { xulNS } = require('./namespace');

const NS_XUL = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
const VALID_POSITIONS = ['top'];

// Converts anything that isn't false, null or undefined into a string
function stringOrNull(val) val ? String(val) : val;

const XUL_SKELETON = Class({
  setup: function setup(attributes) {
  	const internals = xulNS(this);
    internals.attributes = attributes;
    ensure(this, 'destroy');
  },
  appendChild: function appendChild(node) {
  	const ID = this.getAttribute('id');

  	// keep note to update parent in future windows
    xulNS(node).parentID = ID;
    xulNS(node).insertBeforeID = null;

    // update parent on current windows
    windows().forEach(function(window) {
      let parent = window.document.getElementById(ID);
      let { element } = xulNS(node).windowsNS(window);
      parent.appendChild(element);
    });
  },
  insertBefore: function(node, beforeNode) {
    const ID = this.getAttribute('id');
    const B4_ID = (typeof beforeNode == 'string') ? beforeNode : beforeNode.getAttribute('id');

    // keep note to update parent in future windows
    xulNS(node).parentID = ID;
    xulNS(node).insertBeforeID = B4_ID;

    // update parent on current windows
    windows().forEach(function(window) {
      let parent = window.document.getElementById(ID);
      let before = window.document.getElementById(B4_ID);
      let { element } = xulNS(node).windowsNS(window);

      parent.insertBefore(element, before);
    });
  },
  addEventListener: function addEventListener(type, listener, useCapture) {
    internals.eles.forEach(function(ele) {
      ele.addEventListener(type, listener, useCapture);
    });
  },
  removeEventListener: function removeEventListener(type, listener, useCapture) {
    internals.eles.forEach(function(ele) {
      ele.removeEventListener(type, listener, useCapture);
    });
  },
  getAttribute: function getAttribute(attr) {
    return xulNS(this).attributes[attr];
  },
  setAttribute: function setAttribute(attr, value) {
  	const internals = xulNS(this);
    internals.eles.forEach(function(ele) {
      ele.setAttribute(attr, value);
    });
    internals.attributes[attr] = value;
  },
  destroy: function() {
    const internals = xulNS(this);
    internals.attributes = null;
  }
});

const XUL = Class({
  implements: [ XUL_SKELETON ],
  initialize: function(nodeName, attributes) {
  	const self = this;
  	const internals = xulNS(this);
    internals.windowsNS = ns();
    internals.eles = [];
    internals.attributes = attributes;

    XUL_SKELETON.prototype.setup.call(this, attributes);

    // Set Window Tracker
    internals.windowtracker = WindowTracker({
      onTrack: function(window) {
        if (!isBrowser(window)) return;
        let ele = window.document.createElementNS(NS_XUL, nodeName);

        Object.keys(attributes).forEach(function(key) {
          ele.setAttribute(key, attributes[key]);
        })

        internals.eles.push(ele);
        internals.windowsNS(window).element = ele;

        // update parent?
        if (internals.parentID) {
          let parent = window.document.getElementById(internals.parentID);
          if (internals.insertBeforeID) {
            let before = window.document.getElementById(internals.insertBeforeID);
            parent.insertBefore(ele, before);
          }
          else {
            parent.appendChild(ele);
          }
        }
      },
      onUntrack: function(window) {
        if (!isBrowser(window)) return;
        let { element } = internals.windowsNS(window);
        element.parentNode.removeChild(element);
        internals.windowsNS(window).element = null;
      }
    });
  },
  destroy: function() {
    XUL_SKELETON.prototype.destroy.call(this);
    const internals = xulNS(this);
    internals.windowtracker.unload();
    internals.windowtracker = null;
    internals.windowsNS = null;
  }
});
exports.XUL = XUL;

const XUL_GETTER = Class({
  implements: [ XUL_SKELETON ],
  initialize: function(attributes) {
    const self = this;
    const internals = xulNS(this);
    internals.windowsNS = ns();
    internals.eles = [];
    internals.attributes = attributes;

    XUL_SKELETON.prototype.setup.call(this, attributes);

    // Set Window Tracker
    internals.windowtracker = WindowTracker({
      onTrack: function(window) {
        if (!isBrowser(window)) return;
        let ele = window.document.getElementById(attributes.id);
        internals.eles.push(ele);
        internals.windowsNS(window).element = ele;

        // update parent?
        if (internals.parentID) {
          let parent = window.document.getElementById(internals.parentID);
          parent.appendChild(ele);
        }
      }
    });
  },
  destroy: function() {
    const internals = xulNS(this);

    XUL_SKELETON.prototype.destroy.call(this);

    internals.windowtracker.unload();
    internals.windowtracker = null;
    internals.windowsNS = null;
  }
});
exports.XUL_GETTER = XUL_GETTER;

function getXULById(id) {
  return XUL_GETTER({ id: id });
}
exports.getXULById = getXULById;
