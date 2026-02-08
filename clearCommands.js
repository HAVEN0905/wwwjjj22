require("dotenv").config();
const { REST, Routes } = require("discord.js");

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log("🗑 명령어 전체 삭제중...");

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: [] }
        );

        console.log("✅ 모든 슬래시 명령어 삭제 완료!");
    } catch (error) {
        console.error(error);
    }
})();
