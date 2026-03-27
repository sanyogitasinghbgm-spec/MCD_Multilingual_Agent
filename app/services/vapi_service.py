import requests
import os
from dotenv import load_dotenv

load_dotenv()

VAPI_API_KEY = os.getenv("VAPI_API_KEY")
ASSISTANT_ID = os.getenv("VAPI_ASSISTANT_ID")


def make_call(phone, message):

    url = "https://api.vapi.ai/call"

    payload = {
        "assistantId": ASSISTANT_ID,
        "phoneNumber": phone,
        "metadata": {
            "campaign_message": message   # 👈 ye pass kar rahe hain
        }
    }

    headers = {
        "Authorization": f"Bearer {VAPI_API_KEY}",
        "Content-Type": "application/json"
    }

    response = requests.post(url, json=payload, headers=headers)

    return response.json()