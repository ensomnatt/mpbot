import { session, Telegraf } from "telegraf";
import { BOT_TOKEN } from "./config/config";
import composer from "./controllers/botCommands";
import { BotContext } from "./context/context";

const bot = new Telegraf<BotContext>(BOT_TOKEN);
bot.use(session());
//установка значений сессии по умолчанию
bot.use(async (ctx, next) => {
  if (!ctx.session) {
    ctx.session = {
      awaitingTime: false,
      changeTimeMsgID: 0
    }
  }

  return next();
})
bot.use(composer);

bot.launch();
console.log("бот запущен");
