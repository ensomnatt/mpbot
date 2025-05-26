import { Context } from "telegraf";
import View from "../view/view";
import { UserModel } from "../models/userModel";
import { CallbackQuery } from "telegraf/typings/core/types/typegram";
import { BotContext } from "../context/context";
import DateUtils from "../utils/utils";
import logger from "../logs/logs";
import botMessages from "../config/botMessages";

class MessageController {  
  private userModel = new UserModel();
  // /start
  async start(ctx: Context) {
    logger.info(`пользователь @${ctx.from?.username} запустил бота`);
    await View.startMessage(ctx);
  }

  // /list
  async list(ctx: Context) {
    logger.info(`пользователь @${ctx.from?.username} отправил команду /list`);
    const messages = await this.userModel.getAllMessages();
    await View.sendList(ctx, messages);
  }

  // /clear
  async clear(ctx: Context) {
    logger.info(`пользователь @${ctx.from?.username} отправил команду /clear`);
    await this.userModel.deleteAllMessages();
    await View.sendMessage(ctx, botMessages.clear);
  }

  // /help
  async help(ctx: Context) {
    await View.sendMessage(ctx, botMessages.help);
  }

  // кнопка удалить
  async delete(ctx: Context) {
    logger.info(`пользователь @${ctx.from?.username} нажал на кнопку удалить`);
    const callbackQuery = ctx.callbackQuery as CallbackQuery.DataQuery;
    const msgID = parseInt(callbackQuery.data.split("_")[1], 10);

    this.userModel.deleteMessage(msgID);
    await ctx.answerCbQuery();
    await View.sendDeleteMessage(ctx, msgID);
  }

  //кнопка изменить время
  async changeTimeButton(ctx: BotContext) {
    logger.info(`пользователь @${ctx.from?.username} нажал на кнопку изменить время`);

    if (!ctx.session) {
      logger.warn("сессия не объявлена");
    }

    const callbackQuery = ctx.callbackQuery as CallbackQuery.DataQuery;
    const msgID = parseInt(callbackQuery.data.split("_")[1], 10);
    
    await View.timeMessage(ctx);
    ctx.session.changeTimeMsgID = msgID;
    ctx.session.awaitingTime = true;
  }

  //кнопка отмены изменения времени сообщения
  async cancelChangeTime(ctx: BotContext) {
    const callbackQuery = ctx.callbackQuery as CallbackQuery.DataQuery;
    const changeTimeMessageID = callbackQuery.message?.message_id;

    ctx.session.awaitingTime = false;
    await ctx.deleteMessage(changeTimeMessageID);
    await ctx.answerCbQuery();
  }

  //смена времени сообщения
  async changeTime(ctx: BotContext) {
    let time: string = "";
    if (ctx.message && "text" in ctx.message) time = ctx.message!.text;
    
    //проверка на валидность даты
    if (!await DateUtils.isDateValid(time)) {
      await View.sendChangeTimeErrorMessage(ctx);
    } else {
      await this.userModel.changeMessageTime(ctx.session.changeTimeMsgID, time);
      ctx.session.awaitingTime = false;
      await View.sendMessageAboutPublicationTime(ctx, ctx.session.changeTimeMsgID)
    }
  }

  //смена страниц
  async paginate(ctx: Context) {
    const callbackQuery = ctx.callbackQuery as CallbackQuery.DataQuery;
    const data = callbackQuery.data;
    const page = parseInt(data.split("_")[1], 10);

    const messages = await this.userModel.getAllMessages();
    const { text, keyboard } = await View.getPage(messages, page);
    await ctx.editMessageText(text, keyboard);
    await ctx.answerCbQuery();
  }

  //ответ на сообщение из списка
  async showMessage(ctx: Context) {
    const callbackQuery = ctx.callbackQuery as CallbackQuery.DataQuery;
    const data = callbackQuery.data;

    await ctx.deleteMessage(callbackQuery.message?.message_id);
    await ctx.reply(".", {
      reply_parameters: {
        message_id: parseInt(data.split("_")[1], 10)
      }
    });
  }
}

export default MessageController;
