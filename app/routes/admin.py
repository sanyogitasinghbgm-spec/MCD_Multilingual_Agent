from fastapi import APIRouter
from app.services.vapi_service import make_call
from app.database import complaints_collection, users_collection

router = APIRouter()

# Dashboard Stats
@router.get("/admin/stats")
def get_stats():
    pending = complaints_collection.count_documents({"status": "pending"})
    in_progress = complaints_collection.count_documents({"status": "in_progress"})
    completed = complaints_collection.count_documents({"status": "completed"})

    return {
        "pending": pending,
        "in_progress": in_progress,
        "completed": completed
    }


# All Complaints
@router.get("/admin/complaints")
def get_all_complaints():
    complaints = list(complaints_collection.find({}, {"_id": 0}))
    return complaints


# Update Status
# @router.put("/admin/update-status")
# def update_status(ticket_id: str, status: str):
#     complaints_collection.update_one(
#         {"ticket_id": ticket_id},
#         {"$set": {"status": status}}
#     )

#     return {"message": "Status updated"}

@router.put("/admin/update-status")
def update_status(ticket_id: str, status: str):

    allowed_status = ["pending", "in_progress", "completed"]

    if status not in allowed_status:
        return {"error": "Invalid status"}

    complaints_collection.update_one(
        {"ticket_id": ticket_id},
        {"$set": {"status": status}}
    )

    return {"message": "Status updated"}


# # Campaign Trigger
# @router.post("/admin/start-campaign")
# def start_campaign(name: str, area: str, message: str):
#     return {
#         "message": f"Campaign '{name}' started for {area}",
#         "type": "voice_call"
#     }

@router.post("/admin/start-campaign")
def start_campaign(name: str, area: str, message: str):

    # 🔥 YAHI ADD KARNA HAI
    if area == "All":
        users = list(users_collection.find({}, {"_id": 0}))
    else:
        users = list(users_collection.find({"area": area}, {"_id": 0}))

    results = []

    for user in users:
        phone = user.get("phone")

        if phone:
            res = make_call(phone, message)

            results.append({
                "phone": phone,
                "status": res
            })

    return {
        "message": f"Campaign '{name}' started",
        "total_calls": len(results),
        "details": results
    }