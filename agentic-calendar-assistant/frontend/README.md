This is a React + Vite frontend for the Meeting Assistant.

## Getting Started

Install dependencies, then start the development server:

```bash
# Install frontend packages
npm install

# Start Vite on port 3000
npm run dev
```

Open http://localhost:3000 in your browser.

Copy `.env.example` to `.env` and set `VITE_API_URL` if the API is not reachable through the Vite proxy. API calls use `/api` and are proxied to the backend at `http://localhost:4000`.
