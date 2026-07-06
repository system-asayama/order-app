from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import timedelta

from database import get_db, engine
from models import Base, User, OrderItem, Order, UserRole, OrderStatus
from schemas import (
    LoginRequest, TokenResponse, UserResponse, UserCreate, UserUpdate,
    OrderItemCreate, OrderItemUpdate, OrderItemResponse,
    OrderCreate, OrderStatusUpdate, OrderResponse,
)
from auth import (
    authenticate_user, create_access_token, get_password_hash,
    get_current_user, get_current_admin,
)
from config import settings

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Order App API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# Auth
# ============================================================

@app.post("/api/auth/login", response_model=TokenResponse)
def login(form: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, form.email, form.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="メールアドレスまたはパスワードが正しくありません",
        )
    token = create_access_token(
        {"sub": str(user.id), "role": user.role},
        timedelta(minutes=settings.access_token_expire_minutes),
    )
    return {"access_token": token, "token_type": "bearer"}


@app.get("/api/auth/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user


# ============================================================
# Users (admin)
# ============================================================

@app.get("/api/users", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    return db.query(User).order_by(User.created_at.desc()).all()


@app.post("/api/users", response_model=UserResponse, status_code=201)
def create_user(
    body: UserCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="このメールアドレスはすでに登録されています")
    user = User(
        email=body.email,
        name=body.name,
        hashed_password=get_password_hash(body.password),
        role=body.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.patch("/api/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    body: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="ユーザーが見つかりません")
    if user_id == current_user.id and body.role == UserRole.user:
        raise HTTPException(status_code=400, detail="自分自身のロールを変更できません")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


# ============================================================
# Order Item Master (admin CRUD)
# ============================================================

@app.get("/api/order-items", response_model=List[OrderItemResponse])
def list_order_items(
    active_only: bool = True,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(OrderItem)
    if active_only:
        q = q.filter(OrderItem.is_active == True)
    return q.order_by(OrderItem.category, OrderItem.name).all()


@app.post("/api/order-items", response_model=OrderItemResponse, status_code=201)
def create_order_item(
    body: OrderItemCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    item = OrderItem(**body.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@app.patch("/api/order-items/{item_id}", response_model=OrderItemResponse)
def update_order_item(
    item_id: int,
    body: OrderItemUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    item = db.query(OrderItem).filter(OrderItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="品目が見つかりません")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item


@app.delete("/api/order-items/{item_id}", status_code=204)
def delete_order_item(
    item_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    item = db.query(OrderItem).filter(OrderItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="品目が見つかりません")
    # Soft delete
    item.is_active = False
    db.commit()


# ============================================================
# Orders
# ============================================================

@app.post("/api/orders", response_model=OrderResponse, status_code=201)
def create_order(
    body: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = Order(
        user_id=current_user.id,
        order_item_id=body.order_item_id,
        item_name=body.item_name,
        amount=body.amount,
        memo=body.memo,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    resp = OrderResponse.model_validate(order)
    resp.user_name = current_user.name
    resp.user_email = current_user.email
    return resp


@app.get("/api/orders/my", response_model=List[OrderResponse])
def my_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    orders = (
        db.query(Order)
        .filter(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc())
        .all()
    )
    result = []
    for o in orders:
        r = OrderResponse.model_validate(o)
        r.user_name = current_user.name
        r.user_email = current_user.email
        result.append(r)
    return result


@app.get("/api/orders", response_model=List[OrderResponse])
def all_orders(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    orders = (
        db.query(Order)
        .join(User, Order.user_id == User.id)
        .order_by(Order.created_at.desc())
        .all()
    )
    result = []
    for o in orders:
        r = OrderResponse.model_validate(o)
        r.user_name = o.user.name if o.user else None
        r.user_email = o.user.email if o.user else None
        result.append(r)
    return result


@app.patch("/api/orders/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    order_id: int,
    body: OrderStatusUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="注文が見つかりません")
    order.status = body.status
    db.commit()
    db.refresh(order)
    r = OrderResponse.model_validate(order)
    if order.user:
        r.user_name = order.user.name
        r.user_email = order.user.email
    return r


# ============================================================
# Static files (React SPA)
# ============================================================

DIST_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")

if os.path.isdir(DIST_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(DIST_DIR, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        # Don't intercept /api routes
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404)
        index = os.path.join(DIST_DIR, "index.html")
        return FileResponse(index)

# ============================================================
# Seed: create initial admin user if none exists
# ============================================================

@app.on_event("startup")
def seed_admin():
    db = next(get_db())
    try:
        if not db.query(User).filter(User.role == UserRole.admin).first():
            admin = User(
                email="admin@example.com",
                name="Administrator",
                hashed_password=get_password_hash("admin123"),
                role=UserRole.admin,
            )
            db.add(admin)
            db.commit()
            print("[Seed] Admin user created: admin@example.com / admin123")
    finally:
        db.close()
