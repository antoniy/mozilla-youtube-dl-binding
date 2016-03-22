<!-- contributed by Erik Vold [erikvvold@gmail.com]  -->

The `panic` API provides a simple way to create a panic, which
can be used to anything that is desired in a panic situation, like entering
private browsing mode, closing/replacing/hiding tabs, or anything else you
can imagine.

## Example ##

    // create a panic that lasts 5 mins
    require('panic').panic(5*60*1000);

<api name="inPanic">
@property {boolean}
  This read-only boolean is true if there is a panic going on.
</api>

<api name="panic">
@function
  Starts a panic.
@param milliseconds {Number}
  Optional number of milliseconds that the panic should last for, this would
  be useful if you want ensure that certain things are but on hold until the
  panic subsides.
</api>

<api name="start">
@event
Emitted immediately after a panic begins

    var panic = require('panic');
    panic.on("start", function() {
      // Do something when a panic starts
    });
</api>

<api name="end">
@event
Emitted immediately after the panic ends

    var panic = require('panic');
    panic.on("start", function() {
      // Do something when a panic ends
    });
</api>
