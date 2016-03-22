'use strict';

const RE_REGEXP = /^\/(.*)\/(i)?$/;
const RE_ESCAPE = /[{}()\[\]\\^$.?]/g;
const RE_WILD = /\*+/g;
const RE_TLD = /^\^[^\/]*(?:\/\/)?[^\/]*\\\.tld(?:\/.*)?\$$/;

exports.convert2RegExp = function Scriptish_convert2RegExp(aPattern, aNoTLD, forceString) {
  var s = aPattern.toString().trim(), m;

  // Already a regexp?
  if (!forceString && (m = s.match(RE_REGEXP))) {
    return new RegExp(m[1], m[2]);
  }

  var res = "^" + s
    .replace(RE_ESCAPE, "\\$&")
    .replace(RE_WILD, ".*")
    + "$";
  var regExp = new RegExp(res, "i");
  regExp.isTLD = !aNoTLD && RE_TLD.test(res);
  return regExp;
}
