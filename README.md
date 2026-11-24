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

```bash
npm run lint
npm test
npm run build
```
