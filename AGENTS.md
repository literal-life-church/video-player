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

The player has 6 states: `loading` (shown immediately while the API call is in flight), `offline`, `prewarming`, `live`, `canceled`, and `error` (shown when the fetch fails). Each has a corresponding branch in `player.js` — `loading` is set up before the `fetch` call; `error` is handled in the `.catch()`. All states stamp `data-error` and `data-initialized` on the container; successful states (`offline`, `prewarming`, `live`, `canceled`) also add `player-initialized` to the class list. For the full reference on what each state injects and which CSS classes are available, see the **Player States** section of the README.

## Backend

The Media API endpoint used by this library is `https://<data-backend-host>/live-streaming`.

The host is supplied by the consumer via the `data-backend-host` attribute. For the full attribute reference, see the README.

### Server-Sent Event (SSE) Subscription

After the initial fetch resolves, the library opens an `EventSource` to `https://<data-backend-host>/live-streaming/subscribe` and listens for one of two events: `event.state_transition` and `event.close_connection`. The data with `event.state_transition` contains the exact same payload as `https://<data-backend-host>/live-streaming` and is used to immediately issue updates to the client when the live event transitions its state.

The `event.close_connection` is issued by the server to ask the client to close the connection. This approach is taken instead of issuing a 204 because the server cannot tell if the client is a new user sitting on a page with an `offline` event, waiting for it to go online, or if they were present when the state went from `live` to `offline`. We _only_ want to force a disconnection in the second scenario, not for all `offline` events.

All UI rendering for both the initial load and SSE transitions is handled by the inner `renderState(data)` async function defined inside the `DOMContentLoaded` callback. Any future state changes to the UI must go through this function — do not add inline rendering logic to the fetch handler or the SSE listener.

The client never explicitly closes the `EventSource`; the server controls connection lifetime.
