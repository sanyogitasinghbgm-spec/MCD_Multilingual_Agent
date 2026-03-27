from fastapi import APIRouter

router = APIRouter()

# 🔁 Forward Call (VAPI karega actual transfer)
@router.get("/forwardCall")
def forward_call():
    return {
        "status": "success",
        "message": "Transfer triggered"
    }


# 📲 Outbound Call (VAPI karega actual call)
@router.get("/startOutboundCall")
def outbound_call(phone: str):
    return {
        "status": "triggered",
        "phone": phone
    }