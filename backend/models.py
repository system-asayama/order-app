from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Numeric, DateTime,
    Enum, Boolean, ForeignKey
)
from sqlalchemy.orm import declarative_base, relationship
import enum

Base = declarative_base()


class UserRole(str, enum.Enum):
    admin = "admin"
    user = "user"


class MatchStatus(str, enum.Enum):
    upcoming = "upcoming"      # 開催前（ベット受付中）
    closed = "closed"          # ベット締め切り
    finished = "finished"      # 結果確定・精算済み
    cancelled = "cancelled"    # 中止


class BetSide(str, enum.Enum):
    home = "home"
    away = "away"


class BetResult(str, enum.Enum):
    win = "win"                        # 勝ち（×1.9倍）
    partial_win_75 = "partial_win_75"  # 3分勝ち（75%勝ち）
    partial_win_50 = "partial_win_50"  # 歩勝ち（50%勝ち）
    push = "push"                      # 引き分け（全額返還）
    partial_loss_50 = "partial_loss_50"  # 歩負け（50%負け）
    partial_loss_75 = "partial_loss_75"  # 3分負け（75%負け）
    loss = "loss"                      # 負け（全額没収）
    pending = "pending"                # 未確定
    cancelled = "cancelled"            # キャンセル


class TransactionType(str, enum.Enum):
    bet = "bet"                  # ベット（ポイント減算）
    payout = "payout"            # 払い戻し（ポイント加算）
    refund = "refund"            # 返金（キャンセル時）
    admin_adjust = "admin_adjust"  # 管理者による調整


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(320), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.user, nullable=False)
    balance = Column(Numeric(12, 2), default=1000.00, nullable=False)  # 持ち点
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    bets = relationship("Bet", back_populates="user")
    point_transactions = relationship("PointTransaction", back_populates="user")


class Sport(Base):
    __tablename__ = "sports"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    icon = Column(String(10), default="🏆")
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    matches = relationship("Match", back_populates="sport")


class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    sport_id = Column(Integer, ForeignKey("sports.id"), nullable=False)
    home_team = Column(String(100), nullable=False)
    away_team = Column(String(100), nullable=False)
    match_date = Column(DateTime, nullable=False)
    # ハンデ：正の値 = handicap_teamに不利（例: 1.3 = そのチームが1.3点のハンデを背負う）
    # handicap_team: "team1"（ホーム）または "team2"（アウェイ）がハンデを背負う
    handicap = Column(Numeric(5, 2), default=0.00, nullable=False)
    handicap_team = Column(String(10), default="team1", nullable=False)  # "team1" or "team2"
    home_score = Column(Integer, nullable=True)
    away_score = Column(Integer, nullable=True)
    status = Column(Enum(MatchStatus), default=MatchStatus.upcoming, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    sport = relationship("Sport", back_populates="matches")
    bets = relationship("Bet", back_populates="match")


class Bet(Base):
    __tablename__ = "bets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    match_id = Column(Integer, ForeignKey("matches.id"), nullable=False)
    side = Column(Enum(BetSide), nullable=False)      # home or away
    amount = Column(Numeric(12, 2), nullable=False)    # 賭けポイント
    result = Column(Enum(BetResult), default=BetResult.pending, nullable=False)
    payout = Column(Numeric(12, 2), nullable=True)     # 払い戻しポイント（精算後）
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    settled_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="bets")
    match = relationship("Match", back_populates="bets")


class PointTransaction(Base):
    __tablename__ = "point_transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)        # 正=加算、負=減算
    balance_after = Column(Numeric(12, 2), nullable=False)
    transaction_type = Column(Enum(TransactionType), nullable=False)
    description = Column(Text, nullable=True)
    bet_id = Column(Integer, ForeignKey("bets.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="point_transactions")
