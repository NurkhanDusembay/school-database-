# School Academic System

Basic starter website for a school academic system using Node.js, Express, EJS, and PostgreSQL.

## Included in this first version

- Readable overview pages built from joins for students, classes, teaching assignments, attendance, and marks
- Dashboard with cards for `classes`, `students`, `teachers`, `subjects`, `subjects_teachers`, `marks`, and `attendance`
- Simple table preview pages that load up to 20 rows dynamically
- Blue-and-white modern interface
- PostgreSQL connection with `.env` configuration

## Setup

1. Install packages:

   ```bash
   npm install
   ```

2. Create your environment file:

   ```bash
   cp .env.example .env
   ```

3. Update `.env` with your PostgreSQL database values.

4. Start the app:

   ```bash
   npm run dev
   ```

5. Open `http://localhost:3000`

## Notes

- Use `/overview/students-overview`, `/overview/classes-overview`, `/overview/teachers-subjects`, `/overview/attendance-overview`, and `/overview/marks-overview` for the human-readable joined pages.
- Use `/api` to see the REST API entry point.
- Use `/api/overviews` and `/api/tables` to list available JSON endpoints.
- Use `/api/overviews/marks-overview` or `/api/tables/students` to get JSON data.
- You can change the API row count with a query string like `/api/overviews/students-overview?limit=50`.
- The table pages do not depend on fixed column names. They read whatever columns exist in your PostgreSQL tables.
- If you want, the next version can add login, add/edit forms, student profiles, class pages, charts, and better table relations.
