# Tijoir Infra

Local infrastructure starts with Docker Compose:

```bash
docker compose -f infra/docker/docker-compose.yml up -d
```

Production AWS infrastructure is managed with Terraform:

```text
infra/terraform/
```

Cloud-specific notes:

```text
infra/terraform/    AWS production infrastructure
```
