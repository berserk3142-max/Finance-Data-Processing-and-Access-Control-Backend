# Finance Data Processing and Access Control Backend

A role-based finance backend system built with **Node.js + Express + TypeScript + Prisma + PostgreSQL**. Implements RBAC middleware, financial CRUD with filtering/pagination, and aggregated dashboard analytics with structured error handling and Zod validation.

---

## System Architecture

```mermaid
graph TB
    Client["Client (Postman / Frontend / cURL)"]
    
    subgraph Server["Express Server (Port 3000)"]
        Router["Router Layer"]
        Auth["Authentication Middleware<br/>JWT Token Verification"]
        RBAC["Authorization Middleware<br/>Role-Based Access Control"]
        Val["Validation Middleware<br/>Zod Schema Validation"]
        
        subgraph Controllers["Controllers"]
            AC["Auth Controller"]
            UC["User Controller"]
            RC["Record Controller"]
            DC["Dashboard Controller"]
        end
        
        subgraph Services["Services (Business Logic)"]
            AS["Auth Service"]
            US["User Service"]
            RS["Record Service"]
            DS["Dashboard Service"]
        end
        
        EH["Error Handler Middleware"]
    end

    subgraph DB["PostgreSQL (Neon Cloud)"]
        UT["Users Table"]
        RT["Records Table"]
    end

    Client -->|HTTP Request| Router
    Router --> Auth
    Auth --> RBAC
    RBAC --> Val
    Val --> Controllers
    Controllers --> Services
    Services -->|Prisma ORM| DB
    Controllers -->|Error| EH
    EH -->|JSON Error Response| Client
    Services -->|Data| Controllers
    Controllers -->|JSON Response| Client
```

---

## Request Flow — How It Works

Every API request passes through this pipeline:

```mermaid
sequenceDiagram
    participant C as Client
    participant R as Router
    participant A as Auth Middleware
    participant Z as RBAC Middleware
    participant V as Validation
    participant CT as Controller
    participant S as Service
    participant D as Database

    C->>R: HTTP Request
    R->>A: Route matched
    
    alt No token or invalid token
        A-->>C: 401 Unauthorized
    end
    
    A->>Z: Token valid, user attached to req
    
    alt Role not permitted
        Z-->>C: 403 Access Denied
    end
    
    Z->>V: Role authorized
    
    alt Invalid request body/query
        V-->>C: 400 Bad Request + details
    end
    
    V->>CT: Data validated
    CT->>S: Call service method
    S->>D: Prisma query
    D-->>S: Query result
    S-->>CT: Processed data
    CT-->>C: JSON Response (200/201)
```

---

## Role-Based Access Control (RBAC)

The system uses three roles with increasing permissions:

```mermaid
graph LR
    V["VIEWER<br/>Read Only"]
    AN["ANALYST<br/>Read + Analytics"]
    AD["ADMIN<br/>Full Access"]
    
    V -->|can do everything Viewer can| AN
    AN -->|can do everything Analyst can| AD
    
    style V fill:#4CAF50,color:#fff
    style AN fill:#2196F3,color:#fff
    style AD fill:#f44336,color:#fff
```

| Permission | Viewer | Analyst | Admin |
|------------|--------|---------|-------|
| View records | ✅ | ✅ | ✅ |
| Filter/search/paginate records | ✅ | ✅ | ✅ |
| View dashboard analytics | ❌ | ✅ | ✅ |
| Create records | ❌ | ❌ | ✅ |
| Update records | ❌ | ❌ | ✅ |
| Delete records (soft) | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ✅ |

**How it works:** The `authorize(["ADMIN"])` middleware checks `req.user.role` (set by the `authenticate` middleware after JWT verification) against the allowed roles array. If the role is not in the array, it returns 403.

---

## Database Schema

```mermaid
erDiagram
    USER {
        string id PK "CUID auto-generated"
        string name "2-100 characters"
        string email UK "unique, validated"
        string password "bcrypt hashed (12 rounds)"
        enum role "VIEWER | ANALYST | ADMIN"
        enum status "ACTIVE | INACTIVE"
        datetime createdAt "auto-set"
        datetime updatedAt "auto-updated"
    }
    
    RECORD {
        string id PK "CUID auto-generated"
        float amount "must be positive"
        enum type "INCOME | EXPENSE"
        string category "e.g. Salary, Rent, Food"
        datetime date "transaction date"
        string notes "optional, max 500 chars"
        string createdById FK "references User.id"
        datetime deletedAt "null = active (soft delete)"
        datetime createdAt "auto-set"
        datetime updatedAt "auto-updated"
    }
    
    USER ||--o{ RECORD : "creates"
```

**Key design decisions:**
- `createdById` tracks which user created each record (ownership)
- `deletedAt` enables soft delete — records are never permanently removed, just marked with a timestamp
- `role` stored directly on User instead of a separate permissions table — simpler for a 3-role system
- Passwords hashed with bcrypt (12 salt rounds) before storage

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Node.js + Express** | HTTP server and routing |
| **TypeScript** | Type safety and better DX |
| **Prisma** | ORM for database queries and migrations |
| **PostgreSQL (Neon)** | Cloud-hosted relational database |
| **JWT (jsonwebtoken)** | Stateless authentication tokens (7-day expiry) |
| **bcryptjs** | Password hashing (12 rounds) |
| **Zod** | Runtime request validation |
| **dotenv** | Environment variable management |

---

## Project Structure

```
src/
├── app.ts                          # Entry point — Express setup, route registration
├── controllers/                    # Handle HTTP request/response
│   ├── auth.controller.ts          # Register + Login handlers
│   ├── user.controller.ts          # User CRUD handlers
│   ├── record.controller.ts        # Financial record CRUD handlers
│   └── dashboard.controller.ts     # Analytics summary handler
├── services/                       # Business logic (no HTTP awareness)
│   ├── auth.service.ts             # Password hashing, JWT generation
│   ├── user.service.ts             # User queries + role/status updates
│   ├── record.service.ts           # Record CRUD + filtering + pagination
│   └── dashboard.service.ts        # Aggregation queries (SUM, GROUP BY)
├── routes/                         # Route definitions with middleware chains
│   ├── auth.routes.ts              # POST /register, POST /login
│   ├── user.routes.ts              # Admin-only user management
│   ├── record.routes.ts            # CRUD with role-based access
│   └── dashboard.routes.ts         # Analyst+Admin analytics
├── middleware/                     # Request processing pipeline
│   ├── auth.middleware.ts          # JWT verification + role checking
│   ├── validate.middleware.ts      # Zod schema validation
│   └── error.middleware.ts         # Centralized error responses
├── utils/
│   └── validators.ts              # All Zod schemas in one place
└── prisma/
    ├── client.ts                   # Prisma singleton instance
    └── seed.ts                     # Database seeder (3 users + 10 records)
```

---

## Setup & Installation

### Prerequisites
- Node.js (v18+)
- npm
- PostgreSQL database (or use Neon cloud)

### Step-by-Step

```bash
# 1. Clone the repository
git clone https://github.com/berserk3142-max/Finance-Data-Processing-and-Access-Control-Backend.git
cd Finance-Data-Processing-and-Access-Control-Backend

# 2. Install dependencies
npm install

# 3. Create .env file with your database URL
# DATABASE_URL="postgresql://user:pass@host/dbname?sslmode=require"
# JWT_SECRET="your-secret-key"
# PORT=3000

# 4. Generate Prisma client
npx prisma generate

# 5. Run database migration (creates tables)
npx prisma migrate dev --name init

# 6. Seed the database with sample data
npm run seed

# 7. Start the development server
npm run dev
# Server starts on http://localhost:3000
```

---

## API Endpoints

### Authentication (Public — no token required)

| Method | Endpoint | Request Body | Response |
|--------|----------|-------------|----------|
| POST | `/api/auth/register` | `{ name, email, password }` | `{ user, token }` |
| POST | `/api/auth/login` | `{ email, password }` | `{ user, token }` |

**Flow:** Client sends credentials → Server validates with Zod → Hashes password (register) or compares hash (login) → Returns JWT token valid for 7 days.

---

### User Management (Admin Only)

All endpoints require `Authorization: Bearer <token>` header with an ADMIN token.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users |
| POST | `/api/users` | Create a new user (body: `{ name, email, password, role? }`) |
| PUT | `/api/users/:id/role` | Change user role (body: `{ role: "VIEWER" \| "ANALYST" \| "ADMIN" }`) |
| PUT | `/api/users/:id/status` | Activate/deactivate (body: `{ status: "ACTIVE" \| "INACTIVE" }`) |

---

### Financial Records

| Method | Endpoint | Allowed Roles | Description |
|--------|----------|---------------|-------------|
| GET | `/api/records` | All | List records with filters and pagination |
| GET | `/api/records/:id` | All | Get a single record by ID |
| POST | `/api/records` | Admin | Create a new financial record |
| PUT | `/api/records/:id` | Admin | Update an existing record |
| DELETE | `/api/records/:id` | Admin | Soft delete (sets `deletedAt` timestamp) |

#### Filtering & Pagination (GET /api/records)

| Query Parameter | Example | Description |
|----------------|---------|-------------|
| `type` | `?type=INCOME` | Filter by INCOME or EXPENSE |
| `category` | `?category=Salary` | Filter by category (case-insensitive) |
| `search` | `?search=rent` | Search in category and notes fields |
| `startDate` | `?startDate=2026-01-01` | Records from this date |
| `endDate` | `?endDate=2026-03-31` | Records until this date |
| `page` | `?page=1` | Page number (default: 1) |
| `limit` | `?limit=10` | Records per page (default: 10) |

**Example:** `GET /api/records?type=INCOME&category=Salary&page=1&limit=5`

---

### Dashboard Analytics (Analyst + Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/summary` | Complete financial summary |

**Response:**
```json
{
  "totalIncome": 185000,
  "totalExpense": 48000,
  "netBalance": 137000,
  "categoryBreakdown": {
    "Salary": { "income": 150000, "expense": 0, "net": 150000 },
    "Rent": { "income": 0, "expense": 30000, "net": -30000 },
    "Food": { "income": 0, "expense": 13000, "net": -13000 },
    "Freelance": { "income": 10000, "expense": 0, "net": 10000 }
  },
  "monthlyTrends": {
    "2026-01": { "income": 50000, "expense": 23000, "net": 27000 },
    "2026-02": { "income": 60000, "expense": 17000, "net": 43000 },
    "2026-03": { "income": 50000, "expense": 8000, "net": 42000 }
  }
}
```

**How it works:** Uses `prisma.record.aggregate()` for totals, `prisma.record.groupBy()` for category breakdown, and raw SQL `GROUP BY TO_CHAR(date, 'YYYY-MM')` for monthly trends — optimized for PostgreSQL.

---

## Validation & Error Handling

All request bodies are validated using **Zod** schemas before reaching the controller:

| Scenario | Status Code | Response |
|----------|-------------|----------|
| Valid request | 200 / 201 | Success data |
| Invalid request body | 400 | `{ error: "Invalid input", details: "amount: must be positive" }` |
| Missing/invalid JWT token | 401 | `{ error: "Authentication required" }` |
| Wrong role for endpoint | 403 | `{ error: "Access denied" }` |
| Record/User not found | 404 | `{ error: "Record not found" }` |
| Server error | 500 | `{ error: "Internal Server Error" }` |

---

## Testing the API

### Seed Data Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@finance.com | admin123 |
| Analyst | analyst@finance.com | analyst123 |
| Viewer | viewer@finance.com | viewer123 |

### PowerShell Test Commands

```powershell
# Login as admin and save token
$login = Invoke-RestMethod -Uri http://localhost:3000/api/auth/login -Method Post -ContentType "application/json" -Body '{"email":"admin@finance.com","password":"admin123"}'
$token = $login.token

# List users
Invoke-RestMethod -Uri http://localhost:3000/api/users -Headers @{Authorization="Bearer $token"}

# Get records with filters
Invoke-RestMethod -Uri "http://localhost:3000/api/records?type=INCOME&page=1&limit=5" -Headers @{Authorization="Bearer $token"}

# Create a record
Invoke-RestMethod -Uri http://localhost:3000/api/records -Method Post -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -Body '{"amount":25000,"type":"INCOME","category":"Bonus","date":"2026-04-01","notes":"Q1 bonus"}'

# Dashboard analytics
Invoke-RestMethod -Uri http://localhost:3000/api/dashboard/summary -Headers @{Authorization="Bearer $token"}

# Test RBAC — Viewer cannot create records (should return 403)
$viewer = Invoke-RestMethod -Uri http://localhost:3000/api/auth/login -Method Post -ContentType "application/json" -Body '{"email":"viewer@finance.com","password":"viewer123"}'
Invoke-RestMethod -Uri http://localhost:3000/api/records -Method Post -ContentType "application/json" -Headers @{Authorization="Bearer $($viewer.token)"} -Body '{"amount":100,"type":"INCOME","category":"Test","date":"2026-04-01"}'
```

---

## Git Branching Strategy

The project is organized into 4 incremental branches:

```mermaid
gitGraph
    commit id: "init"
    branch day1-setup
    commit id: "Project config + Prisma schema + app entry"
    branch day2-users-rbac
    commit id: "Auth + RBAC middleware + User APIs"
    branch day3-records
    commit id: "Financial CRUD + filtering + pagination"
    branch day4-dashboard
    commit id: "Analytics + seed data + README"
```

| Branch | What it contains |
|--------|-----------------|
| `day1-setup` | package.json, tsconfig, Prisma schema, app.ts, error middleware |
| `day2-users-rbac` | JWT auth, RBAC middleware, Zod validators, auth/user services & routes |
| `day3-records` | Record service + controller + routes with CRUD, filtering, soft delete |
| `day4-dashboard` | Dashboard analytics, seed script, comprehensive README |

---

## Assumptions

- Single-tenant application (one organization)
- Financial amounts stored as floating-point numbers
- Soft delete for records — `deletedAt` timestamp instead of permanent removal
- JWT tokens expire after 7 days with no refresh token mechanism
- All timestamps in UTC
- Passwords require minimum 6 characters

## Trade-offs

- **Raw SQL for monthly trends** — PostgreSQL-specific `TO_CHAR` function used for date grouping instead of Prisma's limited `groupBy`, providing optimal aggregation performance
- **Role on User model** — Stored directly rather than a separate permissions table; simpler and sufficient for a 3-role system
- **No rate limiting** — Would add in production to prevent abuse
- **No refresh tokens** — Acceptable for a backend API demo; in production, would implement refresh token rotation
