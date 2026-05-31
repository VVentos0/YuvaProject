# 🌌 YUVA Archive

YUVA Archive is a full-stack, real-time web application where users can write, send, and read public letters anonymously. Designed with a highly interactive frontend and robust backend architecture, it creates a cozy, atmospheric environment for users to leave their thoughts to the world or specific recipients.

---

## 🌟 Features

- **Anonymous Letter Writing:** Share your thoughts, wishes, and stories with the world without revealing your identity.
- **Real-Time Interactions:** Live updates using `Socket.IO` — see events happen as other users interact with the platform.
- **Immersive Environment:** A carefully crafted UI featuring dynamic animations, interactive elements, and ambient sound effects for a deeply relaxing user experience.
- **Admin Dashboard:** A secure, token-protected administrative panel to moderate and manage the public letters.
- **Containerized Architecture:** Fully dockerized with `Docker` and `Docker Compose` for easy, reproducible deployments across any environment.
- **Security First:** Includes robust anti-spam measures (`express-rate-limit`), security headers (`helmet`), and strict environment-based configuration to protect both the app and the database.

---

## 🛠️ Technology Stack

### Frontend
- HTML5 & CSS3 (Custom animations and styling)
- Vanilla JavaScript
- Socket.IO Client

### Backend
- **Node.js** with **Express.js**
- **MongoDB** (via Mongoose)
- **Socket.IO** (Real-time events)

### Deployment & Infrastructure
- **Docker & Docker Compose**
- **Nginx** (Reverse Proxy & SSL termination)
- **GitHub Actions** (Automated CI/CD deployments)

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- [Node.js](https://nodejs.org/) (v20 or higher)
- [MongoDB](https://www.mongodb.com/) (Running locally or via Atlas)
- [Docker](https://www.docker.com/) (Optional, but recommended)

### 1. Clone the Repository
```bash
git clone https://github.com/VVentos0/YuvaProject.git
cd YuvaProject
```

### 2. Environment Configuration
Copy the template `.env.example` file and rename it to `.env`:
```bash
cp .env.example .env
```
Update the `.env` file with your own secure passwords and connection strings. **Never commit your `.env` file to version control.**

### 3. Running with Docker (Recommended)
You can bring up the entire stack (Node.js App + MongoDB) with a single command:
```bash
docker compose up -d --build
```
The app will be available at `http://localhost:3000`.

### 4. Running Manually
If you prefer running without Docker:
```bash
# Install dependencies
npm install

# Start the application
npm run dev
```

---

## 🛡️ Security & Privacy
This repository is the open-source release of the YUVA project. All sensitive data, API keys, database credentials, and server IPs have been completely removed from the codebase. The application relies entirely on environment variables (`.env`) for authorization, meaning anyone can host their own instance safely without exposing or accessing the original production environment.

## 📄 License
This project is for personal use and is shared as an open-source example of a real-time web application.
