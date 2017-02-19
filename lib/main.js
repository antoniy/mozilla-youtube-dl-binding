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
	
	if(simple_prefs.prefs.downloadThenPlay)
		return download_then_play(url);
	
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

function download_then_play(url){
	
	var file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
	file.initWithPath(simple_prefs.prefs.ytdlBinary);

	var process = Cc["@mozilla.org/process/util;1"].createInstance(Ci.nsIProcess);
	process.init(file);

	var params = simple_prefs.prefs.ytdlParams;

	if (params)
	    var args = params.split(" ");
    else
        var args = [];
	
	// specify file name
	if(args.indexOf('--output') == -1){
		args.push('--output');	
		args.push(simple_prefs.prefs.downloadDirectory + '%(id)s.%(height)s.%(ext)s');
	}
	
	// hook mpv into ytdl's postprocess trigger 
	if(args.indexOf('--exec') == -1){
		
		args.push('--exec');
		// the file itself is added automatically by youtube-dl
		//  see: https://github.com/rg3/youtube-dl/blob/1b6712ab2378b2e8eb59f372fb51193f8d3bdc97/youtube_dl/postprocessor/execafterdownload.py#L17		
		
		// Bug in youtube-dl: uses single quotes
		// see https://github.com/rg3/youtube-dl/issues/5889
		// so we'll try to use powershell for that
		var xulRuntime = Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULRuntime);
		
		if(xulRuntime.OS.indexOf('WINNT') != -1){
			args.push('powershell -Command "Start-Process \'' + simple_prefs.prefs.player + '\' {}"');
		} else {		
			args.push(simple_prefs.prefs.player);
		}
	}

	args.push(url);

	// Set badge text / notification counter
	action_button.badge = action_button.badge ? +action_button.badge +1 : 1;
	action_button.label = 'Running downloads: ' + action_button.badge + '\n\nPlay tab with MPV';
	
	process.runAsync(args, args.length, {
		
		observe: function(subject, topic, data){
			
			// insures that
			// - no negative number of downloads is displayed
			// - the number is also removed when the last running download finishes
			action_button.badge = action_button.badge > 1 ? +action_button.badge -1 : '';
			if(action_button.badge){
				action_button.label = 'Running downloads: ' + action_button.badge + '\n\nPlay tab with MPV';
			}
			else {
				action_button.label = 'Play tab with MPV';
			}
		}
		
	});
}

var menuItem = contextMenu.Item({
  label: "Watch with MPV",
  context: contextMenu.SelectorContext("[href]"),
  contentScript: 'self.on("click", function(node,data){self.postMessage(node.href);})',
  accessKey: "e",
  image: data.url("icon_button.png"),
  onMessage: function (url) {
    play_video(url);
  }
});

var action_button = ui.ActionButton({
  id: "my-button",
  label: "Play tab with MPV",
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
