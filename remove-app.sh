#!/bin/bash

echo "Removing application..."

docker compose down

docker volume rm mongodb_data

docker network rm notes_network

docker image rm notes-backend

echo "Removed app."