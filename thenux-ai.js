   /* _______ _   _ _  _  ____ _   _ ___  
    |__  __| | | | \| |/ __| | | | _ \ 
        | |  | |_| | .` | (__| |_| |  _/ 
        |_|   \___/|_|\_|\___|\___/|_|   


@darkhackersl
@thenux-ai
@hukagannaepa meva sell kerl.

- hama http free.
- naginnathi evunta vada na me cmd eka.
- 


--
-

-
---------------------------
-

--
-

--
-
-
--
-
-
-
-
--



-[-

-
-
p


iop
[
9[

;u
l
f/
ri.]w7hqj[]ajb1
nj
b  hyvynb vy   g5u-`7v 1
95v y
y v  v9y 
  v=6-bf6byc   

















        
*/


































const { cmd } = require('../command');
const axios = require('axios');

let ytResultMap = {};
let ytConnRef = null;

// Helper: format number with commas
function numFmt(n) {
    if (!n) return "-";
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Helper: build styled caption
function styledCaption(vid) {
    return `
╭━━❐━⪼
┇🎬 *Title*     : ${vid.title}
┇⏱️ *Duration*  : ${vid.timestamp}
┇👁️ *Views*     : ${numFmt(vid.views)}
┇👤 *Author*    : ${vid.author?.name || "-"}
┇🖼️ *Thumbnail* : [Click Here](${vid.url})
┇🔗 *Link*      : ${vid.url}
╰━━❑━⪼

${vid.description ? `📝 *Description*: ${vid.description}` : ''}
${vid.ago ? `\n📅 *Published*: ${vid.ago}` : ''}
`.trim();
}

// Helper: build styled search result row (with image URL)
function rowResult(vid, i) {
    return `*${i+1}.* ${vid.title}
${vid.url}
🖼️ ${vid.thumbnail || vid.image}
👤 *${vid.author?.name || "-"}* | ⏱️ *${vid.timestamp}* | 👁️ *${numFmt(vid.views)}*
${vid.ago ? `📅 *${vid.ago}*` : ""}\n`;
}

cmd({
    pattern: "yt",
    alias: [
        "youtube", "ytsearch", "ytfind", "ytvid", "ytmusic", "ytclip", "ytv", "ytresult"
    ],
    desc: "Search YouTube, show number list for selection, then present styled download buttons",
    react: "🔎",
    category: "downloader",
    filename: __filename
},
async (conn, mek, m, { from, args, reply }) => {
    try {
        ytConnRef = conn;
        const query = args.join(' ');
        if (!query) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply('Please provide a search term!\nExample: .yt faded');
        }
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // 1. Search YouTube (main API)
        const apiUrl = `https://www.dark-yasiya-api.site/search/yt?text=${encodeURIComponent(query)}`;
        const { data } = await axios.get(apiUrl);

        if (!data?.status || !data.result?.data?.length) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply('❌ No results found for your query.');
        }

        // 2. Show number list (up to 15 results)
        const topResults = data.result.data.slice(0, 15);
        let txt = `*🔎 YouTube Search Results:*\n\n`;
        ytResultMap[from] = {}; // save in map by chat id

        topResults.forEach((vid, i) => {
            ytResultMap[from][(i+1).toString()] = {
                ...vid,
                image: vid.thumbnail || vid.image // Always store image for later use
            };
            txt += rowResult(vid, i);
        });
        txt += `\n_Reply with the number (e.g. 1) to select a result._\n\n`;
        txt += `*Tip:*\n• Try more searches: \n\`yt music <song>\` | \`yt video <topic>\` | \`yt clip <topic>\` | \`yt [any keywords]\``;

        // Send the first result's image as preview with the text
        await conn.sendMessage(from, {
            caption: txt,
            headerType: 1,
            buttons: topResults.map((vid, i) => ({
                buttonId: `${i+1}`,
                buttonText: { displayText: `${i+1}. ${vid.title}` },
                type: 1
            })),
            viewOnce: true,
            footer: "📺 YouTube Search Results",
            // Use the first result's image as preview
            // If no thumbnail, use the first result's image
            // This ensures we always have an image to show
            headerType: 4,
            image: { url: topResults[0].thumbnail || topResults[0].image },
            footer: "🚀 Powered by DarkHackersL | YT Search",
            

        }, { quoted: mek });

        // React
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        

    } catch (e) {
        console.log(e);
        await ytConnRef.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply('*ERROR ❗❗*');
    }
});

// Number reply handler for yt
if (!global.__ytNumberReplyHandler) {
    global.__ytNumberReplyHandler = true;
    const { setTimeout } = require('timers');
    function waitForYtConn() {
        if (!ytConnRef) return setTimeout(waitForYtConn, 500);
        ytConnRef.ev.on('messages.upsert', async (msgUpdate) => {
            const msg = msgUpdate.messages?.[0];
            if (!msg?.key || !msg.message?.extendedTextMessage) return;
            const from = msg.key.remoteJid;
            if (!ytResultMap[from]) return;

            const userReply = (msg.message.extendedTextMessage.text || "").trim();
            if (!userReply.match(/^\d+$/) || !ytResultMap[from][userReply]) return;

            const vid = ytResultMap[from][userReply];
            // Clean up after selection
            delete ytResultMap[from];

            // Build caption (styled)
            const caption = styledCaption(vid);

            // Build download API url for audio/video
            const downloadApi = `https://api.giftedtech.web.id/api/download/ytdl?apikey=gifted&url=${encodeURIComponent(vid.url)}`;

            // Save info for button handler
            if (!global.__ytSelectedMap) global.__ytSelectedMap = {};
            global.__ytSelectedMap[vid.videoId] = { ...vid, downloadApi };

            // Send select result with buttons (styled)
            await ytConnRef.sendMessage(from, {
                image: { url: vid.image }, // always present now
                caption: caption,
                footer: "🚀 Powered by DarkHackersL | YT Search",
                buttons: [
                    {
                        buttonId: `.ytaudio ${vid.videoId}`,
                        buttonText: { displayText: "🎵 Download Audio" },
                        type: 1
                    },
                    {
                        buttonId: `.ytvideo ${vid.videoId}`,
                        buttonText: { displayText: "🎬 Download Video" },
                        type: 1
                    },
                    {
                        buttonId: `.yturl ${vid.url}`,
                        buttonText: { displayText: "🔗 Open on YouTube" },
                        type: 1
                    }
                ],
                headerType: 1,
                viewOnce: true
            }, { quoted: msg });

            await ytConnRef.sendMessage(from, { react: { text: "✅", key: msg.key } });
        });
    }
    waitForYtConn();
}

// Button handler for yt (audio/video download)
if (!global.__ytButtonReplyHandler) {
    global.__ytButtonReplyHandler = true;
    const { setTimeout } = require('timers');
    function waitForYTBtnConn() {
        if (!ytConnRef) return setTimeout(waitForYTBtnConn, 500);
        ytConnRef.ev.on('messages.upsert', async (msgUpdate) => {
            const msg = msgUpdate.messages?.[0];
            if (!msg?.key) return;
            // Button response
            if (msg.message && msg.message.buttonsResponseMessage) {
                const selected = msg.message.buttonsResponseMessage.selectedButtonId?.trim();
                if (!selected) return;

                // .ytaudio VIDEOID
                if (selected.startsWith(".ytaudio")) {
                    const videoId = selected.split(' ')[1];
                    const info = global.__ytSelectedMap?.[videoId];
                    if (!info) return ytConnRef.sendMessage(msg.key.remoteJid, { text: "❌ No info found.", quoted: msg });

                    try {
                        await ytConnRef.sendMessage(msg.key.remoteJid, { react: { text: "⬇️", key: msg.key } });
                        const { data } = await axios.get(info.downloadApi);
                        if (!data?.success || !data.result?.audio_url) {
                            return ytConnRef.sendMessage(msg.key.remoteJid, { text: "❌ Download failed.", quoted: msg });
                        }
                        await ytConnRef.sendMessage(msg.key.remoteJid, {
                            audio: { url: data.result.audio_url },
                            mimetype: 'audio/mp4',
                            fileName: (info.title || "audio") + ".mp3"
                        }, { quoted: msg });
                    } catch (err) {
                        await ytConnRef.sendMessage(msg.key.remoteJid, { text: "❌ Download error.", quoted: msg });
                    }
                }

                // .ytvideo VIDEOID
                if (selected.startsWith(".ytvideo")) {
                    const videoId = selected.split(' ')[1];
                    const info = global.__ytSelectedMap?.[videoId];
                    if (!info) return ytConnRef.sendMessage(msg.key.remoteJid, { text: "❌ No info found.", quoted: msg });

                    try {
                        await ytConnRef.sendMessage(msg.key.remoteJid, { react: { text: "⬇️", key: msg.key } });
                        const { data } = await axios.get(info.downloadApi);
                        if (!data?.success || !data.result?.video_url) {
                            return ytConnRef.sendMessage(msg.key.remoteJid, { text: "❌ Download failed.", quoted: msg });
                        }
                        await ytConnRef.sendMessage(msg.key.remoteJid, {
                            video: { url: data.result.video_url },
                            mimetype: 'video/mp4',
                            fileName: (info.title || "video") + ".mp4"
                        }, { quoted: msg });
                    } catch (err) {
                        await ytConnRef.sendMessage(msg.key.remoteJid, { text: "❌ Download error.", quoted: msg });
                    }
                }

                // .yturl URL
                if (selected.startsWith(".yturl")) {
                    const url = selected.split(' ').slice(1).join(' ');
                    await ytConnRef.sendMessage(msg.key.remoteJid, { react: { text: "🔗", key: msg.key } });
                    await ytConnRef.sendMessage(msg.key.remoteJid, { text: `🔗 *YouTube URL:*\n${url}` }, { quoted: msg });
                }
            }
        });
    }
    waitForYTBtnConn();
}
