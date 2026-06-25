"""Hospital Insurance Connector — FastAPI backend.

Run:  uvicorn app.main:app --reload  (from the backend/ directory)
Docs: http://localhost:8000/docs
"""
import os
import csv
import io
import uuid
import shutil
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Header, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from . import schemas
from .database import db_cursor, init_db
from .security import (
    APP_ENV,
    create_token,
    decode_token,
    hash_password,
    verify_password,
)

# Directory where static CSV files live
CSV_DIR = os.path.join(os.path.dirname(__file__), "csv")
os.makedirs(CSV_DIR, exist_ok=True)

# Directory where patient-uploaded documents (policy proofs, prescription
# scans) are stored on disk. Files are namespaced per patient.
UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

# Directory where hospital photos are stored
HOSPITAL_PHOTOS_DIR = os.path.join(UPLOADS_DIR, "hospital_photos")
os.makedirs(HOSPITAL_PHOTOS_DIR, exist_ok=True)

ALLOWED_DOC_TYPES = {"policy", "prescription"}
ALLOWED_DOC_MIME = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/png": ".png",
}
ALLOWED_PHOTO_MIME = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}
MAX_DOC_SIZE_BYTES = 10 * 1024 * 1024   # 10 MB
MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB

ALLOWED_ORIGINS = os.environ.get(
    "ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"
).split(",")

ADMIN_SEED_PASSWORD = os.environ.get("ADMIN_SEED_PASSWORD", "admin123")
if APP_ENV != "development" and ADMIN_SEED_PASSWORD == "admin123":
    raise RuntimeError(
        "ADMIN_SEED_PASSWORD must be changed from the default in production."
    )


# ── Lifespan ───────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    _seed_admin()
    _seed_from_csv()
    yield


app = FastAPI(
    title="Hospital Insurance Connector API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve hospital photos as static files
app.mount("/hospital-photos", StaticFiles(directory=HOSPITAL_PHOTOS_DIR), name="hospital-photos")


# ── Seed helpers ───────────────────────────────────────────────────────────
def _seed_admin() -> None:
    """Ensure the default admin account exists."""
    with db_cursor() as cur:
        cur.execute("SELECT id FROM admins WHERE email = ?", ("admin@connector.io",))
        if cur.fetchone() is None:
            cur.execute(
                "INSERT INTO admins (full_name, email, password_hash) VALUES (?,?,?)",
                ("Tech Admin", "admin@connector.io", hash_password(ADMIN_SEED_PASSWORD)),
            )


def _seed_from_csv() -> None:
    """
    Seed patients and hospitals from the CSV files on every startup.
    - Only rows present in the CSV are allowed to log in.
    - Each CSV now carries a Password column; if absent we fall back to a
      role-wide default so existing deployments keep working.
    """
    patient_csv = os.path.join(CSV_DIR, "patient_dummy_data.csv")
    hospital_csv = os.path.join(CSV_DIR, "hospital_dummy_data.csv")

    # ── Patients ──────────────────────────────────────────────────────────
    if os.path.exists(patient_csv):
        with open(patient_csv, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            with db_cursor() as cur:
                cur.execute("DELETE FROM patients WHERE csv_seeded = 1")
                for row in reader:
                    email = (row.get("Email") or "").strip()
                    if not email:
                        continue
                    password = (row.get("Password") or "patient@1234").strip()
                    name = (row.get("Full Name") or "").strip()
                    phone = (row.get("Mobile Number") or "").strip()
                    address = (row.get("Address") or "").strip()
                    age = (row.get("Age") or "").strip()
                    blood_group = (row.get("Blood Group") or "").strip()
                    try:
                        cur.execute(
                            """INSERT INTO patients
                               (full_name, email, password_hash, phone, city, dob, blood_group, csv_seeded)
                               VALUES (?,?,?,?,?,?,?,1)""",
                            (name, email, hash_password(password), phone, address, age, blood_group),
                        )
                    except Exception:
                        pass

    # ── Hospitals ─────────────────────────────────────────────────────────
    if os.path.exists(hospital_csv):
        with open(hospital_csv, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            with db_cursor() as cur:
                cur.execute("DELETE FROM hospitals WHERE csv_seeded = 1")
                for row in reader:
                    email = (row.get("Email") or "").strip()
                    if not email:
                        continue
                    password = (row.get("Password") or "hospital@1234").strip()
                    name = (row.get("Hospital Full Name") or "").strip()
                    phone = (row.get("Landline Number 1") or "").strip()
                    address = (row.get("Full Hospital Address") or "").strip()
                    try:
                        cur.execute(
                            """INSERT INTO hospitals
                               (name, email, password_hash, city, phone, specialties,
                                description, status, csv_seeded)
                               VALUES (?,?,?,?,?,?,?,?,1)""",
                            (name, email, hash_password(password), address, phone,
                             "", "", "approved"),
                        )
                    except Exception:
                        pass


# ── Auth dependency ────────────────────────────────────────────────────────
def current_user(authorization: str = Header(default="")) -> dict:
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing bearer token")
    payload = decode_token(authorization[7:])
    if not payload:
        raise HTTPException(401, "Invalid or expired token")
    return payload


def require_role(*roles: str):
    def _checker(user: dict = Depends(current_user)) -> dict:
        if user["role"] not in roles:
            raise HTTPException(403, "Forbidden for this role")
        return user
    return _checker


def _row(cur, query, params=()):
    cur.execute(query, params)
    r = cur.fetchone()
    return dict(r) if r else None


def _rows(cur, query, params=()):
    cur.execute(query, params)
    return [dict(r) for r in cur.fetchall()]


# ── Health ─────────────────────────────────────────────────────────────────
@app.get("/api/health")
def health():
    return {"status": "ok", "service": "hospital-insurance-connector"}


# ════════════════════════════════════════════════════════════════════════════
#  AUTH
# ════════════════════════════════════════════════════════════════════════════
@app.post("/api/auth/login", response_model=schemas.TokenResponse)
def login(body: schemas.LoginRequest):
    table = {"patient": "patients", "hospital": "hospitals", "admin": "admins"}[body.role]
    name_col = "name" if body.role == "hospital" else "full_name"
    with db_cursor() as cur:
        user = _row(cur, f"SELECT * FROM {table} WHERE email = ?", (body.email,))
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(401, "Invalid credentials")
    token = create_token(user_id=user["id"], role=body.role, email=body.email)
    return schemas.TokenResponse(
        token=token, role=body.role, name=user[name_col], user_id=user["id"]
    )


@app.get("/api/auth/me")
def me(user: dict = Depends(current_user)):
    return {"user_id": user["sub"], "role": user["role"], "email": user["email"]}


# ════════════════════════════════════════════════════════════════════════════
#  PATIENT
# ════════════════════════════════════════════════════════════════════════════
@app.get("/api/patient/me")
def patient_me(user: dict = Depends(require_role("patient"))):
    with db_cursor() as cur:
        p = _row(cur,
            "SELECT id, full_name, email, phone, city, dob, blood_group, created_at FROM patients WHERE id = ?",
            (user["sub"],))
    if not p:
        raise HTTPException(404, "Patient not found")
    return p


@app.get("/api/patient/policies")
def list_policies(user: dict = Depends(require_role("patient"))):
    with db_cursor() as cur:
        return _rows(cur, "SELECT * FROM policies WHERE patient_id = ? ORDER BY id DESC", (user["sub"],))


@app.post("/api/patient/policies", status_code=201)
def add_policy(body: schemas.PolicyCreate, user: dict = Depends(require_role("patient"))):
    with db_cursor() as cur:
        doc = _row(
            cur,
            "SELECT * FROM documents WHERE id = ? AND patient_id = ? AND doc_type = 'policy'",
            (body.document_id, user["sub"]),
        )
        if not doc:
            raise HTTPException(400, "Upload your policy document before adding the policy")
        cur.execute(
            """INSERT INTO policies (patient_id, insurer, policy_number, policy_type, sum_insured, valid_till, document_id)
               VALUES (?,?,?,?,?,?,?)""",
            (user["sub"], body.insurer, body.policy_number, body.policy_type,
             body.sum_insured, body.valid_till, body.document_id),
        )
        return _row(cur, "SELECT * FROM policies WHERE id = ?", (cur.lastrowid,))


@app.delete("/api/patient/policies/{policy_id}", status_code=204)
def delete_policy(policy_id: int, user: dict = Depends(require_role("patient"))):
    with db_cursor() as cur:
        cur.execute("DELETE FROM policies WHERE id = ? AND patient_id = ?", (policy_id, user["sub"]))


@app.get("/api/patient/prescriptions")
def list_prescriptions(user: dict = Depends(require_role("patient"))):
    with db_cursor() as cur:
        return _rows(cur, "SELECT * FROM prescriptions WHERE patient_id = ? ORDER BY id DESC", (user["sub"],))


@app.post("/api/patient/prescriptions", status_code=201)
def add_prescription(body: schemas.PrescriptionCreate, user: dict = Depends(require_role("patient"))):
    with db_cursor() as cur:
        if body.document_id is not None:
            doc = _row(
                cur,
                "SELECT * FROM documents WHERE id = ? AND patient_id = ? AND doc_type = 'prescription'",
                (body.document_id, user["sub"]),
            )
            if not doc:
                raise HTTPException(400, "Document not found")
        cur.execute(
            """INSERT INTO prescriptions (patient_id, doctor_name, diagnosis, medications, notes, document_id)
               VALUES (?,?,?,?,?,?)""",
            (user["sub"], body.doctor_name, body.diagnosis, body.medications, body.notes, body.document_id),
        )
        return _row(cur, "SELECT * FROM prescriptions WHERE id = ?", (cur.lastrowid,))


@app.delete("/api/patient/prescriptions/{rx_id}", status_code=204)
def delete_prescription(rx_id: int, user: dict = Depends(require_role("patient"))):
    with db_cursor() as cur:
        cur.execute("DELETE FROM prescriptions WHERE id = ? AND patient_id = ?", (rx_id, user["sub"]))


# ── Documents (policy proof / prescription scans) ──────────────────────────
@app.get("/api/patient/documents")
def list_documents(user: dict = Depends(require_role("patient"))):
    with db_cursor() as cur:
        return _rows(cur,
            "SELECT * FROM documents WHERE patient_id = ? ORDER BY id DESC",
            (user["sub"],))


@app.post("/api/patient/documents", status_code=201)
async def upload_document(
    doc_type: str = Form(...),
    file: UploadFile = File(...),
    user: dict = Depends(require_role("patient")),
):
    if doc_type not in ALLOWED_DOC_TYPES:
        raise HTTPException(400, "doc_type must be 'policy' or 'prescription'")

    mime = file.content_type or ""
    ext = ALLOWED_DOC_MIME.get(mime)
    if not ext:
        raise HTTPException(415, "Only PDF, JPG, and PNG files are supported")

    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(400, "Uploaded file is empty")
    if len(contents) > MAX_DOC_SIZE_BYTES:
        raise HTTPException(413, "File exceeds the 10MB limit")

    patient_dir = os.path.join(UPLOADS_DIR, str(user["sub"]))
    os.makedirs(patient_dir, exist_ok=True)
    stored_filename = f"{uuid.uuid4().hex}{ext}"
    with open(os.path.join(patient_dir, stored_filename), "wb") as out:
        out.write(contents)

    with db_cursor() as cur:
        cur.execute(
            """INSERT INTO documents
               (patient_id, doc_type, original_filename, stored_filename, mime_type, size_bytes)
               VALUES (?,?,?,?,?,?)""",
            (user["sub"], doc_type, file.filename or stored_filename,
             stored_filename, mime, len(contents)),
        )
        return _row(cur, "SELECT * FROM documents WHERE id = ?", (cur.lastrowid,))


@app.get("/api/patient/documents/{doc_id}/file")
def download_document(doc_id: int, user: dict = Depends(require_role("patient"))):
    with db_cursor() as cur:
        doc = _row(cur,
            "SELECT * FROM documents WHERE id = ? AND patient_id = ?",
            (doc_id, user["sub"]))
    if not doc:
        raise HTTPException(404, "Document not found")
    path = os.path.join(UPLOADS_DIR, str(user["sub"]), doc["stored_filename"])
    if not os.path.exists(path):
        raise HTTPException(404, "File missing on server")
    return FileResponse(path, media_type=doc["mime_type"], filename=doc["original_filename"])


@app.delete("/api/patient/documents/{doc_id}", status_code=204)
def delete_document(doc_id: int, user: dict = Depends(require_role("patient"))):
    with db_cursor() as cur:
        doc = _row(cur,
            "SELECT * FROM documents WHERE id = ? AND patient_id = ?",
            (doc_id, user["sub"]))
        if not doc:
            return
        path = os.path.join(UPLOADS_DIR, str(user["sub"]), doc["stored_filename"])
        if os.path.exists(path):
            os.remove(path)
        cur.execute("DELETE FROM documents WHERE id = ? AND patient_id = ?", (doc_id, user["sub"]))


@app.get("/api/patient/hospitals")
def patient_hospitals(user: dict = Depends(require_role("patient"))):
    with db_cursor() as cur:
        return _rows(cur,
            """SELECT id, name, city, phone, specialties, description, photo_url
               FROM hospitals WHERE status = 'approved' ORDER BY name""")


@app.get("/api/patient/hospitals/{hospital_id}/procedures",
         response_model=list[schemas.HospitalProcedure])
def patient_hospital_procedures(hospital_id: int, user: dict = Depends(require_role("patient"))):
    with db_cursor() as cur:
        h = _row(cur, "SELECT id FROM hospitals WHERE id = ?", (hospital_id,))
        if not h:
            raise HTTPException(404, "Hospital not available")
        return _rows(cur,
            """SELECT id, hospital_id, procedure_name, specialty, avg_cost,
                      success_rate_percent, avg_days_stay, notes
               FROM hospital_procedures WHERE hospital_id = ?
               ORDER BY specialty, procedure_name""", (hospital_id,))


@app.post("/api/patient/quote-requests", status_code=201)
def create_quote_request(body: schemas.QuoteRequestCreate, user: dict = Depends(require_role("patient"))):
    with db_cursor() as cur:
        h = _row(cur, "SELECT id FROM hospitals WHERE id = ?", (body.hospital_id,))
        if not h:
            raise HTTPException(404, "Hospital not available")
        cur.execute(
            """INSERT INTO quote_requests (patient_id, hospital_id, prescription_id, policy_id, treatment_needed, message)
               VALUES (?,?,?,?,?,?)""",
            (user["sub"], body.hospital_id, body.prescription_id, body.policy_id,
             body.treatment_needed, body.message),
        )
        return _row(cur, "SELECT * FROM quote_requests WHERE id = ?", (cur.lastrowid,))


@app.get("/api/patient/quote-requests")
def patient_quote_requests(user: dict = Depends(require_role("patient"))):
    with db_cursor() as cur:
        return _rows(cur, """
            SELECT qr.*, h.name AS hospital_name, h.city AS hospital_city, h.photo_url AS hospital_photo_url
            FROM quote_requests qr JOIN hospitals h ON h.id = qr.hospital_id
            WHERE qr.patient_id = ? ORDER BY qr.id DESC""", (user["sub"],))


@app.get("/api/patient/quote-requests/{id}")
def patient_quote_request_detail(id: int, user: dict = Depends(require_role("patient"))):
    with db_cursor() as cur:
        row = _row(cur, """
            SELECT qr.*, h.name AS hospital_name, h.city AS hospital_city,
                   h.photo_url AS hospital_photo_url,
                   rx.diagnosis, rx.medications, rx.doctor_name,
                   pol.insurer, pol.policy_number, pol.sum_insured, pol.policy_type
            FROM quote_requests qr
            JOIN hospitals h ON h.id = qr.hospital_id
            LEFT JOIN prescriptions rx ON rx.id = qr.prescription_id
            LEFT JOIN policies pol ON pol.id = qr.policy_id
            WHERE qr.id = ? AND qr.patient_id = ?""", (id, user["sub"]))
        if not row:
            raise HTTPException(404, "Request not found")
        quotes = _rows(cur, "SELECT * FROM quotes WHERE request_id = ? ORDER BY id DESC", (id,))
    return {**row, "quotes": quotes}


@app.put("/api/patient/quote-requests/{id}/close")
def patient_close_quote_request(id: int, user: dict = Depends(require_role("patient"))):
    with db_cursor() as cur:
        row = _row(cur, "SELECT * FROM quote_requests WHERE id = ? AND patient_id = ?",
                   (id, user["sub"]))
        if not row:
            raise HTTPException(404, "Request not found")
        if row["status"] != "pending":
            raise HTTPException(400, "Only pending requests can be closed")
        cur.execute("UPDATE quote_requests SET status = 'closed' WHERE id = ?", (id,))
        return _row(cur, "SELECT * FROM quote_requests WHERE id = ?", (id,))


@app.get("/api/patient/quotes")
def patient_quotes(user: dict = Depends(require_role("patient"))):
    with db_cursor() as cur:
        return _rows(cur, """
            SELECT q.*, qr.treatment_needed, h.name AS hospital_name, h.photo_url AS hospital_photo_url
            FROM quotes q
            JOIN quote_requests qr ON qr.id = q.request_id
            JOIN hospitals h ON h.id = q.hospital_id
            WHERE qr.patient_id = ? ORDER BY q.id DESC""", (user["sub"],))


# ════════════════════════════════════════════════════════════════════════════
#  HOSPITAL
# ════════════════════════════════════════════════════════════════════════════
@app.get("/api/hospital/profile")
def hospital_profile(user: dict = Depends(require_role("hospital"))):
    with db_cursor() as cur:
        h = _row(cur,
            """SELECT id, name, email, city, phone, specialties, description,
                      photo_url, status, created_at
               FROM hospitals WHERE id = ?""", (user["sub"],))
    if not h:
        raise HTTPException(404, "Hospital not found")
    return h


_ALLOWED_PROFILE_FIELDS = {"name", "city", "phone", "specialties", "description"}


@app.put("/api/hospital/profile")
def update_hospital_profile(body: schemas.HospitalProfileUpdate, user: dict = Depends(require_role("hospital"))):
    fields = {k: v for k, v in body.model_dump().items() if v is not None and k in _ALLOWED_PROFILE_FIELDS}
    if fields:
        sets = ", ".join(f"{k} = ?" for k in fields)
        with db_cursor() as cur:
            cur.execute(f"UPDATE hospitals SET {sets} WHERE id = ?", (*fields.values(), user["sub"]))
    return hospital_profile(user)


# ── Hospital photo upload ──────────────────────────────────────────────────
@app.post("/api/hospital/upload-photo")
async def upload_hospital_photo(
    file: UploadFile = File(...),
    user: dict = Depends(require_role("hospital")),
):
    mime = file.content_type or ""
    ext = ALLOWED_PHOTO_MIME.get(mime)
    if not ext:
        raise HTTPException(415, "Only JPG, PNG, and WebP images are supported")

    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(400, "Uploaded file is empty")
    if len(contents) > MAX_PHOTO_SIZE_BYTES:
        raise HTTPException(413, "Photo exceeds the 5MB limit")

    # Delete old photo file if exists
    with db_cursor() as cur:
        existing = _row(cur, "SELECT photo_url FROM hospitals WHERE id = ?", (user["sub"],))
    if existing and existing.get("photo_url"):
        old_filename = existing["photo_url"].split("/")[-1]
        old_path = os.path.join(HOSPITAL_PHOTOS_DIR, old_filename)
        if os.path.exists(old_path):
            os.remove(old_path)

    filename = f"hospital_{user['sub']}_{uuid.uuid4().hex[:8]}{ext}"
    filepath = os.path.join(HOSPITAL_PHOTOS_DIR, filename)
    with open(filepath, "wb") as out:
        out.write(contents)

    photo_url = f"/hospital-photos/{filename}"
    with db_cursor() as cur:
        cur.execute("UPDATE hospitals SET photo_url = ? WHERE id = ?", (photo_url, user["sub"]))

    return {"photo_url": photo_url}


@app.get("/api/hospital/requests")
def hospital_requests(user: dict = Depends(require_role("hospital"))):
    with db_cursor() as cur:
        return _rows(cur, """
            SELECT qr.*, p.full_name AS patient_name, p.city AS patient_city,
                   rx.diagnosis, rx.medications, rx.doctor_name,
                   pol.insurer, pol.policy_number, pol.sum_insured, pol.policy_type,
                   (SELECT COUNT(*) FROM quotes q WHERE q.request_id = qr.id) AS quote_count
            FROM quote_requests qr
            JOIN patients p ON p.id = qr.patient_id
            LEFT JOIN prescriptions rx ON rx.id = qr.prescription_id
            LEFT JOIN policies pol ON pol.id = qr.policy_id
            WHERE qr.hospital_id = ? ORDER BY qr.id DESC""", (user["sub"],))


@app.get("/api/hospital/quote-requests")
def hospital_quote_requests_alias(user: dict = Depends(require_role("hospital"))):
    return hospital_requests(user)


@app.put("/api/hospital/quote-requests/{id}/status")
def hospital_update_quote_status(id: int, body: schemas.QuoteRequestStatusUpdate, user: dict = Depends(require_role("hospital"))):
    with db_cursor() as cur:
        req = _row(cur, "SELECT * FROM quote_requests WHERE id = ? AND hospital_id = ?",
                   (id, user["sub"]))
        if not req:
            raise HTTPException(404, "Request not found")
        if req["status"] != "pending":
            raise HTTPException(400, "Only pending requests can be updated")
        new_status = "quoted" if body.status == "accepted" else "declined"
        cur.execute("UPDATE quote_requests SET status = ? WHERE id = ?", (new_status, id))
        return _row(cur, "SELECT * FROM quote_requests WHERE id = ?", (id,))


@app.post("/api/hospital/quotes", status_code=201)
def issue_quote(body: schemas.QuoteCreate, user: dict = Depends(require_role("hospital"))):
    with db_cursor() as cur:
        req = _row(cur, "SELECT * FROM quote_requests WHERE id = ? AND hospital_id = ?",
                   (body.request_id, user["sub"]))
        if not req:
            raise HTTPException(404, "Request not found")
        cur.execute(
            """INSERT INTO quotes (request_id, hospital_id, estimated_cost, insurance_covered, out_of_pocket, validity_days, notes)
               VALUES (?,?,?,?,?,?,?)""",
            (body.request_id, user["sub"], body.estimated_cost, body.insurance_covered,
             body.out_of_pocket, body.validity_days, body.notes),
        )
        quote = _row(cur, "SELECT * FROM quotes WHERE id = ?", (cur.lastrowid,))
        cur.execute("UPDATE quote_requests SET status = 'quoted' WHERE id = ?", (body.request_id,))
    return quote


@app.get("/api/hospital/quotes")
def hospital_quotes(user: dict = Depends(require_role("hospital"))):
    with db_cursor() as cur:
        return _rows(cur, """
            SELECT q.*, qr.treatment_needed, p.full_name AS patient_name
            FROM quotes q
            JOIN quote_requests qr ON qr.id = q.request_id
            JOIN patients p ON p.id = qr.patient_id
            WHERE q.hospital_id = ? ORDER BY q.id DESC""", (user["sub"],))


@app.delete("/api/hospital/quotes/{quote_id}", status_code=204)
def hospital_delete_quote(quote_id: int, user: dict = Depends(require_role("hospital"))):
    with db_cursor() as cur:
        quote = _row(cur, "SELECT * FROM quotes WHERE id = ? AND hospital_id = ?", (quote_id, user["sub"]))
        if not quote:
            raise HTTPException(404, "Quote not found")
        cur.execute("DELETE FROM quotes WHERE id = ?", (quote_id,))
        cur.execute("UPDATE quote_requests SET status = 'pending' WHERE id = ?", (quote["request_id"],))


# ════════════════════════════════════════════════════════════════════════════
#  ADMIN
# ════════════════════════════════════════════════════════════════════════════
@app.get("/api/admin/stats")
def admin_stats(user: dict = Depends(require_role("admin"))):
    with db_cursor() as cur:
        def count(t):
            cur.execute(f"SELECT COUNT(*) AS c FROM {t}")
            return cur.fetchone()["c"]
        cur.execute("SELECT COUNT(*) AS c FROM hospitals WHERE status = 'pending'")
        pending = cur.fetchone()["c"]
        cur.execute("SELECT COALESCE(SUM(estimated_cost),0) AS s FROM quotes")
        quoted_value = cur.fetchone()["s"]
        return {
            "patients": count("patients"),
            "hospitals": count("hospitals"),
            "pending_hospitals": pending,
            "quote_requests": count("quote_requests"),
            "quotes": count("quotes"),
            "total_quoted_value": quoted_value,
        }


@app.get("/api/admin/hospitals")
def admin_hospitals(user: dict = Depends(require_role("admin"))):
    with db_cursor() as cur:
        return _rows(cur,
            "SELECT id, name, email, city, phone, specialties, photo_url, status, created_at FROM hospitals ORDER BY id DESC")


@app.get("/api/admin/hospitals/{hospital_id}")
def admin_hospital_detail(hospital_id: int, user: dict = Depends(require_role("admin"))):
    with db_cursor() as cur:
        h = _row(cur,
            """SELECT id, name, email, city, phone, specialties, description,
                      photo_url, status, created_at
               FROM hospitals WHERE id = ?""", (hospital_id,))
        if not h:
            raise HTTPException(404, "Hospital not found")
        quotes = _rows(cur, """
            SELECT COUNT(*) as total_quotes, COALESCE(SUM(q.estimated_cost), 0) as total_quoted
            FROM quotes q JOIN quote_requests qr ON q.request_id = qr.id
            WHERE qr.hospital_id = ?""", (hospital_id,))
        requests = _rows(cur, """
            SELECT COUNT(*) as total_requests,
                   SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_requests
            FROM quote_requests WHERE hospital_id = ?""", (hospital_id,))
        h["stats"] = {
            "total_quotes": quotes[0]["total_quotes"] if quotes else 0,
            "total_quoted": quotes[0]["total_quoted"] if quotes else 0,
            "total_requests": requests[0]["total_requests"] if requests else 0,
            "pending_requests": requests[0]["pending_requests"] if requests else 0,
        }
    return h


@app.put("/api/admin/hospitals/{hospital_id}/status")
def set_hospital_status(hospital_id: int, body: schemas.HospitalStatusUpdate, user: dict = Depends(require_role("admin"))):
    with db_cursor() as cur:
        cur.execute("UPDATE hospitals SET status = ? WHERE id = ?", (body.status, hospital_id))
        h = _row(cur, "SELECT id, name, status FROM hospitals WHERE id = ?", (hospital_id,))
    if not h:
        raise HTTPException(404, "Hospital not found")
    return h


@app.get("/api/admin/patients")
def admin_patients(user: dict = Depends(require_role("admin"))):
    with db_cursor() as cur:
        return _rows(cur,
            "SELECT id, full_name, email, phone, city, created_at FROM patients ORDER BY id DESC")


@app.get("/api/admin/requests")
def admin_requests(user: dict = Depends(require_role("admin"))):
    with db_cursor() as cur:
        return _rows(cur, """
            SELECT qr.id, qr.treatment_needed, qr.status, qr.created_at,
                   p.full_name AS patient_name, h.name AS hospital_name
            FROM quote_requests qr
            JOIN patients p ON p.id = qr.patient_id
            JOIN hospitals h ON h.id = qr.hospital_id
            ORDER BY qr.id DESC""")


@app.get("/api/admin/quotes")
def admin_quotes(user: dict = Depends(require_role("admin"))):
    with db_cursor() as cur:
        return _rows(cur, """
            SELECT q.id, q.estimated_cost, q.insurance_covered, q.out_of_pocket,
                   q.validity_days, q.notes, q.created_at, qr.treatment_needed,
                   p.full_name AS patient_name, h.name AS hospital_name
            FROM quotes q
            JOIN quote_requests qr ON qr.id = q.request_id
            JOIN patients p ON p.id = qr.patient_id
            JOIN hospitals h ON h.id = q.hospital_id
            ORDER BY q.id DESC""")


@app.post("/api/admin/admins", status_code=201)
def create_admin(body: schemas.AdminCreate, user: dict = Depends(require_role("admin"))):
    with db_cursor() as cur:
        cur.execute("SELECT id FROM admins WHERE email = ?", (body.email,))
        if cur.fetchone():
            raise HTTPException(409, "Email already registered")
        cur.execute(
            "INSERT INTO admins (full_name, email, password_hash) VALUES (?,?,?)",
            (body.full_name, body.email, hash_password(body.password)),
        )
        return _row(cur, "SELECT id, full_name, email, created_at FROM admins WHERE id = ?",
                    (cur.lastrowid,))