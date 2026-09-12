import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai

load_dotenv()

MODEL = "gemini-3.6-flash"
SYSTEM_INSTRUCTION = """You are a Data Structures and Algorithms instructor.
Only answer questions related to Data Structures and Algorithms.

If the user asks anything unrelated (e.g. "How are you", general chit-chat,
other subjects), reply exactly:
"Sorry, this question is not related to Data Structures and Algorithms, and I'm only able to answer questions in that domain."

Otherwise, answer in the simplest, clearest way possible — assume the user
is learning and prefers short explanations broken into one concept at a time."""

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

class ChatTurn(BaseModel):
    role: str
    text: str

class ChatRequest(BaseModel):
    message: str
    history: list[ChatTurn] = []

class ChatResponse(BaseModel):
    reply: str

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/chat", response_model=ChatResponse)
def chat(payload: ChatRequest):
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="`message` is required.")

    contents = [
        {"role": turn.role, "parts": [{"text": turn.text}]}
        for turn in payload.history
    ]
    contents.append({"role": "user", "parts": [{"text": payload.message}]})

    try:
        response = client.models.generate_content(
            model=MODEL,
            contents=contents,
            config={"system_instruction": SYSTEM_INSTRUCTION},
        )
        return ChatResponse(reply=response.text)
    except Exception as e:
        print("Gemini request failed:", e)
        raise HTTPException(status_code=502, detail="The model failed to respond. Please try again.")

@app.get("/api/health")
def health():
    return {"ok": True}