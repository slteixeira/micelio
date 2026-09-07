import Database from "better-sqlite3";

export const db = new Database(process.env.COUNTER_DB_PATH || "./counter.sqlite");
