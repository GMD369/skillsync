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
| `dashboard.test.js` | Dashboard summary (empty, readiness, current week and next task, outdated roadmap), `/health` with the AI service up and down, JSON 404 and invalid JSON (6 tests) |
| `recommendations.test.js` | Project ranking by missing skills, no career goal, level/limit filters, invalid query (400), project by id (404), schema validation and unique title, 501 for internships (8 tests) |

**Total: 71 tests.**

## Testing against the running server

`npm run api:check` (`scripts/api-check.js`) sends 41 real HTTP requests to every endpoint of a running
backend (`npm start`). The requests include valid and invalid ones (bad input, wrong password, unknown ids,
missing token). It compares each status code with the expected one and deletes its temporary student at
the end. The same requests are in the Postman collection, `docs/api/SkillSync.postman_collection.json`.
