from fastapi import APIRouter
from app.database import users_collection, admins_collection
from app.models import UserRegister, UserLogin, AdminRegister, AdminLogin

router = APIRouter()

# GET /user/preferences?phone=...
@router.get("/user/preferences")
def get_preferences(phone: str):
    user = users_collection.find_one({"phone": phone}, {"_id": 0})
    if not user:
        return {"error": "User not found"}
    return {
        "dark_mode": user.get("dark_mode", False),
        "language": user.get("language", "hi")
    }


# PUT /user/preferences?phone=...&dark_mode=...&language=...
@router.put("/user/preferences")
def update_preferences(phone: str, dark_mode: bool = False, language: str = "hi"):
    user = users_collection.find_one({"phone": phone})
    if not user:
        return {"error": "User not found"}

    users_collection.update_one(
        {"phone": phone},
        {"$set": {
            "dark_mode": dark_mode,
            "language": language
        }}
    )
    return {"message": "Preferences updated", "dark_mode": dark_mode, "language": language}

# =========================
# USER (CITIZEN)
# =========================

@router.post("/user/register")
def register_user(data: UserRegister):
    existing = users_collection.find_one({"phone": data.phone})
    if existing:
        return {"message": "User already exists"}

    users_collection.insert_one(data.dict())
    return {"message": "User registered successfully"}


@router.post("/user/login")
def login_user(data: UserLogin):
    user = users_collection.find_one({"phone": data.phone})
    if not user:
        return {"message": "User not found"}

    return {"message": "Login successful", "user": data.phone}


@router.post("/user/logout")
def logout_user():
    return {"message": "User logged out"}


# =========================
# ADMIN
# =========================

@router.post("/admin/register")
def register_admin(data: AdminRegister):
    existing = admins_collection.find_one({"email": data.email})
    if existing:
        return {"message": "Admin already exists"}

    admins_collection.insert_one(data.dict())
    return {"message": "Admin registered successfully"}


@router.post("/admin/login")
def login_admin(data: AdminLogin):
    admin = admins_collection.find_one({"email": data.email})
    if not admin:
        return {"message": "Admin not found"}

    return {"message": "Admin login successful", "admin": data.email}


@router.post("/admin/logout")
def logout_admin():
    return {"message": "Admin logged out"}

