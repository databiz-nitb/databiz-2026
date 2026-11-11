# DataBiz

The website for DataBiz, the Data Science and Analytics Club at NIT Bhopal (MANIT). It brings together the club's events, learning pathways, projects, blog, DataBrew interviews, and information for students and partners.

## What’s in the app

- Public pages for events, learning, blog posts, projects, gallery, team, alumni, and more
- Student accounts and membership applications
- Admin tools for managing and publishing site content
- Email, database, and media integrations for app features

## Tech stack

- Next.js 16 with the App Router and TypeScript
- React 19 and Tailwind CSS
- Neon Postgres with Drizzle ORM
- Better Auth for authentication
- Cloudinary for media and Resend for email

## Run locally

### Prerequisites

- Node.js 20.9 or later
- pnpm 12.9.1 (the version pinned in `package.json`)

### Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Create your local environment file:

   ```powershell
   Copy-Item .env.example .env.local
   ```

3. Configure `.env.local` for your local setup. Set both `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` to `http://localhost:3000`. Add the credentials for the services you intend to use; see [Environment variables](#environment-variables).

4. Start the development server:

   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000).

Some features require working service credentials and a database. To apply the current Drizzle schema to the database in `DATABASE_URL`, run:

```bash
pnpm db:push
```

Only run database commands against a database you are authorized to modify.

## Environment variables

The checked-in `.env.example` lists the app's configuration. Copy it to `.env.local`, then fill in the values appropriate for your environment.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon Postgres connection string |
| `BETTER_AUTH_SECRET` | Secret used by Better Auth |
| `BETTER_AUTH_URL` | Base URL used by authentication; use `http://localhost:3000` locally |
| `BETTER_AUTH_TRUSTED_ORIGINS` | Optional comma-separated list of additional trusted origins |
| `NEXT_PUBLIC_APP_URL` | App's public base URL; use `http://localhost:3000` locally |
| `ALLOWED_EMAIL_DOMAIN` | Allowed student email domain (defaults to `stu.manit.ac.in`) |
| `RESEND_API_KEY` | Resend API key for email |
| `EMAIL_FROM` | Sender address for email |
| `EMAIL_DEV_FALLBACK` | Enables the development email fallback when set to `1` |
| `CONTACT_INBOX` | Inbox for contact messages |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloud name used by browser-side media features |

Keep secrets in `.env.local` or your deployment provider's secret manager. Never commit credentials or production secrets.

## Useful commands

| Command | Description |
| --- | --- |
| `pnpm dev` | Run the local development server |
| `pnpm lint` | Check the code with ESLint |
| `pnpm build` | Create a production build |
| `pnpm start` | Run the production build locally |
| `pnpm db:generate` | Generate a Drizzle migration from schema changes |
| `pnpm db:push` | Push the schema to the configured database |
| `pnpm db:studio` | Open Drizzle Studio |
| `pnpm db:seed` | Seed the configured database |

## Contributing

Contributions are welcome. For a substantial change, start by creating a request (see [Request a change or report a problem](#request-a-change-or-report-a-problem)) so the DataBiz maintainers can discuss the scope before implementation.

1. Fork the repository and create a branch from the default branch. Use a descriptive name, such as `fix/event-timezone` or `feature/member-directory`.
2. Make a focused change and follow the existing code patterns. Include or update tests when the change affects behavior.
3. Run the relevant checks before submitting:

   ```bash
   pnpm lint
   pnpm build
   ```

4. Commit your changes with a clear message.
5. Open a pull request against the default branch. Explain the problem and solution, link the related request if there is one, and include screenshots for visible UI changes.
6. Respond to review feedback and update the pull request as needed.

Please do not include secrets, real user data, or unrelated formatting changes in contributions.

## Request a change or report a problem

Use the repository’s **Issues** page on GitHub to create a request, if Issues are enabled. If they are not enabled, contact the DataBiz team at [databiz.nitb@gmail.com](mailto:databiz.nitb@gmail.com). Search existing issues first to avoid duplicates.

- **Bug report:** Describe what you expected and what happened, steps to reproduce it, and your browser/device or environment. Include screenshots or error messages when useful, but remove personal information and secrets.
- **Feature request:** Explain the user need, the proposed behavior, and any relevant examples or acceptance criteria. Share alternatives you considered if they help clarify the request.
- **Questions or general feedback:** Use the same issue page for project-related discussion, or email the club for matters that are not suitable for a public issue.

For security-sensitive reports, do not post exploit details or credentials in a public issue. Contact the maintainers privately by email instead.

## Project documentation

- [Application specification](./SPEC.md) — product scope, architecture, and implementation details
- [DataBiz LinkedIn](https://www.linkedin.com/company/databiz-nitb/)
- [DataBiz Instagram](https://www.instagram.com/databiz_nitb/)
