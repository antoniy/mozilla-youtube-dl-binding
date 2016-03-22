/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict';

const winUtils = require('sdk/deprecated/window-utils');
const { Class } = require('sdk/core/heritage');
const { validateOptions } = require('sdk/deprecated/api-utils');
const { isBrowser } = require('sdk/window/utils');
const { unload } = require('../../addon/unload');
const { listen } = require('../../xul/listen');

const findsuggestionNS = require('sdk/core/namespace').ns();
const NS_XUL = 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul';

function FindSuggestionOptions(options) {
  return validateOptions(options, {
    word: { is: ['string'] },
    //onClick: { is: ['undefined', 'function'] }
  });
}

const FindSuggestion = Class({
  initialize: function(options) {
    options = findsuggestionNS(this).options = FindSuggestionOptions(options);
    let unloaders = findsuggestionNS(this).unloaders = [];

    winUtils.WindowTracker({
      onTrack: function(window) {
        if (!isBrowser(window)) return;

        let findBar = window.gFindBar;
        let findContainer = findBar.getElement('findbar-container');

        // Show these suggestions in the findbar
        let ele = window.document.createElementNS(NS_XUL, 'label');
        ele.setAttribute('value', options.word);
        ele.style.margin = '2px';
        ele.style.cursor = 'pointer';
        ele.style.fontWeight = 'bold';
        findContainer.appendChild(ele);

        ele.addEventListener('click', suggestionClick.bind({
          findBar: findBar
        }), false);

        // Clear out the suggestions when removing the add-on
        function clearSuggestion() {
          findContainer.removeChild(ele);
        }

        // save a destroyer
        unloaders.push(
          destroyer.bind(null, unload(clearSuggestion, window), clearSuggestion));
      }
    });
  },
  destroy: function() findsuggestionNS(this).unloaders.forEach(function(x) x())
});
exports.FindSuggestion = FindSuggestion;

function suggestionClick(event) {
  let suggestion = event.target.value;
  let findField = this.findBar._findField;

  if (findField.value === suggestion) {
    this.findBar.onFindAgainCommand(false);
  }
  else {
    findField.value = suggestion;
    findBar._find();
  }
}
function destroyer(remover, clearSuggestion) {
  clearSuggestion();
  remover();
}
