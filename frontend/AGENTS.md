# Frontend Agent Instructions

## Project scope

- Follow the repository-root `AGENTS.md` first; these instructions add frontend-specific guidance.
- For frontend-only tasks, work in frontend/. An authorized end-to-end task may also change backend, tests and documentation as needed.
- The frontend uses React 19, Vite 8, and JavaScript/JSX. Keep the existing stack; do not introduce TypeScript or dependencies without discussing the need.
- Keep user-facing copy in Spanish with the project's Argentine voseo and preserve the MandáTodo visual language.
- Do not present mock data, local UI state, or client-side role checks as persisted data, real authentication, or backend security.

## Spec-driven changes

- For a new feature or a change that affects multiple screens or user flows, write or update a short spec in `frontend/specs/<feature>.md` before implementation.
- A spec should state the user/problem, scope and non-goals, screen or flow, acceptance criteria, relevant empty/loading/error/success states, and responsive behavior. Use concrete, observable criteria; use Given/When/Then when it makes a flow clearer.
- Treat an approved spec as the implementation boundary. Update it when the user changes the scope.
- For a small visual correction or a single-screen adjustment with a clear screenshot/request, use that reference as the spec; do not create paperwork just to change spacing or copy.
- For unresolved decisions affecting API contracts, authentication, map providers or shared data, surface options and record the decision in docs/decisiones.md. Follow already agreed decisions and continue independent work.

## Implementation practices

- Prefer small, focused React components and keep presentation separate from future API/service code. Avoid over-engineering and unnecessary abstractions.
- Keep form labels associated with controls, use semantic elements, support keyboard focus, and provide accessible names for icon-only buttons.
- Make layouts responsive with CSS grid/flex and breakpoints. Do not scale a whole screen with `transform` or `zoom`; size its layout and typography directly so native selects, browser autofill, and focus rings remain aligned.
- Keep mock UI interactions clearly local. Do not add persistence, API calls, map services, or real auth unless requested and agreed.
- Do not add credentials, tokens, or other secrets to frontend code. Anything shipped to the browser is public.

## Verification and harness

- Existing checks are `npm run lint` and `npm run build`, run from `frontend/`.
- Run relevant checks after changes and report results. Add meaningful tests when implementing behavior; justify any new framework. See docs/verificacion.md for the shared procedure.
- If a test harness is later requested, keep it deterministic: use fixed mock data, isolate external services behind replaceable adapters, and cover acceptance criteria and error/empty states without calling real services.
- For visual changes, compare at the reference viewport and at a narrow mobile viewport; report when visual verification could not be completed.
