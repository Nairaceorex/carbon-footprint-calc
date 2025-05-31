from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from pydantic import BaseModel
import psycopg2
from passlib.context import CryptContext
from jose import JWTError, jwt
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@db:5432/carboncalc")
conn = psycopg2.connect(DATABASE_URL)
cursor = conn.cursor()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    cursor.execute("SELECT username FROM users WHERE username = %s", (username,))
    if not cursor.fetchone():
        raise HTTPException(status_code=401, detail="User not found")
    return username

class User(BaseModel):
    username: str
    password: str

class Calculation(BaseModel):
    energy: float
    fuel: float
    livestock: float
    fertilizers: float

@app.post("/register")
async def register_user(user: User):
    hashed_password = pwd_context.hash(user.password)
    try:
        cursor.execute(
            "INSERT INTO users (username, password) VALUES (%s, %s)",
            (user.username, hashed_password)
        )
        conn.commit()
        return {"message": "User registered successfully"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/token")
async def login_user(form_data: OAuth2PasswordRequestForm = Depends()):
    cursor.execute("SELECT password FROM users WHERE username = %s", (form_data.username,))
    result = cursor.fetchone()
    if not result or not pwd_context.verify(form_data.password, result[0]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = jwt.encode({"sub": form_data.username}, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": token, "token_type": "bearer"}

@app.post("/calculate")
async def calculate_footprint(calc: Calculation, user: str = Depends(get_current_user)):
    cursor.execute("SELECT co2_factor, ch4_factor, n2o_factor FROM coefficients WHERE category = 'energy'")
    energy_coeffs = cursor.fetchone() or (0.4, 0, 0)
    cursor.execute("SELECT co2_factor, ch4_factor, n2o_factor FROM coefficients WHERE category = 'fuel'")
    fuel_coeffs = cursor.fetchone() or (2.7, 0, 0)
    cursor.execute("SELECT co2_factor, ch4_factor, n2o_factor FROM coefficients WHERE category = 'livestock'")
    livestock_coeffs = cursor.fetchone() or (0, 0.1, 0)
    cursor.execute("SELECT co2_factor, ch4_factor, n2o_factor FROM coefficients WHERE category = 'fertilizers'")
    fertilizers_coeffs = cursor.fetchone() or (0, 0, 0.01)

    co2 = (calc.energy * energy_coeffs[0] + calc.fuel * fuel_coeffs[0])  # Changed to fuel
    ch4 = calc.livestock * livestock_coeffs[1]
    n2o = calc.fertilizers * fertilizers_coeffs[2]
    total = co2 + ch4 * 25 + n2o * 298

    cursor.execute(
        "INSERT INTO calculations (co2, ch4, n2o, total) VALUES (%s, %s, %s, %s) RETURNING id",
        (co2, ch4, n2o, total)
    )
    conn.commit()
    return {"co2": co2, "ch4": ch4, "n2o": n2o, "total": total}

@app.get("/calculations")
async def get_calculations(user: str = Depends(get_current_user)):
    cursor.execute("SELECT id, co2, ch4, n2o, total, created_at FROM calculations")
    calculations = cursor.fetchall()
    return [
        {"id": c[0], "co2": c[1], "ch4": c[2], "n2o": c[3], "total": c[4], "created_at": c[5]}
        for c in calculations
    ]