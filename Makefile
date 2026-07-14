COMPOSE_FILE=infra/docker/docker-compose.yml

# Use Compose v2 (`docker compose`) if available, else fall back to v1 (`docker-compose`).
DC := $(shell docker compose version >/dev/null 2>&1 && echo "docker compose" || echo "docker-compose")

.PHONY: dev dev-down dev-logs dev-db backend-test tree

# Onde command: build + start the whole dev stack (postgres + backend + frontend).
# Backend runs on the `dev` Spring profile (docker-compose sets SPRING_PROFILES_ACTIVE=dev).
#   Frontend: http://localhost:3000   Backend: http://localhost:8080
dev:
	$(DC) -f $(COMPOSE_FILE) up --build

dev-down:
	$(DC) -f $(COMPOSE_FILE) down

dev-logs:
	$(DC) -f $(COMPOSE_FILE) logs -f

# Postgres only — for running backend/frontend from an IDE against the containerized DB.
dev-db:
	$(DC) -f $(COMPOSE_FILE) up -d postgres

backend-test:
	cd backend && mvn test

tree:
	find . -maxdepth 4 -type d | sort
