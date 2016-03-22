/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict';

module.metadata = {
  'stability': 'experimental',
  'engines': {
    'Firefox': '*'
  }
};

const { Class } = require('sdk/core/heritage');
const { merge } = require('sdk/util/object');
const { Disposable } = require('sdk/core/disposable');
const { off, emit, setListeners } = require('sdk/event/core');
const { EventTarget } = require('sdk/event/target');
const { URL } = require('sdk/url');
const { add, remove, has, clear, iterator } = require('sdk/lang/weak-set');
const { WindowTracker } = require('sdk/deprecated/window-utils');
const { isBrowser, getMostRecentBrowserWindow, windows } = require('sdk/window/utils');
const { ns } = require('sdk/core/namespace');
const { remove: removeFromArray } = require('sdk/util/array');
const { Worker: WorkerTrait } = require('sdk/content/worker');

const { create, dispose } = require('./sidebar/utils');
const { show, hide } = require('./sidebar/actions');
const { isShowing } = require('./sidebar/state');
const { contract } = require('./sidebar/contract');

const Worker = WorkerTrait.resolve({
  _injectInDocument: '__injectInDocument'
}).compose({
  get _injectInDocument() false
});

const sidebarNS = ns();

const WEB_PANEL_BROWSER_ID = 'web-panels-browser';

let sidebars = {};
let models = new WeakMap();
let views = new WeakMap();

function viewsFor(sidebar) views.get(sidebar);
function modelFor(sidebar) models.get(sidebar);

const WebPanel = Class({
  implements: [ Disposable ],
  extends: EventTarget,
  setup: function(options) {
    let self = this;

    const windowNS = ns();

    let model = merge({}, contract(options));

    models.set(this, model);

    setListeners(this, options);

    let bars = [];
    sidebarNS(self).tracker = WindowTracker({
      onTrack: function(window) {
        if (!isBrowser(window))
          return;

        let sidebar = window.document.getElementById('sidebar');
        let sidebarBox = window.document.getElementById('sidebar-box');

        let bar = create(window, {
          id: makeID(model.id),
          title: model.title,
          sidebarurl: model.url
        });
        bars.push(bar);
        windowNS(window).bar = bar;

        bar.addEventListener('command', function() {
          if (isSidebarShowing(window, self)) {
            hideSidebar(window, self);
            return;
          }

          showSidebar(window, self);
        }, false);

        function onSidebarLoad() {
          // check if the sidebar is ready
          let isReady = sidebar.docShell && sidebar.contentDocument;
          if (!isReady)
            return;

          // check if it is a web panel
          let panelBrowser = sidebar.contentDocument.getElementById(WEB_PANEL_BROWSER_ID);
          if (!panelBrowser) {
            bar.removeAttribute('checked');
            return;
          }

          let sbTitle = window.document.getElementById('sidebar-title');
          function onWebPanelSidebarLoad() {
            if (panelBrowser.contentWindow.location != model.url ||
                sbTitle.value != model.title) {
              return;
            }

            let worker = windowNS(window).worker = Worker({
              window: panelBrowser.contentWindow
            });

            function onWebPanelSidebarUnload() {
              panelBrowser.removeEventListener('unload', onWebPanelSidebarUnload, true);

              windowNS(window).onWebPanelSidebarLoad = null;

              // uncheck the associated menuitem
              bar.setAttribute('checked', 'false');

              emit(self, 'hide', null);
              emit(self, 'detach', worker);
            }
            windowNS(window).onWebPanelSidebarUnload = onWebPanelSidebarUnload;
            panelBrowser.contentWindow.addEventListener('unload', onWebPanelSidebarUnload, false);

            // check the associated menuitem
            bar.setAttribute('checked', 'true');

            emit(self, 'show', null);
            emit(self, 'attach', worker);
          }
          windowNS(window).onWebPanelSidebarLoad = onWebPanelSidebarLoad;
          panelBrowser.addEventListener('DOMWindowCreated', onWebPanelSidebarLoad, true);
        }
        windowNS(window).onSidebarLoad = onSidebarLoad;
        sidebar.addEventListener('load', onSidebarLoad, true);
      },
      onUntrack: function(window) {
        if (!isBrowser(window))
          return;

        let { bar } = windowNS(window);
        if (bar) {
          removeFromArray(viewsFor(self), bar);
          dispose(bar);
        }

        let sidebar = window.document.getElementById('sidebar');
        if (!sidebar)
          return;

        if (windowNS(window).onSidebarLoad) {
          sidebar.removeEventListener('load', windowNS(window).onSidebarLoad, true)
          windowNS(window).onSidebarLoad = null;
        }

        if (windowNS(window).onWebPanelSidebarLoad) {
          let webPanel = sidebar.contentDocument.getElementById(WEB_PANEL_BROWSER_ID);
          webPanel && webPanel.removeEventListener('DOMWindowCreated', windowNS(window).onWebPanelSidebarLoad, true);
          windowNS(window).onWebPanelSidebarLoad = null;
        }

        if (windowNS(window).onWebPanelSidebarUnload) {
          windowNS(window).onWebPanelSidebarUnload();
        }
      }
    });

    views.set(this, bars);

    add(sidebars, this);
  },
  get id() modelFor(this).id,
  get title() modelFor(this).title,
  get url() modelFor(this).url,
  show: function() show(this),
  hide: function() hide(this),
  dispose: function() {
    off(this);

    let wins = windows('navigator:browser', { includePrivate: true });
    for each (let win in wins) {
      hideSidebar(win, this);
    }

    remove(sidebars, this);

    // stop tracking windows
    sidebarNS(this).tracker.unload();
    sidebarNS(this).tracker = null;

    views.delete(this);
  }
});
exports.WebPanel = WebPanel;

function showSidebar(window, sidebar) {
  let model = modelFor(sidebar);
  let myWindow = window || getMostRecentBrowserWindow();

  myWindow.openWebPanel(model.title, model.url);

  let menuitem = myWindow.document.getElementById(makeID(model.id));
  menuitem.setAttribute('checked', true);
}
show.define(WebPanel, showSidebar.bind(null, null));

function hideSidebar(window, sidebar) {
  let myWindow = window || getMostRecentBrowserWindow();

  if (!isSidebarShowing(myWindow, sidebar))
    return;

  // return window.toggleSidebar();

  // Below was taken from http://mxr.mozilla.org/mozilla-central/source/browser/base/content/browser.js#4775
  // the code for window.toggleSideBar()..
  let { document } = myWindow;
  let mySidebar = document.getElementById('sidebar');
  let sidebarTitle = document.getElementById('sidebar-title');
  let sidebarBox = document.getElementById('sidebar-box');
  let sidebarSplitter = document.getElementById('sidebar-splitter');
  let commandID = sidebarBox.getAttribute('sidebarcommand');
  let sidebarBroadcaster = document.getElementById(commandID);

  sidebarBox.hidden = true;
  sidebarSplitter.hidden = true;

  mySidebar.setAttribute('src', 'about:blank');
  //sidebar.docShell.createAboutBlankContentViewer(null);

  sidebarBroadcaster.removeAttribute('checked');
  sidebarBox.setAttribute('sidebarcommand', '');
  sidebarTitle.value = '';
  sidebarBox.hidden = true;
  sidebarSplitter.hidden = true;

  // TODO: perhaps this isn't necessary if the window is not most recent?
  myWindow.gBrowser.selectedBrowser.focus();
}
hide.define(WebPanel, hideSidebar.bind(null, null));

function isSidebarShowing(window, sidebar) {
  let win = window || getMostRecentBrowserWindow();

  // make sure there is a window
  if (!win) {
    return false;
  }

  // make sure there is a sidebar for the window
  let sb = win.document.getElementById('sidebar');
  let sidebarTitle = win.document.getElementById('sidebar-title');
  if (!(sb && sidebarTitle)) {
    return false;
  }

  // checks if the sidebar box is hidden
  let sbb = win.document.getElementById('sidebar-box');
  if (!sbb || sbb.hidden) {
    return false;
  }

  // checks if the sidebar is loading
  if (win.gWebPanelURI == modelFor(sidebar).url) {
    return false;
  }

  if (sidebarTitle.value == modelFor(sidebar).title) {
    // checks if the sidebar loaded already
    let ele = sb.contentDocument && sb.contentDocument.getElementById(WEB_PANEL_BROWSER_ID);

    if (ele.getAttribute('cachedurl') ==  modelFor(sidebar).url) {
      return true;
    }

    if (ele && ele.contentWindow && ele.contentWindow.location == modelFor(sidebar).url) {
      return true;
    }
  }

  // default
  return false;
}
isShowing.define(WebPanel, isSidebarShowing.bind(null, null));

function makeID(id) {
  return 'pathfinder-sidebar-' + id;
}
