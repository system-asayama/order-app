from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, EmailStr, field_validator
from models import UserRole, MatchStatus, BetSide, BetResult, TransactionType


# ===== Auth =====
class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ===== User =====
class UserCreate(BaseModel):
    email: str
    name: str
    password: str
    role: UserRole = UserRole.user
    balance: Decimal = Decimal("1000.00")


class UserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[UserRole] = None
    balance: Optional[Decimal] = None
    is_active: Optional[bool] = None


class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    role: UserRole
    balance: Decimal
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ===== Sport =====
class SportCreate(BaseModel):
    name: str
    icon: str = "🏆"


class SportResponse(BaseModel):
    id: int
    name: str
    icon: str
    is_active: bool

    class Config:
        from_attributes = True


# ===== Match =====
class MatchCreate(BaseModel):
    sport_id: int
    home_team: str
    away_team: str
    match_date: datetime
    handicap: Decimal = Decimal("0.00")
    notes: Optional[str] = None


class MatchUpdate(BaseModel):
    home_team: Optional[str] = None
    away_team: Optional[str] = None
    match_date: Optional[datetime] = None
    handicap: Optional[Decimal] = None
    status: Optional[MatchStatus] = None
    notes: Optional[str] = None


class MatchResultInput(BaseModel):
    home_score: int
    away_score: int


class MatchResponse(BaseModel):
    id: int
    sport_id: int
    sport: Optional[SportResponse] = None
    home_team: str
    away_team: str
    match_date: datetime
    handicap: Decimal
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    status: MatchStatus
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ===== Bet =====
class BetCreate(BaseModel):
    match_id: int
    side: BetSide
    amount: Decimal

    @field_validator("amount")
    @classmethod
    def amount_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError("賭けポイントは1以上である必要があります")
        return v


class BetResponse(BaseModel):
    id: int
    user_id: int
    match_id: int
    match: Optional[MatchResponse] = None
    side: BetSide
    amount: Decimal
    result: BetResult
    result_label: Optional[str] = None  # "X歩負け"・"勝ち"等の表示用ラベル
    payout: Optional[Decimal] = None
    created_at: datetime
    settled_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ===== PointTransaction =====
class PointTransactionResponse(BaseModel):
    id: int
    amount: Decimal
    balance_after: Decimal
    transaction_type: TransactionType
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ===== Admin: Balance Adjust =====
class BalanceAdjust(BaseModel):
    amount: Decimal
    description: Optional[str] = None


# ===== Ranking =====
class RankingEntry(BaseModel):
    rank: int
    user_id: int
    name: str
    balance: Decimal
    total_bets: int
    wins: int
    win_rate: float
