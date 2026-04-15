

# 🏈 Team Management API

A scalable backend API for managing youth sports teams, practices, and communication between coaches, players, and parents.

---

## 🚀 Tech Stack

- **Node.js**
- **TypeScript**
- **Express**
- **MongoDB (Mongoose)**
- **Jest (Testing)**
- **ESLint + Prettier**
- **Pino (Logging)**

---

## 📁 Project Structure

```
src/
  app.ts
  servers.ts

  config/
    db.ts
    env.ts

  core/
    middleware/
    utils/

  features/
    team/
    practice/

tests/
```

---

## ⚙️ Getting Started

### 1. Install dependencies

```bash
npm install
```

---

### 2. Set up environment variables

Create a `.env` file:

```env
MONGO_URI=your_mongo_uri
PORT=5000
NODE_ENV=development
```

---

### 3. Run the server

```bash
npm run dev
```

---

### 4. Health Check

```
GET http://localhost:5000/health
```

Response:

```json
{
  "status": "OK"
}
```

---

## 🧪 Running Tests

```bash
npm run test
```

---

## 🧹 Linting

```bash
npm run lint
npm run lint:fix
```

---

## 🧠 Features (Planned)

- ✅ Team Management
- 🔜 Practice Planning
- 🔜 User Authentication
- 🔜 Roles (Coach / Parent / Player)
- 🔜 Events & Scheduling
- 🔜 Announcements
- 🔜 Attendance Tracking

---

## 🏗️ Architecture Principles

- Feature-based folder structure
- Separation of concerns (controller / service / model)
- Centralized environment config
- Structured logging
- Scalable and maintainable design

---

## 🔐 Security Notes

- `.env` is not committed
- Sensitive values must be stored securely
- MongoDB credentials should be rotated if exposed

---

## 📌 Status

🚧 In Active Development

---

## 🤝 Contributing

This is a personal project, but feel free to fork and experiment.

---

## 💬 Author

Built by Miguel 🚀