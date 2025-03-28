import { Composer } from "telegraf";
import MessageController from "./messageController";
import ScheduleController from "./scheduleController";

const messageController = new MessageController();
const scheduleController = new ScheduleController();
const composer = new Composer();

composer.command("start", (ctx) => messageController.start(ctx));
composer.on("message", (ctx) => scheduleController.addMessageToQueue(ctx));

export default composer;
