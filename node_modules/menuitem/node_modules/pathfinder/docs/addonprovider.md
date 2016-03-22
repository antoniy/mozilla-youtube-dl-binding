<!-- contributed by Erik Vold [erikvvold@gmail.com]  -->


The `addonprovider` API provides a simple way to create
new Add-on types for the [Extension Manager](about:addons).

## Example ##

    exports.main = function(options) {
      
    };

<api name="AddonProvider">
@class

Module exports `AddonProvider` constructor allowing users to create a
add-on category provider to the Extension Manager.

<api name="AddonProvider">
@constructor
Creates a add-on provider.

@param options {Object}
Options for the add-on provider, with the following parameters:

@prop type {String}
A unique string that will identify the type of add-ons that your provider
will provide.  This is internal users never see it.

@prop localeKey {String}
A label to be used in the Extension Manager, which users see.

@prop uiPriority {Number}
A number to represent the order to display your Add-on type in the Extension
Manager side navigation.

@prop getAddonByID {Function}
A function that returns the appropriate `Addon`.

@prop getAddons {Function}
A function that returns the appropriate `Addon`s.

</api>

<api name="destroy">
@method
Removes the add-on provider.
</api>

</api>
