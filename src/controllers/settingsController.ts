import { Context } from "telegraf";
import { ChannelModel } from "../models/channelModel";
import logger from "../logs/logs";
import View from "../view/view";
import botMessages from "../config/botMessages";

class SettingsController {
  private ChannelModel: ChannelModel;

  constructor() {
    this.ChannelModel = new ChannelModel();
  }

  async rememberChat(ctx: Context) {
    const chatID = ctx.chat?.id || 0;
    await this.ChannelModel.channel(chatID);
    
    logger.info(`бот был добавлен в канал ${chatID}`);

    await View.sendMessage(ctx, botMessages.channel);
  }

  async scheduleStart(ctx: Context) {
    let text: string = "";
    if (ctx.message && "text" in ctx.message) text = ctx.message.text;

    const scheduleStart = 
  }
}

export default SettingsController;
