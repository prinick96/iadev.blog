.PHONY: i run build start test lint format check

i:
	bun install --frozen-lockfile

run:
	bun run dev

build:
	bun run build

start:
	bun run preview

test:
	bun run test

lint:
	bun run lint

format:
	bun run format

check:
	bun run check
