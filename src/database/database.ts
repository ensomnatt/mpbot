import Database from "better-sqlite3";
import logger from "../logs/logs";

const db = new Database("src/database/messages.db");

try {
  logger.info("инициализирована база данных")

  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id INTEGER NOT NULL,
      chat_id INTEGER NOT NULL,
      time TEXT NOT NULL,
      sent INTEGER NOT NULL
    )
    `
  ).run();

} catch (error) {
  logger.error(`ошибка при инициализации базы данных: ${error}`)
}

export default db;
