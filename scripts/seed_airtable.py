import json
import os
import random
import sys
import time
from datetime import datetime, timedelta, timezone
from urllib import request, parse


BASE_URL = "https://api.airtable.com/v0"
TABLES = {
    "patients": "Patients",
    "requests": "AppointmentRequests",
    "triage": "TriageResults",
    "appointments": "Appointments",
    "doctors": "Doctors",
}


def load_env_file():
    env_path = os.path.join(os.getcwd(), ".env")
    if not os.path.exists(env_path):
        env_path = os.path.join(os.getcwd(), ".env.local")
    if not os.path.exists(env_path):
        return
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            s = line.strip()
            if not s or s.startswith("#") or "=" not in s:
                continue
            k, v = s.split("=", 1)
            k = k.strip()
            v = v.strip().strip('"').strip("'")
            if k and k not in os.environ:
                os.environ[k] = v


def api_request(method, path, payload=None, query=None):
    api_key = os.environ.get("AIRTABLE_API_KEY", "")
    if not api_key:
        raise RuntimeError("AIRTABLE_API_KEY is missing")
    base_id = os.environ.get("AIRTABLE_BASE_ID", "")
    if not base_id:
        raise RuntimeError("AIRTABLE_BASE_ID is missing")

    url = f"{BASE_URL}/{base_id}/{parse.quote(path)}"
    if query:
        url += "?" + parse.urlencode(query)

    data = None
    headers = {"Authorization": f"Bearer {api_key}"}
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"

    req = request.Request(url, data=data, headers=headers, method=method)
    with request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))


def list_all_records(table_name):
    out = []
    offset = None
    while True:
        q = {"pageSize": 100}
        if offset:
            q["offset"] = offset
        res = api_request("GET", table_name, query=q)
        out.extend(res.get("records", []))
        offset = res.get("offset")
        if not offset:
            break
    return out


def delete_records(table_name, record_ids):
    for i in range(0, len(record_ids), 10):
        batch = record_ids[i:i + 10]
        q = [("records[]", rid) for rid in batch]
        url_q = "&".join([f"{parse.quote(k)}={parse.quote(v)}" for k, v in q])
        api_key = os.environ.get("AIRTABLE_API_KEY", "")
        base_id = os.environ.get("AIRTABLE_BASE_ID", "")
        url = f"{BASE_URL}/{base_id}/{parse.quote(table_name)}?{url_q}"
        req = request.Request(url, headers={"Authorization": f"Bearer {api_key}"}, method="DELETE")
        with request.urlopen(req):
            pass


def create_many(table_name, records):
    created = []
    for i in range(0, len(records), 10):
        batch = records[i:i + 10]
        payload = {"records": [{"fields": r} for r in batch], "typecast": True}
        res = api_request("POST", table_name, payload=payload)
        created.extend(res.get("records", []))
        time.sleep(0.05)
    return created


def reset_tables():
    for key in ["appointments", "triage", "requests", "doctors", "patients"]:
        table = TABLES[key]
        existing = list_all_records(table)
        if existing:
            delete_records(table, [r["id"] for r in existing])


def seed():
    random.seed(42)
    specialties = ["Cardiology", "Neurology", "Orthopedics", "General Practice", "Dermatology", "Dentistry"]
    urgencies = ["Low", "Medium", "High", "Critical"]
    departments = ["Cardiology", "Neurology", "Orthopedics", "General Medicine", "Dermatology", "Dentistry"]

    patient_records = []
    for i in range(1, 101):
        patient_records.append({
            "Name": f"Patient {i:03d}",
            "Email": f"patient{i:03d}@example.com",
            "Phone": f"+1-555-{1000 + i}",
        })
    patients = create_many(TABLES["patients"], patient_records)
    patient_ids = [r["id"] for r in patients]

    doctor_records = []
    for i in range(1, 101):
        sp = specialties[(i - 1) % len(specialties)]
        doctor_records.append({
            "Name": f"Doctor {i:03d}",
            "Specialty": sp,
            "Email": f"doctor{i:03d}@example.com",
            "Status": "Active" if i % 9 != 0 else "Inactive",
        })
    doctors = create_many(TABLES["doctors"], doctor_records)
    doctor_ids = [r["id"] for r in doctors]

    request_records = []
    for i in range(1, 101):
        p = patient_ids[(i - 1) % len(patient_ids)]
        spec = specialties[(i - 1) % len(specialties)]
        preferred = (datetime.now(timezone.utc) + timedelta(days=(i % 15))).date().isoformat()
        request_records.append({
            "Name": f"REQ-{i:04d}",
            "Patient": [p],
            "Symptoms": f"Symptoms case {i}: headache, fatigue",
            "PreferredDate": preferred,
            "Specialty": "General Medicine" if spec == "General Practice" else spec,
            "Status": "Pending" if i % 5 == 0 else "Scheduled",
        })
    requests = create_many(TABLES["requests"], request_records)
    request_ids = [r["id"] for r in requests]

    triage_records = []
    for i in range(1, 101):
        dept = departments[(i - 1) % len(departments)]
        triage_records.append({
            "Request": [request_ids[i - 1]],
            "Department": dept,
            "Urgency": urgencies[(i - 1) % len(urgencies)],
            "Confidence": (i % 10) + 1,
            "Reasoning": f"Auto generated triage reasoning #{i}",
        })
    triages = create_many(TABLES["triage"], triage_records)

    appointments_records = []
    for i in range(1, 101):
        dept = departments[(i - 1) % len(departments)]
        doctor_idx = (i - 1) % len(doctor_ids)
        starts = datetime.now(timezone.utc) + timedelta(days=(i % 20), hours=(i % 8))
        appointments_records.append({
            "Name": f"APPT-{i:04d}",
            "Patient": [patient_ids[(i - 1) % len(patient_ids)]],
            "Request": [request_ids[(i - 1) % len(request_ids)]],
            "Department": dept,
            "Doctor": [doctor_ids[doctor_idx]],
            "StartTime": starts.isoformat().replace("+00:00", "Z"),
            "Status": "Confirmed" if i % 7 else "Completed",
            "Urgency": urgencies[(i - 1) % len(urgencies)],
        })
    appts = create_many(TABLES["appointments"], appointments_records)

    print(json.dumps({
        "Patients": len(patients),
        "Doctors": len(doctors),
        "AppointmentRequests": len(requests),
        "TriageResults": len(triages),
        "Appointments": len(appts),
    }, indent=2))


def main():
    load_env_file()
    reset = "--no-reset" not in sys.argv
    if reset:
        reset_tables()
    seed()


if __name__ == "__main__":
    main()
