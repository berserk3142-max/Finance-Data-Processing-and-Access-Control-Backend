# Finance Data Processing and Access Control Backend

A role-based finance backend system with clean separation of concerns using Prisma and PostgreSQL. Implements RBAC using middleware, optimized aggregation queries for dashboard analytics, and structured error handling with Zod validation.

## Tech Stack

- **Runtime:** Node.js + Express
- **Language:** TypeScript
- **Database:** PostgreSQL (Neon)
- **ORM:** Prisma
- **Auth:** JWT (JSON Web Tokens)
- **Validation:** Zod

## Project Structure

```
src/
├── controllers/          # Request handlers
│   ├── auth.controller.ts
│   ├── dashboard.controller.ts
│   ├── record.controller.ts
│   └── user.controller.ts
├── services/             # Business logic
│   ├── auth.service.ts
│   ├── dashboard.service.ts
│   ├── record.service.ts
│   └── user.service.ts
├── routes/               # Route definitions
│   ├── auth.routes.ts
│   ├── dashboard.routes.ts
│   ├── record.routes.ts
│   └── user.routes.ts
├── middleware/            # Auth, RBAC, validation, error handling
│   ├── auth.middleware.ts
│   ├── error.middleware.ts
│   └── validate.middleware.ts
├── utils/
│   └── validators.ts     # Zod schemas
├── prisma/
│   ├── client.ts         # Prisma singleton
│   └── seed.ts           # Database seeder
└── app.ts                # Entry point
```

## Setup Instructions

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Seed the database
npm run seed

# Start development server
npm run dev
```

## Environment Variables

Create a `.env` file:

```
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-key"
PORT=3000
```

## API Endpoints

### Authentication (Public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and get JWT token |

### User Management (Admin Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users |
| POST | `/api/users` | Create a new user |
| PUT | `/api/users/:id/role` | Update user role |
| PUT | `/api/users/:id/status` | Activate/deactivate user |

### Financial Records

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/records` | All | List records (with filters) |
| GET | `/api/records/:id` | All | Get single record |
| POST | `/api/records` | Admin | Create record |
| PUT | `/api/records/:id` | Admin | Update record |
| DELETE | `/api/records/:id` | Admin | Soft delete record |

#### Query Parameters for GET /api/records

| Param | Description |
|-------|-------------|
| `type` | Filter by INCOME or EXPENSE |
| `category` | Filter by category name |
| `search` | Search in category and notes |
| `startDate` | Filter records from date |
| `endDate` | Filter records until date |
| `page` | Page number (default: 1) |
| `limit` | Records per page (default: 10) |

### Dashboard Analytics (Analyst + Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/summary` | Aggregated financial summary |

Response:

```json
{
  "totalIncome": 160000,
  "totalExpense": 48000,
  "netBalance": 112000,
  "categoryBreakdown": {
    "Salary": { "income": 150000, "expense": 0, "net": 150000 },
    "Rent": { "income": 0, "expense": 30000, "net": -30000 }
  },
  "monthlyTrends": {
    "2026-01": { "income": 50000, "expense": 23000, "net": 27000 }
  }
}
```

## Role Permissions

| Role | Permissions |
|------|-------------|
| VIEWER | Read financial records only |
| ANALYST | Read records + access dashboard analytics |
| ADMIN | Full access (CRUD + user management + analytics) |

## Seed Data Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@finance.com | admin123 |
| Analyst | analyst@finance.com | analyst123 |
| Viewer | viewer@finance.com | viewer123 |

## Assumptions

- Single-tenant application (one organization)
- Financial amounts stored as floating-point numbers
- Soft delete for records (deletedAt timestamp)
- JWT tokens expire after 7 days
- All timestamps in UTC

## Trade-offs

- Used raw SQL for monthly trend aggregation (PostgreSQL-specific) for optimal performance over Prisma's limited groupBy
- Role stored directly on user model rather than separate permissions table — simpler for 3-role system
- No refresh token mechanism — acceptable for backend API demo
- No rate limiting — would add in production
