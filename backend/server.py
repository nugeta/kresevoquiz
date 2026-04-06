from dotenv import load_dotenv
load_dotenv()

from contextlib import asynccontextmanager
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from bson import ObjectId
import secrets
import asyncio

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_ALGORITHM = "HS256"

def get_jwt_secret() -> str:
    return os.environ.get("JWT_SECRET", "default-secret-change-me")

# Password hashing
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

# JWT Token Management
def create_access_token(user_id: str, username: str) -> str:
    payload = {
        "sub": user_id,
        "username": username,
        "exp": datetime.now(timezone.utc) + timedelta(hours=24),
        "type": "access"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

# Create the main app
@asynccontextmanager
async def lifespan(app: FastAPI):
    await startup_event()
    yield
    client.close()

app = FastAPI(lifespan=lifespan)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# =============================================================================
# PYDANTIC MODELS
# =============================================================================

class UserCreate(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    role: str
    total_score: int = 0
    quizzes_taken: int = 0
    created_at: datetime

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    icon: Optional[str] = "BookOpen"
    color: Optional[str] = "#8AB4F8"

class CategoryResponse(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    color: str
    question_count: int = 0

class AnswerOption(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    text: str
    is_correct: bool = False

class QuestionCreate(BaseModel):
    category_id: str
    question_text: str
    question_type: Literal["multiple_choice", "true_false", "single_choice"]
    options: List[AnswerOption]
    points: int = 10
    time_limit: int = 30  # seconds

class QuestionResponse(BaseModel):
    id: str
    category_id: str
    question_text: str
    question_type: str
    options: List[AnswerOption]
    points: int
    time_limit: int

class QuestionPublic(BaseModel):
    id: str
    question_text: str
    question_type: str
    options: List[dict]  # Without is_correct
    points: int
    time_limit: int

class QuizStart(BaseModel):
    category_id: str
    question_count: int = 10

class AnswerSubmit(BaseModel):
    question_id: str
    selected_option_ids: List[str]
    time_taken: int  # seconds

class QuizSessionResponse(BaseModel):
    session_id: str
    category_name: str
    total_questions: int
    current_question: int
    score: int
    time_remaining: int

class LeaderboardEntry(BaseModel):
    rank: int
    username: str
    total_score: int
    quizzes_taken: int
    average_score: float

# =============================================================================
# AUTH HELPERS
# =============================================================================

async def get_current_user_optional(request: Request) -> Optional[dict]:
    """Get current user if authenticated, otherwise return None"""
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        return None
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            return None
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            return None
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None

async def get_current_user(request: Request) -> dict:
    """Get current user, raise 401 if not authenticated"""
    user = await get_current_user_optional(request)
    if not user:
        raise HTTPException(status_code=401, detail="Nije autentificirano")
    return user

async def require_admin(request: Request) -> dict:
    """Require admin role"""
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Potrebna admin prava")
    return user

# =============================================================================
# RATE LIMITING / ANTI-SPAM
# =============================================================================

async def check_rate_limit(identifier: str, action: str, max_attempts: int = 5, window_minutes: int = 15) -> bool:
    """Check if action is rate limited. Returns True if allowed, False if blocked."""
    key = f"{action}:{identifier}"
    now = datetime.now(timezone.utc)
    window_start = now - timedelta(minutes=window_minutes)
    
    # Count recent attempts
    attempts = await db.rate_limits.count_documents({
        "key": key,
        "timestamp": {"$gte": window_start}
    })
    
    if attempts >= max_attempts:
        return False
    
    # Record this attempt
    await db.rate_limits.insert_one({
        "key": key,
        "timestamp": now
    })
    
    return True

async def clear_rate_limit(identifier: str, action: str):
    """Clear rate limit for an identifier"""
    key = f"{action}:{identifier}"
    await db.rate_limits.delete_many({"key": key})

# =============================================================================
# AUTH ENDPOINTS
# =============================================================================

@api_router.post("/auth/register")
async def register(user_data: UserCreate, request: Request, response: Response):
    client_ip = request.client.host if request.client else "unknown"
    
    # Rate limiting
    if not await check_rate_limit(client_ip, "register", max_attempts=5, window_minutes=60):
        raise HTTPException(status_code=429, detail="Previše pokušaja registracije. Pokušajte ponovno za sat vremena.")
    
    # Check honeypot (if present in request)
    
    # Check if username exists
    existing = await db.users.find_one({"username": user_data.username.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Korisničko ime već postoji")
    
    # Create user
    user_doc = {
        "username": user_data.username.lower(),
        "password_hash": hash_password(user_data.password),
        "role": "user",
        "total_score": 0,
        "quizzes_taken": 0,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    # Create tokens
    access_token = create_access_token(user_id, user_data.username.lower())
    refresh_token = create_refresh_token(user_id)
    
    # Set cookies
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="none", max_age=86400, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=True, samesite="none", max_age=604800, path="/")
    
    await clear_rate_limit(client_ip, "register")
    
    return {
        "id": user_id,
        "username": user_data.username.lower(),
        "role": "user",
        "total_score": 0,
        "quizzes_taken": 0,
        "message": "Uspješna registracija!"
    }

@api_router.post("/auth/login")
async def login(user_data: UserLogin, request: Request, response: Response):
    client_ip = request.client.host if request.client else "unknown"
    identifier = f"{client_ip}:{user_data.username.lower()}"
    
    # Rate limiting for brute force protection
    if not await check_rate_limit(identifier, "login", max_attempts=5, window_minutes=15):
        raise HTTPException(status_code=429, detail="Previše neuspješnih pokušaja. Pokušajte ponovno za 15 minuta.")
    
    # Find user
    user = await db.users.find_one({"username": user_data.username.lower()})
    if not user:
        raise HTTPException(status_code=401, detail="Pogrešno korisničko ime ili lozinka")
    
    # Verify password
    if not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Pogrešno korisničko ime ili lozinka")
    
    # Clear rate limit on success
    await clear_rate_limit(identifier, "login")
    
    user_id = str(user["_id"])
    
    # Create tokens
    access_token = create_access_token(user_id, user["username"])
    refresh_token = create_refresh_token(user_id)
    
    # Set cookies
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="none", max_age=86400, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=True, samesite="none", max_age=604800, path="/")
    
    return {
        "id": user_id,
        "username": user["username"],
        "role": user["role"],
        "total_score": user.get("total_score", 0),
        "quizzes_taken": user.get("quizzes_taken", 0),
        "message": "Uspješna prijava!"
    }

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Uspješna odjava"}

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user_optional(request)
    if not user:
        return {"authenticated": False}
    return {
        "authenticated": True,
        "id": user["_id"],
        "username": user["username"],
        "role": user["role"],
        "total_score": user.get("total_score", 0),
        "quizzes_taken": user.get("quizzes_taken", 0)
    }

# =============================================================================
# CATEGORY ENDPOINTS
# =============================================================================

@api_router.get("/categories", response_model=List[CategoryResponse])
async def get_categories():
    categories = await db.categories.find({}, {"_id": 1, "name": 1, "description": 1, "icon": 1, "color": 1}).to_list(100)
    result = []
    for cat in categories:
        question_count = await db.questions.count_documents({"category_id": str(cat["_id"])})
        result.append({
            "id": str(cat["_id"]),
            "name": cat["name"],
            "description": cat.get("description", ""),
            "icon": cat.get("icon", "BookOpen"),
            "color": cat.get("color", "#8AB4F8"),
            "question_count": question_count
        })
    return result

@api_router.post("/categories")
async def create_category(category: CategoryCreate, request: Request):
    await require_admin(request)
    
    doc = {
        "name": category.name,
        "description": category.description,
        "icon": category.icon,
        "color": category.color,
        "created_at": datetime.now(timezone.utc)
    }
    result = await db.categories.insert_one(doc)
    return {"id": str(result.inserted_id), "message": "Kategorija kreirana"}

@api_router.put("/categories/{category_id}")
async def update_category(category_id: str, category: CategoryCreate, request: Request):
    await require_admin(request)
    
    result = await db.categories.update_one(
        {"_id": ObjectId(category_id)},
        {"$set": {
            "name": category.name,
            "description": category.description,
            "icon": category.icon,
            "color": category.color
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Kategorija nije pronađena")
    return {"message": "Kategorija ažurirana"}

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str, request: Request):
    await require_admin(request)
    
    # Delete category and its questions
    await db.questions.delete_many({"category_id": category_id})
    result = await db.categories.delete_one({"_id": ObjectId(category_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Kategorija nije pronađena")
    return {"message": "Kategorija obrisana"}

# =============================================================================
# QUESTION ENDPOINTS (ADMIN)
# =============================================================================

@api_router.get("/questions")
async def get_all_questions(request: Request, category_id: Optional[str] = None):
    await require_admin(request)
    
    query = {}
    if category_id:
        query["category_id"] = category_id
    
    questions = await db.questions.find(query, {"_id": 1, "category_id": 1, "question_text": 1, "question_type": 1, "options": 1, "points": 1, "time_limit": 1}).to_list(1000)
    
    result = []
    for q in questions:
        result.append({
            "id": str(q["_id"]),
            "category_id": q["category_id"],
            "question_text": q["question_text"],
            "question_type": q["question_type"],
            "options": q["options"],
            "points": q.get("points", 10),
            "time_limit": q.get("time_limit", 30)
        })
    return result

@api_router.post("/questions")
async def create_question(question: QuestionCreate, request: Request):
    await require_admin(request)
    
    # Verify category exists
    category = await db.categories.find_one({"_id": ObjectId(question.category_id)})
    if not category:
        raise HTTPException(status_code=404, detail="Kategorija nije pronađena")
    
    # Validate at least one correct answer
    correct_count = sum(1 for opt in question.options if opt.is_correct)
    if correct_count == 0:
        raise HTTPException(status_code=400, detail="Mora postojati barem jedan točan odgovor")
    
    doc = {
        "category_id": question.category_id,
        "question_text": question.question_text,
        "question_type": question.question_type,
        "options": [opt.model_dump() for opt in question.options],
        "points": question.points,
        "time_limit": question.time_limit,
        "created_at": datetime.now(timezone.utc)
    }
    result = await db.questions.insert_one(doc)
    return {"id": str(result.inserted_id), "message": "Pitanje kreirano"}

@api_router.post("/questions/bulk")
async def bulk_create_questions(questions: List[QuestionCreate], request: Request):
    await require_admin(request)
    if not questions:
        raise HTTPException(status_code=400, detail="Nema pitanja za uvoz")
    if len(questions) > 500:
        raise HTTPException(status_code=400, detail="Maksimalno 500 pitanja odjednom")

    # Validate all category IDs exist
    category_ids = list(set(q.category_id for q in questions))
    for cat_id in category_ids:
        try:
            cat = await db.categories.find_one({"_id": ObjectId(cat_id)})
        except Exception:
            raise HTTPException(status_code=400, detail=f"Nevažeći category_id: {cat_id}")
        if not cat:
            raise HTTPException(status_code=404, detail=f"Kategorija nije pronađena: {cat_id}")

    docs = []
    for q in questions:
        docs.append({
            "category_id": q.category_id,
            "question_text": q.question_text,
            "question_type": q.question_type,
            "options": [{"id": str(uuid.uuid4()), "text": o.text, "is_correct": o.is_correct} for o in q.options],
            "points": q.points,
            "time_limit": q.time_limit,
            "created_at": datetime.now(timezone.utc)
        })

    result = await db.questions.insert_many(docs)
    return {"inserted": len(result.inserted_ids), "message": f"Uvezeno {len(result.inserted_ids)} pitanja"}

@api_router.put("/questions/{question_id}")
async def update_question(question_id: str, question: QuestionCreate, request: Request):
    await require_admin(request)
    
    result = await db.questions.update_one(
        {"_id": ObjectId(question_id)},
        {"$set": {
            "category_id": question.category_id,
            "question_text": question.question_text,
            "question_type": question.question_type,
            "options": [opt.model_dump() for opt in question.options],
            "points": question.points,
            "time_limit": question.time_limit
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Pitanje nije pronađeno")
    return {"message": "Pitanje ažurirano"}

@api_router.delete("/questions/{question_id}")
async def delete_question(question_id: str, request: Request):
    await require_admin(request)
    
    result = await db.questions.delete_one({"_id": ObjectId(question_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Pitanje nije pronađeno")
    return {"message": "Pitanje obrisano"}

# =============================================================================
# QUIZ SESSION ENDPOINTS
# =============================================================================

@api_router.post("/quiz/start")
async def start_quiz(quiz_start: QuizStart, request: Request):
    client_ip = request.client.host if request.client else "unknown"
    
    # Rate limiting for quiz starts
    if not await check_rate_limit(client_ip, "quiz_start", max_attempts=10, window_minutes=5):
        raise HTTPException(status_code=429, detail="Previše kvizova pokrenuto. Pričekajte malo.")
    
    # Get category
    category = await db.categories.find_one({"_id": ObjectId(quiz_start.category_id)})
    if not category:
        raise HTTPException(status_code=404, detail="Kategorija nije pronađena")
    
    # Get random questions from category
    pipeline = [
        {"$match": {"category_id": quiz_start.category_id}},
        {"$sample": {"size": min(quiz_start.question_count, 20)}}
    ]
    questions = await db.questions.aggregate(pipeline).to_list(20)
    
    if len(questions) == 0:
        raise HTTPException(status_code=400, detail="Nema dostupnih pitanja u ovoj kategoriji")
    
    # Get user if authenticated
    user = await get_current_user_optional(request)
    user_id = user["_id"] if user else None
    
    # Create quiz session
    session_id = str(uuid.uuid4())
    question_ids = [str(q["_id"]) for q in questions]
    
    session_doc = {
        "session_id": session_id,
        "user_id": user_id,
        "category_id": quiz_start.category_id,
        "category_name": category["name"],
        "question_ids": question_ids,
        "current_index": 0,
        "answers": [],
        "score": 0,
        "started_at": datetime.now(timezone.utc),
        "completed": False,
        "client_ip": client_ip
    }
    await db.quiz_sessions.insert_one(session_doc)
    
    # Return first question
    first_question = questions[0]
    options_public = [{"id": opt["id"], "text": opt["text"]} for opt in first_question["options"]]
    
    return {
        "session_id": session_id,
        "category_name": category["name"],
        "total_questions": len(questions),
        "current_question": 1,
        "question": {
            "id": str(first_question["_id"]),
            "question_text": first_question["question_text"],
            "question_type": first_question["question_type"],
            "options": options_public,
            "points": first_question.get("points", 10),
            "time_limit": first_question.get("time_limit", 30)
        }
    }

@api_router.post("/quiz/{session_id}/answer")
async def submit_answer(session_id: str, answer: AnswerSubmit, request: Request):
    # Get session
    session = await db.quiz_sessions.find_one({"session_id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Sesija nije pronađena")
    
    if session["completed"]:
        raise HTTPException(status_code=400, detail="Kviz je već završen")
    
    # Get current question
    current_index = session["current_index"]
    question_id = session["question_ids"][current_index]
    question = await db.questions.find_one({"_id": ObjectId(question_id)})
    
    if not question:
        raise HTTPException(status_code=404, detail="Pitanje nije pronađeno")
    
    # Check answer
    correct_option_ids = [opt["id"] for opt in question["options"] if opt["is_correct"]]
    is_correct = set(answer.selected_option_ids) == set(correct_option_ids)
    
    points_earned = 0
    if is_correct:
        # Bonus for quick answers
        time_bonus = max(0, (question.get("time_limit", 30) - answer.time_taken) // 5)
        points_earned = question.get("points", 10) + time_bonus
    
    # Record answer
    answer_record = {
        "question_id": question_id,
        "selected_option_ids": answer.selected_option_ids,
        "correct_option_ids": correct_option_ids,
        "is_correct": is_correct,
        "points_earned": points_earned,
        "time_taken": answer.time_taken
    }
    
    new_score = session["score"] + points_earned
    new_index = current_index + 1
    is_last = new_index >= len(session["question_ids"])
    
    # Update session
    update_data = {
        "$push": {"answers": answer_record},
        "$set": {
            "current_index": new_index,
            "score": new_score
        }
    }
    
    if is_last:
        update_data["$set"]["completed"] = True
        update_data["$set"]["completed_at"] = datetime.now(timezone.utc)
        
        # Update user stats if logged in
        if session.get("user_id"):
            await db.users.update_one(
                {"_id": ObjectId(session["user_id"])},
                {
                    "$inc": {"total_score": new_score, "quizzes_taken": 1}
                }
            )
    
    await db.quiz_sessions.update_one({"session_id": session_id}, update_data)
    
    response_data = {
        "is_correct": is_correct,
        "correct_option_ids": correct_option_ids,
        "points_earned": points_earned,
        "total_score": new_score,
        "is_last_question": is_last
    }
    
    # Get next question if not last
    if not is_last:
        next_question_id = session["question_ids"][new_index]
        next_question = await db.questions.find_one({"_id": ObjectId(next_question_id)})
        options_public = [{"id": opt["id"], "text": opt["text"]} for opt in next_question["options"]]
        
        response_data["next_question"] = {
            "id": str(next_question["_id"]),
            "question_text": next_question["question_text"],
            "question_type": next_question["question_type"],
            "options": options_public,
            "points": next_question.get("points", 10),
            "time_limit": next_question.get("time_limit", 30)
        }
        response_data["current_question"] = new_index + 1
        response_data["total_questions"] = len(session["question_ids"])
    
    return response_data

@api_router.get("/quiz/{session_id}/results")
async def get_quiz_results(session_id: str):
    session = await db.quiz_sessions.find_one({"session_id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Sesija nije pronađena")
    
    if not session["completed"]:
        raise HTTPException(status_code=400, detail="Kviz još nije završen")
    
    # Calculate stats
    total_questions = len(session["question_ids"])
    correct_answers = sum(1 for a in session["answers"] if a["is_correct"])
    total_time = sum(a["time_taken"] for a in session["answers"])
    
    return {
        "session_id": session_id,
        "category_name": session["category_name"],
        "score": session["score"],
        "total_questions": total_questions,
        "correct_answers": correct_answers,
        "accuracy": round((correct_answers / total_questions) * 100, 1) if total_questions > 0 else 0,
        "total_time": total_time,
        "answers": session["answers"]
    }

# =============================================================================
# LEADERBOARD ENDPOINTS
# =============================================================================

@api_router.get("/leaderboard")
async def get_leaderboard(limit: int = 20):
    # Get top users by total score
    users = await db.users.find(
        {"role": {"$ne": "admin"}, "quizzes_taken": {"$gt": 0}},
        {"_id": 0, "username": 1, "total_score": 1, "quizzes_taken": 1}
    ).sort("total_score", -1).limit(limit).to_list(limit)
    
    result = []
    for i, user in enumerate(users):
        avg_score = user["total_score"] / user["quizzes_taken"] if user["quizzes_taken"] > 0 else 0
        result.append({
            "rank": i + 1,
            "username": user["username"],
            "total_score": user["total_score"],
            "quizzes_taken": user["quizzes_taken"],
            "average_score": round(avg_score, 1)
        })
    
    return result

# =============================================================================
# STATS ENDPOINT
# =============================================================================

@api_router.get("/stats")
async def get_stats():
    total_questions = await db.questions.count_documents({})
    total_categories = await db.categories.count_documents({})
    total_users = await db.users.count_documents({"role": {"$ne": "admin"}})
    total_quizzes = await db.quiz_sessions.count_documents({"completed": True})
    
    return {
        "total_questions": total_questions,
        "total_categories": total_categories,
        "total_users": total_users,
        "total_quizzes_completed": total_quizzes
    }

# =============================================================================
# ROOT ENDPOINT
# =============================================================================

@api_router.get("/")
async def root():
    return {"message": "Školski Kviz API", "version": "1.0.0"}

# Include the router in the main app
app.include_router(api_router)

# CORS Configuration
frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[frontend_url, "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================================================
# STARTUP EVENT - Seed Admin and Sample Data
# =============================================================================

async def startup_event():
    # Create indexes
    await db.users.create_index("username", unique=True)
    await db.rate_limits.create_index("timestamp", expireAfterSeconds=3600)
    await db.quiz_sessions.create_index("session_id", unique=True)
    
    # Seed admin
    admin_username = os.environ.get("ADMIN_EMAIL", "admin@skolskikviz.hr").split("@")[0]
    admin_password = os.environ.get("ADMIN_PASSWORD", "Admin123!")
    
    existing_admin = await db.users.find_one({"username": admin_username})
    if existing_admin is None:
        hashed = hash_password(admin_password)
        await db.users.insert_one({
            "username": admin_username,
            "password_hash": hashed,
            "role": "admin",
            "total_score": 0,
            "quizzes_taken": 0,
            "created_at": datetime.now(timezone.utc)
        })
        logger.info(f"Admin user created: {admin_username}")
    elif not verify_password(admin_password, existing_admin["password_hash"]):
        await db.users.update_one(
            {"username": admin_username},
            {"$set": {"password_hash": hash_password(admin_password)}}
        )
        logger.info("Admin password updated")
    
    # Seed sample categories if none exist
    cat_count = await db.categories.count_documents({})
    if cat_count == 0:
        sample_categories = [
            {"name": "Matematika", "description": "Pitanja iz matematike", "icon": "Calculator", "color": "#55EFC4"},
            {"name": "Hrvatski jezik", "description": "Pitanja iz hrvatskog jezika", "icon": "BookOpen", "color": "#8AB4F8"},
            {"name": "Priroda i društvo", "description": "Pitanja iz prirode i društva", "icon": "Globe", "color": "#FDCB6E"},
            {"name": "Opće znanje", "description": "Razna zanimljiva pitanja", "icon": "Lightbulb", "color": "#FF9FF3"},
        ]
        for cat in sample_categories:
            cat["created_at"] = datetime.now(timezone.utc)
        await db.categories.insert_many(sample_categories)
        logger.info("Sample categories created")
        
        # Get category IDs
        cats = await db.categories.find({}).to_list(10)
        cat_map = {c["name"]: str(c["_id"]) for c in cats}
        
        # Seed sample questions
        sample_questions = [
            # Matematika
            {
                "category_id": cat_map["Matematika"],
                "question_text": "Koliko je 7 × 8?",
                "question_type": "single_choice",
                "options": [
                    {"id": str(uuid.uuid4()), "text": "54", "is_correct": False},
                    {"id": str(uuid.uuid4()), "text": "56", "is_correct": True},
                    {"id": str(uuid.uuid4()), "text": "58", "is_correct": False},
                    {"id": str(uuid.uuid4()), "text": "48", "is_correct": False},
                ],
                "points": 10,
                "time_limit": 30
            },
            {
                "category_id": cat_map["Matematika"],
                "question_text": "Je li 17 prost broj?",
                "question_type": "true_false",
                "options": [
                    {"id": str(uuid.uuid4()), "text": "Da", "is_correct": True},
                    {"id": str(uuid.uuid4()), "text": "Ne", "is_correct": False},
                ],
                "points": 10,
                "time_limit": 20
            },
            {
                "category_id": cat_map["Matematika"],
                "question_text": "Koji od ovih brojeva su parni?",
                "question_type": "multiple_choice",
                "options": [
                    {"id": str(uuid.uuid4()), "text": "2", "is_correct": True},
                    {"id": str(uuid.uuid4()), "text": "7", "is_correct": False},
                    {"id": str(uuid.uuid4()), "text": "14", "is_correct": True},
                    {"id": str(uuid.uuid4()), "text": "9", "is_correct": False},
                ],
                "points": 15,
                "time_limit": 30
            },
            # Hrvatski jezik
            {
                "category_id": cat_map["Hrvatski jezik"],
                "question_text": "Kako se zove glavni grad Hrvatske?",
                "question_type": "single_choice",
                "options": [
                    {"id": str(uuid.uuid4()), "text": "Split", "is_correct": False},
                    {"id": str(uuid.uuid4()), "text": "Zagreb", "is_correct": True},
                    {"id": str(uuid.uuid4()), "text": "Rijeka", "is_correct": False},
                    {"id": str(uuid.uuid4()), "text": "Osijek", "is_correct": False},
                ],
                "points": 10,
                "time_limit": 30
            },
            {
                "category_id": cat_map["Hrvatski jezik"],
                "question_text": "Je li riječ 'sunce' imenica?",
                "question_type": "true_false",
                "options": [
                    {"id": str(uuid.uuid4()), "text": "Da", "is_correct": True},
                    {"id": str(uuid.uuid4()), "text": "Ne", "is_correct": False},
                ],
                "points": 10,
                "time_limit": 20
            },
            # Priroda i društvo
            {
                "category_id": cat_map["Priroda i društvo"],
                "question_text": "Koja rijeka prolazi kroz Zagreb?",
                "question_type": "single_choice",
                "options": [
                    {"id": str(uuid.uuid4()), "text": "Drava", "is_correct": False},
                    {"id": str(uuid.uuid4()), "text": "Dunav", "is_correct": False},
                    {"id": str(uuid.uuid4()), "text": "Sava", "is_correct": True},
                    {"id": str(uuid.uuid4()), "text": "Kupa", "is_correct": False},
                ],
                "points": 10,
                "time_limit": 30
            },
            {
                "category_id": cat_map["Priroda i društvo"],
                "question_text": "Ima li Hrvatska izlaz na more?",
                "question_type": "true_false",
                "options": [
                    {"id": str(uuid.uuid4()), "text": "Da", "is_correct": True},
                    {"id": str(uuid.uuid4()), "text": "Ne", "is_correct": False},
                ],
                "points": 10,
                "time_limit": 20
            },
            # Opće znanje
            {
                "category_id": cat_map["Opće znanje"],
                "question_text": "Koliko boja ima duga?",
                "question_type": "single_choice",
                "options": [
                    {"id": str(uuid.uuid4()), "text": "5", "is_correct": False},
                    {"id": str(uuid.uuid4()), "text": "6", "is_correct": False},
                    {"id": str(uuid.uuid4()), "text": "7", "is_correct": True},
                    {"id": str(uuid.uuid4()), "text": "8", "is_correct": False},
                ],
                "points": 10,
                "time_limit": 30
            },
            {
                "category_id": cat_map["Opće znanje"],
                "question_text": "Koji su planeti najbliži Suncu?",
                "question_type": "multiple_choice",
                "options": [
                    {"id": str(uuid.uuid4()), "text": "Merkur", "is_correct": True},
                    {"id": str(uuid.uuid4()), "text": "Venera", "is_correct": True},
                    {"id": str(uuid.uuid4()), "text": "Jupiter", "is_correct": False},
                    {"id": str(uuid.uuid4()), "text": "Saturn", "is_correct": False},
                ],
                "points": 15,
                "time_limit": 30
            },
            {
                "category_id": cat_map["Opće znanje"],
                "question_text": "Je li voda H2O?",
                "question_type": "true_false",
                "options": [
                    {"id": str(uuid.uuid4()), "text": "Da", "is_correct": True},
                    {"id": str(uuid.uuid4()), "text": "Ne", "is_correct": False},
                ],
                "points": 10,
                "time_limit": 20
            },
        ]
        for q in sample_questions:
            q["created_at"] = datetime.now(timezone.utc)
        await db.questions.insert_many(sample_questions)
        logger.info("Sample questions created")

async def shutdown_db_client():
    client.close()
