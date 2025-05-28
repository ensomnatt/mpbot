import { DateTime } from "luxon";
import { Channel, ChannelModel } from "../models/channelModel";
import logger from "../logs/logs";

const FORMAT = "yyyy-MM-dd HH:mm";  

class DateUtils {
  private isScheduleExists: boolean = false; // есть ли расписание
  private isScheduleStartLowerThanEnd: boolean = true; // начало расписания < конца (7:00-20:00)
  private scheduleStart: number = 0; // начало расписания
  private scheduleEnd: number = 0; // конец расписания
  private channelModel!: ChannelModel;
  private channelInfo!: Channel | null;

  constructor() {
    try {
      // настройки канала
      this.channelModel = new ChannelModel();
      this.channelInfo = this.channelModel.chatInfo();
      if (!this.channelInfo) throw new Error("channelInfo is null");

      // существует ли расписание
      if (this.channelInfo.scheduleStart !== "" && this.channelInfo.scheduleEnd !== "") {
        this.isScheduleExists = true;
      }

      // начало расписания и конец в секундах
      this.scheduleStart = this.stringToMinutes(this.channelInfo.scheduleStart);
      this.scheduleEnd = this.stringToMinutes(this.channelInfo.scheduleEnd);

      this.isScheduleStartLowerThanEnd = this.scheduleStart < this.scheduleEnd;
    } catch (error) {
      logger.error(`ошибка при инициализации DateUtils: ${error}`);
    }
  }

  // метод проверки существования часового пояса
  isValidTimeZone(timeZone: string): boolean {
    const dt = DateTime.now().setZone(timeZone);
    return dt.isValid && dt.zoneName === timeZone;
  }

  // метод проверки даты на соответствие 
  isDateInSchedule(date: string): boolean {
    if (!this.isScheduleExists) {
      return true;
    }

    date = this.extractHoursAndMinutes(date);
    const dateMinutes = this.stringToMinutes(date);

    if (this.isScheduleStartLowerThanEnd) {
      return dateMinutes >= this.scheduleStart && dateMinutes <= this.scheduleEnd;
    } else {
      return dateMinutes >= this.scheduleStart || dateMinutes <= this.scheduleEnd;
    }  
  }

  isDateValid(dateStr: string): boolean {
    const date = DateTime.fromFormat(dateStr, FORMAT);
    const currentDate = this.stringToDate(this.getCurrentDate());
    if (!currentDate) return false;

    return date.isValid && date > currentDate;
  }

  maxDate(datesStr: string[]): string | null {
    try {
      const dates = [];
      for (const dateStr of datesStr) {
        const date = this.stringToDate(dateStr);
        if (!date) return null;
        dates.push(date);
      }
      const maxDate = DateTime.max(...dates);

      if (!maxDate) {
        throw new Error("maxDate is null");
      }

      return this.dateToString(maxDate);
    } catch (error) {
      logger.error(`не удалось получить максимальную дату: ${error}`);
      return null;
    }
  }

  //строки в минуты
  stringToMinutes(date: string): number {
    const [hours, minutes] = date.split(":").map(Number);
    return hours * 60 + minutes;
  }

  //строки в юникс тайм
  stringToUnix(str: string): number {
    try {
      if (!this.channelInfo) throw new Error("channelInfo is null");
      const date = DateTime.fromFormat(str, FORMAT, { zone: this.channelInfo.timeZone });
      return date.toSeconds();
    } catch (error) {
      logger.error(`ошибка при выполнении DateUtils.stringToUnix: ${error}`);
      return 0;
    }
  }

  //юникс тайм в строки
  unixToString(unix: number): string {
    const date = DateTime.fromSeconds(unix);
    return this.dateToString(date);
  }

  //получение часов и минут
  extractHoursAndMinutes(date: string): string {
    return date.split(" ")[1];
  }

  //нынешняя дата
  getCurrentDate(): string {
    try {
      if (!this.channelInfo) throw new Error("channelInfo is null");
      return DateTime.now().setZone(this.channelInfo.timeZone).toFormat(FORMAT);
    } catch (error) {
      logger.error(`ошибка при выполнении DateUtils.getCurrentDate: ${error}`);
      return "";
    }
  }

  //форматирование даты в строку
  dateToString(date: DateTime): string {
    return date.toFormat(FORMAT);
  }

  //форматирование строки в дату
  stringToDate(str: string): DateTime | null {
    try {
      if (!this.channelInfo) throw new Error("channelInfo is null");
      return DateTime.fromFormat(str, FORMAT, { zone: this.channelInfo.timeZone });
    } catch (error) {
      logger.error(`ошибка во время выполнения DateUtils.stringToDate: ${error}`);
      return null;
    }
  }

  //нахождение разницы между двумя датами в формате строк
  timeDifference(start: string, end: string): number {
    const startTime = this.stringToDate(start);
    const endTime = this.stringToDate(end);
    if (!endTime || !startTime) return 0;
    return endTime.diff(startTime, "minutes").minutes;
  }

  //метод для установки времени на начало расписания
  setDateToScheduleStart(dateStr: string): string {
    let date = this.stringToDate(dateStr);
    if (!date) return "";

    const dateNow = this.extractHoursAndMinutes(dateStr);
    const dateNowMinutes = this.stringToMinutes(dateNow);

    const hours = Math.floor(this.scheduleStart / 60);
    const minutes = this.scheduleStart % 60; 

    if (dateNowMinutes > this.scheduleEnd) {
      //если дата сообщения больше конца расписания, а расписание в формате 20:00-22:00
      if (this.isScheduleStartLowerThanEnd) {
        return this.dateToString(date.set({ hour: hours, minute: minutes }).plus({ day: 1 }));
        //если дата сообщения больше конца расписания, а расписание в формате 20:00-7:00
      } else {
        return this.dateToString(date.set({ hour: hours, minute: minutes }));
      }
    }

    //если дата сообщения меньше начала расписания
    if (dateNowMinutes < this.scheduleStart && this.isScheduleStartLowerThanEnd) {
      return this.dateToString(date.set({ hour: hours, minute: minutes }));
    } 

    return "";
  }
}

export default DateUtils;
