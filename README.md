# 🌐 MCD Multilingual Agent

An AI-powered multilingual voice calling agent built with a **FastAPI** Python backend, **Twilio** for telephony, **MongoDB** for data persistence, and a **JavaScript/TypeScript** frontend — enabling automated, intelligent phone conversations across multiple languages.

---

## 📖 Project Overview

The **MCD Multilingual Agent** automates voice-based communication in multiple languages. It uses Twilio to handle real phone calls, a FastAPI backend to process and route conversations, and an AI layer to understand and respond intelligently — making it ideal for customer support, outreach, and multilingual engagement workflows.

**Key Features:**
- 📞 Automated outbound/inbound phone calls via Twilio
- 🌍 Multilingual voice conversation support
- ⚡ FastAPI backend with async performance
- 🗄️ MongoDB for call logs and session data
- 🖥️ JavaScript/TypeScript frontend UI
- 🔐 Secure `.env`-based configuration

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Python, FastAPI, Uvicorn |
| Frontend | JavaScript, TypeScript, CSS, HTML |
| Voice & Telephony | Twilio |
| Database | MongoDB (PyMongo) |
| Configuration | python-dotenv |

**Language breakdown:**
- JavaScript — 81.2%
- TypeScript — 9.4%
- Python — 7.7%
- CSS — 1.5%
- HTML — 0.2%

---

## ⚙️ Installation & Setup

### Prerequisites

Make sure you have the following installed:

- Python 3.8+
- Node.js 16+ & npm
- Git
- A [Twilio account](https://www.twilio.com/) with an active phone number
- A [MongoDB](https://www.mongodb.com/) instance (local or MongoDB Atlas)

### 1. Clone the Repository

```bash
git clone https://github.com/sanyogitasinghbgm-spec/MCD-MULTILINGUAL-AGENT.git
cd MCD-MULTILINGUAL-AGENT
```

### 2. Backend Setup (Python / FastAPI)

```bash
# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt
```

### 3. Frontend Setup (JavaScript / TypeScript)

```bash
# Navigate to the frontend app directory
cd app

# Install Node.js dependencies
npm install
```

### 4. AI Calling Agent Setup

```bash
# Navigate to the AI calling agent directory
cd AI-Calling-Agent

# Install dependencies if applicable
npm install
```

### 5. Environment Variables

Create a `.env` file in the root directory with the following:

```env
# Twilio credentials
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX

# MongoDB connection URI
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/mcd_agent

# App configuration
BASE_URL=http://localhost:8000
PORT=8000
```

> ⚠️ **Never commit your `.env` file to version control.** It is already covered by `.gitignore`.

### 6. Run the Application

**Start the FastAPI backend:**
```bash
uvicorn main:app --reload --port 8000
```
API will be available at: `http://localhost:8000`

**Start the frontend (in a separate terminal):**
```bash
cd app
npm run dev
```
Frontend will be available at: `http://localhost:3000`

---

## 🚀 Usage Examples

### Example 1: Trigger an Outbound Multilingual Call

```bash
curl -X POST http://localhost:8000/call \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+91XXXXXXXXXX",
    "language": "hi",
    "message": "नमस्ते, क्या मैं आपकी सहायता कर सकता हूँ?"
  }'
```

**Response:**
```json
{
  "status": "call initiated",
  "call_sid": "CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "language": "hi"
}
```

### Example 2: English Call

```bash
curl -X POST http://localhost:8000/call \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+1XXXXXXXXXX",
    "language": "en",
    "message": "Hello! How can I assist you today?"
  }'
```

### Example 3: Retrieve Call History

```bash
curl http://localhost:8000/calls
```

**Response:**
```json
[
  {
    "call_sid": "CAxxxxxxxxxxxxxxxx",
    "to": "+91XXXXXXXXXX",
    "language": "hi",
    "status": "completed",
    "duration": "45s",
    "timestamp": "2026-03-28T10:30:00Z"
  }
]
```

### Example 4: Using the Web Interface

1. Open `http://localhost:3000` in your browser.
2. Enter the recipient's phone number.
3. Select the preferred language from the dropdown.
4. Click **Start Call** — the agent will dial the number and carry out the conversation.

---

## 📁 Project Structure

```
MCD-MULTILINGUAL-AGENT/
├── AI-Calling-Agent/       # Core AI calling logic & Twilio webhook handlers
├── app/                    # Frontend (JavaScript / TypeScript / CSS / HTML)
├── .gitignore              # Git ignored files (includes .env)
├── requirements.txt        # Python dependencies
└── README.md
```

---

## 🌍 Supported Languages

The agent supports multilingual voice interactions. Language support depends on your configured Twilio TTS/STT settings. Commonly supported languages include:

| Language | Code |
|----------|------|
| English | `en` |
| Hindi | `hi` |
| Spanish | `es` |
| French | `fr` |
| German | `de` |

---

## 🔗 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/call` | Initiate an outbound call |
| `GET` | `/calls` | Retrieve all call logs |
| `GET` | `/calls/{call_sid}` | Get details of a specific call |
| `POST` | `/webhook/voice` | Twilio voice webhook handler |

---

## 🤝 Contributing

Contributions, issues and feature requests are welcome! Feel free to open a [pull request](https://github.com/sanyogitasinghbgm-spec/MCD-MULTILINGUAL-AGENT/pulls) or [issue](https://github.com/sanyogitasinghbgm-spec/MCD-MULTILINGUAL-AGENT/issues).

---

## 📄 License

This project is open source. See [LICENSE](LICENSE) for details.
