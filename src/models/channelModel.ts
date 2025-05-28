import db from "../database/database"
import logger from "../logs/logs";

export interface Channel {
  channelID: number;
  scheduleStart: string;
  scheduleEnd: string;
  interval: number;
  timeZone: string;
} 

interface ChannelData {
  channel_id: number;
  schedule_start: string;
  schedule_end: string;
  interval: number;
  time_zone: string;
}

export class ChannelModel {
  channel(id: number) {
    try {
      db.prepare("UPDATE channel SET channel_id = ?").run(id);
      logger.info(`изменен айди канала на ${id}`);
    } catch (error) {
      logger.error(`ошибка при обновлении айди канала: ${error}`);
    }
  }

  scheduleStart(start: string) {
    try {
      db.prepare("UPDATE chat SET schedule_start = ?").run(start);
      logger.info(`изменено начало расписания на ${start}`);
    } catch (error) {
      logger.error(`ошибка при обновлении начала расписания: ${error}`);
    }
  }

  scheduleEnd(end: string) {
    try {
      db.prepare("UPDATE chat SET schedule_end = ?").run(end);
      logger.info(`изменен конец расписания на ${end}`);
    } catch (error) {
      logger.error(`ошибка при обновлении конца расписания: ${error}`);
    }
  }

  interval(interval: string) {
    try {
      db.prepare("UPDATE chat SET interval = ?").run(interval);
      logger.info(`изменен интервал на ${interval}`);
    } catch (error) {
      logger.error(`ошибка при обновлении интервала: ${error}`);
    }
  }

  timeZone(timeZone: string) {
    try {
      db.prepare("UPDATE chat SET time_zone = ?").run(timeZone);
      logger.info(`изменен часовой пояс на ${timeZone}`);
    } catch (error) {
      logger.error(`ошибка при обновлении часового пояса: ${error}`);
    }
  }

  chatInfo(): Channel | null {
    try {
      const channelRaw = db.prepare("SELECT * FROM channel").get() as ChannelData;

      const channel: Channel = {
        channelID: channelRaw.channel_id,
        scheduleStart: channelRaw.schedule_start,
        scheduleEnd: channelRaw.schedule_end,
        interval: channelRaw.interval,
        timeZone: channelRaw.time_zone,
      }

      logger.info("получена информация о канале")
      return channel;
    } catch (error) {
      logger.error(`ошибка при получении информации о канале: ${error}`);
      return null;
    }
  }
}
