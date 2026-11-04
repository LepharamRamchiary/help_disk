## Help disk
- A web application project designed to help businesses manage customer support requests and resolve customer queries efficiently.
- Developed as a learning project with a strong focus on backend development.
- Implementing Microservices Architecture to separate different services.
- Using Docker for containerization and service management.
- Integrating two types of databases:
  - MySQL (SQL): Relational database.
  - MongoDB (NoSQL): Non-relational database.
- Implementing Google OAuth 2.0 for user authentication.
- Planning to integrate Redis in the future for caching and performance optimization.

### Backend Architecture
- Microservices Architecture: Building a backend system using Node.js with a microservices-based architecture.
- Docker Compose: Docker Compose configuration is completed. Whenever a new service is added, its corresponding Docker image and container need to be built and started.
- API Gateway: Implemented an API Gateway that acts as a central entry point and proxy service, routing client requests to the appropriate microservices.
- Auth Service: Successfully completed the authentication service using:
  - Node.js
  - Express.js
  - Prisma ORM
  - MySQL
  - Google OAuth 2.0
- Ticket Service: Currently under development using:
  - Node.js
  - Express.js
  - Mongoose
  - MongoDB
