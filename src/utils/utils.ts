import { DateTime } from "luxon";
import { TIME_ZONE, SCHEDULE_START, SCHEDULE_END } from "../config/config";

const FORMAT = "yyyy-MM-dd HH:mm";  
const MIDNIGHT = 1440;

class DateUtils {
  private isScheduleExists: boolean;
  private isScheduleStartLowerThanEnd: boolean = true;
  private scheduleStart: number = 0;
  private scheduleEnd: number = 0;

  constructor() {
    if (SCHEDULE_START === "" || SCHEDULE_END === "") {
      this.isScheduleExists = false;
    } else {
      this.isScheduleExists = true;
    }

    this.initSchedule();
  }

  private async initSchedule() {
    this.scheduleStart = await DateUtils.stringToMinutes(SCHEDULE_START);
    this.scheduleEnd = await DateUtils.stringToMinutes(SCHEDULE_END);

    this.isScheduleStartLowerThanEnd = this.scheduleStart < this.scheduleEnd;
  }

  async isDateInSchedule(date: string): Promise<boolean> {
    if (!this.isScheduleExists) {
      return true;
    }

    date = await DateUtils.extractHoursAndMinutes(date);
    const dateMinutes = await DateUtils.stringToMinutes(date);

    if (this.isScheduleStartLowerThanEnd) {
      return dateMinutes >= this.scheduleStart && dateMinutes <= this.scheduleEnd;
    } else {
      return dateMinutes >= this.scheduleStart || dateMinutes <= this.scheduleEnd;
    }  
  }

  static async stringToMinutes(date: string): Promise<number> {
    const [hours, minutes] = date.split(":").map(Number);
    return hours * 60 + minutes;
  }

  static async extractHoursAndMinutes(date: string): Promise<string> {
    return date.split(" ")[1];
  }

  //нынешняя дата
  static async getCurrentDate(): Promise<string> {
    return DateTime.now().setZone(TIME_ZONE).toFormat(FORMAT);
  }

  //форматирование даты в строку
  static async dateToString(date: DateTime): Promise<string> {
    return date.toFormat(FORMAT);
  }

  //форматирование строки в дату
  static async stringToDate(str: string): Promise<DateTime> {
    return DateTime.fromFormat(str, FORMAT, { zone: TIME_ZONE });
  }

  //нахождение разницы между двумя датами в формате строк
  static async timeDifference(start: string, end: string): Promise<number> {
    const startTime = await DateUtils.stringToDate(start);
    const endTime = await DateUtils.stringToDate(end);
    return endTime.diff(startTime, "minutes").minutes;
  }

  //метод для установки времени на начало расписания
  async setDateToScheduleStart(dateStr: string): Promise<string> {
    let date = await DateUtils.stringToDate(dateStr);
    const hours = Math.floor(await this.scheduleStart / 60);
    const minutes = await this.scheduleStart % 60; 

    if (await this.scheduleEnd < MIDNIGHT) {
      return await DateUtils.dateToString(date.set({ hour: hours, minute: minutes }).plus({ day: 1 }));
    } else {
      return await DateUtils.dateToString(date.set({ hour: hours, minute: minutes }));
    }
  }
}

export default DateUtils;
