"""Seed the database with realistic demo data for all three setups.

Run from the backend/ directory:  python seed.py
"""
from app.database import db_cursor, init_db
from app.security import hash_password

HOSPITALS = [
    ("Apollo Speciality Hospital", "contact@apollo.io", "Mumbai", "+91-22-5550-1001",
     "Cardiology, Oncology, Orthopedics", "Multi-speciality tertiary care with cashless insurance desk.", "approved"),
    ("Fortis Health City", "desk@fortis.io", "Bengaluru", "+91-80-5550-2002",
     "Neurology, Nephrology, Transplants", "NABH-accredited quaternary care hospital.", "approved"),
    ("Sunrise Multispeciality", "hello@sunrise.io", "Pune", "+91-20-5550-3003",
     "General Surgery, Maternity, Pediatrics", "Community hospital with affordable care packages.", "pending"),
]

PROCEDURES = {
    "Apollo Speciality Hospital": [
        ("Coronary Angioplasty", "Cardiology", 185000, 94, 3, "Drug-eluting stent package with cardiac ICU monitoring."),
        ("CABG Bypass Surgery", "Cardiology", 420000, 91, 7, "Includes surgeon, ICU, consumables, and routine cardiac rehab planning."),
        ("Total Knee Replacement", "Orthopedics", 260000, 96, 5, "Single knee implant package with physiotherapy review."),
        ("Hip Replacement", "Orthopedics", 310000, 95, 5, "Cementless implant option with post-operative mobility support."),
        ("Breast Cancer Lumpectomy", "Oncology", 225000, 93, 3, "Surgical oncology package with pathology review."),
        ("Laparoscopic Gallbladder Removal", "General Surgery", 95000, 98, 2, "Minimally invasive cholecystectomy."),
        ("Cataract Surgery", "Ophthalmology", 52000, 99, 1, "Foldable lens day-care procedure."),
    ],
    "Fortis Health City": [
        ("Brain Tumor Resection", "Neurology", 540000, 89, 8, "Microsurgical resection with neuro ICU observation."),
        ("Spine Decompression Surgery", "Neurology", 335000, 92, 5, "Lumbar decompression package with post-op physiotherapy."),
        ("Kidney Transplant", "Nephrology", 780000, 88, 12, "Recipient surgery package excluding donor workup variability."),
        ("Dialysis Access Surgery", "Nephrology", 72000, 96, 1, "AV fistula creation for long-term dialysis access."),
        ("Liver Transplant", "Transplants", 2200000, 84, 18, "Complex transplant package with ICU stay estimate."),
        ("Deep Brain Stimulation", "Neurology", 1150000, 86, 6, "Device-assisted movement disorder procedure."),
    ],
    "Sunrise Multispeciality": [
        ("Normal Delivery", "Maternity", 65000, 97, 2, "Standard maternity package for low-risk pregnancies."),
        ("Cesarean Delivery", "Maternity", 115000, 96, 4, "Includes OT, anesthesia, and postnatal room stay."),
        ("Appendectomy", "General Surgery", 85000, 98, 2, "Laparoscopic appendix removal."),
        ("Hernia Repair", "General Surgery", 95000, 97, 2, "Mesh repair package for uncomplicated cases."),
        ("Pediatric Tonsillectomy", "Pediatrics", 70000, 95, 1, "Day-care ENT procedure for children."),
    ],
}

PATIENTS = [
    ("Riya Sharma", "riya@example.com", "Mumbai", "+91-98200-11111", "1991-04-12"),
    ("Arjun Mehta", "arjun@example.com", "Pune", "+91-98200-22222", "1985-09-30"),
]


def seed():
    init_db()
    with db_cursor() as cur:
        # Hospitals
        hospital_ids = {}
        for name, email, city, phone, spec, desc, status in HOSPITALS:
            cur.execute("SELECT id FROM hospitals WHERE email = ?", (email,))
            row = cur.fetchone()
            if row:
                hospital_ids[name] = row["id"]
                continue
            cur.execute(
                """INSERT INTO hospitals (name, email, password_hash, city, phone, specialties, description, status)
                   VALUES (?,?,?,?,?,?,?,?)""",
                (name, email, hash_password("hospital123"), city, phone, spec, desc, status),
            )
            hospital_ids[name] = cur.lastrowid

        # Procedure library
        for hospital_name, procedures in PROCEDURES.items():
            hospital_id = hospital_ids.get(hospital_name)
            if not hospital_id:
                continue
            cur.execute(
                "SELECT COUNT(*) AS c FROM hospital_procedures WHERE hospital_id = ?",
                (hospital_id,),
            )
            if cur.fetchone()["c"]:
                continue
            cur.executemany(
                """INSERT INTO hospital_procedures
                   (hospital_id, procedure_name, specialty, avg_cost, success_rate_percent, avg_days_stay, notes)
                   VALUES (?,?,?,?,?,?,?)""",
                [(hospital_id, *procedure) for procedure in procedures],
            )

        # Patients
        patient_ids = {}
        for full_name, email, city, phone, dob in PATIENTS:
            cur.execute("SELECT id FROM patients WHERE email = ?", (email,))
            row = cur.fetchone()
            if row:
                patient_ids[full_name] = row["id"]
                continue
            cur.execute(
                """INSERT INTO patients (full_name, email, password_hash, phone, city, dob)
                   VALUES (?,?,?,?,?,?)""",
                (full_name, email, hash_password("patient123"), phone, city, dob),
            )
            patient_ids[full_name] = cur.lastrowid

        riya = patient_ids.get("Riya Sharma")
        if riya:
            cur.execute("SELECT id FROM policies WHERE patient_id = ?", (riya,))
            if not cur.fetchone():
                cur.execute(
                    """INSERT INTO policies (patient_id, insurer, policy_number, policy_type, sum_insured, valid_till)
                       VALUES (?,?,?,?,?,?)""",
                    (riya, "Star Health", "SH-2291-8841", "Family Floater", 500000, "2027-03-31"),
                )
                pol_id = cur.lastrowid
                cur.execute(
                    """INSERT INTO prescriptions (patient_id, doctor_name, diagnosis, medications, notes)
                       VALUES (?,?,?,?,?)""",
                    (riya, "Dr. Kapoor", "Coronary artery disease — angioplasty advised",
                     "Aspirin 75mg, Atorvastatin 40mg", "Stent placement recommended within 30 days"),
                )
                rx_id = cur.lastrowid
                apollo = hospital_ids.get("Apollo Speciality Hospital")
                if apollo:
                    cur.execute(
                        """INSERT INTO quote_requests (patient_id, hospital_id, prescription_id, policy_id, treatment_needed, message)
                           VALUES (?,?,?,?,?,?)""",
                        (riya, apollo, rx_id, pol_id, "Coronary angioplasty with stent",
                         "Please share a cashless estimate against my Star Health policy."),
                    )

    print("Seed complete.")
    print("  Admin   : admin@connector.io / admin123")
    print("  Hospital: contact@apollo.io  / hospital123")
    print("  Patient : riya@example.com   / patient123")


if __name__ == "__main__":
    seed()
