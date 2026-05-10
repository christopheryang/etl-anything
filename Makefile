# ETL Anything - Makefile
# Common development and deployment tasks

.PHONY: help backend frontend dev stop clean test install info

# Default target
help:
	@echo "ETL Anything - Available Commands:"
	@echo ""
	@echo "  make backend    - Start backend server (port 8001)"
	@echo "  make frontend   - Start frontend dev server (port 3001)"
	@echo "  make dev        - Start both backend and frontend"
	@echo "  make stop       - Stop backend and frontend servers"
	@echo "  make test       - Run backend tests"
	@echo "  make lint       - Run TypeScript type check"
	@echo "  make clean      - Clean build artifacts"
	@echo "  make install    - Install dependencies"
	@echo "  make info       - Show environment information"
	@echo ""

# Start backend server
backend:
	@echo "🚀 Starting backend server on port 8001..."
	@cd backend && \
	source venv/bin/activate && \
	uvicorn main:app --reload --port 8001

# Start frontend dev server
frontend:
	@echo "🎨 Starting frontend dev server on port 3001..."
	@cd frontend && \
	npm run dev -- -p 3001

# Start both servers (requires two terminals or background processes)
dev:
	@echo "🚀 Starting both backend and frontend..."
	@echo "   Backend: http://localhost:8001"
	@echo "   Frontend: http://localhost:3001"
	@echo ""
	@echo "Starting backend in background..."
	@cd backend && \
	source venv/bin/activate && \
	uvicorn main:app --reload --port 8001 &
	@sleep 2
	@echo "Starting frontend..."
	@cd frontend && \
	npm run dev -- -p 3001

# Stop all servers
stop:
	@echo "🛑 Stopping servers..."
	@echo "Stopping backend (port 8001)..."
	@lsof -ti:8001 | xargs kill -9 2>/dev/null && echo "✅ Backend stopped" || echo "ℹ️  Backend not running"
	@echo "Stopping frontend (port 3001)..."
	@lsof -ti:3001 | xargs kill -9 2>/dev/null && echo "✅ Frontend stopped" || echo "ℹ️  Frontend not running"
	@echo "✅ All servers stopped"

# Run backend tests
test:
	@echo "🧪 Running backend tests..."
	@cd backend && \
	source venv/bin/activate && \
	python -m pytest tests/ -v

# Run TypeScript type check
lint:
	@echo "🔍 Running TypeScript type check..."
	@cd frontend && \
	npx -p typescript tsc --noEmit 2>&1 | grep -v "^npm warn" || true

# Clean build artifacts
clean:
	@echo "🧹 Cleaning build artifacts..."
	@rm -rf backend/__pycache__
	@rm -rf backend/.pytest_cache
	@rm -rf backend/*.pyc
	@rm -rf frontend/.next
	@rm -rf frontend/node_modules
	@rm -rf backend/outputs/*
	@rm -rf backend/uploads/*
	@echo "✅ Clean complete!"

# Install dependencies
install:
	@echo "📦 Installing dependencies..."
	@cd backend && \
	pip install -r requirements.txt
	@cd frontend && \
	npm install
	@echo "✅ Dependencies installed!"

# Show environment info
info:
	@echo "ℹ️  Environment Information:"
	@echo ""
	@echo "Python:"
	@python3 --version
	@echo ""
	@echo "Node.js:"
	@node --version 2>/dev/null || echo "Node.js not found"
	@echo ""
	@echo "npm:"
	@npm --version 2>/dev/null || echo "npm not found"
	@echo ""
	@echo "Backend packages:"
	@cd backend && source venv/bin/activate && pip list | grep -E "fastapi|uvicorn|pydantic|openai|anthropic" || true
	@echo ""
	@echo "Frontend packages:"
	@cd frontend && npm list --depth=0 2>/dev/null | head -20 || true
