import db from "../database/database";
import logger from "../logs/logs";
import DateUtils from "../utils/dateUtils";

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

export class UserModel {
  private dateUtils: DateUtils = new DateUtils();

  //проверка на наличие сообщений в бд
  async checkIfMessagesExists(): Promise<boolean> {
    try {
      logger.info("проверка на наличие сообщений в бд");
      const query = db.prepare("SELECT COUNT(*) AS count FROM messages");
      const result = await query.get() as CountResult;

      return result.count > 0;
    } catch (error) {
      logger.info(`ошибка при проверки на наличие записей в бд: ${error}`);
      return false;
    }
  }

  //добавление сообщения в бд
  addMessageToDB(msg: Message) {
    try {
      const query = db.prepare("INSERT INTO messages (message_id, chat_id, time, sent) VALUES (?, ?, ?, ?)");
      query.run(msg.messageID, msg.chatID, msg.time, msg.sent);

      logger.info(`сообщение добавлено в базу данных. id: ${msg.messageID}, time: ${msg.time}, sent: ${msg.sent}`);
    } catch (error) {
      logger.error(`ошибка при добавлении сообщения в базу данных: ${error}`);
    }
  }

  //получение последней записи в бд
  getLastMessage(): Message {
    const messages = this.getAllMessages();
    const times = [];

    for (const msg of messages) {
      times.push(msg.time);
    }

    const maxTime = this.dateUtils.maxDate(times);
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

    logger.info("получена последняя запись в бд")
    return lastMsg;
  }

  //получение неотправленных сообщений
  getMessagesThatDidntSend(): Message[] {
    logger.info("проверка на наличие неопубликованных сообщений в базе данных");
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
      logger.error(`ошибка при получении неотправленных сообщений в базе данных: ${error}`);
      return [];
    }
  }

  //смена sent на 1
  changeMessageStatus(msgID: number) {
    try {
      db.prepare("UPDATE messages SET sent = 1 WHERE message_id = ?").run(msgID);
    } catch (error) {
      logger.error(`ошибка при попытке изменить сообщение в базе данных: ${error}`);
    }
  }

  //получение всех сообщений
  getAllMessages(): Message[] {
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

      logger.info("получены сообщения из бд");
      return this.sortMessages(messages);
    } catch (error) {
      logger.error(`ошибка при получении всех сообщений из бд: ${error}`);
      return [];
    }
  }

  //удаление всех сообщений
  deleteAllMessages() {
    db.prepare("DELETE FROM messages").run();
    logger.info("удалены все сообщения из бд");
  }

  //удаление сообщения
  deleteMessage(msgID: number) {
    db.prepare("DELETE FROM messages WHERE message_id = ?").run(msgID);
    logger.info("удалено сообщение из бд");
  }

  //смена времени сообщения
  changeMessageTime(msgID: number, time: string) {
    db.prepare("UPDATE messages SET time = ? WHERE message_id = ?").run(time, msgID);
    logger.info(`время публикации сообщения ${msgID} было изменено на ${time}`);
  }

  sortMessages(messages: Message[]): Message[] {
    return messages.sort((a, b) => this.dateUtils.stringToUnix(a.time) - this.dateUtils.stringToUnix(b.time));
  }
}
