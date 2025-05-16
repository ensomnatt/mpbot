import { Context, Markup } from "telegraf";
import { START_MESSAGE, CHANNEL_ID } from "../config/config";
import { Message } from "../model/model";
import { inlineKeyboard } from "telegraf/typings/markup";
import logger from "../logs/logs";

const pageSize = 20;

//измененное сообщение для отправки списка
interface editedMessage extends Message {
  number: number;
}

class View {
  //отправка стартового сообщения
  static async startMessage(ctx: Context) {
    await ctx.sendMessage(
      START_MESSAGE,
      Markup.keyboard([
        ["/list", "/clear", "/help"]
      ]).resize()
    );
  }  

  //руководство по использованию бота
  static async helpMessage(ctx: Context) {
    await ctx.sendMessage(
      "как пользоваться ботом:\n" +
      "вы пересылаете посты боту. все, он сам выставляет время и публикует сообщения\n\n" +
      "инструменты:\n" +
      "/list - выводит все запланированные посты, при нажатии на кнопку, номер которой " +
      "соответствует номеру сообщения бот присылает ответ на нужный вам пост\n" +
      "/clear - удаляет все запланированные посты, будьте осторожны\n" +
      "/help - вывести это сообщение\n" +
      "/start - приветственное сообщение, вызывайте на случай, если пропала клавиатура с кнопками\n" +
      "кнопка удалить - удаляет нужный пост из очереди\n" +
      "кнопка изменить время - переносит нужный пост на заданную дату."
    )
  }

  //отправка сообщения с просьбой ввести время 
  static async timeMessage(ctx: Context) {
    const keyboard = Markup.inlineKeyboard(
      [
        Markup.button.callback("отменить", `cancelChangeTime`)
      ]
    );

    await ctx.sendMessage("введите новое время публикации в формате yyyy-MM-dd HH:mm\n\nк примеру: 2025-03-30 15:30", keyboard);
  }

  //отправка сообщения с оповещением о том, что заданное время не подходит под формат
  static async sendChangeTimeErrorMessage(ctx: Context) {
    await ctx.sendMessage("заданное время не подходит под формат! попробуйте еще раз");
    await this.timeMessage(ctx);
  }

  //отправка сообщения с оповещением о том, что очередь была очищена
  static async sendClearMessage(ctx: Context) {
    await ctx.sendMessage("сообщения были очищены");
  }

  //отправка сообщения с уведомлением о том, что пост был отправлен прямо сейчас
  static async sendMessageAboutPublicationNow(ctx: Context) {
    await ctx.reply("сообщение было отправлено сейчас, потому что в очереди нет других сообщений");
  }

  //отправка сообщения с уведомлением о том, что время публикации было изменено
  static async sendMessageAboutPublicationTime(ctx: Context, msgID: number) {
    await ctx.reply("время публикации было изменено", {
      reply_parameters: {
        message_id: msgID
      }
    });
  }

  //отправка сообщения с уведомлением о том, что сообщение удалено
  static async sendDeleteMessage(ctx: Context, msgID: number) {
    await ctx.reply("сообщение было удалено", {
      reply_parameters: {
        message_id: msgID
      }
    });
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
      logger.info(`сообщение отправлено в канал. id: ${messageID}, time: ${time}`);
    } catch (error) {
      logger.error(`ошибка при пересылке сообщения в канал: ${error}`);
    }
  }

  //отправка времени сообщения
  static async sendMessageTime(ctx: Context, time: string, msgID: number) {
    const keyboard = [
      [
        Markup.button.callback("удалить", `delete_${msgID}`)
      ],

      [
        Markup.button.callback("изменить время", `change_${msgID}`)
      ]
    ];

    await ctx.sendMessage(time, Markup.inlineKeyboard(keyboard));
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
    if (messages.length === 0) {
      await ctx.sendMessage("в очереди нет сообщений");
    } else {
      const { text, keyboard } = await View.getPage(messages, 0); 
      await ctx.sendMessage(text, keyboard);
    }
  }
}

export default View;
