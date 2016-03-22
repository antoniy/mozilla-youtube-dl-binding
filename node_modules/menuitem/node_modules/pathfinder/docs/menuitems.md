<!-- contributed by Erik Vold [erikvvold@gmail.com]  -->


The `menuitems` API is a simple way to create
[Menuitems](https://developer.mozilla.org/en/XUL/PopupGuide/MenuItems), which
can perform an action when clicked, and display state.

## Example ##

    exports.main = function(options) {
      // create menuitem for the File menu,
      // and insert it before the 'Quit' menuitem
      require("menuitems").Menuitem({
        id: "myextprefix-some-mi-id",
        menuid: "menu_FilePopup",
        insertbefore: "menu_FileQuitItem",
        "label": _("label"),
        "accesskey": _("label.ak"),
        image: self.data.url("icon.png"),
        className: 'pizazz',
        disabled: false,
        checked: false,
        onCommand: function() {
          // do something
        }
      });
    };

<api name="Menuitem">
@class

Module exports `Menuitem` constructor allowing users to create a
[`menuitem`](https://developer.mozilla.org/en/XUL/menuitem).

<api name="Menuitem">
@constructor
Creates a `menuitem`.

@param options {Object}
  Options for the `menuitem`, with the following parameters:

@prop id {String}
A id for the `menuitem`, this should be namespaced.

@prop menuid {String}
The id of the parent `<menu>` node.

@prop label {String}
A label for the `menuitem`.

@prop image {String}
A image url for the `menuitem`.

@prop className {String}
A default space delimited list of class names for the menuitem.

@prop disabled {Boolean}
When a menuitem is disabled it cannot be used, but is still displayed.

@prop checked {Boolean}
Displays a check beside the menuitem.

@prop [onCommand] {Function}
 A option function that is invoked when the `menuitem` is executed.
</api>
</api>
