const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'sms_app.db');

let rawDb = null;
let _inTx = false;

function save() {
  if (_inTx) return;
  fs.writeFileSync(DB_PATH, Buffer.from(rawDb.export()));
}

function flatParams(args) {
  if (args.length === 1 && Array.isArray(args[0])) return args[0];
  return args;
}

function makeStmt(sql) {
  return {
    run(...args) {
      const p = flatParams(args);
      rawDb.run(sql, p.length ? p : undefined);
      save();
      const r = rawDb.exec('SELECT last_insert_rowid() as id');
      return { lastInsertRowid: r[0]?.values[0][0] ?? null };
    },
    all(...args) {
      const p = flatParams(args);
      const stmt = rawDb.prepare(sql);
      if (p.length) stmt.bind(p);
      const rows = [];
      while (stmt.step()) rows.push(stmt.getAsObject());
      stmt.free();
      return rows;
    },
    get(...args) {
      return this.all(...args)[0] ?? null;
    },
  };
}

const db = {
  pragma(str) { rawDb.run(`PRAGMA ${str}`); },
  exec(sql) { rawDb.exec(sql); save(); },
  prepare: makeStmt,
  transaction(fn) {
    return (...args) => {
      rawDb.run('BEGIN');
      _inTx = true;
      try {
        const r = fn(...args);
        rawDb.run('COMMIT');
        _inTx = false;
        save();
        return r;
      } catch (e) {
        rawDb.run('ROLLBACK');
        _inTx = false;
        throw e;
      }
    };
  },
};

db.initDb = async function () {
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    rawDb = new SQL.Database(fs.readFileSync(DB_PATH));
  } else {
    rawDb = new SQL.Database();
  }

  rawDb.exec(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL UNIQUE,
      email TEXT,
      group_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS campaigns (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      message TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      recipients TEXT NOT NULL,
      total_recipients INTEGER DEFAULT 0,
      delivered INTEGER DEFAULT 0,
      failed INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      scheduled_at DATETIME,
      sent_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS sms_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id TEXT,
      phone TEXT NOT NULL,
      message TEXT NOT NULL,
      sender_id TEXT,
      status TEXT DEFAULT 'pending',
      arkesel_ref TEXT,
      error_message TEXT,
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS delivery_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      arkesel_ref TEXT,
      phone TEXT,
      status TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  save();
};

module.exports = db;
