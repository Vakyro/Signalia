# Repository Guidelines

## Project Structure & Module Organization
This is a Next.js App Router project. Route pages live in `app/` and use nested folders for URL structure, including dynamic routes such as `app/aprender/[category]/[sign]/page.tsx`. Shared UI lives in `components/`, with layout primitives in `components/layout/` and reusable shadcn-style controls in `components/ui/`. Utility code belongs in `lib/`, client hooks in `hooks/`, global styles in `app/globals.css` and `styles/globals.css`, and static files in `public/`.

## Build, Test, and Development Commands
- `npm run dev`: start the local Next.js dev server.
- `npm run build`: create a production build.
- `npm start`: run the production server after building.
- `npm run lint`: run ESLint across the repository.

Use `npm install` to install dependencies. The repo includes `package-lock.json` and `pnpm-lock.yaml`, but `package.json` is the source of truth for the supported scripts.

## Coding Style & Naming Conventions
TypeScript is enabled with `strict: true` in `tsconfig.json`. Use 2-space indentation, `camelCase` for variables and functions, `PascalCase` for components, and lowercase folder names for routes and shared modules. Prefer the `@/` path alias for internal imports. Keep page files named `page.tsx`, layouts `layout.tsx`, and route groups/dynamic segments aligned with the URL they serve.

## Testing Guidelines
No project-level test runner is configured in `package.json`. Before opening a change, run `npm run lint` and `npm run build` to catch type, import, and rendering issues. If you add tests, place them near the feature or under a dedicated test folder and use clear names such as `component-name.test.tsx`.

## Commit & Pull Request Guidelines
Git history is not exposed in this workspace, so no repository-specific commit convention could be verified. Use short, imperative commit subjects, for example: `Add sign search filters`. Pull requests should describe the change, list verification steps, and include screenshots or short screen recordings for UI updates.

## Configuration Notes
`next.config.mjs` currently ignores TypeScript build errors and disables image optimization. Treat those as project constraints when debugging build output, and avoid introducing environment-specific values directly into source files; keep secrets in `.env*.local`.
