const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle
} = require("discord.js");

const { 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource,
    AudioPlayerStatus
} = require("@discordjs/voice");

const ytdlp = require("yt-dlp-exec");

let queue = [];
let volume = 0.5;
let player = null;
let connection = null;
let playing = false;
let leaveTimer = null;

async function playNext() {

    if (leaveTimer) {
        clearTimeout(leaveTimer);
        leaveTimer = null;
    }

    if (queue.length === 0) {
        playing = false;

        const channel = global.lastTextChannel;
        if (channel) {
            channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setDescription("⏳ 봇이 2분 뒤 음성채널을 나갑니다.\n2분 안에 노래를 추가해주세요!")
                ]
            });
        }

        leaveTimer = setTimeout(() => {
            if (connection && connection.state.status !== "destroyed") {
                try { connection.destroy(); } catch {}
            }
            connection = null;
            player = null;
        }, 120000);

        return;
    }

    playing = true;

    const { query, channel, interaction, requester } = queue.shift();
    global.lastTextChannel = interaction.channel;

    const info = await ytdlp(query, {
        dumpSingleJson: true,
        noPlaylist: true,
        quiet: true
    });

    const streamURL = await ytdlp(info.webpage_url, {
        format: "bestaudio",
        getUrl: true,
        quiet: true
    });

    if (!connection || connection.state.status === "destroyed") {
        connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
            selfDeaf: true
        });

        global.currentConnection = connection;
    }

    if (!player) {
        player = createAudioPlayer();
        connection.subscribe(player);
        player.on(AudioPlayerStatus.Idle, playNext);
    }

    const resource = createAudioResource(streamURL.trim(), { inlineVolume: true });
    resource.volume.setVolume(volume);

    global.currentPlayer = player;
    global.currentResource = resource;

    player.play(resource);

    const embed = new EmbedBuilder()
        .setTitle(info.title)
        .setURL(info.webpage_url)
        .setAuthor({ name: info.uploader || "Unknown Artist" })
        .setImage(info.thumbnail || null)
        .addFields(
            { name: "⏱ 시간", value: formatTime(info.duration || 0), inline: true },
            { name: "요청자", value: requester, inline: true },
            { name: "🎧 음성채널", value: `<#${channel.id}>`, inline: true }
        )
        .setFooter({ text: "Music Bot" });

    const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("stop_music").setLabel("재생 중지").setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId("resume_music").setLabel("다시보기").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("pause_music").setLabel("일시정지").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("skip_music").setLabel("스킵").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("volume_music").setLabel("볼륨").setStyle(ButtonStyle.Secondary)
    );

    await interaction.editReply({
        embeds: [embed],
        components: [buttons]
    });
}

function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2,"0")}`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("재생")
        .setDescription("노래 재생")
        .addStringOption(opt =>
            opt.setName("검색")
               .setDescription("링크 또는 제목")
               .setRequired(true)
        ),

    async execute(interaction) {
        const query = interaction.options.getString("검색");
        const channel = interaction.member.voice.channel;

        if (!channel)
            return interaction.reply({ content: "음성채널 들어가세요", ephemeral: true });

        await interaction.deferReply();

        queue.push({
            query,
            channel,
            interaction,
            requester: interaction.user.toString()
        });

        if (!playing) playNext();
        else await interaction.editReply("➕ 대기열 추가됨!");
    },

    setVolume(v) {
        volume = v;
    },

    reset() {
        queue.length = 0;
        playing = false;

        if (player) {
            try { player.stop(); } catch {}
        }

        if (connection && connection.state.status !== "destroyed") {
            try { connection.destroy(); } catch {}
        }

        player = null;
        connection = null;
    }
};
