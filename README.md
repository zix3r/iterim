# 🗓️ iterim

> **Iteracijų ir ketvirčių planavimo aplikacija**
> *Produkto vystymo projektas*

**`iterim` – tai įrankis, padedantis komandoms lengviau valdyti iteracijų ciklus ir ketvirčių planavimą.**

## 👥 Komanda (Team)

| Vardas Pavardė | Grupė |
| :--- | :--- |
| **Matas Steponavičius** | IFF-3/9 |
| **Gustas Grubliauskas** | IFF-3/9 |
| **Eidvilas Markevičius** | IFK-3 |
| **Romualdas Rauluševičius** | IF-3/1 |
| **Mantas Ruseckas** | IF-3/1 |
| **Ignas Sabaliauskas** | V BS-3 |

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19 + Vite 7 + TypeScript 5.9 + Tailwind CSS v4 + shadcn/ui + React Router |
| **Backend** | ASP.NET Core (.NET 10) + EF Core 9 |
| **Database** | MySQL 8.4 (Docker) |
| **ORM** | Pomelo.EntityFrameworkCore.MySql 9.0 |
| **API Docs** | OpenAPI + Scalar |
| **DB Admin** | phpMyAdmin |

## 📋 Prerequisites

Before you start, make sure you have these installed:

- [.NET 10 SDK](https://dotnet.microsoft.com/en-us/download/dotnet/10.0)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Node.js 20+](https://nodejs.org/) (for frontend)
- [Git](https://git-scm.com/)

Verify installations:

```bash
dotnet --version    # Should show 10.0.x
docker --version    # Should show Docker version 2x.x.x
node --version      # Should show v20.x.x or higher
npm --version       # Should show 10.x.x or higher
```

## 🚀 Quick Start (10 min setup)

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/iterim.git
cd iterim
```

### 2. Start the database

```bash
docker compose up -d
```

This starts:
- **MySQL 8.4** on `localhost:3306`
- **phpMyAdmin** on `http://localhost:8080`

### 3. Run database migrations

```bash
cd backend/iterimApi
dotnet ef database update
```

> If `dotnet ef` is not found, install it: `dotnet tool install --global dotnet-ef`

### 4. Run the backend

```bash
dotnet run
```

The API starts at `http://localhost:5229`

### 5. Run the frontend

Open a **new terminal**:

```bash
cd frontend/iterimWeb
npm install
npm run dev
```

The frontend starts at `http://localhost:5173`

### 6. Verify everything works

| Service | URL | Expected |
| :--- | :--- | :--- |
| **API Health** | http://localhost:5229/api/health | `"database": "connected"` |
| **API Docs (Scalar)** | http://localhost:5229/scalar | Interactive API documentation |
| **phpMyAdmin** | http://localhost:8080 | Database admin panel |
| **Frontend** | http://localhost:5173 | React app |

## 📁 Project Structure

```
iterim/
├── backend/
│   └── iterimApi/
│       ├── Controllers/         # API endpoints
│       ├── Data/                # AppDbContext & DB config
│       ├── DTOs/                # Data Transfer Objects (Request/Response models)
│       ├── Helpers/             # Helper classes (e.g., CookieHelper)
│       ├── Migrations/          # EF Core migrations
│       ├── Models/
│       │   ├── Entities/        # Database entities
│       │   ├── Enums/           # Enum definitions
│       │   └── Settings/        # Configuration settings models
│       ├── Services/
│       │   ├── Interfaces/      # Service abstractions
│       │   └── Implementations/ # Business logic implementation
│       ├── Program.cs           # App entry point & DI configuration
│       └── appsettings.json     # Configuration file
│
├── frontend/
│   └── iterimWeb/
│       ├── src/
│       │   ├── assets/          # Static assets (images, fonts)
│       │   ├── components/      # Shared UI components
│       │   ├── features/        # Feature-based modules
│       │   ├── lib/             # Utility libraries & helpers
│       │   ├── App.tsx          # Main application component
│       │   └── main.tsx         # Frontend entry point
│       ├── index.html           # HTML template
│       ├── package.json         # NPM dependencies & scripts
│       └── vite.config.ts       # Vite configuration
│
├── docker-compose.yml           # Docker services configuration
└── README.md                    # Project documentation
```

## 🗄️ Database

### Connection Details (Development)

| Setting | Value |
| :--- | :--- |
| Host | `localhost` |
| Port | `3306` |
| Database | `iterimdb` |
| User | `interim_user` |
| Password | `interim_dev_pass` |
| Root Password | `root_dev_pass` |

### Useful Commands

```bash
# Start database
docker compose up -d

# Stop database
docker compose down

# Stop database AND delete all data
docker compose down -v

# Create a new migration after changing entities
cd backend/iterimApi
dotnet ef migrations add MigrationName

# Apply migrations to database
dotnet ef database update

# Revert last migration
dotnet ef migrations remove
```

## 🎨 Frontend Commands

```bash
cd frontend/iterimWeb

# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Lint
npm run lint

# Add a shadcn/ui component
npx shadcn@latest add [component-name]

# Examples:
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add table
npx shadcn@latest add input
npx shadcn@latest add dropdown-menu
```

Browse all available shadcn/ui components: https://ui.shadcn.com/docs/components

### Frontend Dependencies

| Package | Purpose |
| :--- | :--- |
| `react` / `react-dom` | UI framework |
| `react-router` | Client-side routing |
| `tailwindcss` / `@tailwindcss/vite` | Utility-first CSS |
| `shadcn/ui` | Pre-built UI components |
| `clsx` / `tailwind-merge` | Class name utilities (via shadcn) |

### Path Aliases

Import from `src/` using `@/` prefix:

```typescript
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
```

## 🔧 Common Issues

**`dotnet ef` not found:**
```bash
dotnet tool install --global dotnet-ef
```

**Port 3306 already in use:** Another MySQL instance is running. Stop it or change the port in `docker-compose.yml`.

**Port 5229 different on your machine:** Check the terminal output when running `dotnet run` for the actual port.

**Docker containers won't start:** Make sure Docker Desktop is running.

**NU1608 warning during build:** This is expected — Pomelo 9.x with EF Core 9 on .NET 10. It's suppressed in the `.csproj`.

**`npm install` fails:** Make sure you have Node.js 20+ installed. Delete `node_modules` and `package-lock.json`, then run `npm install` again.

**Path alias `@/` not working:** Make sure both `tsconfig.json` and `tsconfig.app.json` have the `baseUrl` and `paths` config.

## Documentation for tech used

### 1. ASP.NET Core & EF Core:

- ASP.NET Core fundamentals — https://learn.microsoft.com/en-us/aspnet/core/fundamentals
- EF Core docs (migrations, DbContext, relationships) — https://learn.microsoft.com/en-us/ef/core 
- Pomelo MySQL provider — https://github.com/PomeloFoundation/Pomelo.EntityFrameworkCore.MySql

### 2. Docker:

- Docker Compose docs — https://docs.docker.com/compose 
- MySQL Docker image reference — https://hub.docker.com/_/mysql  

### 3. Frontend:

- Vite docs https://vite.dev/guide 
- React 19 docs — https://react.dev/learn
- Tailwind CSS v4 — https://tailwindcss.com/docs
- shadcn/ui component library — https://ui.shadcn.com/docs
- React Router docs — https://reactrouter.com/start/framework/routing
- TypeScript handbook — https://www.typescriptlang.org/docs 

### 4. JWT Authentication:

- ASP.NET Core auth overview — https://learn.microsoft.com/en-us/aspnet/core/security/authentication 
- What JWTs are and how they work — https://jwt.io/introduction
- JwtBearer package reference — https://learn.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.authentication.jwtbearer

### 5. Password Hashing:

- PasswordHasher<T> docs — https://learn.microsoft.com/en-us/aspnet/core/security/data-protection/consumer-apis/password-hashing  

### 6. Refresh Tokens & Cookies:

- Cookie auth in ASP.NET Core — https://learn.microsoft.com/en-us/aspnet/core/security/authentication/cookie  
- OWASP JWT security best practices (applies to any language) — https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html  
- OWASP session/token management — https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html  

### 7. CORS:

- CORS in ASP.NET Core — https://learn.microsoft.com/en-us/aspnet/core/security/cors  