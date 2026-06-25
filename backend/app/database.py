"""SQLite database layer.

Three logical "setups" share one SQLite file but map to clearly separated
table groups:
  - Patient/Customer setup : patients, policies, prescriptions
  - Hospital setup         : hospitals
  - Shared workflow        : quote_requests, quotes
  - Tech/Admin setup       : admins
"""
import os
import sqlite3
from contextlib import contextmanager

DB_PATH = os.path.join(os.path.dirname(__file__), "connector.db")


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


@contextmanager
def db_cursor():
    conn = get_connection()
    try:
        yield conn.cursor()
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


SCHEMA = """
-- ── Patient / Customer setup ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patients (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name     TEXT    NOT NULL,
    email         TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL,
    phone         TEXT,
    city          TEXT,
    dob           TEXT,
    blood_group   TEXT,
    csv_seeded    INTEGER NOT NULL DEFAULT 0,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Uploaded documents (policy proof / prescription scans), patient setup
CREATE TABLE IF NOT EXISTS documents (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id       INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doc_type         TEXT    NOT NULL, -- 'policy' | 'prescription'
    original_filename TEXT   NOT NULL,
    stored_filename  TEXT    NOT NULL,
    mime_type        TEXT    NOT NULL,
    size_bytes       INTEGER NOT NULL DEFAULT 0,
    created_at       TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS policies (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id     INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    insurer        TEXT    NOT NULL,
    policy_number  TEXT    NOT NULL,
    policy_type    TEXT,
    sum_insured    REAL    NOT NULL DEFAULT 0,
    valid_till     TEXT,
    document_id    INTEGER REFERENCES documents(id) ON DELETE SET NULL,
    created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS prescriptions (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id    INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_name   TEXT,
    diagnosis     TEXT    NOT NULL,
    medications   TEXT,
    notes         TEXT,
    document_id   INTEGER REFERENCES documents(id) ON DELETE SET NULL,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ── Hospital setup ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hospitals (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT    NOT NULL,
    email         TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL,
    city          TEXT,
    phone         TEXT,
    specialties   TEXT,
    accepted_insurers TEXT,
    description   TEXT,
    photo_url     TEXT,
    -- pending | approved | suspended  (controlled by Tech/Admin setup)
    status        TEXT    NOT NULL DEFAULT 'pending',
    csv_seeded    INTEGER NOT NULL DEFAULT 0,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS hospital_procedures (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id          INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    procedure_name       TEXT    NOT NULL,
    specialty            TEXT    NOT NULL,
    avg_cost             REAL    NOT NULL DEFAULT 0,
    success_rate_percent REAL    NOT NULL DEFAULT 0,
    avg_days_stay        INTEGER NOT NULL DEFAULT 0,
    notes                TEXT
);

-- ── Shared quote workflow ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quote_requests (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id       INTEGER NOT NULL REFERENCES patients(id)  ON DELETE CASCADE,
    hospital_id      INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    prescription_id  INTEGER REFERENCES prescriptions(id) ON DELETE SET NULL,
    policy_id        INTEGER REFERENCES policies(id)      ON DELETE SET NULL,
    treatment_needed TEXT    NOT NULL,
    message          TEXT,
    -- pending | quoted | declined | closed
    status           TEXT    NOT NULL DEFAULT 'pending',
    created_at       TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS quotes (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id         INTEGER NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
    hospital_id        INTEGER NOT NULL REFERENCES hospitals(id)      ON DELETE CASCADE,
    estimated_cost     REAL    NOT NULL,
    insurance_covered  REAL    NOT NULL DEFAULT 0,
    out_of_pocket      REAL    NOT NULL DEFAULT 0,
    validity_days      INTEGER NOT NULL DEFAULT 30,
    notes              TEXT,
    created_at         TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ── Tech / Admin setup ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admins (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name     TEXT    NOT NULL,
    email         TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);
"""


def init_db() -> None:
    conn = get_connection()
    try:
        conn.executescript(SCHEMA)
        _ensure_column(conn, "hospitals", "accepted_insurers", "TEXT")
        _ensure_column(conn, "hospitals", "csv_seeded", "INTEGER NOT NULL DEFAULT 0")
        _ensure_column(conn, "patients", "blood_group", "TEXT")
        _ensure_column(conn, "patients", "csv_seeded", "INTEGER NOT NULL DEFAULT 0")
        _ensure_column(conn, "policies", "document_id", "INTEGER REFERENCES documents(id) ON DELETE SET NULL")
        _ensure_column(conn, "prescriptions", "document_id", "INTEGER REFERENCES documents(id) ON DELETE SET NULL")
        conn.commit()
    finally:
        conn.close()


def _ensure_column(
    conn: sqlite3.Connection,
    table: str,
    column: str,
    definition: str,
) -> None:
    columns = {row["name"] for row in conn.execute(f"PRAGMA table_info({table})")}
    if column not in columns:
        conn.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")