import { DateTime } from "luxon";
import { Channel } from "../models/channelModel";
import logger from "../logs/logs";

const FORMAT = "yyyy-MM-dd HH:mm";  

class DateUtils {
  private isScheduleExists: boolean; // есть ли расписание
  private isScheduleStartLowerThanEnd: boolean = true; // начало расписания < конца (7:00-20:00)
  private scheduleStart: number = 0; // начало расписания
  private scheduleEnd: number = 0; // конец расписания
  private timeZone: string;
  private scheduleStartString: string;
  private scheduleEndString: string;

  constructor(channelInfo: Channel) {
    this.timeZone = channelInfo.timeZone;
    this.scheduleStartString = channelInfo.scheduleStart;
    this.scheduleEndString = channelInfo.scheduleEnd;

    if (this.scheduleStartString === "" || this.scheduleEndString === "") {
      this.isScheduleExists = false;
    } else {
      this.isScheduleExists = true;
    }

    this.initSchedule();
  }

  async initSchedule() {
    this.scheduleStart = this.stringToMinutes(this.scheduleStartString);
    this.scheduleEnd = this.stringToMinutes(this.scheduleEndString);

    this.isScheduleStartLowerThanEnd = this.scheduleStart < this.scheduleEnd;
  }


  // метод проверки существования часового пояса
  static isValidTimeZone(timeZone: string): boolean {
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
    return date.isValid && date > this.stringToDate(this.getCurrentDate());
  }

  maxDate(datesStr: string[]): string | null {
    try {
      const dates = [];
      for (const dateStr of datesStr) {
        const date = this.stringToDate(dateStr);
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
    const date = DateTime.fromFormat(str, FORMAT, { zone: this.timeZone });
    return date.toSeconds();
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
    return DateTime.now().setZone(this.timeZone).toFormat(FORMAT);
  }

  //форматирование даты в строку
  dateToString(date: DateTime): string {
    return date.toFormat(FORMAT);
  }

  //форматирование строки в дату
  stringToDate(str: string): DateTime {
    return DateTime.fromFormat(str, FORMAT, { zone: this.timeZone });
  }

  //нахождение разницы между двумя датами в формате строк
  timeDifference(start: string, end: string): number {
    const startTime = this.stringToDate(start);
    const endTime = this.stringToDate(end);
    return endTime.diff(startTime, "minutes").minutes;
  }

  //метод для установки времени на начало расписания
  setDateToScheduleStart(dateStr: string): string {
    let date = this.stringToDate(dateStr);
    
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
