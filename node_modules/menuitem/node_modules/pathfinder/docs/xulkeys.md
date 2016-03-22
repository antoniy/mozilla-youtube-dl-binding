<!-- contributed by Erik Vold [erikvvold@gmail.com]  -->

Some add-ons may wish to define keyboard shortcuts for certain operations. This
module exposes an API to create
[xul based hotkeys](https://developer.mozilla.org/en/XUL/key).

## Example ##

    var keyID = "ADDON:EXAMPLE-HOTKEY@ERIKVOLD.COM:CMD-ALT-R";
    const { XulKey } = require("xulkeys");

    XulKey({
      id: keyID,
      modifiers: "accel,alt",
      key: "R",
      onCommand: function() {
        console.log("pressed");
      }
    });

<api name="XulKey">
@class

This module exports a `XulKey` constructor which allows one to create xul based
hotkeys.

<api name="XulKey">
@constructor
Creates a hotkey whose `onCommand` listener method is invoked when the key
comboination provided is pressed.

@param options {Object}
  Options that define the hotkey, with the following properties:

@prop [id] {string}
  A namespaced unique id for the key element.
@prop key {string}
  The key to listen for.
@prop [modifiers] {string}
  A list of modifier keys that should be pressed to invoke the hotkey.
  Multiple keys may be separated by spaces or commas.

      "accel"
      "meta,shift"
      "control alt"

  See the [MDN documentation on the modifiers
  attribute](https://developer.mozilla.org/en/XUL/Attribute/modifiers) for a
  full list of acceptable values.

@prop onCommand {function}
  A function that is invoked when the hotkey is pressed.
</api>

</api>
