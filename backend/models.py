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


class OrderStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(320), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.user, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    orders = relationship("Order", back_populates="user")


class OrderItem(Base):
    """品目マスターテーブル"""
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    default_amount = Column(Numeric(12, 2), nullable=True)
    category = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    orders = relationship("Order", back_populates="order_item")


class Order(Base):
    """注文テーブル"""
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    order_item_id = Column(Integer, ForeignKey("order_items.id"), nullable=True)
    item_name = Column(String(255), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    memo = Column(Text, nullable=True)
    status = Column(Enum(OrderStatus), default=OrderStatus.pending, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="orders")
    order_item = relationship("OrderItem", back_populates="orders")
