# Voyanero SaaS Platform

A modern SaaS platform built with FastAPI, React, and Supabase.

## Tech Stack

### Backend
- **FastAPI**: Modern, fast web framework for building APIs
- **Supabase**: Open-source Firebase alternative for database and authentication
- **Stripe**: Payment processing
- **OpenAI**: AI integration
- **AWS S3**: File storage via boto3
- **Redis**: Caching and session management

### Frontend
- **React 19**: Latest React with Vite for fast development
- **Tailwind CSS**: Utility-first CSS framework
- **Axios**: HTTP client for API requests
- **Supabase JS**: Client library for Supabase integration

### Infrastructure
- **Docker & Docker Compose**: Containerization for easy deployment
- **Redis**: In-memory data store

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Node.js 20+ (for local development)
- Python 3.11+ (for local development)

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd saasportal
```

2. Set up environment variables:

**Backend:**
```bash
cp backend/.env.example backend/.env
# Edit backend/.env and add your API keys
```

**Frontend:**
```bash
cp frontend/.env.example frontend/.env
# Edit frontend/.env and add your Supabase credentials
```

3. Start all services with Docker Compose:
```bash
docker-compose up
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs
- Redis: localhost:6379

## Development

### Running Locally Without Docker

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### API Endpoints

- `GET /health` - Health check endpoint
- `GET /` - Root endpoint with API information
- `GET /docs` - Interactive API documentation (Swagger UI)

## Project Structure

```
saasportal/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── requirements.txt     # Python dependencies
│   ├── .env.example        # Environment variables template
│   └── Dockerfile          # Backend container configuration
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # Main React component
│   │   └── index.css       # Tailwind CSS imports
│   ├── package.json        # Node.js dependencies
│   ├── .env.example        # Environment variables template
│   ├── Dockerfile          # Frontend container configuration
│   └── tailwind.config.js  # Tailwind configuration
├── docker-compose.yml      # Multi-container orchestration
└── README.md              # This file
```

## Environment Variables

### Backend (.env)
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_KEY`: Supabase service role key
- `OPENAI_API_KEY`: OpenAI API key
- `STRIPE_SECRET_KEY`: Stripe secret key
- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key
- `REDIS_URL`: Redis connection URL

### Frontend (.env)
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key
- `VITE_API_URL`: Backend API URL

## License

MIT
