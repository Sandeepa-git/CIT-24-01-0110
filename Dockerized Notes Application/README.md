# Dockerized Notes Application

## Project Overview

This project is developed as part of CCS3308 – Virtualization and Containers assignment.
It demonstrates a multi-container Docker application with service orchestration, networking, and persistent storage.

The application is a simple Notes Management System where users can:

* Create notes through a web interface
* View saved notes
* Store data permanently using a database

The system is fully containerized using Docker and can be deployed using shell scripts or Docker Compose.

---

## System Architecture

The application consists of three main services:

```text
Browser
   ↓
Frontend (Nginx)
   ↓
Backend (Flask API)
   ↓
MongoDB (Database with persistent storage)
```

### Services

* Frontend (Nginx)

  * Serves the web interface (HTML/JS)
  * Runs on port 8180

* Backend (Flask API)

  * Handles REST API requests
  * Runs on port 5000
  * Communicates with MongoDB

* Database (MongoDB)

  * Stores notes data
  * Uses Docker volume for persistent storage
  * Runs on port 27017

---

## Network Configuration

A custom Docker network is created:

* Network Name: notes_network
* Purpose:

  * Enables communication between containers
  * Isolates application from host network

All services are connected to this network.

---

## Persistent Storage

This project uses Docker named volumes:

* Volume Name: mongodb_data
* Purpose:

  * Stores MongoDB database files
  * Ensures data persistence even after container restart or removal

---

## Container List

| Service  | Container Name | Image        | Port  | Role          |
| -------- | -------------- | ------------ | ----- | ------------- |
| Frontend | frontend       | nginx        | 8180  | UI Web Server |
| Backend  | backend        | custom build | 5000  | API Service   |
| Database | mongodb        | mongo        | 27017 | Data Storage  |

---

## Deployment Requirements

Make sure the following are installed:

* Docker Engine
* Docker Compose
* Git
* Bash shell (Linux / WSL / macOS)

Check installation:

```bash
docker --version
docker compose version
```

---

## How to Run the Project

### 1. Clone Repository

```bash
git clone https://github.com/<your-registration-number>.git
cd <your-registration-number>
```

---

### 2. Give Permission to Scripts

```bash
chmod +x *.sh
```

---

### 3. Prepare the Application

This step builds images, networks, and volumes.

```bash
./prepare-app.sh
```

Expected output:

```text
Preparing app...
Preparation complete.
```

---

### 4. Start the Application

```bash
./start-app.sh
```

Expected output:

```text
Starting app...
Application available at:
http://localhost:8180
```

---

### 5. Access Application

Open in browser:

http://localhost:8180

You can:

* Add notes
* View stored notes

---

### 6. Stop the Application (Keep Data Safe)

```bash
./stop-app.sh
```

This stops containers but does not delete data.

---

### 7. Remove Everything (Full Cleanup)

```bash
./remove-app.sh
```

This removes:

* Containers
* Networks
* Images
* Volumes (database reset)

---

## Example Workflow

```bash
./prepare-app.sh
./start-app.sh
http://localhost:8180
./stop-app.sh
./start-app.sh
./remove-app.sh
```

---

## Container Configuration

### Backend Configuration

* Built using Python Flask
* Connects to MongoDB using:

```
mongodb://mongodb:27017/
```

### MongoDB Configuration

* Uses official MongoDB image
* Data stored in /data/db
* Persistent volume attached

### Frontend Configuration

* Uses Nginx official image
* HTML served from /usr/share/nginx/html

---

## Project Structure

```
.
├── frontend/
│   └── index.html
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   └── Dockerfile
├── prepare-app.sh
├── start-app.sh
├── stop-app.sh
├── remove-app.sh
├── docker-compose.yaml
└── README.md
```

---

## Technologies Used

* Docker
* Docker Compose
* Flask (Python)
* MongoDB
* Nginx
* HTML
* JavaScript

---

## Key Features

* Multi-container architecture
* Service communication via Docker network
* Persistent database storage using volumes
* Automated deployment scripts
* Separation of frontend, backend, and database

---

## Notes

* Ensure ports 8180 and 5000 are free before running
* MongoDB data persists unless remove-app.sh is executed
* Designed for educational purposes (Virtualization and Containers assignment)

---

## Author

CIT-24-01-0110 | A.G.S.V Wimalasiri
Student Project – CCS3308 Virtualization and Containers
University Assignment Submission

---

## License

This project is for academic purposes only.
