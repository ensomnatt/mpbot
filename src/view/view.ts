import { Context } from "telegraf";
import { START_MESSAGE, CHANNEL_ID } from "../config/config";

class View {
  //отправка стартового сообщения
  static async startMessage(ctx: Context) {
    await ctx.sendMessage(START_MESSAGE);
  }  

  //отправка сообщения в канал
  static async sendMessageToChannel(
    ctx: Context, 
    messageID: number, 
    chatID: number, 
    time: string
  ) {
    try {
      await ctx.telegram.forwardMessage(CHANNEL_ID, chatID, messageID);
      console.log(`сообщение отправлено в канал. id: ${messageID}, time: ${time}`);
    } catch (error) {
      console.error(`ошибка при пересылке сообщения в канал: ${error}`);
    }
  }
}

export default View;
