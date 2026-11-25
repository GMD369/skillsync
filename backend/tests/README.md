# Backend Tests

Automated API tests using Node's built-in test runner (`node:test`) and `fetch`.

```bash
cd backend
npm test
```

Each test file uses its own database based on `TEST_MONGO_URI` (e.g. `skillsync_test_auth`,
`skillsync_test_profile`), because Node runs test files in parallel. The databases are wiped before
each test and dropped afterwards, so your development data is never touched. Shared setup is in
`helpers.js`.

| File | Covers |
|------|--------|
| `auth.test.js` | Register, login, password hashing, duplicate email, validation, 72-byte password limit, brute-force lock, JWT-protected routes, invalid JSON (15 tests) |
| `profile.test.js` | Profile update and validation, skills de-duplication, resume upload with a fake AI service, AI service down, non-PDF / fake PDF / too large, download, delete, privacy between students, skill normalization with and without the AI service, account deletion with related data (20 tests) |
| `career.test.js` | Career roles, target-role selection, skill-gap calculation (9 tests) |
| `roadmap.test.js` | Roadmap Create / Read / Update / Delete, validation, privacy, unique index, link to the skill gap (13 tests) |
