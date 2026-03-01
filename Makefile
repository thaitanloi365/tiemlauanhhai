SHELL := /bin/sh

ifneq (,$(wildcard .env))
include .env
export
endif

.PHONY: help dev build preview check migrate-safe migrate-remote seed-admin run

help:
	@echo "Available targets:"
	@echo "  make dev             - Start dev server"
	@echo "  make build           - Build production bundle"
	@echo "  make preview         - Preview production build"
	@echo "  make check           - Run Svelte checks"
	@echo "  make migrate-safe    - Validate SUPABASE_DB_URL and push migrations"
	@echo "  make migrate-remote  - Alias of migrate-safe"
	@echo "  make seed-admin      - Seed super admin user"
	@echo "  make run CMD='...'   - Run any command with .env exported"

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

run:
	@if [ -z "$(CMD)" ]; then echo "Usage: make run CMD='bun run check'"; exit 1; fi
	@sh -lc '$(CMD)'
