from typing import Optional, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import AuditLog, Notification, NotificationType

async def log_audit(
    db: AsyncSession,
    action: str,
    entity: str,
    user_id: Optional[int] = None,
    entity_id: Optional[str] = None,
    ip_address: Optional[str] = None,
    details: Optional[dict] = None
):
    try:
        audit = AuditLog(
            user_id=user_id,
            action=action,
            entity=entity,
            entity_id=str(entity_id) if entity_id else None,
            ip_address=ip_address,
            details_json=details or {}
        )
        db.add(audit)
        await db.commit()
    except Exception as e:
        print(f"Failed to create audit log: {e}")

async def create_notification(
    db: AsyncSession,
    user_id: int,
    notification_type: NotificationType,
    title: str,
    message: str,
    link: Optional[str] = None
):
    try:
        notif = Notification(
            user_id=user_id,
            type=notification_type,
            title=title,
            message=message,
            link=link,
            is_read=False
        )
        db.add(notif)
        await db.commit()
    except Exception as e:
        print(f"Failed to create notification: {e}")
