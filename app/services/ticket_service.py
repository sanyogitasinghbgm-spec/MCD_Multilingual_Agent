import uuid
from datetime import datetime

def generate_ticket():
    ticket_id = str(uuid.uuid4())[:8]
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    return ticket_id, timestamp