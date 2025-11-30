import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, "moneylith.db"));

// Basis schema: inclusief categorie + vaste_last
db.exec(`
  CREATE TABLE IF NOT EXISTS transacties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rekening TEXT,
    datum TEXT,
    bedrag REAL,
    omschrijving TEXT,
    categorie TEXT,
    bron TEXT,
    ingevoerd_op TEXT,
    vaste_last INTEGER DEFAULT 0
  )
`);

// Migratie voor oude databases (alleen nodig als kolommen nog missen)
const columns = db.prepare("PRAGMA table_info(transacties)").all();

if (!columns.some((col) => col.name === "categorie")) {
  db.prepare("ALTER TABLE transacties ADD COLUMN categorie TEXT").run();
}

if (!columns.some((col) => col.name === "vaste_last")) {
  db.prepare("ALTER TABLE transacties ADD COLUMN vaste_last INTEGER DEFAULT 0").run();
}

db.exec(`
  CREATE TABLE IF NOT EXISTS budgetten (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    categorie TEXT NOT NULL,
    bedrag_per_maand REAL NOT NULL
  )
`);

// Nieuwe tabel voor gedetecteerde vaste lasten groepen.
db.exec(`
  CREATE TABLE IF NOT EXISTS vaste_lasten_groepen (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    normalized_key TEXT NOT NULL UNIQUE,
    rekening TEXT NOT NULL,
    omschrijving TEXT NOT NULL,
    gemiddelde_bedrag REAL NOT NULL,
    aantal_transacties INTEGER NOT NULL,
    eerste_datum TEXT NOT NULL,
    laatste_datum TEXT NOT NULL,
    actief INTEGER NOT NULL DEFAULT 1,
    categorie TEXT DEFAULT NULL,
    notitie TEXT DEFAULT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS regels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    naam TEXT NOT NULL,
    actief INTEGER NOT NULL DEFAULT 1,
    rekening TEXT DEFAULT NULL,
    omschrijving_pattern TEXT DEFAULT NULL,
    min_bedrag REAL DEFAULT NULL,
    max_bedrag REAL DEFAULT NULL,
    categorie_actie TEXT DEFAULT NULL,
    markeer_vaste_last INTEGER DEFAULT NULL,
    laatst_getriggerd_op TEXT DEFAULT NULL,
    aangemaakt_op TEXT NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS instellingen (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS uitgavepatronen (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jaar INTEGER NOT NULL,
    maand INTEGER NOT NULL,
    categorie TEXT,
    totaal REAL,
    patroon_type TEXT,
    redenering TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS vaste_lasten_index (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    naam TEXT NOT NULL,
    bedrag REAL NOT NULL,
    rekening TEXT,
    frequentie TEXT,
    omschrijving TEXT,
    actief INTEGER NOT NULL DEFAULT 1,
    ingevoerd_op TEXT DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS schulden (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    naam TEXT NOT NULL,
    bedrag REAL NOT NULL,
    rente REAL,
    maandbedrag REAL,
    looptijd TEXT,
    status TEXT,
    imported_on TEXT DEFAULT (datetime('now'))
  )
`);

const insertDefaultInstelling = db.prepare(`
  INSERT OR IGNORE INTO instellingen (key, value)
  VALUES (@key, @value)
`);

insertDefaultInstelling.run({
  key: "regels_automatisch_toepassen",
  value: "1",
});

export default db;
