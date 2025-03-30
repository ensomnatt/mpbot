import { Context } from "telegraf";

export interface SessionData {
  awaitingTime: boolean;
  changeTimeMsgID: number;
}

export interface BotContext extends Context {
  session: SessionData;
}
