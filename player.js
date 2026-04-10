function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    // region Configuration Defaults

    const CONTAINER_ID = "literal-life-church-video-player";
    const DEFAULT_ASPECT_RATIO = "16 / 9";
    const DEFAULT_OFFLINE_MESSAGE = "This event is offline.";
    const DEFAULT_PREWARMING_MESSAGE = "We are getting ready to go live very soon. Please stay tuned.";
    const LOGGING_TAG = "[Literal Life Church Video Player]";
    const MARKED_URL = "https://cdn.jsdelivr.net/npm/marked@18.0.0/lib/marked.umd.min.js";

    // endregion

    // region Required Initialization

    const container = document.getElementById(CONTAINER_ID);

    if (!container) {
        console.error(`${LOGGING_TAG} Initialization failed: no element with id="${CONTAINER_ID}" was found on the page.`);
        return;
    }

    const backendHost = container.dataset.backendHost?.trim();

    if (!backendHost) {
        console.error(`${LOGGING_TAG} Initialization failed: the element with id="${CONTAINER_ID}" is missing a required data-backend-host attribute.`);
        return;
    }

    const apiEndpoint = `https://${backendHost}/live-streaming`;

    // endregion

    // region Optional Configuration

    const aspectRatio = container.dataset.aspectRatio || DEFAULT_ASPECT_RATIO;
    container.style.aspectRatio = aspectRatio;

    const offlineMessage = container.dataset.offlineMessage?.trim() || DEFAULT_OFFLINE_MESSAGE;
    const prewarmingMessage = container.dataset.prewarmingMessage?.trim() || DEFAULT_PREWARMING_MESSAGE;

    // endregion

    fetch(apiEndpoint)
        .then((response) => response.json())
        .then(async (data) => {
            if (data.status === "offline") {
                await loadScript(MARKED_URL);
                container.innerHTML = `<div>${marked.parse(offlineMessage)}</div>`;
            } else if (data.status === "prewarming") {
                await loadScript(MARKED_URL);
                container.innerHTML = `<div>${marked.parse(prewarmingMessage)}</div>`;
            } else if (data.status === "live") {
                const iframe = document.createElement("iframe");
                iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
                iframe.allowFullscreen = true;
                iframe.setAttribute("frameborder", "0");
                iframe.src = data.event.embedUrl;
                iframe.style.border = "0";
                iframe.style.height = "100%";
                iframe.style.width = "100%";
                iframe.title = data.event.name;

                container.innerHTML = "";
                container.appendChild(iframe);
            }
        })
        .catch((error) => console.error(error));
});
