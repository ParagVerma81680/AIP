# AIP Security & Access Control Reference

## 1. Authentication & Tenant Data Isolation
- Password hashing using standard bcrypt with random salt (`passlib.context.CryptContext`).
- Stateless JWT access tokens signed with HMAC-SHA256 (`HS256`).
- **Data Isolation:** All database queries for memories, user preferences, orders, and documents strictly enforce `WHERE user_id == current_user.id`. A user cannot read or mutate another user's records.

## 2. Safe Tool Execution
- **Mathematical evaluation:** Uses restricted sandbox with zero access to `__builtins__`, os, sys, or subprocess.
- No arbitrary shell commands or code evaluation.

## 3. File Upload Protections
- Supported file types restricted to `pdf`, `docx`, `doc`, `txt`, `md`.
- Strict file size limit of 10 MB per upload.
- Stored and parsed purely in memory/streams before chunking into vector database.

## 4. Secret Management
- All sensitive keys (`AI_API_KEY`, `SECRET_KEY`, `DATABASE_URL`) are read via environment variables (`.env`).
- `.env` is included in `.gitignore` to prevent leaking credentials to public Git repositories.
