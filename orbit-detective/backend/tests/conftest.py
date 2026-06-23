import os
import tempfile

# Use isolated test database
_test_dir = tempfile.mkdtemp()
os.environ.setdefault("DATABASE_URL", f"sqlite+aiosqlite:///{_test_dir}/test.db")
os.environ.setdefault("LLM_PROVIDER", "mock")
os.environ.setdefault("ORBIT_USE_MOCK", "true")
os.environ.setdefault("GITLAB_WEBHOOK_SECRET", "")
os.environ.setdefault("AUTH_ENABLED", "false")
