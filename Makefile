SHELL := /bin/sh

env ?=
ENV ?= $(if $(env),$(env),dev)
ENV_FILE := .env.$(ENV)

ifneq (,$(wildcard $(ENV_FILE)))
include $(ENV_FILE)
export
endif

.PHONY: help dev build preview check migrate-safe migrate-remote seed-admin migration-new db-nuke db-reset run

help:
	@echo "Available targets:"
	@echo "  make dev             - Start dev server"
	@echo "  make build           - Build production bundle"
	@echo "  make preview         - Preview production build"
	@echo "  make check           - Run Svelte checks"
	@echo "  make migrate-safe    - Validate SUPABASE_DB_URL and push migrations"
	@echo "  make migrate-remote  - Alias of migrate-safe"
	@echo "  make seed-admin      - Seed super admin user"
	@echo "  make migration-new NAME=... - Create timestamped migration file"
	@echo "  make db-nuke         - Reset remote DB from current migrations (no seed)"
	@echo "  make db-reset        - Nuke + migrate + seed admin"
	@echo "  make run CMD='...'   - Run any command with selected env exported"
	@echo "  env/ENV options: dev (default) or prod"

dev:
	bun run dev

build:
	bun run build

preview:
	bun run preview

check:
	bun run check

migrate-safe:
	bun run migrate:safe

migrate-remote: migrate-safe

seed-admin:
	bun run seed:admin

migration-new:
	@if [ -z "$(NAME)" ]; then echo "Usage: make migration-new NAME=create_orders_table"; exit 1; fi
	npx supabase@latest migration new "$(NAME)"

db-nuke:
	@if [ -z "$$SUPABASE_DB_URL" ]; then echo "SUPABASE_DB_URL is missing"; exit 1; fi
	npx supabase@latest db reset --db-url "$$SUPABASE_DB_URL" --no-seed

db-reset: db-nuke migrate-safe seed-admin

run:
	@if [ -z "$(CMD)" ]; then echo "Usage: make run CMD='bun run check'"; exit 1; fi
	@sh -lc '$(CMD)'
