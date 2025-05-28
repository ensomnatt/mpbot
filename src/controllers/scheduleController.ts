import { Context } from "telegraf";
import { UserModel, Message } from "../models/userModel";
import DateUtils from "../utils/dateUtils";
import View from "../view/view";
import logger from "../logs/logs";
import botMessages from "../config/botMessages";
import { ChannelModel } from "../models/channelModel";

class ScheduleController {
  private userModel: UserModel;
  private channelModel: ChannelModel;
  private dateUtils: DateUtils;
  private intervalID: NodeJS.Timeout | null = null;

  constructor() {
    this.userModel = new UserModel();
    this.channelModel = new ChannelModel();
    this.dateUtils = new DateUtils();
  }

  //метод добавления сообщения в очередь
  async addMessageToQueue(ctx: Context) {
    try {
      this.startCheckingMessages(ctx);

      // переменные
      const chatID = ctx.chat?.id || 0; //чат айди
      const msgID = ctx.message?.message_id || 0; //айди сообщения
      const channelID = this.channelModel.chatInfo()?.channelID;
      const interval = this.channelModel.chatInfo()?.interval;

      // проверки
      if (!channelID) throw new Error("channelID is undefined");
      if (!interval) throw new Error("interval is undefined");

      //экземпляр сообщения для отправки сейчас
      let msgNow: Message = {
        messageID: msgID,
        chatID: chatID,
        time: this.dateUtils.getCurrentDate(),
        sent: 1
      }

      logger.info(`пользователь @${ctx.from?.username} захотел добавить сообщение в очередь. id: ${msgID}, time: ${msgNow.time}`);

      //если нет сообщений в базе
      if (!await this.userModel.checkIfMessagesExists()) {
        logger.info("в базе нет сообщений");
        //если сообщение вне расписания
        if (!this.dateUtils.isDateInSchedule(msgNow.time)) {
          logger.debug("сообщение вне расписания");
          let msgClone = msgNow;
          msgClone.time = this.dateUtils.setDateToScheduleStart(msgNow.time);
          msgClone.sent = 0;
          
          this.userModel.addMessageToDB(msgClone);
          await View.sendMessageTime(ctx, msgClone.time, msgClone.messageID);
          //если в расписании
        } else {
          logger.debug("сообщение в расписании");
          this.userModel.addMessageToDB(msgNow);
          await View.sendMessageToChannel(ctx, msgNow.messageID, chatID, channelID, msgNow.time);
          await View.sendMessage(ctx, botMessages.publicationTime);
        }
        //если есть сообщения
      } else {
        console.debug("есть сообщения");
        const lastMsg = this.userModel.getLastMessage(); //последнее сообщение
        const diff = this.dateUtils.timeDifference(lastMsg.time, msgNow.time); //разница в минутах
        //между нынешним временем и временем последнего сообщения

        const lastMsgDate = this.dateUtils.stringToDate(lastMsg.time)
        if (!lastMsgDate) throw new Error("lastMsgDate is null");

        //экземпляр сообщения для отложки
        let msgLater: Message = {
          messageID: msgID,
          chatID: chatID,
          time: this.dateUtils.dateToString(lastMsgDate.plus({ minutes: interval })),
          sent: 0
        }

        //если время экземпляра сообщения для отложки выходит за рамки расписания, 
        //ставим время на начало расписания
        if (!this.dateUtils.isDateInSchedule(msgLater.time)) {
          console.debug("сообщение выходит за рамки расписания, переносим на начало расписания");
          msgLater.time = this.dateUtils.setDateToScheduleStart(msgLater.time);
        }

        //если с момента отправки последнего сообщения прошло больше интервала и 
        //нынешнее время позднее времени отправки последнего сообщения
        const msgNowTime = this.dateUtils.stringToDate(msgNow.time);
        const lastMsgTime = this.dateUtils.stringToDate(lastMsg.time);

        if (!msgNowTime || !lastMsgTime) throw new Error("msg time is null");

        if (
          diff >= interval && 
          msgNowTime > lastMsgTime &&
          this.dateUtils.isDateInSchedule(msgNow.time)
        ) {
          console.debug("с момента отправки последнего сообщения прошло достаточно времени");
          this.userModel.addMessageToDB(msgNow);
          await View.sendMessageTime(ctx, msgNow.time, msgNow.messageID);
          await View.sendMessageToChannel(ctx, msgID, chatID, channelID, msgNow.time);
          //если разница меньше интервала либо 
          //нынешнее время меньше времени публикации последнего сообщения
        } else {
          this.userModel.addMessageToDB(msgLater);
          await View.sendMessageTime(ctx, msgLater.time, msgLater.messageID);
          console.info(`сообщение было отправленно в отложенные. id: ${msgLater.messageID}, time: ${msgLater.time}`);
        }
      }
    } catch (error) {
      logger.error(`ошибка во время выполнения ScheduleController.addMessageToQueue: ${error}`);
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
    try {
      logger.info(`начата проверка на наличие готовых сообщений в ${this.dateUtils.getCurrentDate()}`);
      const messages: Message[] = [];

      for (const msg of this.userModel.getMessagesThatDidntSend()) {
        if (msg.time === this.dateUtils.getCurrentDate()) {
          messages.push(msg);
        } else {
          continue;
        }
      }

      const channelID = this.channelModel.chatInfo()?.channelID;
      if (!channelID) throw new Error("channelID is null");

      if (messages.length !== 0) {
        for (const msg of messages) {
          this.userModel.changeMessageStatus(msg.messageID);
          await View.sendMessageToChannel(ctx, msg.messageID, msg.chatID, channelID, msg.time);
        }
      } else {
        logger.info("готовые к публикации сообщения не найдены");
        return;
      }
    } catch (error) {
      logger.error(`ошибка во время проверки сообщений: ${error}`);
    }
  }
}

export default ScheduleController;
