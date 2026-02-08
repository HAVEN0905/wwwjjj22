require("dotenv").config();

const { 
    Client, 
    GatewayIntentBits, 
    Collection,
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require("discord.js");

const fs = require("fs");
const playCommand = require("./commands/play");

global.currentResource = null;
global.currentPlayer = null;
global.currentConnection = null;
global.leaveTimer = null;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.commands = new Collection();

for (const file of fs.readdirSync("./commands")) {
    const command = require(`./commands/${file}`);
    if (command.data)
        client.commands.set(command.data.name, command);
}

client.once("clientReady", () => {
    console.log(`🟢 봇 온라인: ${client.user.tag}`);
});

client.on("interactionCreate", async interaction => {

    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (command) return command.execute(interaction);
    }

    /* ⏹ 재생 중지 */
    if (interaction.isButton() && interaction.customId === "stop_music") {
        playCommand.reset();
        return interaction.reply({ content: "⏹ 재생 중지됨", ephemeral: true });
    }

    /* ⏸ 일시정지 */
    if (interaction.isButton() && interaction.customId === "pause_music") {
        if (global.currentPlayer) global.currentPlayer.pause();
        return interaction.reply({ content: "⏸ 일시정지", ephemeral: true });
    }

    /* ▶ 다시보기 */
    if (interaction.isButton() && interaction.customId === "resume_music") {
        if (global.currentPlayer) global.currentPlayer.unpause();
        return interaction.reply({ content: "▶ 다시 재생", ephemeral: true });
    }

    /* ⏭ 스킵 */
    if (interaction.isButton() && interaction.customId === "skip_music") {
        if (global.currentPlayer) global.currentPlayer.stop();
        return interaction.reply({ content: "⏭ 스킵됨", ephemeral: true });
    }

    /* 🔊 볼륨 */
    if (interaction.isButton() && interaction.customId === "volume_music") {

        const modal = new ModalBuilder()
            .setCustomId("volume_modal")
            .setTitle("볼륨 조절");

        const input = new TextInputBuilder()
            .setCustomId("volume_input")
            .setLabel("0~100")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(input)
        );

        return interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && interaction.customId === "volume_modal") {

        const value = Number(interaction.fields.getTextInputValue("volume_input"));

        if (isNaN(value) || value < 0 || value > 100)
            return interaction.reply({ content: "0~100만 입력", ephemeral: true });

        playCommand.setVolume(value / 100);

        if (global.currentResource)
            global.currentResource.volume.setVolume(value / 100);

        return interaction.reply({ content: `🔊 ${value}% 설정 완료`, ephemeral: true });
    }
});

client.login(process.env.TOKEN);
