# Literal Life Church Video Player

Frontend video player for live streaming events that hooks into our [Media API](https://github.com/literal-life-church/media-api) to display a video player container the live event, related announcements, schedules, and deliver push notifications.

## For Developers

Here is how you can get this project up and running on your machine.

  1. Install the latest [Node.js LTS](https://nodejs.org/en/download) version
  2. Run this project on your machine with these commands:

      ```sh
      npm i
      npm run dev
      ```

  3. Open [http://localhost:3000](http://localhost:3000) in your browser.

      > **Note:** The demo page in `index.html` is pre-configured to point at an example Media API instance, which does not exist, but proves how you could use it against your own instance. To test against a different backend, update the `data-backend-host` attribute on the container `div` in that file.

## Using on a Website

If you want to embed this player onto your webpage, follow these steps. Keep in mind that this isn't a standalone application, and requires an instance of the [Media API](https://github.com/literal-life-church/media-api) to fetch relevant data.

  1. Add the following `<script>` tag to your page, ideally just before `</body>`:

      ```html
      <script src="https://cdn.jsdelivr.net/gh/literal-life-church/video-player@XXXX.YY.ZZ/player.js"></script>

      <!-- Optional styles with pre-configured defaults -->
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/literal-life-church/video-player@XXXX.YY.ZZ/styles.min.css" />
      ```

     Where `XXXX.YY.ZZ` is replaced with the most recent release version: ![GitHub Release](https://img.shields.io/github/v/release/literal-life-church/video-player?label=Latest%20Release&sort=date)

  2. Place a `<div>` wherever you want the player to appear:

      ```html
      <div
          id="literal-life-church-video-player"
          data-backend-host="api.example.com"
          data-error-message="Something went wrong. Please try again later."
          data-offline-message="We are currently **offline** right now."
          data-prewarming-message="We will be going live *very* soon.">
      </div>
      ```

  3. Populate each of the `data-` attributes as desired from this table:

| Attribute | Required | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `id` | Yes | `string` | — | Must be exactly `literal-life-church-video-player`. The script will not initialize against any other ID. |
| `data-backend-host` | Yes | `string` | — | Hostname of your [Media API](https://github.com/literal-life-church/media-api) instance. No protocol, no trailing path (e.g. `api.example.com`). |
| `data-error-message` | No | `string` (Markdown) | `We were not able to load any information about this event. Please contact the site owner.` | Message displayed when the player fails to load event data. Supports Markdown. Multi-line values are supported via [multi-line HTML attributes](https://stackoverflow.com/a/38880984). |
| `data-offline-message` | No | `string` (Markdown) | `This event is offline.` | Message displayed when the event is offline. Supports Markdown. Multi-line values are supported via [multi-line HTML attributes](https://stackoverflow.com/a/38880984). |
| `data-prewarming-message` | No | `string` (Markdown) | `We are getting ready to go live very soon. Please stay tuned.` | Message displayed when the event is prewarming (created on YouTube but not yet broadcasting). Supports Markdown. Multi-line values are supported via [multi-line HTML attributes](https://stackoverflow.com/a/38880984). |

## Player States

The player can fall into one of 6 possible states as detailed in the subsequent sections. In each situation, the player modifies the container's classes and `data-` attributes and, in some cases, injects structured content so you have fine-grained styling control and better semantic meaning for this content.

Every state transition also triggers a CSS `player-fade-in` animation on the newly inserted content. The animation is defined in `styles.css`, which you can include as-is or use as a reference for your own styles.

You can observe a few examples of how to use these classes inside of the `styles.css` example file.

### Loading

The loading state is active immediately on page load while the player waits for the backend to respond.

#### Container modifications

| Attribute | Value | Description |
| --- | --- | --- |
| `class` | `player-loading player-uninitialized` | Added to the container's class list. |
| `data-error` | `false` | Reflects whether the player encountered an error. |
| `data-initialized` | `false` | Reflects whether the player has finished initializing. |
| `data-player-loading` | *(empty)* | Present while the player is loading. |
| `data-status` | `loading` | Reflects the current player status. |

#### CSS classes

| Class | Element | Description |
| --- | --- | --- |
| `loading-container` | `<div>` | Wraps the animated puff spinner shown while the player loads. |

---

### Offline

When the backend returns `status: "offline"`, the player enters the offline state.

#### Container modifications

| Attribute | Value | Description |
| --- | --- | --- |
| `class` | `event-offline player-initialized` | Added to the container's class list. |
| `data-error` | `false` | Reflects whether the player encountered an error. |
| `data-event-offline` | *(empty)* | Present when the event is in the offline state. |
| `data-initialized` | `true` | Reflects whether the player has finished initializing. |
| `data-status` | `offline` | Reflects the current player status. |

#### CSS classes

| Class | Element | Description |
| --- | --- | --- |
| `message-container message-event-offline-container` | `<div>` | Goes directly inside the container to wrap the offline message content. `message-container` is shared across all message states; `message-event-offline-container` is unique to the offline state. |

---

### Prewarming

When the backend returns `status: "prewarming"`, the player enters the prewarming state.

#### Container modifications

| Attribute | Value | Description |
| --- | --- | --- |
| `class` | `event-prewarming player-initialized` | Added to the container's class list. |
| `data-error` | `false` | Reflects whether the player encountered an error. |
| `data-event-prewarming` | *(empty)* | Present when the event is in the prewarming state. |
| `data-initialized` | `true` | Reflects whether the player has finished initializing. |
| `data-status` | `prewarming` | Reflects the current player status. |

#### CSS classes

| Class | Element | Description |
| --- | --- | --- |
| `message-container message-event-prewarming-container` | `<div>` | Goes directly inside the container to wrap the prewarming message content. `message-container` is shared across all message states; `message-event-prewarming-container` is unique to the prewarming state. |

---

### Live

When the backend returns `status: "live"`, the player enters the live state and embeds the YouTube player.

#### Container modifications

| Attribute | Value | Description |
| --- | --- | --- |
| `class` | `event-live player-initialized` | Added to the container's class list. |
| `data-error` | `false` | Reflects whether the player encountered an error. |
| `data-event-live` | *(empty)* | Present when the event is in the live state. |
| `data-initialized` | `true` | Reflects whether the player has finished initializing. |
| `data-status` | `live` | Reflects the current player status. |

#### CSS classes

| Class | Element | Description |
| --- | --- | --- |
| `player-container` | `<iframe>` | Applied to the YouTube embed iframe. |

---

### Canceled

When the backend returns `status: "canceled"`, the player enters an event canceled state.

#### Container modifications

The following attributes are added to the outer container `<div>` when the canceled state is active:

| Attribute | Value | Description |
| --- | --- | --- |
| `class` | `event-canceled player-initialized` | Added to the container's class list. |
| `data-error` | `false` | Reflects whether the player encountered an error. |
| `data-event-canceled` | *(empty)* | Present when the event is in the canceled state. |
| `data-initialized` | `true` | Reflects whether the player has finished initializing. |
| `data-status` | `canceled` | Reflects the current player status. |

#### CSS classes

All content is injected inside the container and can be targeted with the following classes:

| Class | Element | Description |
| --- | --- | --- |
| `message-container message-event-canceled-container` | `<div>` | Goes directly inside of the container `<div />` to wrap all canceled state content. Note that ALL messages, even if they aren't cancellation messages, will get wrapped inside of the `message-container` `<div>`. `message-event-canceled-container` is unique to cancellation messages, though. |
| `event-canceled-status-balloon` | `<span>` | The "Canceled" status badge at the top. |
| `event-canceled-name` | `<h1>` | The name of the canceled event. |
| `event-canceled-original-schedule` | `<p>` | The originally scheduled time paragraph directly below the event name. Has `padding-bottom: 1rem` applied by default. |
| `event-canceled-original-schedule-label` | `<span>` | The "Originally scheduled for: " label within the schedule paragraph. |
| `event-canceled-original-schedule-time` | `<span>` | The formatted date and time within the schedule paragraph. |
| `event-canceled-reason` | `<div>` | Contains the Markdown-rendered reason for cancellation directly below the originally scheduled time. |

---

### Error

The error state is entered when the player fails to reach the backend or receives an unparseable response.

#### Container modifications

| Attribute | Value | Description |
| --- | --- | --- |
| `class` | `player-error player-uninitialized` | Added to the container's class list. |
| `data-error` | `true` | Reflects whether the player encountered an error. |
| `data-initialized` | `false` | Reflects whether the player has finished initializing. |
| `data-player-error` | *(empty)* | Present when the player has encountered an error. |
| `data-status` | `error` | Reflects the current player status. |

#### CSS classes

| Class | Element | Description |
| --- | --- | --- |
| `error-container` | `<div>` | Wraps the Markdown-rendered error message set by `data-error-message`. |
