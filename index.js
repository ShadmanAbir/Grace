const Discord = require('discord.js');
const ytdl = require("ytdl-core");
const request = require("request");
const fs = require("fs");
const getYoutubeId = require("get-youtube-id");
const fetchVideoInfo = require("youtube-info");
const bot = new Discord.Client();

var queue = [];
var isPlaying = false;
var dispatcher = null;
var voiceChannel = null;
var skipReq = 0;
var skippers = [];

bot.on('message', (message) => {
    const member = message.member;
    const msg = message.content.toLowerCase();
    const args = message.content.split(' ').slice(1).join(" ");
    if (msg.startsWith("play")) {
        if (member.voiceChannel || bot.guilds.get("581169943224123392").voiceConnection != null) {
            if (queue.length > 0 || isPlaying) {
                getID(args, function (id) {
                    add_to_queue(id);
                    fetchVideoInfo(id, function (err, videInfo) {
                        if (err) throw new Error(err);
                        message.reply("**" + videInfo.title + "** is added to queue");
                        console.log(queue)
                        message.reply(queue)
                    });
                });
            } else {
                isPlaying = true;
                getID(args, function (id) {
                    queue.push("");
                    playMusic(id, message);

                    fetchVideoInfo(id, function (err, videInfo) {
                        if (err) throw new Error(err);
                        message.reply("now playing **" + videInfo.title + "**");
                    });
                });
            }
        } else {
            message.reply("You need to be in a voice channel");
        }
    } else if (msg.startsWith("skip")) {
        skip_song(message);
        message.reply("song skipped");
    }
});

function playMusic(id, message) {
    voiceChannel = message.member.voiceChannel;
    voiceChannel.join().then(function (connection) {
        stream = ytdl("https://www.youtube.com/watch?v=" + id, {
            filter: 'audioonly'
        });
        skipReq = 0;
        skippers = [];

        dispatcher = connection.playStream(stream);
        dispatcher.on('end', function () {
            skipReq = 0;
            skippers = [];
            queue.shift();
            if (queue.length === 0) {
                queue = [];
                isPlaying = false;
            } else {
                playMusic(queue[0], message);
            }
        })
    });
}

function skip_song(message) {
    dispatcher.end();
    console.log(queue);
    if (queue > 0) {
        playMusic(queue[0], message);
        console.log(queue);
        console.log(queue[0]);
    } else {
        skipReq = 0;
        skippers = [];
    }
}

function getID(str, cb) {
    if (isYoutube(str)) {
        cb(getYoutubeId(str));
    } else {
        search_video(str, function (id) {
            cb(id);
        });
    }
}

function add_to_queue(strID) {
    if (isYoutube(strID)) {
        queue.push(getYoutubeId(strID));
    } else {
        queue.push(strID);
    }
}

function search_video(query, callback) {
    request("https://www.googleapis.com/youtube/v3/search?part=id&type=video&q=" + encodeURIComponent(query) + "&key=AIzaSyCAe0FWgWbxtTjTEB_J9hpg2Tstsdn44DY", function (error, response, body) {
        var json = JSON.parse(body);
        callback(json.items[0].id.videoId);
    });
}

function isYoutube(str) {
    return str.toLowerCase().indexOf("youtube.com") > -1;
}
bot.login(process.env.token);
