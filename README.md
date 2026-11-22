# HelpDask

HelpDask is a full-stack customer support and service management platform for handling support requests, managing users, and organizing support workflows. It combines a Next.js frontend with a central API gateway and separate authentication and support services.

## Overview

This repository combines:

- A Next.js dashboard for customers and support teams
- A Node.js API gateway that routes requests to the appropriate service
- An Express authentication service using Prisma and MySQL
- An Express support service using MongoDB and Mongoose
- Docker Compose configuration for local orchestration

The project demonstrates service separation, OAuth authentication, role-based access, proxy routing, and multi-database application design.

## Features

- User authentication and authorization
- Google OAuth 2.0 integration
- Password reset workflows
- Role-based access for platform and company administration
- Customer and ticket management
- Support ticket conversations and internal notes
- File and attachment uploads
- Ticket status, priority, assignment, and reporting views
- Centralized REST API gateway routing
- Docker Compose setup for local development
- Responsive Next.js interface

## Tech Stack

### Frontend
- Next.js 15
- React 19
- Tailwind CSS 4
- Recharts
- Lucide Icons

### Backend
- Node.js
- Express 5
- Prisma 6
- MySQL
- MongoDB 8
- Mongoose

### Infrastructure
- Docker
- Docker Compose
- Custom Node.js API gateway

## Project Structure

```text
help-dask/
├── client/                 # Next.js frontend
├── server/
│   ├── api-gateway/        # Gateway service
│   ├── auth/               # Authentication + user service
│   └── support/            # Ticket/support service
├── docker-compose.yml      # Multi-service orchestration
├── .env                    # Shared Docker environment variables
├── README.md               # Project documentation
└── .gitignore
```

## Architecture

The application uses a microservices-oriented architecture:

- Client requests go through the API gateway.
- `/api/v1/auth/*` requests are forwarded to the auth service.
- `/api/v1/support/*` requests are forwarded to the support service.
- Auth data is stored in MySQL through Prisma.
- Tickets, messages, and attachments are stored in MongoDB through Mongoose.
- MongoDB runs in Docker, while MySQL is expected to run on the host at `host.docker.internal`.

This keeps the services independently deployable and prevents the frontend from connecting directly to internal services.

## Prerequisites

Before running the project, make sure you have:

- Node.js 18+ or newer
- npm
- Docker and Docker Compose
- A local MySQL server for the auth service
- A Google OAuth client ID and secret

## Environment Setup

Create the required environment files before running the apps.

### Root `.env`

The root Docker setup uses a `.env` file for variables referenced by `docker-compose.yml`:

```env
GOOGLE_CLIENT_ID=your_google_client_id
MYSQL_PASSWORD=your_mysql_root_password
```

### Auth service

```bash
cp server/auth/.env.example server/auth/.env
```

Edit `server/auth/.env` with your real values for:

- `DATABASE_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `AUTH_JWT_SECRET`
- `SMTP_*` values if email is enabled
- `APP_URL`
- `ADMIN_NOTIFY_EMAILS`

Use a random secret of at least 32 bytes for `AUTH_JWT_SECRET`.

### API Gateway

```bash
cp server/api-gateway/.env.example server/api-gateway/.env
```

The gateway routes requests using:

- `AUTH_SERVICE_URL`
- `SUPPORT_SERVICE_URL`
- `CORS_ALLOWED_ORIGINS`

### Support service

```bash
cp server/support/.env.example server/support/.env
```

Set `MONGODB_URI` and copy the exact auth service `AUTH_JWT_SECRET` into this service.

### Client

```bash
cp client/.env.example client/.env.local
```

Set your frontend variables such as:

- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `NEXT_PUBLIC_USE_MOCK_API`

## Running with Docker

From the project root:

```bash
docker compose up --build
```

This will start:

- Client: http://localhost:3000
- API Gateway: http://localhost:8000
- Auth Service: http://localhost:8001
- Support Service: http://localhost:8002
- MongoDB: mongodb://localhost:27017

Before starting the stack, create the auth database and apply the Prisma migrations:

```sql
CREATE DATABASE IF NOT EXISTS help_dask_auth;
```

```bash
cd server/auth
npx prisma migrate deploy
```

The Docker Compose auth service connects to MySQL through `host.docker.internal` and uses the `MYSQL_PASSWORD` value from the root `.env`.

To stop the stack:

```bash
docker compose down
```

## Running Services Manually

### Frontend

```bash
cd client
npm install
npm run dev
```

### API Gateway

```bash
cd server/api-gateway
npm install
npm run dev
```

### Auth Service

```bash
cd server/auth
npm install
npm run dev
```

### Support Service

```bash
cd server/support
npm install
npm run dev
```

## Current Status

This project is in active development. Authentication, Google OAuth, password reset, ticket management, attachments, and Docker orchestration are implemented. Potential future improvements include:

- automated tests
- CI/CD workflows
- notification preferences
- role-based permissions
- caching with Redis
- analytics and reports
- production database orchestration

## Development Notes

- The API gateway centralizes routing and keeps the frontend isolated from direct service dependencies.
- MySQL is used for structured user and auth data.
- MongoDB is used for flexible support and ticket-related records.
- Docker Compose helps maintain a consistent local environment for all services.
- Keep `AUTH_JWT_SECRET` identical across the auth and support services.
- Keep the MySQL database name used by `DATABASE_URL` consistent with the migration target.

## Contributing

Contributions are welcome as this project is intended for learning and practical backend architecture work.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run the relevant checks
5. Open a pull request

## Contact

For questions or collaboration, reach out via the repository owner or project maintainer.

---

This README will continue to evolve as the application grows and more services are added.
