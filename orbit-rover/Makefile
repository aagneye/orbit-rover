.PHONY: dev backend frontend test demo docker

dev: backend frontend

backend:
	cd backend && uvicorn app.main:app --reload --port 8000

frontend:
	cd frontend && npm run dev

test:
	cd backend && pytest tests/ -v

demo:
	powershell -ExecutionPolicy Bypass -File scripts/demo.ps1

docker:
	docker compose up --build

install:
	cd backend && pip install -r requirements.txt -r requirements-dev.txt
	cd frontend && npm install
