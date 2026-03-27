from pydantic import BaseModel

class Complaint(BaseModel):
    Intent: str
    source: str
    language: str
    location: str
    userPhone: str
    description: str

class UserRegister(BaseModel):
    name: str
    phone: str
    area: str 

class UserLogin(BaseModel):
    phone: str

class AdminRegister(BaseModel):
    name: str
    email: str

class AdminLogin(BaseModel):
    email: str

class Complaint(BaseModel):
    Intent: str   # Garbage / Water / Electricity
    source: str
    language: str
    location: str
    userPhone: str
    description: str