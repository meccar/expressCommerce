# Variables for Docker Compose files
DOCKER_COMPOSE_DEV_FILE=docker-compose.dev.yaml
DOCKER_COMPOSE_PROD_FILE=docker-compose.prod.yaml

# Define directory path

COMPOSE_DIR=compose


up-dev:
	cd $(COMPOSE_DIR) && docker-compose -f $(DOCKER_COMPOSE_DEV_FILE) up -d

up-prod:
	cd $(COMPOSE_DIR) && docker-compose -f $(DOCKER_COMPOSE_PROD_FILE) up -d

down-dev:
	cd $(COMPOSE_DIR) && docker-compose -f $(DOCKER_COMPOSE_DEV_FILE) down

down-prod:
	cd $(COMPOSE_DIR) && docker-compose -f $(DOCKER_COMPOSE_PROD_FILE) down

logs-dev:
	cd $(COMPOSE_DIR) && docker-compose -f $(DOCKER_COMPOSE_DEV_FILE) logs -f

logs-prod:
	cd $(COMPOSE_DIR) && docker-compose -f $(DOCKER_COMPOSE_PROD_FILE) logs -f

build-dev:
	cd $(COMPOSE_DIR) && docker-compose -f $(DOCKER_COMPOSE_DEV_FILE) build

build-prod:
	cd $(COMPOSE_DIR) && docker-compose -f $(DOCKER_COMPOSE_PROD_FILE) build

stop-dev:
	cd $(COMPOSE_DIR) && docker-compose -f $(DOCKER_COMPOSE_DEV_FILE) stop

stop-prod-dev:
	cd $(COMPOSE_DIR) && docker-compose -f $(DOCKER_COMPOSE_PROD_FILE) stop

rm-dev:
	cd $(COMPOSE_DIR) && docker-compose -f $(DOCKER_COMPOSE_DEV_FILE) rm -f
