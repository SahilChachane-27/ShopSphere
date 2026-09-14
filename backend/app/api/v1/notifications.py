from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.dependencies.auth import get_current_user
from app.models.models import Notification, User
from app.schemas.schemas import StandardResponse, NotificationOut

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("", response_model=StandardResponse[List[NotificationOut]])
async def get_user_notifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Notification).where(Notification.user_id == current_user.id).order_by(Notification.created_at.desc())
    res = await db.execute(stmt)
    notifications = res.scalars().all()
    return StandardResponse(data=[NotificationOut.model_validate(n) for n in notifications])

@router.put("/{notification_id}/read", response_model=StandardResponse[dict])
async def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Notification).where(Notification.id == notification_id, Notification.user_id == current_user.id)
    res = await db.execute(stmt)
    notif = res.scalar_one_or_none()
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")

    notif.is_read = True
    db.add(notif)
    await db.commit()
    return StandardResponse(message="Notification marked as read", data={})

@router.put("/read-all", response_model=StandardResponse[dict])
async def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = update(Notification).where(Notification.user_id == current_user.id).values(is_read=True)
    await db.execute(stmt)
    await db.commit()
    return StandardResponse(message="All notifications marked as read", data={})
