# SkillSync – Frontend

Next.js (App Router) + React + Tailwind CSS user interface for SkillSync.

```bash
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:5000/api
npm run dev                  # http://localhost:3000
```

| Folder | Contents |
|--------|----------|
| `src/app/` | Pages (one folder = one route): landing, login, register, dashboard, profile, skill-gap, roadmap, projects |
| `src/components/` | `auth/` (ProtectedRoute, AuthLayout), `layout/` (Navbar, Footer, ComingSoon), `profile/` (profile cards), `ui/` (Button, FormField, TagInput, Alert, LoadError, Logo) |
| `src/context/AuthContext.js` | Logged-in user and token shared across the app |
| `src/lib/` | `api.js` (all backend calls: base URL, token, timeouts, error messages), `useSubmitLock.js`, validation rules, formatting |
| `e2e/` | Browser test of the complete workflow (`npm run test:e2e`, needs Edge or Chrome and all services running) |
| `src/app/globals.css` | Skeuomorphic design system (`skeu-*` classes) |

## End-to-end test

```bash
npm run test:e2e                     # backend, AI service and frontend must be running
SHOTS=e2e/output npm run test:e2e    # also saves screenshots and the list of API requests
```

How the frontend and backend are connected: [docs/INTEGRATION.md](../docs/INTEGRATION.md).

See the [main README](../README.md) for the full project.
