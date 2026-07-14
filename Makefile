COMPOSE_FILE=infra/docker/docker-compose.yml

.PHONY: dev dev-down dev-logs dev-db backend-test tree

# One command: build + start the whole dev stack (postgres + backend + frontend).
# Backend runs on the `dev` Spring profile (docker-compose sets SPRING_PROFILES_ACTIVE=dev).
#   Frontend: http://localhost:3000   Backend: http://localhost:8080
dev:
	docker compose -f $(COMPOSE_FILE) up --build

dev-down:
	docker compose -f $(COMPOSE_FILE) down

dev-logs:
	docker compose -f $(COMPOSE_FILE) logs -f

# Postgres only — for running backend/frontend from an IDE against the containerized DB.
dev-db:
	docker compose -f $(COMPOSE_FILE) up -d postgres

backend-test:
	cd backend && mvn test

tree:
	find . -maxdepth 4 -type d | sort
