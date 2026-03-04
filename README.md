# Cloud Engineer Assessment — Full-Stack CRUD Application

A production-ready, containerised full-stack web application demonstrating core cloud engineering competencies: infrastructure design, Docker orchestration, AWS service integration, and secure environment configuration.

> **Demo Video:** https://youtu.be/7166htiUrk4  
> **Repository:** https://github.com/Zayan-Mohamed/cloud-engineer-assessment.git  
> **EC2 Public IP:** http://16.16.214.245/  

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Environment Variables](#environment-variables)
- [AWS Infrastructure Setup](#aws-infrastructure-setup)
- [Production Deployment](#production-deployment)
- [API Reference](#api-reference)
- [Security Considerations](#security-considerations)

---

## Architecture Overview

```
                        ┌─────────────────────────────────────┐
                        │           AWS Cloud (EC2)            │
  Browser               │                                      │
    │                   │  ┌──────────┐      ┌─────────────┐  │
    │── HTTP :80 ───────┼─▶│  Nginx   │─────▶│   Backend   │  │
    │                   │  │ (Reverse │      │  (Gunicorn  │  │
    │                   │  │  Proxy)  │      │  + Django)  │  │
    │                   │  └──────────┘      └──────┬──────┘  │
    │                   │       │                   │         │
    │                   │  ┌────▼─────┐      ┌──────▼──────┐  │
    │                   │  │ Frontend │      │  Amazon RDS │  │
    │                   │  │ (React + │      │ (PostgreSQL)│  │
    │                   │  │  Nginx)  │      └─────────────┘  │
    │                   │  └──────────┘                        │
    │                   └─────────────────────────────────────┘
    │                                        │
    │                              ┌─────────▼──────────┐
    │                              │     Amazon S3      │
    │◀─────── File URLs ───────────│  (File Attachments)│
                                   └────────────────────┘
```

**Traffic flow:**

- All HTTP traffic enters through **Nginx** on port 80
- `/api/*` and `/admin/*` requests are proxied to the **Django/Gunicorn** backend
- All other requests are proxied to the **React** frontend container
- Django uses **Amazon RDS (PostgreSQL)** for persistent data storage
- File uploads are stored directly in **Amazon S3** and served via permanent public URLs

---

## Technology Stack

| Layer                | Technology                                  |
| -------------------- | ------------------------------------------- |
| **Frontend**         | React 19, Vite 7, Axios                     |
| **Backend**          | Django 4.2, Django REST Framework, Gunicorn |
| **Database**         | PostgreSQL 15 (Amazon RDS)                  |
| **File Storage**     | Amazon S3 (`django-storages` + `boto3`)     |
| **Reverse Proxy**    | Nginx (Alpine)                              |
| **Containerisation** | Docker, Docker Compose                      |
| **Cloud Provider**   | AWS (EC2, RDS, S3, IAM)                     |

---

## Project Structure

```
cloud-engineer-assessment/
├── backend/
│   ├── api/                    # Django app — models, views, serializers, URLs
│   │   ├── migrations/
│   │   ├── admin.py            # Task registered in Django admin
│   │   ├── models.py           # Task model
│   │   ├── serializers.py      # DRF serializers
│   │   ├── views.py            # ModelViewSet (full CRUD)
│   │   └── urls.py             # API router
│   ├── core/                   # Django project configuration
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── Dockerfile              # Python 3.11-slim, Gunicorn (3 workers)
│   ├── entrypoint.sh           # Auto-runs migrate + collectstatic on startup
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   └── App.jsx             # Full CRUD UI (React)
│   ├── Dockerfile              # Multi-stage: Node 22 build → Nginx serve
│   └── package.json
├── nginx/
│   └── nginx.conf              # Reverse proxy — routes /api/, /admin/, /static/, /
├── docker-compose.yml          # Orchestrates backend, frontend, nginx
├── .env.example                # Environment variable reference template
└── README.md
```

---

## Features

- **Create** tasks with a title, description, and optional file attachment
- **Read** — live task list fetched from the REST API on page load
- **Update** — inline edit form pre-populated with existing record data
- **Delete** — single-click record removal with immediate UI refresh
- **File uploads** — attachments stored on Amazon S3 and served via permanent public URLs
- **Django Admin** — full model management interface at `/admin/`
- **Auto-migration** — database schema applied automatically on every container startup

---

## Prerequisites

### Local Development

- Python 3.11+
- Node.js 20+
- PostgreSQL 15
- Git

### Production (AWS)

- AWS account with permissions for EC2, RDS, S3, and IAM
- EC2 instance running Ubuntu 24.04 LTS (t3.small or larger)
- Docker and Docker Compose installed on the EC2 instance

---

## Local Development Setup

### 1. Clone the repository

```bash
git clone https://github.com/Zayan-Mohamed/cloud-engineer-assessment.git
cd cloud-engineer-assessment
```

### 2. Configure environment variables

```bash
cp .env.example .env
# Edit .env — set DEBUG=True and point DB_HOST to localhost
```

### 3. Create the local database

```bash
sudo -u postgres psql -c "CREATE DATABASE cloud_db;"
```

### 4. Run the backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
# Backend available at http://localhost:8000
```

### 5. Run the frontend

```bash
cd frontend
npm install
npm run dev
# Frontend available at http://localhost:5173
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in all values before running the application.

```dotenv
# Django
SECRET_KEY=your_super_secret_key_here
DEBUG=False                             # True for local development only

# PostgreSQL
DB_ENGINE=django.db.backends.postgresql
DB_NAME=cloud_db
DB_USER=postgres
DB_PASSWORD=your_db_password
DB_HOST=your-rds-endpoint.rds.amazonaws.com   # Use 'localhost' for local dev
DB_PORT=5432

# AWS S3
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_STORAGE_BUCKET_NAME=your_s3_bucket_name
AWS_S3_REGION_NAME=us-east-1
```

> **Never commit `.env` to version control.** It is listed in `.gitignore`.

> Generate a secure secret key with:
>
> ```bash
> python -c "import secrets; print(secrets.token_urlsafe(50))"
> ```

---

## AWS Infrastructure Setup

### 1. S3 Bucket

1. Create a bucket in your target region (e.g. `cloud-engineer-assessment-uploads`)
2. Under **Permissions**, disable **Block all public access**
3. Apply the following **Bucket Policy**:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

4. Add a **CORS configuration**:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]
```

### 2. IAM User

1. Create an IAM user with programmatic access (e.g. `cloud-app-s3-user`)
2. Attach the **AmazonS3FullAccess** managed policy (or a scoped inline policy limited to your bucket)
3. Generate and save the **Access Key ID** and **Secret Access Key**

### 3. RDS PostgreSQL

1. Launch a **PostgreSQL 15** instance (Free Tier eligible)
2. Set the initial database name to `cloud_db`
3. Place it in the **same VPC** as your EC2 instance
4. In the RDS **Security Group → Inbound rules**, add:
   - **Type:** `PostgreSQL` | **Port:** `5432` | **Source:** EC2 Security Group ID

### 4. EC2 Instance

1. Launch **Ubuntu 24.04 LTS** (t3.small minimum recommended)
2. Configure the **Security Group** inbound rules:
   - Port `22` — SSH (restrict to your IP)
   - Port `80` — HTTP (0.0.0.0/0)
3. Install Docker on the instance:

```bash
sudo apt-get update && sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update && sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker ubuntu && newgrp docker
```

---

## Production Deployment

### 1. Clone the repository on EC2

```bash
git clone https://github.com/Zayan-Mohamed/cloud-engineer-assessment.git
cd cloud-engineer-assessment
```

### 2. Create the production `.env`

```bash
nano .env
# Populate with: RDS endpoint, RDS password, S3 credentials, strong SECRET_KEY, DEBUG=False
```

### 3. Build and start all containers

```bash
docker compose up --build -d
```

This single command:

- Builds the **Django backend** image and automatically runs `migrate` and `collectstatic`
- Builds the **React frontend** (multi-stage) and serves the production bundle
- Starts **Nginx** as the reverse proxy on port 80

### 4. Create a Django superuser

```bash
docker compose exec backend python manage.py createsuperuser
```

Access the admin panel at `http://<EC2_PUBLIC_IP>/admin/`

### 5. Verify the deployment

```bash
docker compose ps                      # All services: "running"
curl http://localhost/api/tasks/       # Returns: []
```

### 6. Updating the application

```bash
git pull
docker compose up --build -d
```

---

## API Reference

**Base URL:** `http://<host>/api/`

| Method   | Endpoint           | Description                              |
| -------- | ------------------ | ---------------------------------------- |
| `GET`    | `/api/tasks/`      | List all tasks (ordered by newest first) |
| `POST`   | `/api/tasks/`      | Create a new task                        |
| `GET`    | `/api/tasks/{id}/` | Retrieve a single task                   |
| `PATCH`  | `/api/tasks/{id}/` | Partially update a task                  |
| `DELETE` | `/api/tasks/{id}/` | Delete a task                            |

**Task object schema:**

```json
{
  "id": 1,
  "title": "Example Task",
  "description": "An optional description.",
  "created_at": "2026-03-04T18:00:00Z",
  "file_attachment": "https://your-bucket.s3.amazonaws.com/uploads/file.pdf"
}
```

**Example — create a task with a file attachment:**

```bash
curl -X POST http://<host>/api/tasks/ \
  -F "title=My Task" \
  -F "description=Optional description" \
  -F "file_attachment=@/path/to/file.pdf"
```

---

## Security Considerations

| Concern                 | Mitigation Applied                                                                           |
| ----------------------- | -------------------------------------------------------------------------------------------- |
| Secret management       | All credentials stored in `.env`, excluded from version control via `.gitignore`             |
| Database network access | RDS Security Group only accepts inbound connections from the EC2 Security Group on port 5432 |
| `DEBUG` mode            | Controlled via environment variable; set to `False` in production                            |
| File storage            | Uploads stored on S3, not on the container filesystem — no data loss on redeployment         |
| AWS access scope        | IAM user restricted to S3 only; no broader AWS account permissions granted                   |
| Container resilience    | All services configured with `restart: unless-stopped` for automatic recovery                |
