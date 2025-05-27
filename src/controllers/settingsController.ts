import { Context } from "telegraf";
import { ChannelModel } from "../models/channelModel";
import logger from "../logs/logs";
import View from "../view/view";
import botMessages from "../config/botMessages";
import ParseUtils from "../utils/parseUtils";
import DateUtils from "../utils/dateUtils";

class SettingsController {
  private ChannelModel: ChannelModel;

  constructor() {
    this.ChannelModel = new ChannelModel();
  }

  // метод запоминания чата
  async rememberChat(ctx: Context) {
    const chatID = ctx.chat?.id || 0;
    this.ChannelModel.channel(chatID);
    
    logger.info(`бот был добавлен в канал ${chatID}`);

    await View.sendMessage(ctx, botMessages.channel);
  }

  // метод изменения расписания
  async scheduleStart(ctx: Context) {
    let text: string = "";
    if (ctx.message && "text" in ctx.message) text = ctx.message.text;

    const time = text.split(" ")[3];
    const startOrEnd = text.split(" ")[1];
    if (!ParseUtils.checkTime(time)) {
      await View.sendMessage(ctx, botMessages.timeFormatError2);
      return;
    }

    switch (startOrEnd) {
    case "начало":
      this.ChannelModel.scheduleStart(time);
      logger.info(`пользователь ${ctx.from?.username} изменил начало расписания на ${time}`);
      break;
    case "конец":
      this.ChannelModel.scheduleEnd(time);
      logger.info(`пользователь ${ctx.from?.username} изменил конец расписания на ${time}`);
      break;
    }

    await View.sendMessage(ctx, botMessages.settings);
  }


  // метод изменения интервала
  async interval(ctx: Context) {
    let text: string = "";
    if (ctx.message && "text" in ctx.message) text = ctx.message.text;

    const interval = text.split(" ")[2];
    if (!ParseUtils.checkInterval(interval)) {
      await View.sendMessage(ctx, botMessages.intervalError);
      return;
    }

    logger.info(`пользователь ${ctx.from?.username} изменил интервал на ${interval}`);

    this.ChannelModel.interval(interval);
    await View.sendMessage(ctx, botMessages.settings);
  }

  async timeZone(ctx: Context) {
    let text: string = "";
    if (ctx.message && "text" in ctx.message) text = ctx.message.text;

    const timeZone = text.split(" ")[3];
    if (!ParseUtils.checkTimeZone(timeZone) && !DateUtils.isValidTimeZone(timeZone)) {
      await View.sendMessage(ctx, botMessages.timeZoneError);
      return;
    }

    logger.info(`пользователь ${ctx.from?.username} изменил часовой пояс на ${timeZone}`);

    this.ChannelModel.timeZone(timeZone);
    await View.sendMessage(ctx, botMessages.settings);
  }
}

export default SettingsController;
