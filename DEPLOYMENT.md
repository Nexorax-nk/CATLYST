# Deployment Guide for CATLYST

CATLYST is a modern web application consisting of a React (Vite) frontend and a Python FastAPI backend. This guide covers how to deploy the application for production use.

## Architecture
- **Frontend**: React, Tailwind CSS, Vite (Port `5173` locally, served via Nginx/CDN in production).
- **Backend**: FastAPI, SQLAlchemy, Uvicorn (Port `8080`).
- **Database**: SQLite (local) or PostgreSQL (production).
- **AI Dependencies**: Groq API (LLM for extraction), Playwright (Web scraping).

## Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- `uv` Python package manager (optional but recommended)
- A Groq API key

---

## 1. Backend Deployment (FastAPI)

### Environment Setup
1. Clone the repository and navigate to `CATLYST/backend`.
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Install Playwright browsers (required for web scraping):
   ```bash
   playwright install chromium
   ```

### Configuration
Create a `.env` file in the `backend` directory based on `.env.example`:
```env
GROQ_API_KEY=your_production_api_key_here
DATABASE_URL=sqlite:///./catlyst.db
ENVIRONMENT=production
```

### Running the Server
Use a production-grade ASGI server like `gunicorn` with `uvicorn` workers:
```bash
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8080
```

---

## 2. Frontend Deployment (React / Vite)

### Environment Setup
1. Navigate to `CATLYST/frontend`.
2. Install dependencies:
   ```bash
   npm install
   ```

### Configuration
Create a `.env` file in the `frontend` directory:
```env
VITE_API_URL=https://api.yourdomain.com  # Point to your deployed FastAPI backend
```

### Build for Production
Generate the static assets:
```bash
npm run build
```
This will create a `dist` directory containing HTML, CSS, and JS files.

### Hosting
You can host the `dist` directory on any static web host, such as:
- **Vercel / Netlify**: Simply link your GitHub repo and configure the build command (`npm run build`) and output directory (`dist`).
- **Nginx**: Serve the `dist` folder directly.
  ```nginx
  server {
      listen 80;
      server_name yourdomain.com;
      root /path/to/CATLYST/frontend/dist;
      index index.html;

      # SPA Routing
      location / {
          try_files $uri $uri/ /index.html;
      }
  }
  ```

---

## 3. Post-Deployment Checks

1. **API Health Check**: Navigate to `https://api.yourdomain.com/docs` to verify FastAPI is running and Swagger UI loads.
2. **Web Scraping Check**: The server running the backend must have internet access to scrape domains like `3m.com` and `mcmaster.com`.
3. **Storage**: Ensure the backend process has write permissions to the SQLite database file and the local file system (if saving exports to disk).

## Scaling & Limitations
- **API Rate Limits**: The backend uses Groq API, which has TPM (Tokens Per Minute) limits. The current pipeline dynamically truncates scraped text to fit within standard model limits. If upgrading to higher concurrency, ensure your Groq tier supports the increased throughput.
- **Scraping Headless Browsers**: Playwright can consume significant memory. Run the backend on an instance with at least 2GB-4GB of RAM for stable bulk processing.
