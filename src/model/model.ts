import db from "../database/database";
import DateUtils from "../utils/utils";

//интерфейс сообщения
export interface Message {
  messageID: number,
  chatID: number,
  time: string,
  sent: number
}

//костыль для бд
interface Row {
  id: number,
  message_id: number,
  chat_id: number,
  time: string,
  sent: number;
}

//еще костыль для бд
interface CountResult {
  count: number;
}

export class Model {
  //проверка на наличие сообщений в бд
  async checkIfMessagesExists(): Promise<boolean> {
    try {
      console.log("проверка на наличие сообщений в бд");
      const query = db.prepare("SELECT COUNT(*) AS count FROM messages");
      const result = await query.get() as CountResult;

      return result.count > 0;
    } catch (error) {
      console.error(`ошибка при проверки на наличие записей в бд: ${error}`);
      return false;
    }
  }

  //добавление сообщения в бд
  async addMessageToDB(msg: Message) {
    try {
      const query = db.prepare("INSERT INTO messages (message_id, chat_id, time, sent) VALUES (?, ?, ?, ?)");
      query.run(msg.messageID, msg.chatID, msg.time, msg.sent);

      console.log(`сообщение добавлено в базу данных. id: ${msg.messageID}, time: ${msg.time}, sent: ${msg.sent}`);
    } catch (error) {
      console.error(`ошибка при добавлении сообщения в базу данных: ${error}`);
    }
  }

  //получение последней записи в бд
  async getLastMessage(): Promise<Message> {
    const messages = await this.getAllMessages();
    const times = [];

    for (const msg of messages) {
      times.push(msg.time);
    }

    const maxTime = await DateUtils.maxDate(times);
    let lastMsg: Message = {
      messageID: 0,
      chatID: 0,
      time: "",
      sent: 0
    };

    for (const msg of messages) {
      if (msg.time === maxTime) {
        lastMsg = msg; 
      } else {
        continue;
      }
    }

    console.log("получена последняя запись в бд")
    return lastMsg;
  }

  //получение неотправленных сообщений
  async getMessagesThatDidntSend(): Promise<Message[]> {
    console.log("проверка на наличие неопубликованных сообщений в базе данных");
    try {
      const query = db.prepare("SELECT * FROM messages WHERE sent = 0");
      const messagesRows = query.all() as Row[];

      const messages: Message[] = [];
      for (const row of messagesRows) {
        const msg: Message = {
          messageID: row.message_id,
          chatID: row.chat_id,
          time: row.time,
          sent: row.sent
        }

        if (msg.sent === 0) {
          messages.push(msg);
        } else {
          continue;
        }
      }

      return messages;
    } catch (error) {
      console.error(`ошибка при получении неотправленных сообщений в базе данных: ${error}`);
      return [];
    }
  }

  //смена sent на 1
  async changeMessageStatus(msgID: number) {
    try {
      db.prepare("UPDATE messages SET sent = 1 WHERE message_id = ?").run(msgID);
    } catch (error) {
      console.error(`ошибка при попытке изменить сообщение в базе данных: ${error}`);
    }
  }

  //получение всех сообщений
  async getAllMessages(): Promise<Message[]> {
    try {
      const messagesRows = db.prepare("SELECT * FROM messages;").all() as Row[];
      const messages: Message[] = [];

      for (const row of messagesRows) {
        const msg: Message = {
          messageID: row.message_id,
          chatID: row.chat_id,
          time: row.time,
          sent: row.sent
        }

        messages.push(msg);
      }

      console.log("получены сообщения из бд");
      return await this.sortMessages(messages);
    } catch (error) {
      console.error(`ошибка при получении всех сообщений из бд: ${error}`);
      return [];
    }
  }

  //удаление всех сообщений
  async deleteAllMessages() {
    db.prepare("DELETE FROM messages").run();
    console.log("удалены все сообщения из бд");
  }

  //удаление сообщения
  async deleteMessage(msgID: number) {
    db.prepare("DELETE FROM messages WHERE message_id = ?").run(msgID);
    console.log("удалено сообщение из бд");
  }

  //смена времени сообщения
  async changeMessageTime(msgID: number, time: string) {
    db.prepare("UPDATE messages SET time = ? WHERE message_id = ?").run(time, msgID);
    console.log(`время публикации сообщения ${msgID} было изменено на ${time}`);
  }

  async sortMessages(messages: Message[]): Promise<Message[]> {
    let n = messages.length;
    for (let i = 0; i < n; i++) {
      let swapped = false;
      for (let j = 0; j < n - i - 1; j++) {
        const date1 = await DateUtils.stringToDate(messages[j].time);
        const date2 = await DateUtils.stringToDate(messages[j + 1].time);
        
        if (date1 > date2) {
          [messages[j], messages[j + 1]] = [messages[j + 1], messages[j]];
          swapped = true;
        }
      }
      if (!swapped) {
        break;
      }
    }

    return messages;
  }
}
