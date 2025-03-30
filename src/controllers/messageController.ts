import { Context } from "telegraf";
import View from "../view/view";
import { Model } from "../model/model";
import { CallbackQuery } from "telegraf/typings/core/types/typegram";

class MessageController {  
  private model = new Model();
  // /start
  async start(ctx: Context) {
    console.log(`пользователь @${ctx.from?.username} запустил бота`);
    await View.startMessage(ctx);
  }

  // /list
  async list(ctx: Context) {
    console.log(`пользователь @${ctx.from?.username} отправил команду /list`)
    const messages = await this.model.getAllMessages();
    await View.sendList(ctx, messages);
  }

  //смена страниц
  async paginate(ctx: Context) {
    const callbackQuery = ctx.callbackQuery as CallbackQuery.DataQuery;
    const data = callbackQuery.data;
    const page = parseInt(data.split("_")[1], 10);

    const messages = await this.model.getAllMessages();
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
