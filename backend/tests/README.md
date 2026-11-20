# Backend Tests

Automated API tests using Node's built-in test runner (`node:test`) and `fetch`.

```bash
cd backend
npm test
```

The tests use a separate database (`TEST_MONGO_URI` in `.env`, default
`mongodb://127.0.0.1:27017/skillsync_test`), which is wiped before each test and
dropped afterwards, so your development data is never touched.

| File | Covers |
|------|--------|
| `auth.test.js` | Register, login, password hashing, duplicate email, validation errors, JWT-protected routes, invalid JSON (12 tests) |
