import db from "../database/database";

//интерфейс сообщения
export interface Message {
  messageID: number,
  time: string,
  sent: number
}

//костыль для бд
interface Row {
  id: number,
  message_id: number,
  time: string,
  sent: number
}

export class Model {
  //проверка на наличие сообщений в бд
  async checkIfMessagesExists(): Promise<boolean> {
    console.log("проверка на наличие сообщений в бд")
    const query = db.prepare("SELECT CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END FROM messages");
    const result = await query.get();
    
    return result === 1;
  }

  //добавление сообщения в бд
  async addMessageToDB(msg: Message) {
    try {
      const query = db.prepare("INSERT INTO messages (message_id, time, sent) VALUES (?, ?, ?)");
      query.run(msg.messageID, msg.time, msg.sent);

      console.log(`сообщение добавлено в базу данных. id: ${msg.messageID}, time: ${msg.time}, sent: ${msg.sent}`);
    } catch (error) {
      console.error(`ошибка при добавлении сообщения в базу данных: ${error}`);
    }
  }

  //получение последней записи в бд
  async getLastMessage(): Promise<Message> {
    const row = db.prepare("SELECT * FROM messages ORDER BY id LIMIT 1").get() as Row; 

    const msg: Message = {
      messageID: row.message_id,
      time: row.time,
      sent: row.sent
    }

    console.log("получена последняя запись в бд")
    return msg;
  }
}
