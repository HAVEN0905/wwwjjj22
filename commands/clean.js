const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("청소")
        .setDescription("채팅을 지정한 개수만큼 삭제합니다")
        .addIntegerOption(option =>
            option
                .setName("갯수")
                .setDescription("삭제할 메시지 수")
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const amount = interaction.options.getInteger("갯수");

        await interaction.channel.bulkDelete(amount, true);

        await interaction.reply({
            content: `🧹 ${amount}개 메시지를 삭제했습니다.`,
            ephemeral: true
        });
    }
};
