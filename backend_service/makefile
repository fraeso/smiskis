.PHONY: run build down clean log

run:
	docker compose up -d --build

down:
	docker compose down

clean:
	docker compose down -v

log:
	docker compose logs -f
