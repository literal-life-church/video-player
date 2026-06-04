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

// iPadOS 13+ identifies as Mac, so we have to check for touch support to reliably detect it
function isIpadOs() {
    return /ipad/i.test(navigator.userAgent) ||
        (/mac/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
}

// Covers iPhone, iPad (pre-13), and legacy iPod touch
function isIos() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isIphone() {
    return /iphone|ipod/i.test(navigator.userAgent);
}

function isIosOrIpadOs() {
    return isIos() || isIpadOs();
}

// Safari includes "Safari" but not "Chrome", "CriOS", "FxiOS"
function isIosOrIpadOsSafari() {
    return isIosOrIpadOs() &&
        /safari/i.test(navigator.userAgent) &&
        !/chrome|chromium|crios|fxios|edgios|opios/i.test(navigator.userAgent);
}

function isStandalone() {
    return navigator.standalone === true ||
        window.matchMedia("(display-mode: standalone)").matches;
}

document.addEventListener("DOMContentLoaded", () => {
    // region Configuration Defaults

    const CONTAINER_ID = "literal-life-church-video-player";

    // Message defaults
    const DEFAULT_ERROR_MESSAGE = "We were not able to load any information about this event. Please contact the site owner.";
    const DEFAULT_OFFLINE_MESSAGE = "This event is offline.";
    const DEFAULT_PREWARMING_MESSAGE = "We are getting ready to go live very soon. Please stay tuned.";

    // Push notification defaults
    const DEFAULT_PUSH_NOTIFICATION_NEW_OPT_IN_BUTTON_LABEL = "Get Notifications From Us";
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
    const GO_LIVE_SEGMENT_TAG_NAME = "go_live";
    const PROMPT_TYPE = "category";
    const SCHEDULE_UPDATES_SEGMENT_TAG_NAME = "schedule_updates";

    // SSE event names
    const SSE_CLOSE_EVENT_NAME = "event.close_connection";
    const SSE_STATE_TRANSITION_EVENT_NAME = "event.state_transition";
    
    // Third-party script URLs
    const MARKED_URL = "https://cdn.jsdelivr.net/npm/marked@18.0.0/lib/marked.umd.min.js";
    const ONESIGNAL_URL = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";

    // Baked-in images
    const APP_ICON = `data:image/png;base64,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`;
    const IOS_ADD_ICON = `<svg xmlns="http://www.w3.org/2000/svg" height="1.5rem" viewBox="0 -960 960 960" width="1.5rem" fill="#000000"><path d="M440-280h80v-160h160v-80H520v-160h-80v160H280v80h160v160ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm0-560v560-560Z"/></svg>`;
    const IOS_SAFARI_ICON = `data:image/png;base64,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`;
    const IOS_SHARE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" height="1.5rem" viewBox="0 -960 960 960" width="1.5rem" fill="#000000"><path d="M240-80q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640h120v80H240v400h480v-400H600v-80h120q33 0 56.5 23.5T800-560v400q0 33-23.5 56.5T720-80H240Zm200-240v-447l-64 64-56-57 160-160 160 160-56 57-64-64v447h-80Z"/></svg>`;
    const IOS_THREE_DOTS_ICON = `<svg xmlns="http://www.w3.org/2000/svg" height="1.5rem" viewBox="0 -960 960 960" width="1.5rem" fill="#000000"><path d="M240-400q-33 0-56.5-23.5T160-480q0-33 23.5-56.5T240-560q33 0 56.5 23.5T320-480q0 33-23.5 56.5T240-400Zm240 0q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm240 0q-33 0-56.5-23.5T640-480q0-33 23.5-56.5T720-560q33 0 56.5 23.5T800-480q0 33-23.5 56.5T720-400Z"/></svg>`;
    const IOS_VIEW_MORE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" height="1.5rem" viewBox="0 -960 960 960" width="1.5rem" fill="#000000"><path d="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z"/></svg>`;
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

    const pushNotificationAppId = container.dataset.pushNotificationAppId?.trim() || "";
    const pushNotificationSafariWebId = container.dataset.pushNotificationSafariWebId?.trim() || "";

    if (!pushNotificationAppId || pushNotificationAppId === ""|| !pushNotificationSafariWebId || pushNotificationSafariWebId === "") {
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

    const showIosPwaInstallGuide = () => {
        const deviceName = isIphone() ? "iPhone" : "iPad";

        const overlay = document.createElement("div");
        overlay.className = "pwa-install-guide-overlay";

        const guide = document.createElement("div");
        guide.className = "pwa-install-guide";

        const header = document.createElement("p");
        header.className = "pwa-install-guide-header";
        header.textContent = `To enable notifications on your ${deviceName}, you'll first need to install this website as an app. Here's how:`;
        guide.appendChild(header);

        const steps = document.createElement("ol");
        steps.className = "pwa-install-guide-steps";

        const addStep = (iconHtml, text, isImg = false) => {
            const li = document.createElement("li");
            li.className = "pwa-install-guide-step";

            const iconSpan = document.createElement("span");
            iconSpan.className = "pwa-install-guide-step-icon";

            if (iconHtml) {
                if (isImg) {
                    const img = document.createElement("img");
                    img.src = iconHtml;
                    img.alt = "";
                    iconSpan.appendChild(img);
                } else {
                    iconSpan.innerHTML = iconHtml;
                }
            }

            const textSpan = document.createElement("span");
            textSpan.className = "pwa-install-guide-step-text";
            textSpan.textContent = text;

            li.appendChild(iconSpan);
            li.appendChild(textSpan);
            steps.appendChild(li);
        };

        addStep(IOS_SAFARI_ICON, "Open this website in Safari", true);
        addStep(IOS_THREE_DOTS_ICON, "Tap the three dots at the bottom-right of your screen");
        addStep(IOS_SHARE_ICON, "Tap Share");
        addStep(IOS_VIEW_MORE_ICON, "Scroll all the way down");
        addStep(IOS_ADD_ICON, "Tap Add to Home Screen");
        addStep(null, "Tap the Add button at the top right");
        addStep(APP_ICON, "Go to your home screen and open the Literal Life Church app", true);

        guide.appendChild(steps);

        const cancelButton = document.createElement("button");
        cancelButton.className = "pwa-install-guide-cancel";
        cancelButton.textContent = "Cancel";
        cancelButton.addEventListener("click", () => overlay.remove());

        guide.appendChild(cancelButton);
        overlay.appendChild(guide);
        container.appendChild(overlay);
    };

    const appendPushButton = (messageContainer) => {
        if (!pushNotificationsEnabled) return;

        const isSubscribed = window.OneSignal?.User?.PushSubscription?.optedIn ?? false;
        const pushButton = document.createElement("button");

        pushButton.className = `push-notification-opt-in ${isSubscribed ? "existing-subscriber" : "new-subscriber"}`;
        pushButton.textContent = isSubscribed ? pushNotificationUpdateOptInButtonLabel : pushNotificationNewOptInButtonLabel;

        pushButton.addEventListener("click", () => {
            if (isIosOrIpadOs() && !isStandalone()) {
                showIosPwaInstallGuide();
                return;
            }

            if (!window.OneSignal?.Notifications?.isPushSupported()) {
                pushNotificationsEnabled = false;
                setPushSubscriptionStatus();
                pushButton.remove();
                return;
            }

            window.OneSignal.Slidedown.promptPushCategories({ force: true });
        });

        messageContainer.appendChild(pushButton);
    };

    const setPushSubscriptionStatus = () => {
        try {
            if (pushNotificationsEnabled) {
                const isSubscribed = window.OneSignal?.User?.PushSubscription?.optedIn ?? false;
                container.dataset.pushNotificationSubscriptionStatus = isSubscribed ? "existing" : "new";
            } else {
                container.dataset.pushNotificationSubscriptionStatus = "disabled";
            }
        } catch (error) {
            console.warn(`${LOGGING_TAG} Could not determine OneSignal push notification subscription status.`, error);
            container.dataset.pushNotificationSubscriptionStatus = "disabled";
        }
    };

    const renderState = async (data) => {
        resetContainerState(container);
        setPushSubscriptionStatus();

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
                if (pushNotificationsEnabled && (!isIos() || isStandalone())) {
                    await loadScript(ONESIGNAL_URL);

                    await new Promise((resolve, reject) => {
                        window.OneSignalDeferred = window.OneSignalDeferred || [];
                        window.OneSignalDeferred.push((OneSignal) =>
                            OneSignal.init({
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
                                                { tag: GO_LIVE_SEGMENT_TAG_NAME, label: pushNotificationSegmentGoLiveLabel },
                                                { tag: SCHEDULE_UPDATES_SEGMENT_TAG_NAME, label: pushNotificationSegmentScheduleUpdatesLabel }
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
                            })
                            .then(resolve)
                            .catch(reject)
                        );
                    });
                }
            } catch (error) {
                console.warn(`${LOGGING_TAG} The OneSignal push notification SDK could not be loaded. Push notifications have been disabled. This could be due to an ad-blocker preventing the script from loading or a misconfigured OneSignal setup.`, error);
                pushNotificationsEnabled = false;
            } finally {
                await renderState(data);

                const eventSource = new EventSource(sseEndpoint);

                eventSource.addEventListener(SSE_STATE_TRANSITION_EVENT_NAME, async (event) => {
                    await renderState(JSON.parse(event.data));
                });

                eventSource.addEventListener(SSE_CLOSE_EVENT_NAME, () => {
                    eventSource.close();
                });
            }
        })
        .catch(async (error) => {
            console.error(error);

            await loadScript(MARKED_URL);
            resetContainerState(container);
            setPushSubscriptionStatus();

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
