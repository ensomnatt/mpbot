import { Context, Markup } from "telegraf";
import { START_MESSAGE, CHANNEL_ID } from "../config/config";
import { Message } from "../model/model";

const pageSize = 20;

//измененное сообщение для отправки списка
interface editedMessage extends Message {
  number: number;
}

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

  //отправка времени сообщения
  static async sendMessageTime(ctx: Context, time: string) {
    await ctx.sendMessage(time);
  }

  //получение страницы
  static async getPage(messages: Message[], page: number) {
    const start = page * pageSize;
    const end = start + pageSize;
    let list = "";

    //пронумерованные сообщения
    const editedMessages: editedMessage[] = [];
    let i = 0;
    for (const msg of messages) {
      const editedMsg: editedMessage = {
        number: ++i,
        messageID: msg.messageID,
        chatID: msg.chatID,
        time: msg.time,
        sent: msg.sent
      }

      editedMessages.push(editedMsg);
    }

    //сообщения на странице
    const pageMessages = editedMessages.slice(start, end);

    for (const msg of pageMessages) {
      list += `${msg.number}. ${msg.time}\n`;
    }

    //кнопки для сообщений на странице
    const buttons: any[][] = [];
    for (let i = 0; i < pageMessages.length; i += 5) {
      buttons.push(
        pageMessages.slice(i, i + 5).map(
          msg => Markup.button.callback(msg.number.toString(), `message_${msg.messageID}`)
        )
      );
    }

    //навигационные кнопки
    const navButtons = [];
    if (page > 0) {
      navButtons.push(
        Markup.button.callback("<", `page_${page - 1}`)
      );
    }

    if (end < messages.length) {
      navButtons.push(
        Markup.button.callback(">", `page_${page + 1}`)
      );
    }

    if (navButtons.length) buttons.push(navButtons);

    return {
      text: list,
      keyboard: Markup.inlineKeyboard(buttons)
    }
  }

  //отправка списка
  static async sendList(ctx: Context, messages: Message[]) {
    const { text, keyboard } = await View.getPage(messages, 0); 
    await ctx.sendMessage(text, keyboard);
  }
}

export default View;
