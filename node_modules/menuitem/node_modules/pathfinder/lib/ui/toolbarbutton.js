/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict';

const winUtils = require("sdk/deprecated/window-utils");
const { isBrowser } = require('sdk/window/utils');
const { Class } = require('sdk/core/heritage');
const TBB_NS = require('sdk/core/namespace').ns();

const { validate: validateOptions } = require('./validate');
const { getToolbarButtons, toolbarbuttonExists } = require('./utils');
const { unload } = require("../addon/unload");
const { listen } = require("../xul/listen");

const NS_XUL = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

exports.ToolbarButton = Class({
  initialize: function(options) {
    TBB_NS(this).unloaders = [];

    const self = this;
    TBB_NS(this).destroyed = false;
    TBB_NS(this).destroyFuncs = [];
    let safeOptions = TBB_NS(this).options = validateOptions(options);

    winUtils.WindowTracker({
      onTrack: function (window) {
        if (!isBrowser(window) || TBB_NS(self).destroyed)
          return;

        let doc = window.document;
        let $ = function(id) doc.getElementById(id);

        // create toolbar button
        let tbb = doc.createElementNS(NS_XUL, "toolbarbutton");
        tbb.setAttribute("id", safeOptions.id);
        tbb.setAttribute("type", "button");
        if (safeOptions.image)
          tbb.setAttribute("image", safeOptions.image);
        tbb.setAttribute("class", "toolbarbutton-1 chromeclass-toolbar-additional");
        tbb.setAttribute("label", safeOptions.label);
        tbb.setAttribute('tooltiptext', safeOptions.tooltiptext);
        tbb.addEventListener("command", function() {
          if (safeOptions.onCommand)
            safeOptions.onCommand({}); // TODO: provide something?

          if (safeOptions.panel) {
            safeOptions.panel.show(tbb);
          }
        }, true);

        // add toolbarbutton to palette
        ($("navigator-toolbox") || $("mail-toolbox")).palette.appendChild(tbb);

        // find a toolbar to insert the toolbarbutton into
        if (TBB_NS(self).options.toolbarID) {
          var tb = $(TBB_NS(self).options.toolbarID);
        }
        if (!tb) {
          var tb = toolbarbuttonExists(doc, safeOptions.id);
        }

        // found a toolbar to use?
        if (tb) {
          let b4;

          // find the toolbarbutton to insert before
          if (TBB_NS(self).options.insertbefore) {
            b4 = $(TBB_NS(self).options.insertbefore);
          }
          if (!b4) {
            let currentset = tb.getAttribute("currentset").split(",");
            let i = currentset.indexOf(safeOptions.id) + 1;

            // was the toolbarbutton id found in the curent set?
            if (i > 0) {
              let len = currentset.length;
              // find a toolbarbutton to the right which actually exists
              for (; i < len; i++) {
                b4 = $(currentset[i]);
                if (b4) break;
              }
            }
          }

          tb.insertItem(safeOptions.id, b4, null, false);
        }

        var saveTBNodeInfo = function(e) {
          TBB_NS(self).options.toolbarID = tbb.parentNode.getAttribute("id") || "";
          TBB_NS(self).options.insertbefore = (tbb.nextSibling || "")
              && tbb.nextSibling.getAttribute("id").replace(/^wrapper-/i, "");
        };

        window.addEventListener("aftercustomization", saveTBNodeInfo, false);

        // add unloader to unload+'s queue
        var unloadFunc = function() {
          tbb.parentNode.removeChild(tbb);
          window.removeEventListener("aftercustomization", saveTBNodeInfo, false);
        };
        var index = TBB_NS(self).destroyFuncs.push(unloadFunc) - 1;
        listen(window, window, "unload", function() {
          TBB_NS(self).destroyFuncs[index] = null;
        }, false);
        TBB_NS(self).unloaders.push(unload(unloadFunc, window));
      }
    });
  },
  destroy: function() {
    if (TBB_NS(this).destroyed) return;
    TBB_NS(this).destroyed = true;

    let options = TBB_NS(this).options;

    if (options.panel)
      options.panel.destroy();

    // run unload functions
    TBB_NS(this).destroyFuncs.forEach(function(f) f && f());
    TBB_NS(this).destroyFuncs.length = 0;

    // remove unload functions from unload+'s queue
    TBB_NS(this).unloaders.forEach(function(f) f());
    TBB_NS(this).unloaders.length = 0;
  },
  moveTo: function(pos) {
    if (TBB_NS(this).destroyed) return;

    let options = TBB_NS(this).options;

    // record the new position for future windows
    TBB_NS(this).options.toolbarID = pos.toolbarID;
    TBB_NS(this).options.insertbefore = pos.insertbefore;

    // change the current position for open windows
    for each (var window in winUtils.windowIterator()) {
      if (!isBrowser(window)) continue;

      let $ = function (id) window.document.getElementById(id);

      // if the move isn't being forced and it is already in the window, abort
      if (!pos.forceMove && $(this.id)) continue;

      var tb = $(TBB_NS(this).options.toolbarID);
      var b4 = $(TBB_NS(this).options.insertbefore);

      // TODO: if b4 dne, but insertbefore is in currentset, then find toolbar to right

      if (tb) tb.insertItem(this.id, b4, null, false);
    };
  },
  get id() TBB_NS(this).options.id,
  get label() TBB_NS(this).options.label,
  set label(value) {
    TBB_NS(this).options.label = value;
    getToolbarButtons(function(tbb) {
      tbb.label = value;
    }, this.id);
    return value;
  },
  setIcon: function setIcon(options) {
    let val = TBB_NS(this).options.image = options.image || options.url;
    getToolbarButtons(function(tbb) {
      tbb.image = val;
    }, this.id);
    return val;
  },
  get image() TBB_NS(this).options.image,
  set image(value) this.setIcon({image: value}),
  get tooltiptext() TBB_NS(this).options.tooltiptext,
  set tooltiptext(value) {
    TBB_NS(this).options.tooltiptext = value;
    getToolbarButtons(function(tbb) {
      tbb.setAttribute('tooltiptext', value);
    }, this.id);
  }
});
