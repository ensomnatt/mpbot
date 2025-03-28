import { Telegraf } from "telegraf";
import { BOT_TOKEN } from "./config/config";
import composer from "./controllers/botCommands";

const bot = new Telegraf(BOT_TOKEN);
bot.use(composer)

bot.launch()
console.log("бот запущен")
