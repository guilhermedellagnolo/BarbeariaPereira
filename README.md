# Precision Barbering App

## Local Setup

1. Install dependencies: `npm install`
2. Setup your .env file: `cp .env.example .env` and fill in your DATABASE_URL
3. Push the schema to your local database: `npm run db:push`
4. Start the application: `npm run dev`

## Handover Notes
- **Database:** PostgreSQL with Drizzle ORM.
- **Backend:** Node.js/Express.
- **Frontend:** React/Vite/Tailwind.
- **Automation:** n8n Webhook integration in `server/routes.ts`.
