# HelpDask

HelpDask is a full-stack customer support and service management platform designed to help businesses handle support requests, manage users, and streamline support workflows. The project is built as a learning-focused microservices application with a modern frontend, a central API gateway, and separate backend services for authentication and support operations.

## Overview

This repository combines:

- A Next.js client application for the user dashboard and experience
- A Node.js API gateway to route external requests to the correct service
- An authentication service built with Express, Prisma, and MySQL
- A support service built with Express and MongoDB
- Docker-based local orchestration for easier setup and environment consistency

The project is being developed to explore real-world backend architecture patterns, service separation, OAuth authentication, and multi-database application design.

## Features

- User authentication and authorization
- Google OAuth 2.0 integration
- Role-based access flow for users and admins
- REST API gateway for service orchestration
- Support/ticket-style backend service with MongoDB
- MySQL-based identity and account management
- Docker Compose setup for local development and deployment
- Modern React/Next.js user interface

## Tech Stack

### Frontend
- Next.js
- React
- Tailwind CSS
- Recharts
- Lucide Icons

### Backend
- Node.js
- Express.js
- Prisma ORM
- MySQL
- MongoDB
- Mongoose

### Infrastructure
- Docker
- Docker Compose
- Nginx-style gateway architecture pattern

## Project Structure

```text
help-dask/
├── client/                 # Next.js frontend
├── server/
│   ├── api-gateway/        # Gateway service
│   ├── auth/               # Authentication + user service
│   └── support/            # Ticket/support service
├── docker-compose.yml      # Multi-service orchestration
├── .env                    # Root environment variables for Docker
├── README.md               # Project documentation
└── .gitignore
```

## Architecture

The application follows a microservices-oriented architecture:

- Client requests go through the API gateway.
- The gateway forwards requests to the relevant internal service.
- Auth requests are handled by the auth service using MySQL and Prisma.
- Support requests are handled by the support service using MongoDB.
- The front-end communicates with the backend through the gateway rather than hitting services directly.

This keeps services loosely coupled and makes it easier to scale or extend the platform later.

## Prerequisites

Before running the project, make sure you have:

- Node.js 18+ or newer
- npm or pnpm
- Docker and Docker Compose
- MySQL running locally or through Docker
- MongoDB running locally or through Docker
- A Google OAuth client ID and secret (for auth)

## Environment Setup

Create the required environment files before running the apps.

### Root `.env`

The root Docker setup expects a `.env` file with variables like:

```env
GOOGLE_CLIENT_ID=your_google_client_id
MYSQL_PASSWORD=your_mysql_root_password
```

### Auth service

```bash
cp server/auth/.env.example server/auth/.env
```

Edit `server/auth/.env` with your real values for:

- `DB_USER`
- `DB_PASSWORD`
- `DATABASE_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `SMTP_*` values if email is enabled

### API Gateway

```bash
cp server/api-gateway/.env.example server/api-gateway/.env
```

### Support service

```bash
cp server/support/.env.example server/support/.env
```

### Client

```bash
cp client/.env.example client/.env.local
```

Set your frontend variables such as:

- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

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
- MongoDB: localhost:27017

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

This project is in active development. The authentication service is functional and the support service is being expanded. The overall structure is designed to support a scalable help desk system with future enhancements such as:

- ticket lifecycle management
- admin dashboards
- notification and email workflows
- role-based permissions
- caching with Redis
- analytics and reports

## Development Notes

- The API gateway centralizes routing and keeps the frontend isolated from direct service dependencies.
- MySQL is used for structured user and auth data.
- MongoDB is used for flexible support and ticket-related records.
- Docker Compose helps maintain a consistent local environment for all services.

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
