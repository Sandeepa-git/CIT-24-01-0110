#!/bin/bash

echo "Preparing app..."

docker network create notes_network

docker volume create mongodb_data

docker build -t notes-backend ./backend

echo "Preparation complete."