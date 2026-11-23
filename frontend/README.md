# SkillSync – Frontend

Next.js (App Router) + React + Tailwind CSS user interface for SkillSync.

```bash
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:5000/api
npm run dev                  # http://localhost:3000
```

| Folder | Contents |
|--------|----------|
| `src/app/` | Pages (one folder = one route): landing, login, register, dashboard, profile, skill-gap, roadmap |
| `src/components/` | `auth/` (ProtectedRoute, AuthLayout), `layout/` (Navbar, Footer, ComingSoon), `profile/` (profile cards), `ui/` (Button, FormField, TagInput, Alert, Logo) |
| `src/context/AuthContext.js` | Logged-in user and token shared across the app |
| `src/lib/` | API helper, validation rules, formatting helpers |
| `src/app/globals.css` | Skeuomorphic design system (`skeu-*` classes) |

See the [main README](../README.md) for the full project.
