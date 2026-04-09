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
    const LOGGING_TAG = "[Literal Life Church Video Player]";

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

    // endregion

    fetch(apiEndpoint)
        .then((response) => response.json())
        .then((data) => console.log(data))
        .catch((error) => console.error(error));
});
