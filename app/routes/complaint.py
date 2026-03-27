# from fastapi import APIRouter
# from app.models import Complaint
# from app.database import complaints_collection
# from app.services.ticket_service import generate_ticket

# router = APIRouter()

# @router.get("/registerComplaint")
# def register_complaint(data: Complaint):
    
#     ticket_id, timestamp = generate_ticket()

#     complaint_data = data.dict()
#     complaint_data["ticket_id"] = ticket_id
#     complaint_data["timestamp"] = timestamp
#     complaint_data["status"] = "pending"

#     complaints_collection.insert_one(complaint_data)

#     return {
#         "status": "success",
#         "ticket_id": ticket_id,
#         "timestamp": timestamp,
#         "message": "Complaint registered successfully"
#     }

from fastapi import APIRouter
from app.models import Complaint
from app.database import complaints_collection
from app.services.ticket_service import generate_ticket

router = APIRouter()

ALLOWED_INTENTS = ["Garbage", "Water", "Electricity"]

# @router.get("/registerComplaint")
# def register_complaint(data: Complaint):

#     # ✅ Intent validation
#     if data.Intent not in ALLOWED_INTENTS:
#         return {"error": "Invalid complaint type"}

#     ticket_id, timestamp = generate_ticket()

#     complaint_data = data.dict()
#     complaint_data["ticket_id"] = ticket_id
#     complaint_data["timestamp"] = timestamp
#     complaint_data["status"] = "pending"   # 👈 default
#     complaint_data["cancelled"] = False

#     complaints_collection.insert_one(complaint_data)

#     return {
#         "status": "success",
#         "ticket_id": ticket_id,
#         "timestamp": timestamp,
#         "message": "Complaint registered successfully"
#     }


# @router.get("/registerComplaint")
# def register_complaint(data: Complaint):

#     # ✅ Intent validation
#     if data.Intent not in ALLOWED_INTENTS:
#         return {"error": "Invalid complaint type"}

#     ticket_id, timestamp = generate_ticket()

#     complaint_data = data.dict()
#     complaint_data["ticket_id"] = ticket_id
#     complaint_data["timestamp"] = timestamp
#     complaint_data["status"] = "pending"   # 👈 default
#     complaint_data["cancelled"] = False

#     complaints_collection.insert_one(complaint_data)

#     return {
#         "status": "success",
#         "ticket_id": ticket_id,
#         "timestamp": timestamp,
#         "message": "Complaint registered successfully"
#     }

from fastapi import APIRouter
from app.database import complaints_collection
from app.services.ticket_service import generate_ticket

router = APIRouter()

ALLOWED_INTENTS = ["Garbage", "Water", "Electricity"]

@router.get("/registerComplaint")
def register_complaint(
    Intent: str,
    source: str,
    language: str,
    location: str,
    userPhone: str,
    description: str
):

    # Intent validation
    if Intent not in ALLOWED_INTENTS:
        return {"error": "Invalid complaint type"}

    # Basic validation (extra safe)
    if not location.strip():
        return {"error": "Location is required"}

    if not userPhone.strip():
        return {"error": "Phone number is required"}

    # Ticket generate
    ticket_id, timestamp = generate_ticket()

    complaint_data = {
        "Intent": Intent,
        "source": source,
        "language": language,
        "location": location,
        "userPhone": userPhone,
        "description": description,
        "ticket_id": ticket_id,
        "timestamp": timestamp,
        "status": "pending",
        "cancelled": False
    }

    # Save in DB
    complaints_collection.insert_one(complaint_data)

    return {
        "status": "success",
        "ticket_id": ticket_id,
        "timestamp": timestamp,
        "message": "Complaint registered successfully"
    }