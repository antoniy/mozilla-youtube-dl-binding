var data = require("sdk/self").data;
var tabs = require("sdk/tabs");
var simplePrefs = require("sdk/simple-prefs");
var ui = require("sdk/ui");
var { env } = require('sdk/system/environment');
const {Cc,Ci} = require("chrome");
var { Hotkey } = require("sdk/hotkeys");
var cm = require("sdk/context-menu");
var querystring = require("sdk/querystring");
var ytdlYoutube = "22"; //EDIT THIS
var ytdlTwitch = "720p"; // --//--

function playVideo(url, argMpv) {
    var file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
    file.initWithPath(simplePrefs.prefs.player);

    // create an nsIProcess
    var process = Cc["@mozilla.org/process/util;1"].createInstance(Ci.nsIProcess);
    process.init(file);

    if (url.indexOf("twitch.tv")> -1) { // URL is Twitch link
    
        if (argMpv === "sound") { // play audio only
            var args = "--ytdl-format=audio_only".split(" "); // Twitch settings for play audio only
        }
        else { 
            var args = "--ytdl-format=" + ytdlTwitch; //set quality for twitch
			args = args.split(" ");
        }
        
    } else if (argMpv === "sound") { // play audio only
        var args = simplePrefs.prefs.secondParams.split(" ");
        
    } else {
        
        if (url.indexOf("youtube.com") > -1) { //set quality set. and additional parameters for youtube
            var params = "--ytdl-format=" +  ytdlYoutube + " " + simplePrefs.prefs.params;
        }
        else {
            var params = simplePrefs.prefs.params;
        };
        
        if (params) {
            var args = params.split(" ");
        }
        else {
            var args = [];
        };
      };

  if (simplePrefs.prefs.ytStartPlAtIndex) {
     
    // Checks if running on Youtube
    if (url.indexOf("youtube.com") > -1) { // URL is Youtube link
       
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

setQualityIcons = function(qualityMenu, ytdlFormat) {
    var items = qualityMenu.items;

    for (var i = 0, len = items.length ; i < len ; i++) {

        if (items[i].data === ytdlFormat)
            items[i].image = data.url("icon_button.png");

        else
            items[i].image = data.url("");
    }
};

var qualityYoutube = cm.Menu({
    label: 'Set Youtube quality',
    image: data.url("icon_button.png"),
    context: cm.SelectorContext("[href]"),
    contentScript:  'self.on("click", function(node,data){self.postMessage(data);})',
    items: [
        cm.Item({ label: '360p', data: '18' }),
        cm.Item({ label: '720p', data: '22' })
    ],
    onMessage: function (data) {
        ytdlYoutube = data;
        setQualityIcons (qualityYoutube, ytdlYoutube); //set icon
    }
});

var qualityYoutubeStream = cm.Menu({
    label: 'Set Youtube stream quality',
    image: data.url("icon_button.png"),
    context: cm.SelectorContext("[href]"),
    contentScript:  'self.on("click", function(node,data){self.postMessage(data);})',
    items: [
        cm.Item({ label: '144p', data: '91' }),    
        cm.Item({ label: '240p', data: '92' }),
        cm.Item({ label: '360p', data: '93' }),
        cm.Item({ label: '480p', data: '94' }),
        cm.Item({ label: '720p', data: '95' }),
        cm.Item({ label: '1080p', data: '96' })
    ],
    onMessage: function (data) {
        ytdlYoutube = data;
        setQualityIcons (qualityYoutubeStream, ytdlYoutube); //set icon
    }
});

var qualityTwitch = cm.Menu({
    label: 'Set Twitch stream quality',
    image: data.url("icon_button.png"),
    context: cm.SelectorContext("[href]"),
    contentScript:  'self.on("click", function(node,data){self.postMessage(data);})',
    items: [
        cm.Item({ label: '160p', data: '160p' }),
        cm.Item({ label: '360p', data: '360p' }),
        cm.Item({ label: '480p', data: '480p' }),
        cm.Item({ label: '720p', data: '720p' }),
        cm.Item({ label: '1080p', data: '1080p' })
    ],
    onMessage: function (data) {
        ytdlTwitch = data;
        setQualityIcons (qualityTwitch, ytdlTwitch); //set icon
    }
});

var menuPlayVideo = cm.Item({
    label: "Play video with MPV",
    context: cm.SelectorContext("[href]"),
    contentScript: 'self.on("click", function(node,data){self.postMessage(node.href);})',
    accessKey: "e",
    image: data.url("icon_button.png"),
    onMessage: function (url) {
      playVideo(url);
    }
});

var menuPlayAudio = cm.Item({
    label: "Play audio with MPV",
    context: cm.SelectorContext("[href]"),
    contentScript: 'self.on("click", function(node,data){self.postMessage(node.href);})',
    image: data.url("icon_button.png"),
    onMessage: function (url) {
        playVideo(url, "sound");
    }
});

var menuQuality = cm.Menu({
    label: 'Set quality',
    image: data.url("icon_button.png"),
    context: cm.SelectorContext("[href]"),
    contentScript:  'self.on("click", function(node,data){self.postMessage(data);})',
    items: [
        qualityYoutube,
        qualityYoutubeStream,
        qualityTwitch
    ]    
});

var action_button = ui.ActionButton({
    id: "my-button",
    label: "Play with MPV",
    icon: data.url("icon_button.png"),
    onClick: function(state) {
      playVideo(tabs.activeTab.url);
    }
});

var showHotKey = Hotkey({
    combo: simplePrefs.prefs.hotkey,
    onPress: function() {
      playVideo(tabs.activeTab.url);
    }
});

tabs.on("ready", function(tab) {
    var worker = tab.attach({
        contentScriptFile: data.url("modified-click.js")
    });
    worker.port.on("altClick", function(url) {
        console.log(url);
        playVideo(url);
    });

    function onPrefChanged(name) {
        worker.port.emit("prefChanged", name, simplePrefs.prefs[name]);
    };

    var watchedPrefs = [
        "altClick"
    ];

    watchedPrefs.forEach(function(value) {
        simplePrefs.on(value, onPrefChanged);
        onPrefChanged(value);
    });

    worker.on("detach", function() {
        watchedPrefs.forEach(function(value) {
            simplePrefs.removeListener(value, onPrefChanged);
        });
    });

});