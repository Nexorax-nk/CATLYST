# CATLYST — Product Intelligence Infrastructure

> **"Turning messy product data into hyper-structured, commerce-ready catalogs at scale."**

[![Live Frontend](https://img.shields.io/badge/Frontend-Vercel-success?style=flat-square&logo=vercel)](#)
[![Live Backend](https://img.shields.io/badge/Backend-catlyst--backend.onrender.com-success?style=flat-square&logo=render)](#)
[![Architecture: LLM Pipeline](https://img.shields.io/badge/Architecture-AI%20Data%20Enrichment-2EB67D?style=flat-square)](#)
[![Database](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-336791?style=flat-square&logo=supabase)](#)

---

## Table of Contents

- [The Problem](#the-problem)
- [The Solution](#the-solution)
- [Architecture & Pipeline](#architecture--pipeline)
- [Core Features](#core-features)
- [Tech Stack](#tech-stack)
- [Local Setup & Deployment](#local-setup--deployment)
- [Project Structure](#project-structure)
- [The Pitch](#the-pitch)

---

## 🚀 Live Deployment
- **Frontend:** Deployed on Vercel
- **Backend API:** [catlyst-backend.onrender.com](https://catlyst-backend.onrender.com)
- **Database:** Supabase PostgreSQL

---

## The Problem

E-commerce companies, distributors, and retailers deal with millions of product SKUs. This data often arrives messy, incomplete, and highly unstructured:

- Missing manufacturer or brand names.
- Descriptions that are just a string of jumbled keywords and part numbers.
- No structured attributes (like voltage, material, color, dimensions).
- Inconsistent taxonomy and categorization.

Fixing this manually requires thousands of hours of data entry, slowing down time-to-market and resulting in a terrible search and filter experience for end customers. Traditional rule-based regex parsers fail because product formats vary wildly across different suppliers.

---

## The Solution

> **CATLYST acts as an autonomous AI data steward for your product catalog.**

You simply upload a raw, messy CSV of product data. CATLYST orchestrates a sophisticated, multi-stage LLM pipeline to automatically:

1. **Clean & Identify:** Extracts the canonical Manufacturer and Brand names, even if they are buried in the description.
2. **Structure & Parse:** Pulls out distinct technical attributes (Voltage, Material, Dimensions) and standardizes them.
3. **Classify:** Maps the product to a strict E-commerce taxonomy.
4. **Score:** Assigns Confidence, Completeness, and Accuracy scores to every enriched product.

The result is a clean, perfectly structured, commerce-ready dataset that can immediately power faceted search and high-converting product pages.

---

## Architecture & Pipeline

CATLYST operates on a resilient, high-speed asynchronous architecture designed to handle bulk uploads without locking up the server.

### Event Flow:
1. **Ingestion:** User uploads a raw CSV via the React frontend.
2. **Background Processing:** The FastAPI backend spins up a background thread, logging the Job ID to Supabase.
3. **The LLM Enrichment Loop:** 
   - Row-by-row, the AI pipeline extracts facts, standardizes attributes, and formats descriptions.
   - Powered by **Groq LPU**, the pipeline executes in milliseconds.
   - Built-in **Rate Limit Fallback Logic**: If the primary Groq API key hits a rate limit, the system gracefully falls back to a secondary key and orchestrates intelligent exponential backoff.
4. **Real-time Monitoring:** The frontend polls the job status, rendering real-time progress. Users can Pause, Resume, or Stop (Interrupt) a running job dynamically.
5. **Export:** Once completed, the enriched, commerce-ready data is exported back to CSV.

---

## Core Features

- **Automated Brand & Manufacturer Resolution:** Normalizes varying supplier names into a single canonical brand list.
- **Dynamic Attribute Extraction:** Pulls distinct specs directly from raw unstructured text.
- **Job Control Center:** Real-time visibility into batch processing jobs. Seamlessly Pause, Resume, or Interrupt jobs.
- **AI Scoring Engine:** Every product receives an AI-generated Accuracy and Completeness score to flag items needing human review.
- **Fail-safe Groq Integration:** Built-in rate-limit protection and dual-key fallback mechanism for uninterrupted processing.

---

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Lucide Icons (Deployed on Vercel)
- **Backend:** FastAPI, Python, SQLAlchemy, Uvicorn (Deployed on Render)
- **Database:** Supabase (PostgreSQL with PgBouncer connection pooling)
- **AI Inference Engine:** Groq API (`meta-llama/llama-4-scout-17b-16e-instruct` / `groq/compound`)

---

## Local Setup & Deployment

### Prerequisites
- Node.js & npm
- Python 3.10+
- A Supabase PostgreSQL database
- Groq API Keys (Primary and Fallback)

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
```

Create a `.env` in the `backend/` folder:
```env
# Supabase Connection
DATABASE_URL="postgresql://user:password@pooler.supabase.com:6543/postgres?pgbouncer=true"

# Groq Keys
GROQ_API_KEY="gsk_primary_key"
GROQ_API_KEY_FALLBACK="gsk_secondary_key"
```

Run the API:
```bash
uvicorn main:app --port 8080 --reload
```

### Frontend Setup
```bash
cd frontend
npm install
```

Create a `.env` in the `frontend/` folder:
```env
VITE_API_URL="http://127.0.0.1:8080"
```

Run the development server:
```bash
npm run dev
```

---

## Project Structure

```text
CATLYST/
├── backend/
│   ├── main.py                 # FastAPI endpoints & Job Control Logic
│   ├── ai_pipeline.py          # The core LLM extraction and validation pipeline
│   ├── pipeline/
│   │   ├── groq_client.py      # Resilient Groq integration with fallback
│   │   └── data_loaders.py     # Master data loading logic
│   └── requirements.txt
└── frontend/
    ├── index.html              # Custom SVG Favicon & Title
    ├── src/
    │   ├── pages/
    │   │   ├── LandingPage.jsx   # Interactive Marketing Page
    │   │   ├── ProcessingJobs.jsx# Real-time Job Monitoring & Controls
    │   │   └── Overview.jsx      # Analytics Dashboard
    │   └── config.js           # API Base URL mapping
```

---

## The Pitch

> *"Messy product data kills conversions. It breaks search, ruins filters, and frustrates buyers.*
>
> *CATLYST isn't just a data parser—it's an AI-native Data Steward. By leveraging ultra-fast Groq LLMs and a resilient orchestration layer, we transform unstructured, chaotic supplier data into beautiful, commerce-ready catalogs in seconds, not months.*
>
> *We built a production-grade pipeline with real-time job controls, dual-API fallback resilience, and strict structural enforcement.*
>
> *CATLYST: From Chaos to Catalog."*
