# 🚀 Job Portal Backend - AI Powered

A high-performance REST API for a modern job portal, featuring AI-driven resume parsing, intelligent ATS scoring, and automated candidate-job matching.

## ✨ Key Features

- **🔐 Robust Authentication:** JWT-based secure authentication with bcrypt password hashing.
- **⚡ AI Resume Parsing:** Automated extraction of skills, experience, and contact info from PDF resumes using Groq LLM.
- **📊 Smart ATS Scoring:** Rule-based and AI-powered scoring system to rank candidates against job requirements.
- **🛠️ Job & Application Management:** Full CRUD operations for recruiters and candidates.
- **🔗 Intelligent Matching:** Weighted skill matching with synonym support for better accuracy.

## 🛠️ Tech Stack

- **Runtime:** [Node.js](https://nodejs.org/) (v18+)
- **Framework:** [Express 5](https://expressjs.com/)
- **Database:** [PostgreSQL](https://www.postgresql.org/) (via [Knex.js](https://knexjs.org/))
- **AI Engine:** [Groq Cloud SDK](https://wow.groq.com/)
- **PDF Processing:** [pdf-parse](https://www.npmjs.com/package/pdf-parse)
- **Validation:** [express-validator](https://express-validator.github.io/docs/)

## 🚀 Quick Start

### 1. Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (or a cloud provider like Supabase)

### 2. Installation
```bash
git clone git@github.com-mahima:llmahima/job-portal-backend.git
cd job-portal-backend
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory and add the following:

```env
PORT=3000
DATABASE_URL=postgresql://postgres:password@localhost:5432/job_portal
JWT_SECRET=your-super-secret-key-here
LOG_LEVEL=info

# AI Integration
GROQ_API_KEY=your_groq_api_key
ENABLE_LLM_PARSING=true
```

### 4. Database Setup
Run migrations to create the necessary tables:
```bash
npm run migrate
```

### 5. Running the Application
```bash
# Start the production server
npm start

# For development (if nodemon is installed)
# npm run dev 
```

## 📍 API Endpoints

### 🔐 Auth
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Create a new recruiter or candidate account |
| `POST` | `/api/auth/login` | Authenticate and receive a JWT |

### 💼 Jobs
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/jobs` | Retrieve all open job listings |
| `POST` | `/api/jobs` | Post a new job (Recruiter only) |

### 📝 Applications
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/applications` | Submit an application with a resume |
| `GET` | `/api/applications` | View submitted applications |

### 💓 Health
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status check |

## 📁 Project Structure

```bash
src/
├── app.js               # Main application entry point
├── config/
│   └── db.js            # Knex & DB configuration
├── controllers/         # Request handling logic
├── routes/              # Route definitions
├── middleware/          # JWT Auth & Error handling
├── services/            # AI Parsing, ATS Scoring, PDF processing
├── db/                  # Migrations and database seeds
└── utils/               # Shared utilities (logger, etc.)
```

## 📄 License
This project is licensed under the ISC License.
