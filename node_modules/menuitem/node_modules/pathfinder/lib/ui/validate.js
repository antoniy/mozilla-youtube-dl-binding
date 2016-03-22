'use strict';

const { validateOptions } = require('sdk/deprecated/api-utils');
const { Panel } = require('sdk/panel');

 const RULES = {
  image: { is: ["null", "undefined", "string"] },
  tooltiptext: {
  	is: ["null", "undefined", "string"],
  	defaultValue: ''
  },
  id: {
    is: ["string"],
    ok: function (v) v.length > 0,
    msg: 'BAD ID',
    readonly: true
  },
  label: {
    is: ["string"],
    ok: function (v) v.length > 0,
    msg: 'BAD Label'
  },
  panel: {
    is: ["null", "undefined", "object"],
    ok: function(v) !v || v instanceof Panel
  },
  onCommand: {
    is: ["null", "undefined", "function"],
  }
};
exports.validate = function(o) validateOptions(o, RULES);
