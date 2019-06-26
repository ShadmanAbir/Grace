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
                    fetchVideoInfo(id, function (err, videInfo) {
                        if (err) throw new Error(err);
                        message.reply("**" + videInfo.title + "** is added to queue");
                        add_to_queue(videInfo.title,id);
                    });
                });
            } else {
                isPlaying = true;
                getID(args, function (id) {
                    playMusic(id, message);
                    fetchVideoInfo(id, function (err, videInfo) {
                        if (err) throw new Error(err);
                        message.reply("now playing **" + videInfo.title + "**");
                        queue.push({'SongName' : videInfo.title,'SongId' : id});
                    });
                });
            }
        } else if(args == null){
            message.reply("I am not in your head.Don't be lazy and splill out the name.");
        } else {
            message.reply("You need to be in a voice channel");
        }
    } else if (msg.startsWith("skip")) {
        skip_song(message);
        message.reply("song skipped");
    } else if (msg.startsWith("stop")) {
        if(!message.member.voiceChannel) return message.channel.send('You are not connectde to a channel');
        if(!message.guild.me.voiceChannel) return message.channel.send('I am not singing anything');
        if(message.guild.me.voiceChannelID != message.member.voiceChannelID) return message.channel.send('We are not in the same room');
        message.guild.me.voiceChannel.leave();
        message.channel.send("Hope you will love my song next time");
    } else if (msg.startsWith("-playlist")) {
        if(queue.length == 0) return message.channel.send("There's no song at the playlist right now.");
        if(queue.length > 0){
            for(var i = 0; i <queue.length; i++)
            {
            message.channel.send((i+1)+ ". Name:" + queue[i].SongName  );
            }
        }
    }
});

function playMusic(id, message) {
    voiceChannel = message.member.voiceChannel;
    voiceChannel.join().then(function (connection) {
        stream = ytdl("https://www.youtube.com/watch?v=" + id, {
            filter: 'audio',
            quality: 'highestaudio',
            bitrate: 320000
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
                playMusic(queue[0].SongId, message);
            }
        })
    });
}

function skip_song(message) {
    dispatcher.end();
    console.log(queue);
    if (queue > 0) {
        playMusic(queue[0].SongId, message);
        console.log(queue);
        console.log(queue[0].SongId);
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

function add_to_queue(title,strID) {
    if (isYoutube(strID)) {
        queue.push({'SongName' : title,'SongId' : getYoutubeId(strID)});
        
    } else {
        queue.push({'SongName' : title,'SongId' : strID});
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
