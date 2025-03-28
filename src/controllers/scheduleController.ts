import { Context } from "telegraf";
import { Model, Message } from "../model/model";
import { INTERVAL } from "../config/config";
import DateUtils from "../utils/utils";
import View from "../view/view";

class ScheduleController {
  private model: Model;
  private dateUtils: DateUtils;

  constructor() {
    this.model = new Model();
    this.dateUtils = new DateUtils();
  }

  //метод добавления сообщения в очередь
  async addMessageToQueue(ctx: Context) {
    const chatID = ctx.chat?.id || 0; //чат айди
    const msgID = ctx.message?.message_id || 0; //айди сообщения

    //экземпляр сообщения для отправки сейчас
    let msgNow: Message = {
      messageID: msgID,
      time: await DateUtils.getCurrentDate(),
      sent: 1
    }

    console.log(`пользователь @${ctx.from?.username} захотел добавить сообщение в очередь. id: ${msgID}, time: ${msgNow.time}`);

    //если нет сообщений в базе
    if (!await this.model.checkIfMessagesExists()) {
      console.log("в базе нет сообщений")
      //если сообщение вне расписания
      if (!await this.dateUtils.isDateInSchedule(msgNow.time)) {
        console.log("сообщение вне расписания")
        let msgClone = msgNow;
        msgClone.time = await this.dateUtils.setDateToScheduleStart(msgNow.time);
        msgClone.sent = 0;
        
        await this.model.addMessageToDB(msgClone);
        //если в расписании
      } else {
        await this.model.addMessageToDB(msgNow);
        await View.sendMessageToChannel(ctx, msgNow.messageID, chatID, msgNow.time);
      }
      //если есть сообщения
    } else {
      const lastMsg = await this.model.getLastMessage(); //последнее сообщение
      const diff = await DateUtils.timeDifference(lastMsg.time, msgNow.time); //разница в минутах 
      //между нынешним временем и временем последнего сообщения

      const lastMsgDate = await DateUtils.stringToDate(lastMsg.time)
      //экземпляр сообщения для отложки
      let msgLater: Message = {
        messageID: msgID,
        time: await DateUtils.dateToString(lastMsgDate.plus({ minutes: 5 })),
        sent: 0
      }

      //если время экземпляра сообщения для отложки выходит за рамки расписания, 
      //ставим время на начало расписания
      if (!await this.dateUtils.isDateInSchedule(msgLater.time)) {
        console.log("сообщение выходит за рамки расписания, переносим на начало расписания")
        msgLater.time = await this.dateUtils.setDateToScheduleStart(msgLater.time);
      }

      //если с момента отправки последнего сообщения прошло больше интервала и 
      //нынешнее время позднее времени отправки последнего сообщения
      if (
        diff >= INTERVAL && 
        await DateUtils.stringToDate(msgNow.time) > await DateUtils.stringToDate(lastMsg.time) &&
        await this.dateUtils.isDateInSchedule(msgNow.time)
      ) {
        await this.model.addMessageToDB(msgNow);
        await View.sendMessageToChannel(ctx, msgID, chatID, msgNow.time);
        //если разница меньше интервала либо 
        //нынешнее время меньше времени публикации последнего сообщения
      } else {
        await this.model.addMessageToDB(msgLater);
        console.log(`сообщение было отправленно в отложенные. id: ${msgLater.messageID}, time: ${msgLater.time}`);
      }
    }
  }
}

export default ScheduleController;
