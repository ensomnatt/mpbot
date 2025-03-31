import { Composer } from "telegraf";
import MessageController from "./messageController";
import ScheduleController from "./scheduleController";
import { BotContext } from "../context/context";

const messageController = new MessageController();
const scheduleController = new ScheduleController();
const composer = new Composer<BotContext>();

composer.command("start", (ctx) => messageController.start(ctx));
composer.command("list", (ctx) => messageController.list(ctx));
composer.command("clear", (ctx) => messageController.clear(ctx));
composer.command("help", (ctx) => messageController.help(ctx));
composer.on("message", (ctx) => {
  if (ctx.session?.awaitingTime) {
    messageController.changeTime(ctx);
  } else {
    scheduleController.addMessageToQueue(ctx);
  }
});
composer.action(/^page_\d+$/, (ctx) => messageController.paginate(ctx));
composer.action(/^message_\d+$/, (ctx) => messageController.showMessage(ctx));
composer.action(/^delete_\d+$/, (ctx) => messageController.delete(ctx));
composer.action(/^change_\d+$/, (ctx) => messageController.changeTimeButton(ctx));
composer.action("cancelChangeTime", (ctx) => messageController.cancelChangeTime(ctx));

export default composer;
