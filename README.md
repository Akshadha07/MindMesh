# MindMesh 
### Interactive Knowledge Management & Cybernetic Visualization Platform

**MindMesh** is a full-stack MERN application that enables users to capture, organize, and visually explore interconnected thoughts, research, and documentation through an interactive **Force-Directed Knowledge Graph**. MindMesh pairs a high-performance React 19 frontend with a robust, multi-tenant Express and MongoDB Atlas backend.

---

##  Key Features

1. **Interactive User Experience**:
   - Translucent obsidian glass cards with glowing border animations.
   - Floating sakura petal motifs, neon badges, and high-contrast accessible typography.
   - Fully responsive design across desktop, tablet, and mobile viewport sizes.

2. **Full CRUD Note Lifecycle**:
   - Create, view, edit, and delete notes with title, detailed body, category, and tags.
   - Real-time client-side search across titles, descriptions, categories, and tags.
   - Immediate optimistic UI updates paired with persistent MongoDB Atlas synchronization.

3. **Interactive Force-Directed Knowledge Graph **:
   - **Zero-Dependency HTML5 Canvas Engine**: 60 FPS physics simulation using Coulomb repulsion, Hooke springs, gravity centering, and kinetic damping without heavy external libraries.
   - **Intelligent Edge Generation**:
     - **Shared Tags**: Solid neon-fuchsia edges (`#ff2a85`) with strong attraction representing deep topical synergy.
     - **Shared Categories**: Dashed lavender edges (`#c084fc`) representing broad contextual clustering.
     - **Disjoint Nodes**: Independent nodes safely spaced apart via repulsion forces.
   - **Interactive Graph Controls**: Pan, zoom, node drag-and-pin, fit-to-screen, search query filtering, and a slide-out **Node Inspector Drawer** with neighbor traversal.

4. **Multi-Tenant Security & Authentication **:
   - Secure registration and login using `bcryptjs` (salt rounds = 10) and JSON Web Tokens (JWT).
   - Strict multi-tenant data isolation: all queries are hard-scoped to the authenticated user ID (`{ _id: noteId, user: req.user._id }`).
   - Secure dual-token transport: HTTP-only cookie (`token`) with fallback support for standard `Authorization: Bearer <token>` headers.
   - Automatic onboarding seed notes for newly registered architects.

5. **Production Readiness & Automated Testing **:
   - Automated end-to-end integration test suite verifying health, authentication, CRUD, multi-tenant cross-user isolation, and graph algorithms (21/21 passing assertions).
   - Production Vite frontend build tested with 0 compilation errors.

---

## System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                 React 19 + Vite Frontend                    │
│   • AuthContext (JWT Session & HTTP-only Cookie Transport)  │
│   • Dashboard (Search, Note Grid, Metrics, Modals)          │
│   • Interactive Canvas Force-Directed Knowledge Graph       │
└──────────────┬──────────────────────────────▲───────────────┘
               │ JSON / REST API Requests      │ 
               │ Credentials: 'include'        │ Response Payloads
               ▼                               │
┌──────────────────────────────────────────────┴──────────────┐
│                  Node.js + Express Backend                  │
│   • CORS with Origin & Credential Verification              │
│   • Auth Middleware (Cookie Parser + JWT Verification)      │
│   • Multi-Tenant Route Handlers (/api/auth & /api/notes)    │
└──────────────┬──────────────────────────────▲───────────────┘
               │ Mongoose ORM                  │ BSON Documents
               ▼                               │
┌──────────────────────────────────────────────┴──────────────┐
│                    MongoDB Atlas Cluster                    │
│   • Users Collection (unique email index, bcrypt hash)      │
│   • Notes Collection (compound index: user + createdAt)     │
└─────────────────────────────────────────────────────────────┘
```

---

##  Project Directory Structure

```text
mernstack/
├── client/                               # Frontend React + Vite Application
│   ├── public/                           # Static public assets
│   ├── src/
│   │   ├── assets/                       # Visual assets (SVGs, icons)
│   │   ├── components/                   # Reusable UI Components
│   │   │   ├── AuthScreen.jsx            # Cyberpunk Login & Registration View
│   │   │   ├── Dashboard.jsx             # Notes grid, metric cards, search bar
│   │   │   ├── KnowledgeGraph.jsx        # HTML5 Canvas 60fps Force-Directed Graph
│   │   │   ├── NoteCard.jsx              # Obsidian note card with edit/delete actions
│   │   │   ├── CreateNoteModal.jsx       # Modal for creating new knowledge notes
│   │   │   ├── EditNoteModal.jsx         # Modal for updating existing notes
│   │   │   ├── DeleteConfirmModal.jsx    # Neon safety prompt before deletion
│   │   │   └── Sidebar.jsx               # Navigation bar with user badge & logout
│   │   ├── context/
│   │   │   └── AuthContext.jsx           # Global user authentication state provider
│   │   ├── data/
│   │   │   └── sampleNotes.js            # Initial fallback reference data
│   │   ├── App.css                       # Comprehensive Cyberpunk design system
│   │   ├── App.jsx                       # Main application router and state shell
│   │   ├── config.js                     # Dynamic environment API URL configuration
│   │   ├── index.css                     # Global reset and typography styling
│   │   └── main.jsx                      # React 19 root DOM mount
│   ├── .env.example                      # Frontend environment template
│   ├── index.html                        # Application entry HTML
│   ├── package.json                      # Frontend dependencies & scripts
│   └── vite.config.js                    # Vite bundler configuration
│
├── server/                               # Backend Node.js + Express API
│   ├── src/
│   │   ├── middleware/
│   │   │   └── auth.js                   # requireAuth middleware (JWT & cookies)
│   │   ├── models/
│   │   │   ├── Note.js                   # Mongoose Note schema with user ownership
│   │   │   └── User.js                   # Mongoose User schema with bcrypt pre-save
│   │   ├── routes/
│   │   │   └── auth.js                   # Auth routes (/register, /login, /me, /logout)
│   │   └── server.js                     # Express application entry & Note CRUD routes
│   ├── .env.example                      # Server environment template
│   ├── package.json                      # Server dependencies & scripts
│   ├── test-auth-crud-graph.mjs          # Automated end-to-end integration test suite
│   └── test-e2e.ps1                      # Windows PowerShell test helper
│
├── .gitignore                            # Root Git ignore rules (node_modules, .env)
└── README.md                             # Comprehensive project documentation (this file)
```

---

##  Prerequisites & Setup

### Requirements
- **Node.js**: v18.0.0 or later (verified on v22+)
- **npm**: v10.0.0 or later
- **MongoDB Atlas**: Free tier M0 cluster connection string

---

### Step 1: Clone & Configure Server

1. Open your terminal and navigate to `server/`:
   ```bash
   cd server
   npm install
   ```

2. Create your local `server/.env` by copying `server/.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Populate `server/.env` with your actual database and secret configuration:
   ```env
   PORT=5000
   NODE_ENV=development
   CLIENT_ORIGIN=http://localhost:5173
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.yourdomain.mongodb.net/mindmesh?retryWrites=true&w=majority
   JWT_SECRET=your_super_secret_cryptographic_random_string_at_least_32_chars
   ```
   *(Note: Never commit `.env` to Git. The `.gitignore` files exclude it automatically).*

---

### Step 2: Configure & Build Client

1. Open a second terminal and navigate to `client/`:
   ```bash
   cd client
   npm install
   ```

2. (Optional) Create `client/.env` from `client/.env.example`:
   ```env
   VITE_API_URL=http://localhost:5000
   ```

---

##  Running the Application Locally

### 1. Launch Backend API Server
In the `server/` terminal:
```bash
npm run dev
```
- Server starts on: **`http://localhost:5000`**
- Verifies database connection with MongoDB Atlas.
- Automatically creates or migrates initial seed notes to demo architect if necessary.

### 2. Launch Frontend Development Server
In the `client/` terminal:
```bash
npm run dev
```
- Client runs on: **`http://localhost:5173`**
- Open your browser to `http://localhost:5173` to enter the MindMesh terminal.

---

##  API Specification & Endpoints

###  Health & Diagnostic
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/api/health` | No | Server heartbeat and database connectivity check. |

**Example Response (`200 OK`)**:
```json
{
  "status": "ok",
  "message": "MindMesh server is running",
  "database": "connected",
  "timestamp": "2026-10-23T00:30:00.000Z"
}
```

---

###  Authentication (`/api/auth`)
All authenticated responses set an HTTP-only `token` cookie and return user profile data.

#### 1. Register User
- **`POST /api/auth/register`**
- **Body**:
  ```json
  {
    "username": "NeoArchitect",
    "email": "neo@mindmesh.io",
    "password": "Password123!"
  }
  ```
- **Responses**:
  - `201 Created`: User registered, starter notes seeded, token cookie set.
  - `400 Bad Request`: Validation failure (short password, invalid email).
  - `409 Conflict`: Email already registered.

#### 2. Login User
- **`POST /api/auth/login`**
- **Body**:
  ```json
  {
    "email": "neo@mindmesh.io",
    "password": "Password123!"
  }
  ```
- **Responses**:
  - `200 OK`: Authenticated, token cookie set.
  - `401 Unauthorized`: Invalid email or password.

#### 3. Current Session Check
- **`GET /api/auth/me`**
- Reads HTTP-only cookie or Bearer header.
- **Responses**:
  - `200 OK`: `{ "user": { "id": "...", "username": "NeoArchitect", "email": "neo@mindmesh.io" } }`
  - `401 Unauthorized`: No active session.

#### 4. Logout User
- **`POST /api/auth/logout`**
- Clears the HTTP-only `token` cookie.
- **Responses**: `200 OK`

---

###  Notes CRUD (`/api/notes`)
*All notes endpoints require active authentication (`requireAuth` middleware). All queries are scoped strictly to `req.user._id`.*

#### 1. List All Notes
- **`GET /api/notes`**
- **Response (`200 OK`)**: Array of notes belonging exclusively to the authenticated user.
```json
[
  {
    "id": "671842888f4c194b12345678",
    "title": "Quantum Neural Interfaces",
    "description": "Bi-directional synaptics with quantum-entangled qubits.",
    "category": "Architecture",
    "tags": ["quantum", "neuro", "hardware"],
    "createdAt": "2026-10-23T00:00:00.000Z",
    "updatedAt": "2026-10-23T00:00:00.000Z"
  }
]
```

#### 2. Create Note
- **`POST /api/notes`**
- **Body**:
  ```json
  {
    "title": "Sakura Protocol Architecture",
    "description": "Decentralized consensus mechanism for distributed graph storage.",
    "category": "Security",
    "tags": ["crypto", "sakura", "mesh"]
  }
  ```
- **Response (`201 Created`)**: Returns newly created note document.

#### 3. Get Single Note
- **`GET /api/notes/:id`**
- **Responses**:
  - `200 OK`: Note object.
  - `400 Bad Request`: Invalid MongoDB ObjectId format.
  - `404 Not Found`: Note does not exist or belongs to another user.

#### 4. Update Note
- **`PATCH /api/notes/:id`**
- **Body**: Any subset of `{ title, description, category, tags }`.
- **Responses**:
  - `200 OK`: Updated note object.
  - `400 Bad Request`: Validation failure.
  - `404 Not Found`: Note not found or ownership mismatch.

#### 5. Delete Note
- **`DELETE /api/notes/:id`**
- **Responses**:
  - `200 OK`: `{ "message": "Note deleted successfully", "id": "..." }`
  - `404 Not Found`: Note not found or ownership mismatch.

---

##  Knowledge Graph: Physics & Relationships

The interactive Knowledge Graph is rendered directly on an HTML5 `<canvas>` using a custom physics simulation loop (`requestAnimationFrame` at 60 FPS):

```
       [Note A: tags=["mesh", "ai"]]
              ●
             / \  <-- Solid Fuchsia Edge (Shared Tag: "ai")
            /   \
           ●─────●
   [Note B: tags=["ai"]]   [Note C: category="Security"]
                             - - - - - - - - (Dashed Lavender Edge: Shared Category)
```

### 1. Physics Engine Math
- **Coulomb Repulsion**: Nodes push each other away inversely proportional to square distance:
  $$F_r = \frac{k_r}{d^2}$$
- **Hooke Attraction (Springs)**: Nodes connected by shared tags or category are pulled toward each other proportional to distance:
  $$F_a = k_a \cdot (d - l_0)$$
- **Center Gravity**: Pulls stray nodes gently toward the canvas center:
  $$F_c = -k_c \cdot (p - p_{center})$$
- **Velocity Damping**: Friction factor ($0.88$) prevents infinite oscillation.

### 2. Edge Relationship Rules
- **Tag Link (`type: 'tag'`)**:
  - Triggered when two distinct notes share at least one tag (case-insensitive).
  - Rendered as a glowing **solid neon fuchsia line** (`#ff2a85`, width: 1.8px).
  - Stronger spring constant ($0.04$) and shorter target distance ($110px$).
- **Category Link (`type: 'category'`)**:
  - Triggered when notes have identical non-empty categories but no shared tags.
  - Rendered as a delicate **dashed lavender line** (`#c084fc`, dash pattern: `[4, 4]`).
  - Moderate spring constant ($0.02$) and target distance ($160px$).

### 3. Interactive Capabilities
- **Physics Dragging**: Click and drag any node to pin it; releasing smoothly unpins or keeps it in place.
- **Canvas Zoom & Pan**: Mouse wheel scales canvas smoothly from 0.4x to 3.0x; dragging empty space pans the viewport.
- **Search Filtering**: Typing in the filter bar highlights matching nodes while dimming unrelated nodes.
- **Node Inspector Drawer**: Clicking any node opens a slide-out drawer showing its metadata, tags, and clickable neighboring notes.

---

##  Automated Testing & Verification

MindMesh includes an automated end-to-end test suite (`server/test-auth-crud-graph.mjs`) that spins up a test server, makes real HTTP requests, and verifies database persistence and multi-tenant isolation.

### Running the Backend Test Suite:
```bash
npm --prefix server test
```

### Test Suite Coverage (21 Assertions):
1. **Health Check**: `GET /api/health` returns status `ok` and status code 200.
2. **Registration Validation**: Rejects invalid email formats and short passwords with code 400.
3. **User Creation**: `POST /api/auth/register` creates User A with code 201.
4. **Duplicate Email Rejection**: Rejects re-registration with code 409 Conflict.
5. **Login Authentication**: Verifies credentials and sets HTTP-only cookie with code 200.
6. **Password Security**: Rejects incorrect passwords with code 401 Unauthorized.
7. **Session Verification**: `GET /api/auth/me` validates session token.
8. **Route Protection**: Rejects unauthenticated note requests with code 401.
9. **Scoped CRUD**: Creates, reads, and updates notes belonging to User A.
10. **Multi-Tenant Cross-User Isolation**: User B cannot read, update, or delete User A's note (returns 404 Not Found to prevent ID-harvesting leaks).
11. **ObjectId Validation**: Malformed MongoDB IDs return code 400.
12. **Permanent Deletion**: Verifies note deletion and subsequent 404 responses.
13. **Graph Algorithm Logic**: Verifies tag-link creation, category fallback, and disjoint isolation.

### Frontend Production Build Verification:
```bash
npm --prefix client run build
```
*Builds client to `dist/` with zero TypeScript/JSX errors in ~300ms.*

---

##  Deployment Readiness Guide

### 1. MongoDB Atlas Configuration
- Whitelist server IP addresses in **Network Access** (`0.0.0.0/0` for dynamic cloud hosts like Render or Railway).
- Create a dedicated database user with `readWrite` permissions.

### 2. Backend Deployment (Render / Railway / Fly.io)
- **Root Directory**: `server`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment Variables**:
  ```env
  NODE_ENV=production
  PORT=5000
  CLIENT_ORIGIN=https://your-mindmesh-frontend.vercel.app
  MONGODB_URI=mongodb+srv://...
  JWT_SECRET=<cryptographically-random-64-character-string>
  ```
- *Note*: Ensure `CLIENT_ORIGIN` matches your frontend domain so CORS credentials and cookies are accepted.

### 3. Frontend Deployment (Vercel / Netlify)
- **Root Directory**: `client`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variable**:
  ```env
  VITE_API_URL=https://your-mindmesh-api.onrender.com
  ```
- **SPA Rewrite Rule**: For Vercel, include `vercel.json`:
  ```json
  {
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
  }
  ```

---
