# Literal Life Church Video Player

Frontend video player for live streaming events that hooks into our [Media API](https://github.com/literal-life-church/media-api) to display a video player container the live event, related announcements, schedules, and deliver push notifications.

## For Developers

Here is how you can get this project up and running on your machine.

  1. Install the latest [Node.js LTS](https://nodejs.org/en/download) version
  2. Run this project on your machine with 

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
      ```

     Where `XXXX.YY.ZZ` is replaced with the most recent release version: ![GitHub Release](https://img.shields.io/github/v/release/literal-life-church/video-player?label=Latest%20Release&sort=date)

  2. Place a `<div>` wherever you want the player to appear:

      ```html
      <div
          id="literal-life-church-video-player"
          data-aspect-ratio="16 / 9"
          data-backend-host="api.example.com">
      </div>
      ```

  3. Populate each of the `data-` attributes as desired from this table:

| Attribute | Required | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `id` | Yes | `string` | — | Must be exactly `literal-life-church-video-player`. The script will not initialize against any other ID. |
| `data-aspect-ratio` | No | `string` | `16 / 9` | Any value supported by the CSS [`aspect-ratio`](https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio) property. Sets the aspect ratio of this container. |
| `data-backend-host` | Yes | `string` | — | Hostname of your [Media API](https://github.com/literal-life-church/media-api) instance. No protocol, no trailing path (e.g. `api.example.com`). |
