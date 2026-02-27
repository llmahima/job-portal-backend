# Job Portal Backend

REST API for a job portal with user authentication, job management, application processing, resume parsing, and ATS scoring.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express 5
- **Database:** PostgreSQL (via Knex)
- **Auth:** JWT + bcrypt

## Prerequisites

- Node.js (v18+)
- PostgreSQL

## Setup

1. **Clone the repo**

   ```sh
   git clone git@github.com-mahima:llmahima/job-portal-backend.git
   cd job-portal-backend
   ```

2. **Install dependencies**

   ```sh
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the project root:

   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/job_portal
   JWT_SECRET=your_jwt_secret
   PORT=3000
   ```

4. **Run database migrations**

   ```sh
   npm run migrate
   ```

5. **Start the server**

   ```sh
   npm start
   ```

   The server will start on `http://localhost:3000` (or the port specified in `.env`).

## API Endpoints

### Auth
| Method | Endpoint             | Description       |
|--------|----------------------|-------------------|
| POST   | `/api/auth/register` | Register a user   |
| POST   | `/api/auth/login`    | Login             |

### Jobs
| Method | Endpoint         | Description          |
|--------|------------------|----------------------|
| GET    | `/api/jobs`      | List jobs            |
| POST   | `/api/jobs`      | Create a job         |

### Applications
| Method | Endpoint              | Description            |
|--------|-----------------------|------------------------|
| POST   | `/api/applications`   | Submit an application  |
| GET    | `/api/applications`   | List applications      |

### Health
| Method | Endpoint       | Description   |
|--------|----------------|---------------|
| GET    | `/api/health`  | Health check  |

## Project Structure

```
src/
├── app.js                  # Express app entry point
├── config/db.js            # Database connection
├── controllers/            # Route handlers
├── db/migrations/          # Database migrations
├── middleware/auth.js       # JWT auth middleware
├── routes/                 # Route definitions
└── services/               # Resume parser & ATS scorer
```
