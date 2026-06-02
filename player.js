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
    delete container.dataset.pushNotificationSubscriptionStatus;
    delete container.dataset.status;
}

document.addEventListener("DOMContentLoaded", () => {
    // region Configuration Defaults

    const CONTAINER_ID = "literal-life-church-video-player";

    // Element dataset defaults
    const DEFAULT_ERROR_MESSAGE = "We were not able to load any information about this event. Please contact the site owner.";
    const DEFAULT_OFFLINE_MESSAGE = "This event is offline.";
    const DEFAULT_PREWARMING_MESSAGE = "We are getting ready to go live very soon. Please stay tuned.";
    const DEFAULT_PUSH_NOTIFICATION_NEW_OPT_IN_BUTTON_LABEL = "Get Notified When We Go Live";
    const DEFAULT_PUSH_NOTIFICATION_NEW_OPT_IN_PROMPT_MESSAGE = "Get notified whenever we go live or announce a change to our schedule.";
    const DEFAULT_PUSH_NOTIFICATION_NEW_OPT_IN_ACCEPT_BUTTON_LABEL = "Subscribe";
    const DEFAULT_PUSH_NOTIFICATION_NEW_OPT_IN_CANCEL_BUTTON_LABEL = "Cancel";
    const DEFAULT_PUSH_NOTIFICATION_UPDATE_OPT_IN_BUTTON_LABEL = "Update Notification Preferences";
    const DEFAULT_PUSH_NOTIFICATION_UPDATE_OPT_IN_PROMPT_MESSAGE = "Update what types of notifications we're sending you.";
    const DEFAULT_PUSH_NOTIFICATION_UPDATE_OPT_IN_ACCEPT_BUTTON_LABEL = "Apply Changes";
    const DEFAULT_PUSH_NOTIFICATION_UPDATE_OPT_IN_CANCEL_BUTTON_LABEL = "Cancel";
    const DEFAULT_PUSH_NOTIFICATION_SEGMENT_GO_LIVE_LABEL = "Go-Live";
    const DEFAULT_PUSH_NOTIFICATION_SEGMENT_SCHEDULE_UPDATES_LABEL = "Schedule Updates";
    const DEFAULT_PUSH_NOTIFICATION_WELCOME_NOTIFICATION_TITLE = "Welcome";
    const DEFAULT_PUSH_NOTIFICATION_WELCOME_NOTIFICATION_MESSAGE = "You will now get updates from us when there are relevant updates to share.";
    const DEFAULT_PUSH_NOTIFICATION_SCOPE = "/live-streaming";
    const DEFAULT_PUSH_NOTIFICATION_SERVICE_WORKER_PATH = "OneSignalSDKWorker.js";

    // OneSignal configuration defaults
    const AUTO_PROMPT = false;
    const AUTO_RESUBSCRIBE = true;
    const ENABLE_NOTIFY_BUTTON = false;
    const GO_LIVE_CATEGORY_TAG_NAME = "go_live";
    const PROMPT_TYPE = "category";
    const SCHEDULE_UPDATES_CATEGORY_TAG_NAME = "schedule_updates";

    // SSE event names
    const SSE_CLOSE_EVENT_NAME = "event.close_connection";
    const SSE_STATE_TRANSITION_EVENT_NAME = "event.state_transition";
    
    // Third-party script URLs
    const MARKED_URL = "https://cdn.jsdelivr.net/npm/marked@18.0.0/lib/marked.umd.min.js";
    const ONESIGNAL_URL = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";

    // Baked-in images
    const LOADING_SVG = `<svg width="80" height="80" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg" stroke="currentColor"><g fill="none" fill-rule="evenodd" stroke-width="2"><circle cx="22" cy="22" r="1"><animate attributeName="r" begin="0s" dur="1.8s" values="1; 20" calcMode="spline" keyTimes="0; 1" keySplines="0.165, 0.84, 0.44, 1" repeatCount="indefinite"/><animate attributeName="stroke-opacity" begin="0s" dur="1.8s" values="1; 0" calcMode="spline" keyTimes="0; 1" keySplines="0.3, 0.61, 0.355, 1" repeatCount="indefinite"/></circle><circle cx="22" cy="22" r="1"><animate attributeName="r" begin="-0.9s" dur="1.8s" values="1; 20" calcMode="spline" keyTimes="0; 1" keySplines="0.165, 0.84, 0.44, 1" repeatCount="indefinite"/><animate attributeName="stroke-opacity" begin="-0.9s" dur="1.8s" values="1; 0" calcMode="spline" keyTimes="0; 1" keySplines="0.3, 0.61, 0.355, 1" repeatCount="indefinite"/></circle></g></svg>`;

    // Other
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
    const sseEndpoint = `https://${backendHost}/live-streaming/subscribe`;

    const pushNotificationAppId = container.dataset.pushNotificationAppId?.trim();
    const pushNotificationSafariWebId = container.dataset.pushNotificationSafariWebId?.trim() || "";

    if (!pushNotificationAppId || !pushNotificationSafariWebId) {
        console.error(`${LOGGING_TAG} Push notifications will be disabled: missing required data-push-notification-app-id and data-push-notification-safari-web-id attributes on the element with id="${CONTAINER_ID}".`);
    }

    let pushNotificationsEnabled = !!pushNotificationAppId;

    // endregion

    // region Optional Configuration

    const errorMessage = container.dataset.errorMessage?.trim() || DEFAULT_ERROR_MESSAGE;
    const offlineMessage = container.dataset.offlineMessage?.trim() || DEFAULT_OFFLINE_MESSAGE;
    const prewarmingMessage = container.dataset.prewarmingMessage?.trim() || DEFAULT_PREWARMING_MESSAGE;
    const pushNotificationNewOptInButtonLabel = container.dataset.pushNotificationNewOptInButtonLabel?.trim() || DEFAULT_PUSH_NOTIFICATION_NEW_OPT_IN_BUTTON_LABEL;
    const pushNotificationUpdateOptInButtonLabel = container.dataset.pushNotificationUpdateOptInButtonLabel?.trim() || DEFAULT_PUSH_NOTIFICATION_UPDATE_OPT_IN_BUTTON_LABEL;
    const pushNotificationNewOptInPromptMessage = container.dataset.pushNotificationNewOptInPromptMessage?.trim() || DEFAULT_PUSH_NOTIFICATION_NEW_OPT_IN_PROMPT_MESSAGE;
    const pushNotificationNewOptInAcceptButtonLabel = container.dataset.pushNotificationNewOptInAcceptButtonLabel?.trim() || DEFAULT_PUSH_NOTIFICATION_NEW_OPT_IN_ACCEPT_BUTTON_LABEL;
    const pushNotificationNewOptInCancelButtonLabel = container.dataset.pushNotificationNewOptInCancelButtonLabel?.trim() || DEFAULT_PUSH_NOTIFICATION_NEW_OPT_IN_CANCEL_BUTTON_LABEL;
    const pushNotificationUpdateOptInPromptMessage = container.dataset.pushNotificationUpdateOptInPromptMessage?.trim() || DEFAULT_PUSH_NOTIFICATION_UPDATE_OPT_IN_PROMPT_MESSAGE;
    const pushNotificationUpdateOptInAcceptButtonLabel = container.dataset.pushNotificationUpdateOptInAcceptButtonLabel?.trim() || DEFAULT_PUSH_NOTIFICATION_UPDATE_OPT_IN_ACCEPT_BUTTON_LABEL;
    const pushNotificationUpdateOptInCancelButtonLabel = container.dataset.pushNotificationUpdateOptInCancelButtonLabel?.trim() || DEFAULT_PUSH_NOTIFICATION_UPDATE_OPT_IN_CANCEL_BUTTON_LABEL;
    const pushNotificationSegmentGoLiveLabel = container.dataset.pushNotificationSegmentGoLiveLabel?.trim() || DEFAULT_PUSH_NOTIFICATION_SEGMENT_GO_LIVE_LABEL;
    const pushNotificationSegmentScheduleUpdatesLabel = container.dataset.pushNotificationSegmentScheduleUpdatesLabel?.trim() || DEFAULT_PUSH_NOTIFICATION_SEGMENT_SCHEDULE_UPDATES_LABEL;
    const pushNotificationWelcomeNotification = container.dataset.pushNotificationWelcomeNotification !== "false";
    const pushNotificationWelcomeNotificationTitle = container.dataset.pushNotificationWelcomeNotificationTitle?.trim() || DEFAULT_PUSH_NOTIFICATION_WELCOME_NOTIFICATION_TITLE;
    const pushNotificationWelcomeNotificationMessage = container.dataset.pushNotificationWelcomeNotificationMessage?.trim() || DEFAULT_PUSH_NOTIFICATION_WELCOME_NOTIFICATION_MESSAGE;
    const pushNotificationPersist = container.dataset.pushNotificationPersist !== "false";
    const pushNotificationScope = container.dataset.pushNotificationScope?.trim() || DEFAULT_PUSH_NOTIFICATION_SCOPE;
    const pushNotificationServiceWorkerPath = container.dataset.pushNotificationServiceWorkerPath?.trim() || DEFAULT_PUSH_NOTIFICATION_SERVICE_WORKER_PATH;

    // endregion

    // region State Rendering

    const appendPushButton = (messageContainer) => {
        if (pushNotificationsEnabled) {
            const isSubscribed = window.OneSignal?.User?.PushSubscription?.optedIn ?? false;
            container.dataset.pushNotificationSubscriptionStatus = isSubscribed ? "existing" : "new";

            const pushButton = document.createElement("button");
            pushButton.className = `push-notification-opt-in ${isSubscribed ? "existing-subscriber" : "new-subscriber"}`;
            pushButton.textContent = isSubscribed ? pushNotificationUpdateOptInButtonLabel : pushNotificationNewOptInButtonLabel;
            pushButton.addEventListener("click", () => {
                window.OneSignal.Slidedown.promptPushCategories({ force: true });
            });

            messageContainer.appendChild(pushButton);
        } else {
            container.dataset.pushNotificationSubscriptionStatus = "disabled";
        }
    };

    const renderState = async (data) => {
        resetContainerState(container);

        container.classList.add("player-initialized");
        container.dataset.error = "false";
        container.dataset.initialized = "true";

        if (data.status === "offline") {
            if (!window.marked) await loadScript(MARKED_URL);

            container.classList.add("event-offline");
            container.dataset.eventOffline = "";
            container.dataset.status = "offline";

            const messageContainer = document.createElement("div");
            messageContainer.className = "message-container message-event-offline-container";
            messageContainer.innerHTML = marked.parse(offlineMessage);

            container.innerHTML = "";
            container.appendChild(messageContainer);

            appendPushButton(messageContainer);
        } else if (data.status === "prewarming") {
            if (!window.marked) await loadScript(MARKED_URL);

            container.classList.add("event-prewarming");
            container.dataset.eventPrewarming = "";
            container.dataset.status = "prewarming";

            const messageContainer = document.createElement("div");
            messageContainer.className = "message-container message-event-prewarming-container";
            messageContainer.innerHTML = marked.parse(prewarmingMessage);

            container.innerHTML = "";
            container.appendChild(messageContainer);

            appendPushButton(messageContainer);
        } else if (data.status === "canceled") {
            if (!window.marked) await loadScript(MARKED_URL);

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

            appendPushButton(messageContainer);
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
    };

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
            try {
                if (pushNotificationsEnabled) {
                    await loadScript(ONESIGNAL_URL);

                    await new Promise((resolve) => {
                        window.OneSignalDeferred = window.OneSignalDeferred || [];
                        window.OneSignalDeferred.push(async (OneSignal) => {
                            await OneSignal.init({
                                appId: pushNotificationAppId,
                                safari_web_id: pushNotificationSafariWebId,
                                autoResubscribe: AUTO_RESUBSCRIBE,
                                notifyButton: { enable: ENABLE_NOTIFY_BUTTON },
                                persistNotification: pushNotificationPersist,
                                promptOptions: {
                                    slidedown: {
                                        prompts: [{
                                            type: PROMPT_TYPE,
                                            autoPrompt: AUTO_PROMPT,
                                            text: {
                                                actionMessage: pushNotificationNewOptInPromptMessage,
                                                acceptButton: pushNotificationNewOptInAcceptButtonLabel,
                                                cancelButton: pushNotificationNewOptInCancelButtonLabel,
                                                updateMessage: pushNotificationUpdateOptInPromptMessage,
                                                positiveUpdateButton: pushNotificationUpdateOptInAcceptButtonLabel,
                                                negativeUpdateButton: pushNotificationUpdateOptInCancelButtonLabel
                                            },
                                            categories: [
                                                { tag: GO_LIVE_CATEGORY_TAG_NAME, label: pushNotificationSegmentGoLiveLabel },
                                                { tag: SCHEDULE_UPDATES_CATEGORY_TAG_NAME, label: pushNotificationSegmentScheduleUpdatesLabel }
                                            ]
                                        }]
                                    }
                                },
                                serviceWorkerParam: { scope: pushNotificationScope },
                                serviceWorkerPath: pushNotificationServiceWorkerPath,
                                welcomeNotification: {
                                    disable: !pushNotificationWelcomeNotification,
                                    title: pushNotificationWelcomeNotificationTitle,
                                    message: pushNotificationWelcomeNotificationMessage
                                }
                            });

                            resolve();
                        });
                    });
                }
            } catch (error) {
                console.warn(`${LOGGING_TAG} The OneSignal push notification SDK could not be loaded. Push notifications have been disabled. This could be due to an ad-blocker preventing the script from loading or a misconfigured OneSignal setup.`, error);
                pushNotificationsEnabled = false;
            }

            await renderState(data);

            const eventSource = new EventSource(sseEndpoint);

            eventSource.addEventListener(SSE_STATE_TRANSITION_EVENT_NAME, async (event) => {
                await renderState(JSON.parse(event.data));
            });

            eventSource.addEventListener(SSE_CLOSE_EVENT_NAME, () => {
                eventSource.close();
            });
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
