

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
corepack enable
yarn install --immutable
```

---

### 2. Set up environment variables

Create `.env.development` with the required application and integration values:

```env
MONGO_URI=your_mongo_uri
PORT=5001
NODE_ENV=development
JWT_SECRET=your_jwt_secret
APP_URL=http://localhost:8081/
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_SECRET_KEY=your_cloudinary_secret
CLOUDINARY_URL=your_cloudinary_url
RESEND_API_KEY=your_resend_api_key
```

---

### 3. Run the server

```bash
npm run dev
```

---

### 4. Health Check

```
GET http://localhost:5001/health
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
npm test
```

Jest starts a disposable in-memory MongoDB and supplies test-only values for
JWT, application URL, Cloudinary, and Resend configuration before application
modules load. Test values take precedence over local environment files, so the
suite cannot connect to development, staging, or production services. The first
run downloads the MongoDB test binary and caches it for
later runs.

CI installs dependencies with `yarn install --immutable` and runs the same
`npm test` command.

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
