# Literal Life Church Video Player

Frontend video player for live streaming events that hooks into our [Media API](https://github.com/literal-life-church/media-api) to display a video player container holding the live event, related announcements, schedules, and deliver push notifications.

## For Developers

Here is how you can get this project up and running on your machine.

  1. Install the latest [Node.js LTS](https://nodejs.org/en/download) version
  2. Run this project on your machine with these commands:

      ```sh
      npm i
      npm run dev
      ```

  3. Open [http://localhost](http://localhost) in your browser.

      > **Note:** The demo page in `index.html` is pre-configured to point at an example Media API instance, which does not exist, but proves how you could use it against your own instance. To test against a different backend, update the `data-backend-host` attribute on the container `div` in that file.

## Using on a Website

If you want to embed this player onto your webpage, follow these steps. Keep in mind that this isn't a standalone application, and requires an instance of the [Media API](https://github.com/literal-life-church/media-api) to fetch relevant data.

> [!IMPORTANT]
> You can see a complete implementation inside of the [index.html](./index.html) sample file.

  1. Add the following `<script>` tag to your page, ideally just before `</body>`:

      ```html
      <script src="https://cdn.jsdelivr.net/gh/literal-life-church/video-player@XXXX.YY.ZZ/player.min.js"></script>
      ```

     Where `XXXX.YY.ZZ` is replaced with the most recent release version: ![GitHub Release](https://img.shields.io/github/v/release/literal-life-church/video-player?label=Latest%20Release&sort=date)

     To enable proper Push Notification support for all devices, you will need a few additional dependencies as documented in the [Push Notifications](#push-notifications) section. If you don't plan on supporting push notifications, you can omit those steps.

  2. You can also add the optional stylesheet in your `<head />` section:

      ```html
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/literal-life-church/video-player@XXXX.YY.ZZ/styles.min.css" />
      ```

  3. Place a `<div>` wherever you want the player to appear. Here are a few of the options you can configure:

      ```html
      <div
          id="literal-life-church-video-player"
          data-backend-host="api.example.com"
          data-error-message="Something went wrong. Please try again later."
          data-offline-message="We are currently **offline** right now."
          data-prewarming-message="We will be going live *very* soon."
          data-push-notification-app-id="00000000-0000-0000-0000-000000000000"
          data-push-notification-safari-web-id="web.onesignal.auto.00000000-0000-0000-0000-000000000000"
          data-push-notification-scope="/"
          data-push-notification-service-worker-path="/service-worker.js">
      </div>
      ```

  4. Populate each of the `data-` attributes as desired from this table:

| Attribute | Required | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `id` | Yes | `string` | — | Must be exactly `literal-life-church-video-player`. The script will not initialize against any other ID. |
| `data-backend-host` | Yes | `string` | — | Hostname of your [Media API](https://github.com/literal-life-church/media-api) instance. No protocol, no trailing path (e.g. `api.example.com`). |
| `data-error-message` | No | `string` (Markdown) | `We were not able to load any information about this event. Please contact the site owner.` | Message displayed when the player fails to load event data. Supports Markdown. Multi-line values are supported via [multi-line HTML attributes](https://stackoverflow.com/a/38880984). |
| `data-offline-message` | No | `string` (Markdown) | `This event is offline.` | Message displayed when the event is offline. Supports Markdown. Multi-line values are supported via [multi-line HTML attributes](https://stackoverflow.com/a/38880984). |
| `data-prewarming-message` | No | `string` (Markdown) | `We are getting ready to go live very soon. Please stay tuned.` | Message displayed when the event is prewarming (created on YouTube but not yet broadcasting). Supports Markdown. Multi-line values are supported via [multi-line HTML attributes](https://stackoverflow.com/a/38880984). |
| `data-push-notification-app-id` | No* | `string` | — | OneSignal application ID. **Required to enable push notifications alongside `data-push-notification-safari-web-id`.** <br><br> (*) If absent (or if loading the OneSignal SDK fails), the entire push notification experience is silently disabled. |
| `data-push-notification-safari-web-id` | No* | `string` | — | OneSignal Safari web ID. **Required to enable push notifications alongside `data-push-notification-app-id`.** <br><br> (*) If absent (or if loading the OneSignal SDK fails), the entire push notification experience is silently disabled. |
| `data-push-notification-new-opt-in-button-label` | No | `string` | `Get Notifications From Us` | Label on the button which initiates the push notification subscription opt-in flow shown to users who have not yet subscribed. |
| `data-push-notification-update-opt-in-button-label` | No | `string` | `Update Notification Preferences` | Label on the button which updates the user's push notification subscription preferences for users who are already subscribed. |
| `data-push-notification-new-opt-in-prompt-message` | No | `string` | `Get notified whenever we go live or announce a change to our schedule.` | Message shown to new subscribers while opting into push notifications within the OneSignal slidedown. |
| `data-push-notification-new-opt-in-accept-button-label` | No | `string` | `Subscribe` | Accept button label in the new-subscriber slidedown. |
| `data-push-notification-new-opt-in-cancel-button-label` | No | `string` | `Cancel` | Cancel button label in the new-subscriber slidedown. |
| `data-push-notification-update-opt-in-prompt-message` | No | `string` | `Update what types of notifications we're sending you.` | Message shown to existing subscribers while updating push notification preferences within the OneSignal slidedown. |
| `data-push-notification-update-opt-in-accept-button-label` | No | `string` | `Apply Changes` | Accept button label in the existing-subscriber slidedown. |
| `data-push-notification-update-opt-in-cancel-button-label` | No | `string` | `Cancel` | Cancel button label in the existing-subscriber slidedown. |
| `data-push-notification-segment-go-live-label` | No | `string` | `Go-Live` | Display label for the Go-Live notification segment shown in the subscription slidedown. |
| `data-push-notification-segment-schedule-updates-label` | No | `string` | `Schedule Updates` | Display label for the Schedule Updates notification segment shown in the subscription slidedown. |
| `data-push-notification-welcome-notification` | No | `boolean` | `true` | Set to `"false"` to suppress the welcome notification sent after a new subscriber opts in. Setting to `"true"` or simply having this attribute present without a value will enable this feature. |
| `data-push-notification-welcome-notification-title` | No | `string` | `Welcome` | Title of the welcome notification. |
| `data-push-notification-welcome-notification-message` | No | `string` | `You will now get updates from us when there are relevant updates to share.` | Body of the welcome notification. |
| `data-push-notification-persist` | No | `boolean` | `true` | Set to `"false"` to dismiss notifications automatically rather than keeping them until clicked. Setting to `"true"` or simply having this attribute present without a value will enable this feature. |
| `data-push-notification-scope` | No | `string` | `/live-streaming` | Service worker scope passed to OneSignal. See [Push Notifications](#push-notifications). |
| `data-push-notification-service-worker-path` | No | `string` | `OneSignalSDKWorker.js` | Path to your OneSignal service worker file. See [Push Notifications](#push-notifications). |

## Player States

The player can fall into one of 6 possible states as detailed in the subsequent sections. In each situation, the player modifies the container's classes and `data-` attributes and, in some cases, injects structured content so you have fine-grained styling control and better semantic meaning for this content.

Every state transition also triggers a CSS `player-fade-in` animation on the newly inserted content. The animation is defined in `styles.css`, which you can include as-is or use as a reference for your own styles.

You can observe a few examples of how to use these classes inside of the `styles.css` example file.

### Loading

The loading state is active immediately on page load while the player waits for the backend to respond.

#### Loading Container Modifications

| Attribute | Value | Description |
| --- | --- | --- |
| `class` | `player-loading player-uninitialized` | Added to the container's class list. |
| `data-error` | `false` | Reflects whether the player encountered an error. |
| `data-initialized` | `false` | Reflects whether the player has finished initializing. |
| `data-player-loading` | *(empty)* | Present while the player is loading. |
| `data-status` | `loading` | Reflects the current player status. |

#### Loading CSS Classes

| Class | Element | Description |
| --- | --- | --- |
| `loading-container` | `<div>` | Wraps the animated puff spinner shown while the player loads. |

---

### Offline

When the backend returns `status: "offline"`, the player enters the offline state.

#### Offline Container Modifications

| Attribute | Value | Description |
| --- | --- | --- |
| `class` | `event-offline player-initialized` | Added to the container's class list. |
| `data-error` | `false` | Reflects whether the player encountered an error. |
| `data-event-offline` | *(empty)* | Present when the event is in the offline state. |
| `data-initialized` | `true` | Reflects whether the player has finished initializing. |
| `data-push-notification-subscription-status` | `new` \| `existing` \| `disabled` | Reflects the user's push notification subscription status. See [Push Notifications](#push-notifications). |
| `data-status` | `offline` | Reflects the current player status. |

#### Offline CSS Classes

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
| `data-push-notification-subscription-status` | `new` \| `existing` \| `disabled` | Reflects the user's push notification subscription status. See [Push Notifications](#push-notifications). |
| `data-status` | `prewarming` | Reflects the current player status. |

#### CSS classes

| Class | Element | Description |
| --- | --- | --- |
| `message-container message-event-prewarming-container` | `<div>` | Goes directly inside the container to wrap the prewarming message content. `message-container` is shared across all message states; `message-event-prewarming-container` is unique to the prewarming state. |

---

### Live

When the backend returns `status: "live"`, the player enters the live state and embeds the YouTube player.

#### Live Container Modifications

| Attribute | Value | Description |
| --- | --- | --- |
| `class` | `event-live player-initialized` | Added to the container's class list. |
| `data-error` | `false` | Reflects whether the player encountered an error. |
| `data-event-live` | *(empty)* | Present when the event is in the live state. |
| `data-initialized` | `true` | Reflects whether the player has finished initializing. |
| `data-status` | `live` | Reflects the current player status. |

#### Live CSS Classes

| Class | Element | Description |
| --- | --- | --- |
| `player-container` | `<iframe>` | Applied to the YouTube embed iframe. |

---

### Canceled

When the backend returns `status: "canceled"`, the player enters an event canceled state.

#### Canceled Container Modifications

The following attributes are added to the outer container `<div>` when the canceled state is active:

| Attribute | Value | Description |
| --- | --- | --- |
| `class` | `event-canceled player-initialized` | Added to the container's class list. |
| `data-error` | `false` | Reflects whether the player encountered an error. |
| `data-event-canceled` | *(empty)* | Present when the event is in the canceled state. |
| `data-initialized` | `true` | Reflects whether the player has finished initializing. |
| `data-push-notification-subscription-status` | `new` \| `existing` \| `disabled` | Reflects the user's push notification subscription status. See [Push Notifications](#push-notifications). |
| `data-status` | `canceled` | Reflects the current player status. |

#### Canceled CSS Classes

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

The error state is entered when the player fails to reach the backend or receives a response to cannot parse.

#### Error Container Modifications

| Attribute | Value | Description |
| --- | --- | --- |
| `class` | `player-error player-uninitialized` | Added to the container's class list. |
| `data-error` | `true` | Reflects whether the player encountered an error. |
| `data-initialized` | `false` | Reflects whether the player has finished initializing. |
| `data-player-error` | *(empty)* | Present when the player has encountered an error. |
| `data-status` | `error` | Reflects the current player status. |

#### Error CSS Classes

| Class | Element | Description |
| --- | --- | --- |
| `error-container` | `<div>` | Wraps the Markdown-rendered error message set by `data-error-message`. |

---

### Push Notifications

Push Notifications use [OneSignal](https://www.onesignal.com/) as the backing service. As such, there are a few things you need to do in addition to installing this player to ensure your frontend is ready to process requests.

When `data-push-notification-app-id` and `data-push-notification-safari-web-id` are both set and the OneSignal SDK loads successfully, an opt-in button is appended as the last child of the message container in the `offline`, `prewarming`, and `canceled` states. The button is intentionally absent in the `live` state (the event is already happening) and the `error` state.

#### Subscription status

The `data-push-notification-subscription-status` attribute is set on the root container element:

| Value | Meaning |
| --- | --- |
| `new` | The user has not yet subscribed to push notifications. The **New Opt-in Button** is shown. |
| `existing` | The user is already subscribed. The **Update Opt-in Preferences Button** is shown. |
| `disabled` | Push notifications are disabled — either `data-push-notification-app-id` or `data-push-notification-safari-web-id` is absent or the OneSignal SDK failed to load (e.g. blocked by an ad blocker). |

#### Subscription State CSS classes

| Class | Element | Description |
| --- | --- | --- |
| `push-notification-opt-in` | `<button>` | Present on all opt-in buttons regardless of subscription status. |
| `new-subscriber` | `<button>` | Added when the user has not yet subscribed. Shown alongside `push-notification-opt-in`. |
| `existing-subscriber` | `<button>` | Added when the user is already subscribed. Shown alongside `push-notification-opt-in`. |

#### Third-party Dependencies

For push notifications to work across all platforms, you need the following pieces to be in place:

1. OneSignal provides a worker script which runs in the background of a user's browser to collect push notification as they arrive. Per modern browser security policies, this worker script **must** be served on your domain exactly as the user visits it. For example, if a user visits you at `https://www.example.com/`, then the service worker must be served from that domain, not `https://example.com/` or `http://www.example.com/`. Everything must match. Here is [OneSignal's guide on setting that up](https://documentation.onesignal.com/docs/en/web-sdk-setup).
2. For iOS and iPadOS users running on Safari, the browser will not deliver any push notifications until the site is installed as a progressive web app (PWA). This requirement has a further step where you must host a `manifest.json` file to declare your site as PWA-capable. Here is [OneSignal's guide on setting that up](https://documentation.onesignal.com/docs/en/web-push-for-ios).

There is [a shimming layer project on GitHub](https://github.com/literal-life-church/push-notification-shimming-layer) that can proxy calls to your site via Cloudflare and host all of this for you automatically. All of the information you need to modify and host this project is documented there. This project is recommended for websites that do not allow you to host your own script or manifest files.

In all, once you have created the service worker script and manifest file, you'll want to add the manifest to the `<head />` section of every page:

```html
<link rel="manifest" href="/manifest.json" />
```

and this can be added to your player `<div />` tag:

```html
<div
    id="literal-life-church-video-player"
    data-push-notification-service-worker-path="/path/to/your/service-worker.js">
</div>
```

#### Service Worker Scope

Whenever a service worker script is registered by the browser, it is assigned a scope, a set of pages that it is allowed to control. [OneSignal has documentation the explains what this is and how they recommend using it](https://documentation.onesignal.com/docs/en/onesignal-service-worker) with their service worker. They document what they consider to be [a typical site setup](https://documentation.onesignal.com/docs/en/onesignal-service-worker#typical-site-setup), although you are free to adjust as required.
