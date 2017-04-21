var data = require("sdk/self").data;
var tabs = require("sdk/tabs");
var simple_prefs = require("sdk/simple-prefs");
var ui = require("sdk/ui");
var { env } = require('sdk/system/environment');
const {Cc,Ci} = require("chrome");
var { Hotkey } = require("sdk/hotkeys");
var contextMenu = require("sdk/context-menu");
var querystring = require("sdk/querystring");

function play_video(url) {
	var file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
	file.initWithPath(simple_prefs.prefs.player);

	// create an nsIProcess
	var process = Cc["@mozilla.org/process/util;1"].createInstance(Ci.nsIProcess);
	process.init(file);

	var params = simple_prefs.prefs.params;

	if (params)
	    var args = params.split(" ");
    else
        var args = [];


  if (simple_prefs.prefs.ytStartPlAtIndex) {

    // Checks if running on Youtube
    if (url.indexOf("youtube.com") > -1) { // url is Youtube link

      // Parses url params to an object returning object like:
      // {"v":"g04s2u30NfQ","index":"3","list":"PL58H4uS5fMRzmMC_SfMelnCoHgB8COa5r"}
      var qs = querystring.parse(url.split("?")[1]);

      if (qs["list"] && qs["index"]) { // we have the playlist and the video index

        // args could be: ["--video-unscaled=yes","--ytdl-raw-options=format=best"]
        // so checking for ytdl-raw-options
        var ytdlRawOptionsIndex = -1;
        for (var i = 0; i < args.length; i++) {
            if (args[i].indexOf("ytdl-raw-options") > -1) {
              ytdlRawOptionsIndex = i;
              break;
            };
        };

        // Change ytdl-raw-options or add it to args if not exist
        if (ytdlRawOptionsIndex > -1) {
          args[ytdlRawOptionsIndex] += ",yes-playlist=,playlist-start=" + qs["index"];
        } else {
          args.push("--ytdl-raw-options=yes-playlist=,playlist-start=" + qs["index"]);
        };
      };
    };
  };

	args.push(url);

	// process.run(false, args, args.length);
	process.runAsync(args, args.length);
}

var menuItem = contextMenu.Item({
  label: "Watch with MPV",
  context: contextMenu.SelectorContext("[href],video"),
  contentScript: 'self.on("click", function(node,data){'+
	'if(node.href){	self.postMessage(node.href);}'+
        'else if (node.src){ self.postMessage(node.src);}'+
	'else if (node.nodeName.toUpperCase() === "video".toUpperCase()){ var sources = node.querySelector("source"); '+
          ' self.postMessage(sources.src); }'+
       '})',
  accessKey: "e",
  image: data.url("icon_button.png"),
  onMessage: function (url) {
    play_video(url);
  }
});

var action_button = ui.ActionButton({
  id: "my-button",
  label: "Play with MPV",
  icon: data.url("icon_button.png"),
  onClick: function(state) {
    play_video(tabs.activeTab.url);
  }
});

var showHotKey = Hotkey({
  combo: simple_prefs.prefs.hotkey,
  onPress: function() {
    play_video(tabs.activeTab.url);
  }
});

tabs.on("ready", function(tab) {
    var worker = tab.attach({
        contentScriptFile: data.url("modified-click.js")
    });
    worker.port.on("altClick", function(url) {
        console.log(url);
        play_video(url);
    });

    function onPrefChanged(name) {
        worker.port.emit("prefChanged", name, simple_prefs.prefs[name]);
    }

    var watchedPrefs = [
        "altClick"
    ];

    watchedPrefs.forEach(function(value) {
        simple_prefs.on(value, onPrefChanged);
        onPrefChanged(value);
    });

    worker.on("detach", function() {
        watchedPrefs.forEach(function(value) {
            simple_prefs.removeListener(value, onPrefChanged);
        });
    });

});
