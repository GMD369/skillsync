# Module M1 – Authentication

**Status:** Complete (Phase 1, Day 5)
**Requirements covered:** FR-01 (register), FR-02 (login/logout), FR-03 (protect private pages and APIs),
NFR-02 (security)

## What it does

- A student creates an account with name, email and password.
- A student logs in and receives a **JWT token** (valid for 7 days).
- The token is saved in the browser, so the student stays logged in after refreshing the page.
- Private pages (e.g. the dashboard) redirect to the login page if the student is not logged in.
- Private API routes return `401` without a valid token.
- The student can log out.

## How it works

```
Register / Login page  ──POST /api/auth/register or /login──►  auth.controller.js
        ▲                                                       │ 1. validate input
        │                                                       │ 2. check email / password (bcrypt)
        │   { token, user }                                     │ 3. create JWT
        └───────────────────────────────────────────────────────┘
AuthContext saves the token ──GET /api/auth/me (Bearer token)──► requireAuth middleware ──► user
```

## Files

### Backend
| File | Responsibility |
|------|----------------|
| `src/routes/auth.routes.js` | `POST /register`, `POST /login`, `GET /me` |
| `src/controllers/auth.controller.js` | Register, login and current-user logic |
| `src/models/User.js` | User schema; hashes the password before saving; never returns it |
| `src/utils/validators.js` | Input validation rules |
| `src/utils/generateToken.js` | Creates the signed JWT |
| `src/middleware/auth.middleware.js` | `requireAuth`: checks the Bearer token |
| `src/middleware/error.middleware.js` | Invalid JSON, duplicate email, server errors |
| `src/app.js` / `src/server.js` | App setup (testable) / starts the server after connecting to MongoDB |
| `tests/auth.test.js` | 12 automated tests |

### Frontend
| File | Responsibility |
|------|----------------|
| `src/context/AuthContext.js` | Stores the logged-in user and token; `login`, `register`, `logout`; restores the session on reload |
| `src/app/login/page.js` | Login form with validation and error messages |
| `src/app/register/page.js` | Registration form with password confirmation |
| `src/components/auth/ProtectedRoute.js` | Redirects logged-out users to `/login` |
| `src/app/dashboard/page.js` | Protected page showing the student's account |
| `src/components/layout/Navbar.js` | Shows Login / Sign up, or the student's name and Logout |
| `src/components/auth/AuthLayout.js` | Split-screen layout (brand panel + form) for login and register |
| `src/components/ui/FormField.js` | Reusable input with icon, show/hide password, hint and error message |
| `src/components/ui/Button.js`, `Alert.js`, `Logo.js` | Shared UI: button variants with loading spinner, error banner, logo |
| `src/lib/api.js`, `src/lib/validators.js` | API helper with clear errors; client-side validation |

## API

| Method | Endpoint | Body | Success | Errors |
|--------|----------|------|---------|--------|
| POST | `/api/auth/register` | `name, email, password` | `201 { token, user }` | `400` invalid input, `409` email already registered |
| POST | `/api/auth/login` | `email, password` | `200 { token, user }` | `400` invalid input, `401` incorrect email or password |
| GET | `/api/auth/me` | – (Bearer token) | `200 { user }` | `401` missing / invalid / expired token |

## Validation rules

- **Name:** 2–60 characters
- **Email:** valid format; stored in lowercase, so `A@x.com` and `a@x.com` are the same account
- **Password:** at least 8 characters, with at least one letter and one number

Rules are checked in the browser (instant feedback) **and** on the server (cannot be bypassed).

## Security decisions

- Passwords are hashed with **bcrypt** (10 salt rounds); the hash is excluded from all API responses.
- Login uses the **same error message** for an unknown email and a wrong password, so nobody can find
  out which emails are registered.
- The JWT secret is a long random string kept in `backend/.env`, which is not committed to GitHub.
- The token is stored in `localStorage` for simplicity in this MVP. A more secure option for production
  is an HTTP-only cookie, which JavaScript cannot read.

## Testing

```bash
cd backend
npm test
```

12 tests pass: successful registration, password hashing, duplicate email (any letter case), invalid
input, weak password, successful login, wrong password, unknown email, missing fields, `/me` with a
valid token, protected routes without or with an invalid token, and invalid JSON.
