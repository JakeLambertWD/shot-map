<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project Coding Standards

## Mantine UI

- Prefer Mantine components that express the intended layout behavior. For example, use `Center` when content should be centered instead of using `Box` with `display`, `alignItems`, and `justifyContent` in a style object.
- Use Mantine style props when a component supports the CSS property. Prefer props such as `mih`, `p`, `px`, `py`, `m`, `mx`, `my`, `bg`, `c`, `fw`, `fz`, and `ta` over equivalent declarations inside `style`.
- Use `style` or `styles` only for CSS that is not available as a Mantine prop, component-specific selectors, or genuinely custom styling.
- Prefer Mantine layout components and props before writing custom flexbox or spacing CSS.

## Theme And Design Tokens

- Import the shared theme from `styles/theme` rather than creating duplicate theme objects.
- Use `theme.other!.colors` for the application brand palette. Do not duplicate brand color values in page or component files.
- Use the theme's named spacing, radius, font-size, and breakpoint tokens where possible instead of arbitrary values.
- Keep responsive and layout behavior in Mantine props or the shared theme when the framework supports it.

## Component Constants

- Keep static component configuration, such as navigation links, in a colocated `<ComponentName>.constants.ts` file when it is likely to grow, be reused, or be tested independently.
- Name exported constant configuration in uppercase, such as `NAVIGATION_LINKS`.
- Use `as const` for immutable configuration so literal values are preserved and accidental mutation is prevented.

## TypeScript

- Preserve strong typing. Avoid broad fallback objects such as `?? {}` when the value is guaranteed by the application's theme configuration.
- Keep changes focused and follow the existing project patterns before introducing new abstractions.

## tRPC / React Query

- Destructure query results instead of accessing properties on the query object. Rename `data` to a descriptive name, and destructure any other fields you need (such as `isLoading` or `error`) on the same line, e.g. `const { data: followerCount, isLoading } = api.followers.getCount.useQuery();`.
