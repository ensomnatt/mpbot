import { Context } from "telegraf";
import { UserModel, Message } from "../models/userModel";
import { INTERVAL } from "../config/config";
import DateUtils from "../utils/dateUtils";
import View from "../view/view";
import logger from "../logs/logs";
import botMessages from "../config/botMessages";

class ScheduleController {
  private userModel: UserModel;
  private dateUtils: DateUtils;
  private intervalID: NodeJS.Timeout | null = null;

  constructor() {
    this.userModel = new UserModel();
    this.dateUtils = new DateUtils();
  }

  //метод добавления сообщения в очередь
  async addMessageToQueue(ctx: Context) {
    this.startCheckingMessages(ctx);

    const chatID = ctx.chat?.id || 0; //чат айди
    const msgID = ctx.message?.message_id || 0; //айди сообщения

    //экземпляр сообщения для отправки сейчас
    let msgNow: Message = {
      messageID: msgID,
      chatID: chatID,
      time: await DateUtils.getCurrentDate(),
      sent: 1
    }

    logger.info(`пользователь @${ctx.from?.username} захотел добавить сообщение в очередь. id: ${msgID}, time: ${msgNow.time}`);

    //если нет сообщений в базе
    if (!await this.userModel.checkIfMessagesExists()) {
      logger.info("в базе нет сообщений");
      //если сообщение вне расписания
      if (!await this.dateUtils.isDateInSchedule(msgNow.time)) {
        logger.debug("сообщение вне расписания");
        let msgClone = msgNow;
        msgClone.time = await this.dateUtils.setDateToScheduleStart(msgNow.time);
        msgClone.sent = 0;
        
        this.userModel.addMessageToDB(msgClone);
        await View.sendMessageTime(ctx, msgClone.time, msgClone.messageID);
        //если в расписании
      } else {
        logger.debug("сообщение в расписании");
        this.userModel.addMessageToDB(msgNow);
        await View.sendMessageToChannel(ctx, msgNow.messageID, chatID, msgNow.time);
        await View.sendMessage(ctx, botMessages.publicationTime);
      }
      //если есть сообщения
    } else {
      console.debug("есть сообщения");
      const lastMsg = await this.userModel.getLastMessage(); //последнее сообщение
      const diff = await DateUtils.timeDifference(lastMsg.time, msgNow.time); //разница в минутах
      //между нынешним временем и временем последнего сообщения

      const lastMsgDate = await DateUtils.stringToDate(lastMsg.time)
      //экземпляр сообщения для отложки
      let msgLater: Message = {
        messageID: msgID,
        chatID: chatID,
        time: await DateUtils.dateToString(lastMsgDate.plus({ minutes: INTERVAL })),
        sent: 0
      }

      //если время экземпляра сообщения для отложки выходит за рамки расписания, 
      //ставим время на начало расписания
      if (!await this.dateUtils.isDateInSchedule(msgLater.time)) {
        console.debug("сообщение выходит за рамки расписания, переносим на начало расписания");
        msgLater.time = await this.dateUtils.setDateToScheduleStart(msgLater.time);
      }

      //если с момента отправки последнего сообщения прошло больше интервала и 
      //нынешнее время позднее времени отправки последнего сообщения
      if (
        diff >= INTERVAL && 
        await DateUtils.stringToDate(msgNow.time) > await DateUtils.stringToDate(lastMsg.time) &&
        await this.dateUtils.isDateInSchedule(msgNow.time)
      ) {
        console.debug("с момента отправки последнего сообщения прошло достаточно времени");
        this.userModel.addMessageToDB(msgNow);
        await View.sendMessageTime(ctx, msgNow.time, msgNow.messageID);
        await View.sendMessageToChannel(ctx, msgID, chatID, msgNow.time);
        //если разница меньше интервала либо 
        //нынешнее время меньше времени публикации последнего сообщения
      } else {
        this.userModel.addMessageToDB(msgLater);
        await View.sendMessageTime(ctx, msgLater.time, msgLater.messageID);
        console.info(`сообщение было отправленно в отложенные. id: ${msgLater.messageID}, time: ${msgLater.time}`);
      }
    }
  }

  //метод старта метода для проверки сообщений
  async startCheckingMessages(ctx: Context) {
    if (this.intervalID) {
      return;
    }

    logger.info("запущена цикличная проверка сообщений");
    this.intervalID = setInterval(async () => {
      await this.checkMessages(ctx);
    }, 30000); //пол минуты
  }

  //метод для проверки и публикации запланированных сообщений
  async checkMessages(ctx: Context) {
    logger.info(`начата проверка на наличие готовых сообщений в ${await DateUtils.getCurrentDate()}`);
    const messages: Message[] = [];

    for (const msg of this.userModel.getMessagesThatDidntSend()) {
      if (msg.time === await DateUtils.getCurrentDate()) {
        messages.push(msg);
      } else {
        continue;
      }
    }

    if (messages.length !== 0) {
      for (const msg of messages) {
        this.userModel.changeMessageStatus(msg.messageID);
        await View.sendMessageToChannel(ctx, msg.messageID, msg.chatID, msg.time);
      }
    } else {
      logger.info("готовые к публикации сообщения не найдены");
      return;
    }
  }
}

export default ScheduleController;
