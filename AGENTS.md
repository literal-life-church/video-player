# AGENTS.md

Guidance for AI agents working in this repository.

## Project Overview

This is a single-file, zero-dependency vanilla JavaScript library. The entire runtime is `player.js` — there is no build step, no bundler, and no framework. Node.js is only present to run a local development server (`npm run dev`) for convenience while building; it is not part of the runtime.

The library is hosted and minified by [jsDelivr](https://www.jsdelivr.com/). Consumers embed it via a `<script>` tag and a container `<div>`. For the full embedding instructions and parameter reference, see the **Using on a Website** section of the README.

The player depends on the [Media API](https://github.com/literal-life-church/media-api) as its backend. It cannot function without a reachable Media API instance.

## Repository Structure

| File | Purpose |
| --- | --- |
| `player.js` | The entire library. All logic lives here. |
| `index.html` | Local demo page. Not shipped; for development use only. |
| `package.json` | Defines the `dev` script only. No runtime dependencies. |
| `README.md` | End-user documentation: developer setup and embedding guide. |

## Key Conventions

- **One file.** Do not introduce additional JS files, modules, or a build pipeline unless explicitly asked. All changes go into `player.js`.
- **No npm runtime dependencies.** Do not add runtime npm packages. The only permitted dev dependency is the local server (`browser-sync`). Third-party libraries are loaded at runtime from jsDelivr, CDNJS, or other CDN using the `loadScript` utility (see below).
- **Plain JS.** No TypeScript, no transpilation, no module syntax (`import`/`export`). The file is served as-is by jsDelivr and must run natively in the browser.
- **Constants block at the top.** Configuration defaults (e.g. `CONTAINER_ID`, `DEFAULT_ASPECT_RATIO`, `LOGGING_TAG`) are declared in the `// region Configuration Defaults` block at the top of the `DOMContentLoaded` callback. Add new constants there, not inline.
- **Console error prefix.** All error messages must be prefixed with the `LOGGING_TAG` constant so they are identifiable in the browser console.

## Loading External Libraries

Third-party libraries are loaded at runtime via the `loadScript` utility defined at the top of `player.js`:

```js
loadScript("https://cdn.jsdelivr.net/npm/<package>@<version>/<file>")
    .then(() => {
        // library is now available on window
    });
```

**Rules:**

- Always load from a CDN such as jsDelivr or CDNJS using a **pinned version** (e.g. `marked@15.0.7`), never `@latest`.
- Only load a library when it is actually needed (i.e. after the API response determines which UI to render), not eagerly on every page load.
- All currently approved external libraries are listed below. Do not introduce a new library without being explicitly asked to. When you do add a new library, log it in the table below.

### Approved Libraries

| Library | CDN URL | `window` global | Purpose |
| --- | --- | --- | --- |
| [Marked](https://marked.js.org/) | `https://cdn.jsdelivr.net/npm/marked@18.0.0/lib/marked.umd.min.js` | `window.marked` | Parse Markdown content returned by the Media API |

## Player States

Each API status (`offline`, `prewarming`, `live`, `canceled`) has a corresponding branch in the `fetch` handler in `player.js`. Some states apply classes, data attributes, and CSS hooks to the container or injected content to give the implementing page styling control and better semantic meaning. For the full reference on what each state injects and which CSS classes are available, see the **Player States** section of the README.

## Backend

The Media API endpoint used by this library is `https://<data-backend-host>/live-streaming`.

The host is supplied by the consumer via the `data-backend-host` attribute. For the full attribute reference, see the README.
