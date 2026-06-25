"""Pydantic request/response models."""
from typing import Optional
from pydantic import BaseModel, Field



# ── Auth ───────────────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: str
    password: str
    role: str = Field(pattern="^(patient|hospital|admin)$")


class TokenResponse(BaseModel):
    token: str
    role: str
    name: str
    user_id: int


# ── Patient setup ──────────────────────────────────────────────────────────
class PatientRegister(BaseModel):
    full_name: str
    email: str
    password: str = Field(min_length=6)
    phone: Optional[str] = None
    city: Optional[str] = None
    dob: Optional[str] = None


class PolicyCreate(BaseModel):
    insurer: str
    policy_number: str
    policy_type: Optional[str] = None
    sum_insured: float = 0
    valid_till: Optional[str] = None
    document_id: int


class PrescriptionCreate(BaseModel):
    doctor_name: Optional[str] = None
    diagnosis: str
    medications: Optional[str] = None
    notes: Optional[str] = None
    document_id: Optional[int] = None


# ── Hospital setup ─────────────────────────────────────────────────────────
class HospitalRegister(BaseModel):
    name: str
    email: str
    password: str = Field(min_length=6)
    city: Optional[str] = None
    phone: Optional[str] = None
    specialties: Optional[str] = None
    description: Optional[str] = None


class HospitalProfileUpdate(BaseModel):
    name: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None
    specialties: Optional[str] = None
    description: Optional[str] = None


class HospitalProcedure(BaseModel):
    id: int
    hospital_id: int
    procedure_name: str
    specialty: str
    avg_cost: float
    success_rate_percent: float
    avg_days_stay: int
    notes: Optional[str] = None


# ── Quote workflow ─────────────────────────────────────────────────────────
class QuoteRequestCreate(BaseModel):
    hospital_id: int
    prescription_id: Optional[int] = None
    policy_id: Optional[int] = None
    treatment_needed: str
    message: Optional[str] = None


class QuoteRequestStatusUpdate(BaseModel):
    status: str = Field(pattern="^(accepted|declined)$")

class HospitalStatusUpdate(BaseModel):
    status: str = Field(pattern="^(pending|approved|suspended|quoted|declined|closed)$")

# ── Admin setup ────────────────────────────────────────────────────────────
class QuoteCreate(BaseModel):
    request_id: int
    estimated_cost: float
    insurance_covered: float = 0
    out_of_pocket: float = 0
    validity_days: int = 30
    notes: Optional[str] = None


class AdminCreate(BaseModel):
    full_name: str
    email: str
    password: str = Field(min_length=6)