from twilio.rest import Client
import os
from dotenv import load_dotenv

load_dotenv()

client = Client(
    os.getenv("TWILIO_ACCOUNT_SID"),
    os.getenv("TWILIO_AUTH_TOKEN")
)

def send_sms(to, message):
    client.messages.create(
        body=message,
        from_=os.getenv("TWILIO_PHONE"),
        to=to
    )