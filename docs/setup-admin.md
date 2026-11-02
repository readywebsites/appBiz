# Biz499 Admin Web Dashboard Setup Guide

The Biz499 Admin Dashboard is a responsive, single-page web application built with **React 18**, **TypeScript**, **Vite 6**, and **Tailwind CSS**. It is designed for daily business operations, CRM pipeline management, quotation generation, order tracking, project delivery milestones, invoices, and analytics.

---

## 1. Prerequisites

- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **Package Manager**: `npm` (v9+) or `yarn` / `pnpm`
- **Backend API**: The Django REST API should be running on `http://localhost:8000` (or configured via `.env`).

---

## 2. Directory Structure

```text
admin/
├── src/
│   ├── components/          # Reusable UI & Shell Layout
│   │   ├── Header.tsx       # Top bar with user profile & quick navigation
│   │   └── Sidebar.tsx      # Role-aware navigation menu
│   ├── context/
│   │   └── AuthContext.tsx  # Auth state, JWT storage, role checks
│   ├── lib/
│   │   └── api.ts           # Axios client with automatic 401 token refresh
│   ├── pages/               # Functional business views
│   │   ├── Dashboard.tsx    # Executive KPIs, financial metrics, recent feeds
│   │   ├── LeadsCRM.tsx     # CRM pipeline, status transitions, account conversion
│   │   ├── Quotations.tsx   # Quote generator with GST math and PDF actions
│   │   ├── Orders.tsx       # Orders table, balances, payment statuses
│   │   ├── Projects.tsx     # Project milestone tracker, staging/live URLs
│   │   ├── Invoices.tsx     # Sequential invoices list with PDF downloads
│   │   ├── ServicesManager.tsx # Catalog pricing, tiers, and add-ons management
│   │   ├── SupportTickets.tsx  # Customer helpdesk with threaded replies
│   │   ├── AuditLogs.tsx    # Compliance audit log trail
│   │   └── Login.tsx        # Staff sign-in with 1-click quick demo buttons
│   ├── types/
│   │   └── index.ts         # TypeScript interfaces matching backend models
│   ├── App.tsx              # Application routing & ProtectedRoute wrapper
│   ├── main.tsx             # Entry point
│   └── index.css            # Tailwind directives and custom scrollbars
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 3. Environment Variables Configuration

Create a `.env` file in `admin/`:

```bash
# Backend REST API Base URL
VITE_API_URL=http://localhost:8000/api/v1
```

If not provided, the dashboard automatically defaults to `http://localhost:8000/api/v1`.

---

## 4. Installation & Local Development

### Step 1: Install Dependencies

```bash
cd admin
npm install
```

### Step 2: Start the Vite Development Server

```bash
npm run dev
```

The development server will launch at:
`http://localhost:5173`

---

## 5. Staff Sign-In & Demo Accounts

For rapid evaluation and daily development, the login screen includes 1-click pre-fill buttons for three distinct business roles:

| Role | Email | Password | Allowed Capabilities |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@biz499.com` | `Biz499Admin#2026` | Full platform access, financial KPIs, service pricing, audit logs |
| **Sales Manager**| `sales@biz499.com` | `Biz499Sales#2026` | Leads CRM, consultation scheduling, quote builder, order conversion |
| **Project Manager**| `pm@biz499.com` | `Biz499Project#2026` | Projects, milestones, task progress, revision requests, client deliverables |

---

## 6. Production Build & Deployment

To typecheck and compile the production bundle:

```bash
npm run build
```

This compiles static assets into `admin/dist/`. The output can be served with Nginx, Apache, or any static hosting provider (Vercel, Netlify, Cloudflare Pages, AWS S3 + CloudFront).

To test the production build locally:

```bash
npm run preview
```

