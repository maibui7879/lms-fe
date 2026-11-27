# LMS Frontend

Next.js App Router frontend for the LMS. The frontend calls the NestJS API Gateway,
not the individual internal services.

## Local development

Create `.env.local` from `.env.example`, then run:

```bash
npm install
npm run dev
```

The frontend runs at `http://localhost:5173`; the API Gateway defaults to
`http://localhost:3000`. The Gateway CORS allowlist must include the frontend
origin (`http://localhost:5173`).

## API client

UI components should call a domain function from `src/services/*.service.ts`.
The service layer handles the API call, auth token requirement, and response
unwrapping; components do not need to know HTTP methods or URL paths. For
example:

```ts
import { courseService } from "@/services/course.service";

const courses = await courseService.listCourses({ page: 1, limit: 12 });
```

Feature API modules under `src/features/*/api.ts` define the Gateway method and
path directly in the frontend repository. The frontend does not read the
backend repository or generate its route definitions from backend files.
Protected APIs require an access token from the caller; Gateway errors are
surfaced as `ApiClientError`. Keep these frontend API definitions aligned with
the Gateway contract when either project changes.

Quiz API routes are not currently exposed by the Gateway. Do not call the
internal Quiz service directly from the frontend.

## Checks

Use Node.js 24 and install dependencies with `npm ci`, matching CI.
Run all quality checks locally with `npm run check`, or individually:

```bash
npm run lint
npm run format:check
npm test
npm run build
```

Run `npm run format` to format the project and `npm run lint:fix` to apply
automatic ESLint fixes. Prettier skips generated output, the npm lockfile, and
the Next.js-managed agent instructions.

GitHub Actions runs lint, formatting checks, and the full existing Vitest suite
as independent jobs on every push and pull request. The workflow can also be
started manually. Tests use mocked API requests and do not require a running
backend or secrets. The build command remains a separate local check.
