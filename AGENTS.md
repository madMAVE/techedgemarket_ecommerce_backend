# Project Guidelines

## TypeScript Rules

- **NEVER** use `any` or `unknown` as a type declaration. Always provide explicit, specific types for variables, parameters, and return values.
- Use inferred types when possible, but add explicit type annotations when TypeScript cannot infer correctly.
- Prefer narrow, descriptive types over broad ones (e.g., `{ id: string; name: string }` instead of `Record<string, unknown>`).
