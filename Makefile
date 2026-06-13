COMPOSE_FILE=infra/docker/docker-compose.yml

.PHONY: dev-up dev-down dev-logs backend-test frontend-dev tree

dev-up:
	docker compose -f $(COMPOSE_FILE) up -d postgres redis

dev-down:
	docker compose -f $(COMPOSE_FILE) down

dev-logs:
	docker compose -f $(COMPOSE_FILE) logs -f

backend-test:
	cd backend && mvn test

frontend-dev:
	cd frontend && npm run dev

tree:
	find . -maxdepth 4 -type d | sort

