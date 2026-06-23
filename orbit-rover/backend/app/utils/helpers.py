import hashlib
import hmac
import json
import logging
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)


def verify_gitlab_token(header_token: str | None, expected_token: str) -> bool:
    if not expected_token:
        logger.warning("GITLAB_WEBHOOK_SECRET not configured — skipping token verification")
        return True
    if not header_token:
        return False
    return hmac.compare_digest(header_token, expected_token)


def truncate_log(log_text: str, max_lines: int) -> str:
    lines = log_text.splitlines()
    if len(lines) <= max_lines:
        return log_text
    omitted = len(lines) - max_lines
    return "\n".join(lines[-max_lines:]) + f"\n\n... [{omitted} lines truncated]"


def load_prompt_template(name: str) -> str:
    prompts_dir = Path(__file__).resolve().parent.parent / "prompts"
    path = prompts_dir / name
    if not path.exists():
        raise FileNotFoundError(f"Prompt template not found: {path}")
    return path.read_text(encoding="utf-8")


def safe_json_dumps(data: Any, indent: int = 2) -> str:
    return json.dumps(data, indent=indent, default=str)


def confidence_label(confidence: float) -> str:
    pct = int(confidence * 100)
    if pct >= 90:
        return f"**{pct}%** (High)"
    if pct >= 70:
        return f"**{pct}%** (Medium)"
    return f"**{pct}%** (Low)"


def pipeline_fingerprint(project_id: int, pipeline_id: int, sha: str) -> str:
    raw = f"{project_id}:{pipeline_id}:{sha}"
    return hashlib.sha256(raw.encode()).hexdigest()[:16]
