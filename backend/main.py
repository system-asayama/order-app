"""
Sports Betting Simulation API - v2.0
FastAPI + PostgreSQL + アジアンハンデ判定
"""
import os
from datetime import datetime
from decimal import Decimal
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, joinedload

from config import settings
from database import get_db, engine
from models import (
    Base, User, Sport, Match, Bet, PointTransaction,
    UserRole, MatchStatus, BetResult, TransactionType
)
from auth import (
    verify_password, get_password_hash,
    create_access_token, get_current_user, require_admin
)
from schemas import (
    LoginRequest, TokenResponse,
    UserCreate, UserUpdate, UserResponse,
    SportCreate, SportResponse,
    MatchCreate, MatchUpdate, MatchResultInput, MatchResponse,
    BetCreate, BetResponse,
    PointTransactionResponse,
    BalanceAdjust, RankingEntry
)
from handicap import calculate_result_v2, get_result_label

Base.metadata.create_all(bind=engine)


def bet_to_response(bet: Bet) -> BetResponse:
    """BetオブジェクトをBetResponseに変換し、result_labelを動的に付与する"""
    handicap = float(bet.match.handicap) if bet.match else 0.0
    label = get_result_label(bet.result, handicap)
    data = BetResponse.model_validate(bet)
    data.result_label = label
    return data

app = FastAPI(title="Sports Betting Simulation", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def init_db():
    db = next(get_db())
    try:
        if not db.query(User).filter(User.email == "admin@example.com").first():
            db.add(User(
                email="admin@example.com",
                name="Administrator",
                hashed_password=get_password_hash("admin123"),
                role=UserRole.admin,
                balance=Decimal("99999.00"),
            ))
        if not db.query(User).filter(User.email == "user@example.com").first():
            db.add(User(
                email="user@example.com",
                name="Demo User",
                hashed_password=get_password_hash("user123"),
                role=UserRole.user,
                balance=Decimal("1000.00"),
            ))
        for name, icon in [("サッカー","⚽"),("バスケットボール","🏀"),("野球","⚾"),("テニス","🎾"),("アメフト","🏈")]:
            if not db.query(Sport).filter(Sport.name == name).first():
                db.add(Sport(name=name, icon=icon))
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Init DB error: {e}")
    finally:
        db.close()

init_db()


# ===== AUTH =====
@app.post("/api/auth/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="メールアドレスまたはパスワードが正しくありません")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="アカウントが無効です")
    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return TokenResponse(access_token=token)


@app.get("/api/auth/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user


# ===== USERS =====
@app.get("/api/users", response_model=List[UserResponse])
def list_users(db: Session = Depends(get_db), _=Depends(require_admin)):
    return db.query(User).order_by(User.created_at).all()


@app.post("/api/users", response_model=UserResponse)
def create_user(req: UserCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail="このメールアドレスは既に登録されています")
    user = User(
        email=req.email, name=req.name,
        hashed_password=get_password_hash(req.password),
        role=req.role, balance=req.balance,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.put("/api/users/{user_id}", response_model=UserResponse)
def update_user(user_id: int, req: UserUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="ユーザーが見つかりません")
    for field, value in req.model_dump(exclude_none=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


@app.post("/api/users/{user_id}/adjust-balance", response_model=UserResponse)
def adjust_balance(user_id: int, req: BalanceAdjust, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="ユーザーが見つかりません")
    user.balance = Decimal(str(user.balance)) + req.amount
    db.add(PointTransaction(
        user_id=user.id, amount=req.amount, balance_after=user.balance,
        transaction_type=TransactionType.admin_adjust,
        description=req.description or f"管理者による調整（{admin.name}）",
    ))
    db.commit()
    db.refresh(user)
    return user


# ===== SPORTS =====
@app.get("/api/sports", response_model=List[SportResponse])
def list_sports(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(Sport).filter(Sport.is_active == True).all()


@app.post("/api/sports", response_model=SportResponse)
def create_sport(req: SportCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    if db.query(Sport).filter(Sport.name == req.name).first():
        raise HTTPException(status_code=400, detail="この種目名は既に登録されています")
    sport = Sport(name=req.name, icon=req.icon)
    db.add(sport)
    db.commit()
    db.refresh(sport)
    return sport


@app.delete("/api/sports/{sport_id}")
def delete_sport(sport_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    sport = db.query(Sport).filter(Sport.id == sport_id).first()
    if not sport:
        raise HTTPException(status_code=404, detail="種目が見つかりません")
    sport.is_active = False
    db.commit()
    return {"message": "削除しました"}


# ===== MATCHES =====
@app.get("/api/matches", response_model=List[MatchResponse])
def list_matches(
    status: Optional[str] = None,
    sport_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user)
):
    q = db.query(Match).options(joinedload(Match.sport))
    if status:
        q = q.filter(Match.status == status)
    if sport_id:
        q = q.filter(Match.sport_id == sport_id)
    return q.order_by(Match.match_date.desc()).all()


@app.get("/api/matches/{match_id}", response_model=MatchResponse)
def get_match(match_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    match = db.query(Match).options(joinedload(Match.sport)).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="試合が見つかりません")
    return match


@app.post("/api/matches", response_model=MatchResponse)
def create_match(req: MatchCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    match = Match(**req.model_dump())
    db.add(match)
    db.commit()
    db.refresh(match)
    return db.query(Match).options(joinedload(Match.sport)).filter(Match.id == match.id).first()


@app.put("/api/matches/{match_id}", response_model=MatchResponse)
def update_match(match_id: int, req: MatchUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="試合が見つかりません")
    for field, value in req.model_dump(exclude_none=True).items():
        setattr(match, field, value)
    db.commit()
    return db.query(Match).options(joinedload(Match.sport)).filter(Match.id == match_id).first()


@app.post("/api/matches/{match_id}/result", response_model=MatchResponse)
def set_match_result(match_id: int, req: MatchResultInput, db: Session = Depends(get_db), _=Depends(require_admin)):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="試合が見つかりません")
    if match.status == MatchStatus.finished:
        raise HTTPException(status_code=400, detail="この試合は既に精算済みです")

    match.home_score = req.home_score
    match.away_score = req.away_score
    match.status = MatchStatus.finished

    bets = db.query(Bet).filter(Bet.match_id == match_id, Bet.result == BetResult.pending).all()
    for bet in bets:
        result, multiplier = calculate_result_v2(
            home_score=req.home_score,
            away_score=req.away_score,
            handicap=match.handicap,
            side=bet.side.value,
            handicap_team=match.handicap_team or "team1",
        )
        payout = Decimal(str(bet.amount)) * multiplier
        bet.result = result
        bet.payout = payout
        bet.settled_at = datetime.utcnow()

        user = db.query(User).filter(User.id == bet.user_id).first()
        if user and payout > 0:
            user.balance = Decimal(str(user.balance)) + payout
            db.add(PointTransaction(
                user_id=user.id, amount=payout, balance_after=user.balance,
                transaction_type=TransactionType.payout,
                description=f"精算: {match.home_team} vs {match.away_team} - {get_result_label(result, float(match.handicap))}",
                bet_id=bet.id,
            ))

    db.commit()
    return db.query(Match).options(joinedload(Match.sport)).filter(Match.id == match_id).first()


@app.post("/api/matches/{match_id}/close")
def close_match(match_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="試合が見つかりません")
    match.status = MatchStatus.closed
    db.commit()
    return {"message": "ベットを締め切りました"}


@app.post("/api/matches/{match_id}/cancel")
def cancel_match(match_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="試合が見つかりません")
    bets = db.query(Bet).filter(Bet.match_id == match_id, Bet.result == BetResult.pending).all()
    for bet in bets:
        bet.result = BetResult.cancelled
        bet.payout = bet.amount
        bet.settled_at = datetime.utcnow()
        user = db.query(User).filter(User.id == bet.user_id).first()
        if user:
            user.balance = Decimal(str(user.balance)) + Decimal(str(bet.amount))
            db.add(PointTransaction(
                user_id=user.id, amount=bet.amount, balance_after=user.balance,
                transaction_type=TransactionType.refund,
                description=f"試合中止返金: {match.home_team} vs {match.away_team}",
                bet_id=bet.id,
            ))
    match.status = MatchStatus.cancelled
    db.commit()
    return {"message": "試合を中止し、ベットを返金しました"}


# ===== BETS =====
@app.post("/api/bets", response_model=BetResponse)
def place_bet(req: BetCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    match = db.query(Match).filter(Match.id == req.match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="試合が見つかりません")
    if match.status != MatchStatus.upcoming:
        raise HTTPException(status_code=400, detail="この試合はベットを受け付けていません")
    if Decimal(str(current_user.balance)) < req.amount:
        raise HTTPException(status_code=400, detail=f"残高が不足しています（残高: {current_user.balance}pt）")
    existing = db.query(Bet).filter(
        Bet.user_id == current_user.id, Bet.match_id == req.match_id, Bet.result == BetResult.pending
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="この試合には既にベットしています")

    current_user.balance = Decimal(str(current_user.balance)) - req.amount
    bet = Bet(user_id=current_user.id, match_id=req.match_id, side=req.side, amount=req.amount)
    db.add(bet)
    db.flush()
    db.add(PointTransaction(
        user_id=current_user.id, amount=-req.amount, balance_after=current_user.balance,
        transaction_type=TransactionType.bet,
        description=f"ベット: {match.home_team} vs {match.away_team} ({req.side.value})",
        bet_id=bet.id,
    ))
    db.commit()
    bet_obj = db.query(Bet).options(joinedload(Bet.match).joinedload(Match.sport)).filter(Bet.id == bet.id).first()
    return bet_to_response(bet_obj)


@app.get("/api/bets/my", response_model=List[BetResponse])
def my_bets(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    bets = db.query(Bet).options(
        joinedload(Bet.match).joinedload(Match.sport)
    ).filter(Bet.user_id == current_user.id).order_by(Bet.created_at.desc()).all()
    return [bet_to_response(b) for b in bets]


@app.get("/api/bets", response_model=List[BetResponse])
def all_bets(match_id: Optional[int] = None, db: Session = Depends(get_db), _=Depends(require_admin)):
    q = db.query(Bet).options(joinedload(Bet.match).joinedload(Match.sport))
    if match_id:
        q = q.filter(Bet.match_id == match_id)
    return [bet_to_response(b) for b in q.order_by(Bet.created_at.desc()).all()]


# ===== TRANSACTIONS =====
@app.get("/api/transactions/my", response_model=List[PointTransactionResponse])
def my_transactions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(PointTransaction).filter(
        PointTransaction.user_id == current_user.id
    ).order_by(PointTransaction.created_at.desc()).limit(50).all()


# ===== RANKING =====
@app.get("/api/ranking", response_model=List[RankingEntry])
def get_ranking(db: Session = Depends(get_db), _=Depends(get_current_user)):
    users = db.query(User).filter(User.role == UserRole.user, User.is_active == True).all()
    ranking = []
    for user in users:
        bets = db.query(Bet).filter(
            Bet.user_id == user.id,
            Bet.result.notin_([BetResult.pending, BetResult.cancelled])
        ).all()
        total = len(bets)
        wins = sum(1 for b in bets if b.result in [BetResult.win, BetResult.partial_win_75, BetResult.partial_win_50])
        win_rate = (wins / total * 100) if total > 0 else 0.0
        ranking.append(RankingEntry(
            rank=0, user_id=user.id, name=user.name,
            balance=user.balance, total_bets=total, wins=wins,
            win_rate=round(win_rate, 1),
        ))
    ranking.sort(key=lambda x: x.balance, reverse=True)
    for i, e in enumerate(ranking):
        e.rank = i + 1
    return ranking


# ===== STATIC FILES =====
DIST_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")

if os.path.isdir(DIST_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(DIST_DIR, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404)
        return FileResponse(os.path.join(DIST_DIR, "index.html"))
