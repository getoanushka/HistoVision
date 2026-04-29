# HistoVision

> Tissue Image Analysis & Quality Assessment Tool

A full-stack computer-vision project (React + FastAPI + MongoDB) that performs
color-space transforms, segmentation, image-quality assessment, and an
enhancement pipeline on microscopy / tissue images.

## Features
- **Color spaces:** RGB / HSV / Grayscale / LAB
- **Segmentation:** Otsu + Gaussian-adaptive thresholding + contour extraction
- **Image Quality (IQA):** Laplacian variance, brightness, contrast, sharpness, SNR (dB), dynamic range
- **Enhancement pipeline:** Non-Local Means denoise → CLAHE → unsharp-mask sharpen
- **Analysis history** persisted to MongoDB
- **Sample tissue images** built-in
- **Resume bullets** ready to paste

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+ and Yarn
- MongoDB running on localhost:27017

### 1. Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --reload --port 8001
```

### 2. Frontend
```bash
cd frontend
yarn install
yarn start   # opens http://localhost:3000
```

## Project Structure
```
histovision/
├── README.md
├── RESUME_BULLETS.md
├── backend/
│   ├── server.py          # FastAPI app + image processing pipeline
│   ├── requirements.txt
│   └── .env               # MONGO_URL, DB_NAME, CORS_ORIGINS
└── frontend/
    ├── package.json
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── craco.config.js    # Webpack alias (@/ → src/)
    ├── jsconfig.json
    ├── .env               # REACT_APP_BACKEND_URL
    ├── public/
    │   └── index.html
    └── src/
        ├── index.js
        ├── App.js
        ├── App.css
        ├── index.css
        ├── lib/
        │   └── api.js     # Axios API client
        ├── components/
        │   ├── Sidebar.jsx
        │   ├── MetricCard.jsx
        │   └── ImagePane.jsx
        └── pages/
            ├── Analyzer.jsx
            ├── History.jsx
            └── ResumeBullets.jsx
```

## API Reference
| Method | Path | Purpose |
|--------|------|---------|
| GET    | `/api/`                | Health check |
| GET    | `/api/samples`         | List built-in tissue samples |
| POST   | `/api/analyze/upload`  | Analyze an uploaded image |
| POST   | `/api/analyze/url`     | Analyze an image by URL |
| GET    | `/api/history`         | List past analyses |
| GET    | `/api/history/{id}`    | Full results for one analysis |
| DELETE | `/api/history/{id}`    | Delete an analysis |
| GET    | `/api/resume-bullets`  | Resume markdown |

## Environment Variables

### Backend (`backend/.env`)
| Variable | Default | Description |
|----------|---------|-------------|
| `MONGO_URL` | `mongodb://localhost:27017` | MongoDB connection string |
| `DB_NAME` | `test_database` | MongoDB database name |
| `CORS_ORIGINS` | `*` | Comma-separated allowed origins |

### Frontend (`frontend/.env`)
| Variable | Default | Description |
|----------|---------|-------------|
| `REACT_APP_BACKEND_URL` | `http://localhost:8001` | Backend base URL |

## Deployment
🔗 Live App (Render): https://histovision-frontend.onrender.com — may take ~30–60s to load (cold start).
