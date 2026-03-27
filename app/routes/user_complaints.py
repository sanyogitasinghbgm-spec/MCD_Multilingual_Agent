from fastapi import APIRouter
from app.database import complaints_collection

router = APIRouter()

# My Complaints 
@router.get("/user/my-complaints")
def get_my_complaints(phone: str):

    complaints = list(
        complaints_collection.find(
            {"userPhone": phone},
            {"_id": 0}
        )
    )

    return complaints


# Cancel Complaint
@router.put("/user/cancel-complaint")
def cancel_complaint(ticket_id: str, phone: str):

    complaint = complaints_collection.find_one({
        "ticket_id": ticket_id,
        "userPhone": phone
    })

    if not complaint:
        return {"message": "Complaint not found"}

    if complaint["status"] == "completed":
        return {"message": "Cannot cancel completed complaint"}

    complaints_collection.update_one(
        {"ticket_id": ticket_id},
        {"$set": {
            "status": "cancelled",
            "cancelled": True
        }}
    )

    return {"message": "Complaint cancelled successfully"}