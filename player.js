function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

function ordinalSuffix(day) {
    if (day >= 11 && day <= 13) return "th";

    switch (day % 10) {
        case 1: return "st";
        case 2: return "nd";
        case 3: return "rd";
        default: return "th";
    }
}

function formatEventDate(isoString) {
    const date = new Date(isoString);
    const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
    const month = date.toLocaleDateString("en-US", { month: "long" });
    const day = date.getDate();
    const year = date.getFullYear();
    const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    return `${weekday}, ${month} ${day}${ordinalSuffix(day)}, ${year} at ${time}`;
}

function resetContainerState(container) {
    container.classList.remove(
        "event-canceled", "event-offline", "event-live", "event-prewarming",
        "player-initialized", "player-loading", "player-uninitialized"
    );

    delete container.dataset.status;
    container.removeAttribute("data-event-canceled");
    container.removeAttribute("data-event-live");
    container.removeAttribute("data-event-offline");
    container.removeAttribute("data-event-prewarming");
    container.removeAttribute("data-initialized");
    container.removeAttribute("data-player-loading");
}

document.addEventListener("DOMContentLoaded", () => {
    // region Configuration Defaults

    const CONTAINER_ID = "literal-life-church-video-player";
    const DEFAULT_ASPECT_RATIO = "16 / 9";
    const DEFAULT_OFFLINE_MESSAGE = "This event is offline.";
    const DEFAULT_PREWARMING_MESSAGE = "We are getting ready to go live very soon. Please stay tuned.";
    const LOADING_SVG = `<svg width="80" height="80" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg" stroke="currentColor"><g fill="none" fill-rule="evenodd" stroke-width="2"><circle cx="22" cy="22" r="1"><animate attributeName="r" begin="0s" dur="1.8s" values="1; 20" calcMode="spline" keyTimes="0; 1" keySplines="0.165, 0.84, 0.44, 1" repeatCount="indefinite"/><animate attributeName="stroke-opacity" begin="0s" dur="1.8s" values="1; 0" calcMode="spline" keyTimes="0; 1" keySplines="0.3, 0.61, 0.355, 1" repeatCount="indefinite"/></circle><circle cx="22" cy="22" r="1"><animate attributeName="r" begin="-0.9s" dur="1.8s" values="1; 20" calcMode="spline" keyTimes="0; 1" keySplines="0.165, 0.84, 0.44, 1" repeatCount="indefinite"/><animate attributeName="stroke-opacity" begin="-0.9s" dur="1.8s" values="1; 0" calcMode="spline" keyTimes="0; 1" keySplines="0.3, 0.61, 0.355, 1" repeatCount="indefinite"/></circle></g></svg>`;
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

    // region Loading State

    container.classList.add("player-loading", "player-uninitialized");
    container.dataset.initialized = "false";
    container.dataset.status = "loading";
    container.setAttribute("data-player-loading", "");

    const loadingContainer = document.createElement("div");
    loadingContainer.className = "loading-container";
    loadingContainer.innerHTML = LOADING_SVG;

    container.innerHTML = "";
    container.appendChild(loadingContainer);

    // endregion

    fetch(apiEndpoint)
        .then((response) => response.json())
        .then(async (data) => {
            if (data.status === "offline") {
                await loadScript(MARKED_URL);
                resetContainerState(container);

                container.classList.add("event-offline", "player-initialized");
                container.dataset.initialized = "true";
                container.dataset.status = "offline";
                container.setAttribute("data-event-offline", "");

                const messageContainer = document.createElement("div");
                messageContainer.className = "message-container message-event-offline-container";
                messageContainer.innerHTML = marked.parse(offlineMessage);

                container.innerHTML = "";
                container.appendChild(messageContainer);
            } else if (data.status === "prewarming") {
                await loadScript(MARKED_URL);
                resetContainerState(container);

                container.classList.add("player-initialized", "event-prewarming");
                container.dataset.initialized = "true";
                container.dataset.status = "prewarming";
                container.setAttribute("data-event-prewarming", "");

                const messageContainer = document.createElement("div");
                messageContainer.className = "message-container message-event-prewarming-container";
                messageContainer.innerHTML = marked.parse(prewarmingMessage);

                container.innerHTML = "";
                container.appendChild(messageContainer);
            } else if (data.status === "canceled") {
                await loadScript(MARKED_URL);
                resetContainerState(container);

                container.classList.add("event-canceled", "player-initialized");
                container.dataset.initialized = "true";
                container.dataset.status = "canceled";
                container.setAttribute("data-event-canceled", "");

                const messageContainer = document.createElement("div");
                messageContainer.className = "message-container message-event-canceled-container";
                messageContainer.style.textAlign = "left";

                const balloon = document.createElement("span");
                balloon.className = "event-canceled-status-balloon";
                balloon.style.backgroundColor = "#CCCCCC";
                balloon.style.borderRadius = "0.365rem";
                balloon.style.fontSize = "0.75rem";
                balloon.style.padding = "0.2rem 0.4rem";
                balloon.textContent = "Canceled";

                const title = document.createElement("h1");
                title.className = "event-canceled-name";
                title.style.margin = "0.5rem 0";
                title.textContent = data.cancellation.name;

                const schedule = document.createElement("p");
                schedule.className = "event-canceled-original-schedule";
                schedule.style.margin = "0";
                schedule.style.paddingBottom = "1rem";

                const scheduleLabel = document.createElement("span");
                scheduleLabel.className = "event-canceled-original-schedule-label";
                scheduleLabel.textContent = "Originally scheduled for: ";

                const scheduleTime = document.createElement("span");
                scheduleTime.className = "event-canceled-original-schedule-time";
                scheduleTime.textContent = formatEventDate(data.cancellation.timeOfEvent);

                schedule.appendChild(scheduleLabel);
                schedule.appendChild(scheduleTime);

                const reason = document.createElement("div");
                reason.className = "event-canceled-reason";
                reason.innerHTML = marked.parse(data.cancellation.reason);

                messageContainer.appendChild(balloon);
                messageContainer.appendChild(title);
                messageContainer.appendChild(schedule);
                messageContainer.appendChild(reason);

                container.innerHTML = "";
                container.appendChild(messageContainer);
            } else if (data.status === "live") {
                resetContainerState(container);

                container.classList.add("event-live", "player-initialized");
                container.dataset.initialized = "true";
                container.dataset.status = "live";
                container.setAttribute("data-event-live", "");

                const iframe = document.createElement("iframe");
                iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
                iframe.allowFullscreen = true;
                iframe.className = "player-container";
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
