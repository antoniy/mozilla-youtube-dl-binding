'use strict';

let $ = function(id) document.getElementById(id);

function doAndClose(func) {
  func();
  window.close();
}

$('cancel-btn').addEventListener('click', doAndClose(function() self.port.emit("cancel")), false);
$('ok-btn').addEventListener('click', doAndClose(function() self.port.emit("accept")), false);

self.port.on('load', function(data) {
  $('errorTitle').innerHTML = data.errorTitle || '';
  $('errorShortDesc').innerHTML = data.errorShortDesc || '';
  $('errorLongDesc').innerHTML = data.errorLongDesc || '';
  $('cancel-btn').setAttribute('value', data.cancelButtonLabel || 'Decline');
  $('ok-btn').setAttribute('value', data.okButtonLabel || 'Accept');
});
