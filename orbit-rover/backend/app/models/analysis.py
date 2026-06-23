import uuid
from datetime import datetime

from sqlalchemy import JSON, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class AnalysisRecord(Base):
    __tablename__ = "analyses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[int] = mapped_column(Integer, index=True)
    project_path: Mapped[str] = mapped_column(String(255), index=True)
    pipeline_id: Mapped[int] = mapped_column(Integer, index=True)
    pipeline_iid: Mapped[int] = mapped_column(Integer)
    pipeline_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    branch: Mapped[str] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(50))
    mr_iid: Mapped[int | None] = mapped_column(Integer, nullable=True)
    mr_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    cause: Mapped[str] = mapped_column(Text)
    confidence: Mapped[float] = mapped_column(Float)
    summary: Mapped[str] = mapped_column(Text)
    report_json: Mapped[dict] = mapped_column(JSON)
    context_json: Mapped[dict] = mapped_column(JSON)
    provider: Mapped[str] = mapped_column(String(50), default="mock")
    model: Mapped[str] = mapped_column(String(100), default="mock")
    mr_comment_posted: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
