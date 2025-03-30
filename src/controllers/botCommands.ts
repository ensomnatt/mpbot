import { Composer } from "telegraf";
import MessageController from "./messageController";
import ScheduleController from "./scheduleController";

const messageController = new MessageController();
const scheduleController = new ScheduleController();
const composer = new Composer();

composer.command("start", (ctx) => messageController.start(ctx));
composer.command("list", (ctx) => messageController.list(ctx));
composer.command("clear", (ctx) => messageController.clear(ctx));
composer.on("message", (ctx) => scheduleController.addMessageToQueue(ctx));
composer.action(/^page_\d+$/, (ctx) => messageController.paginate(ctx));
composer.action(/^message_\d+$/, (ctx) => messageController.showMessage(ctx));

export default composer;
