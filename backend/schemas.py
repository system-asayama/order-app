from datetime import datetime
from typing import Optional
from decimal import Decimal
from pydantic import BaseModel, EmailStr, field_validator
from models import UserRole, OrderStatus


# ---- Auth ----

class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    role: UserRole
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    email: str
    name: str
    password: str
    role: UserRole = UserRole.user

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("パスワードは6文字以上で入力してください")
        return v


class UserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


# ---- Order Item Master ----

class OrderItemCreate(BaseModel):
    name: str
    description: Optional[str] = None
    default_amount: Optional[Decimal] = None
    category: Optional[str] = None


class OrderItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    default_amount: Optional[Decimal] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None


class OrderItemResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    default_amount: Optional[Decimal]
    category: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ---- Orders ----

class OrderCreate(BaseModel):
    order_item_id: Optional[int] = None
    item_name: str
    amount: Decimal
    memo: Optional[str] = None

    @field_validator("amount")
    @classmethod
    def amount_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("金額は0より大きい値を入力してください")
        return v

    @field_validator("item_name")
    @classmethod
    def item_name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("品目名を入力してください")
        return v.strip()


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class OrderResponse(BaseModel):
    id: int
    user_id: int
    order_item_id: Optional[int]
    item_name: str
    amount: Decimal
    memo: Optional[str]
    status: OrderStatus
    created_at: datetime
    updated_at: datetime
    user_name: Optional[str] = None
    user_email: Optional[str] = None

    class Config:
        from_attributes = True
