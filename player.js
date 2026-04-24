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

    delete container.dataset.error;
    delete container.dataset.eventCanceled;
    delete container.dataset.eventLive;
    delete container.dataset.eventOffline;
    delete container.dataset.eventPrewarming;
    delete container.dataset.initialized;
    delete container.dataset.playerError;
    delete container.dataset.playerLoading;
    delete container.dataset.status;
}

document.addEventListener("DOMContentLoaded", () => {
    // region Configuration Defaults

    const CONTAINER_ID = "literal-life-church-video-player";
    const DEFAULT_ERROR_MESSAGE = "We were not able to load any information about this event. Please contact the site owner.";
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

    const errorMessage = container.dataset.errorMessage?.trim() || DEFAULT_ERROR_MESSAGE;
    const offlineMessage = container.dataset.offlineMessage?.trim() || DEFAULT_OFFLINE_MESSAGE;
    const prewarmingMessage = container.dataset.prewarmingMessage?.trim() || DEFAULT_PREWARMING_MESSAGE;

    // endregion

    // region Loading State

    container.classList.add("player-loading", "player-uninitialized");
    container.dataset.error = "false";
    container.dataset.initialized = "false";
    container.dataset.playerLoading = "";
    container.dataset.status = "loading";

    const loadingContainer = document.createElement("div");
    loadingContainer.className = "loading-container";
    loadingContainer.innerHTML = LOADING_SVG;

    container.innerHTML = "";
    container.appendChild(loadingContainer);

    // endregion

    fetch(apiEndpoint)
        .then((response) => response.json())
        .then(async (data) => {
            resetContainerState(container);

            container.classList.add("player-initialized");
            container.dataset.error = "false";
            container.dataset.initialized = "true";

            if (data.status === "offline") {
                await loadScript(MARKED_URL);

                container.classList.add("event-offline");
                container.dataset.eventOffline = "";
                container.dataset.status = "offline";

                const messageContainer = document.createElement("div");
                messageContainer.className = "message-container message-event-offline-container";
                messageContainer.innerHTML = marked.parse(offlineMessage);

                container.innerHTML = "";
                container.appendChild(messageContainer);
            } else if (data.status === "prewarming") {
                await loadScript(MARKED_URL);

                container.classList.add("event-prewarming");
                container.dataset.eventPrewarming = "";
                container.dataset.status = "prewarming";

                const messageContainer = document.createElement("div");
                messageContainer.className = "message-container message-event-prewarming-container";
                messageContainer.innerHTML = marked.parse(prewarmingMessage);

                container.innerHTML = "";
                container.appendChild(messageContainer);
            } else if (data.status === "canceled") {
                await loadScript(MARKED_URL);

                container.classList.add("event-canceled");
                container.dataset.eventCanceled = "";
                container.dataset.status = "canceled";

                const messageContainer = document.createElement("div");
                messageContainer.className = "message-container message-event-canceled-container";

                const balloon = document.createElement("span");
                balloon.className = "event-canceled-status-balloon";
                balloon.textContent = "Canceled";

                const title = document.createElement("h1");
                title.className = "event-canceled-name";
                title.textContent = data.cancellation.name;

                const schedule = document.createElement("p");
                schedule.className = "event-canceled-original-schedule";

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

                container.classList.add("event-live");
                container.dataset.eventLive = "";
                container.dataset.status = "live";

                const iframe = document.createElement("iframe");
                iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
                iframe.allowFullscreen = true;
                iframe.className = "player-container";
                iframe.setAttribute("frameborder", "0");
                iframe.src = data.event.embedUrl;
                iframe.title = data.event.name;

                container.innerHTML = "";
                container.appendChild(iframe);
            }
        })
        .catch(async (error) => {
            console.error(error);

            await loadScript(MARKED_URL);
            resetContainerState(container);

            container.classList.add("player-error", "player-uninitialized");
            container.dataset.error = "true";
            container.dataset.initialized = "false";
            container.dataset.playerError = "";
            container.dataset.status = "error";

            const errorContainer = document.createElement("div");
            errorContainer.className = "error-container";
            errorContainer.innerHTML = marked.parse(errorMessage);

            container.innerHTML = "";
            container.appendChild(errorContainer);
        });
});
