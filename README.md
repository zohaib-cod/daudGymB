# daudGymB - FG & S.M Fitness Gym (Backend API)

Production REST API for FG & S.M Fitness Gym, built with Node.js, Express, MongoDB Atlas (Mongoose), and Cloudinary. Fully configured for direct deployment on **Vercel Serverless Functions**.

### Owners & Directors
- **Saqib Mehmood**
- **Ali Daud**

---

## 🚀 Vercel Deployment Guide

This backend is pre-configured with `vercel.json` and `/api/index.js` so it deploys seamlessly to Vercel in 1 click:

1. Import this repository (`zohaib-cod/daudGymB`) into **Vercel**.
2. In Project Settings -> **Environment Variables**, add the following keys from your `.env.example`:
   - `MONGODB_URI`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `CLOUDINARY_URL`
3. Click **Deploy**.
4. Once deployed, copy your Vercel URL (e.g., `https://daud-gym-b.vercel.app`) and set it as `NEXT_PUBLIC_API_URL=https://daud-gym-b.vercel.app/api` in your frontend Vercel project settings.

---

## 📡 API Endpoints

- `GET /` or `GET /api/health`: Health status & database connectivity info
- `POST /api/members/register`: Register new member & upload portrait to Cloudinary
- `GET /api/members`: Fetch all members (supports `?search=` and `?status=`)
- `GET /api/members/stats`: Fetch gym KPI analytics (Total, Active, Inactive, This Month)
- `PATCH /api/members/:id/status`: Toggle or update member status (`Active` / `Inactive`)
- `DELETE /api/members/:id`: Remove member record

---

## 💻 Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Start Server
```bash
node server.js
```
Server runs at `http://localhost:5000`.

