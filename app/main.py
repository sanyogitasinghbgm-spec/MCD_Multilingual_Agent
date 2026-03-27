from fastapi import FastAPI
from app.routes import complaint, call, auth, admin, user_complaints
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="MCD AI Backend",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(complaint.router)
app.include_router(call.router)
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(user_complaints.router)

@app.get("/")
def home():
    return {"message": "MCD AI Backend Running"}