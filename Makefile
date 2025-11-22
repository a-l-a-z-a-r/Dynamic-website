lint:
	@echo "Linting backend (flake8)…"
	@cd backend && flake8
	@echo "Linting frontend (prettier)…"
	@npm run lint:frontend --silent
