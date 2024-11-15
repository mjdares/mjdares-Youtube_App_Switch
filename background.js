// Function to inject content script
function injectContentScript(tabId, callback) {
	chrome.scripting.executeScript(
		{
			target: { tabId: tabId },
			files: ['content.js']
		},
		callback
	);
}

// Function to handle pausing and resuming video
function handleTabChange(tabId, action) {
	chrome.tabs.get(tabId, (tab) => {
		if (tab.url && tab.url.includes("youtube.com/watch")) {
			injectContentScript(tabId, () => {
				chrome.tabs.sendMessage(tabId, { action: action });
			});
		}
	});
}

// Listen for tab activation events
chrome.tabs.onActivated.addListener((activeInfo) => {
	handleTabChange(activeInfo.tabId, "resumeVideo");
	chrome.tabs.query({ active: false, currentWindow: true }, (tabs) => {
		tabs.forEach((tab) => {
			if (tab.url && tab.url.includes("youtube.com/watch")) {
				chrome.tabs.sendMessage(tab.id, { action: "pauseVideo" });
			}
		});
	});
});

// Listen for tab update events
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (changeInfo.status === 'complete' && tab.url && tab.url.includes("youtube.com/watch")) {
		injectContentScript(tabId, () => {
			chrome.tabs.sendMessage(tabId, { action: "resumeVideo" });
		});
	}
});

// Listen for window focus change events
chrome.windows.onFocusChanged.addListener((windowId) => {
	if (windowId === chrome.windows.WINDOW_ID_NONE) {
		// All windows lost focus
		chrome.tabs.query({ url: "*://www.youtube.com/watch*" }, (tabs) => {
			tabs.forEach((tab) => {
				chrome.tabs.sendMessage(tab.id, { action: "pauseVideo" });
			});
		});
	} else {
		// Some window gained focus
		chrome.windows.get(windowId, { populate: true }, (window) => {
			if (window.focused) {
				window.tabs.forEach((tab) => {
					if (tab.active && tab.url.includes("youtube.com/watch")) {
						chrome.tabs.sendMessage(tab.id, { action: "resumeVideo" });
					}
				});
			}
		});
	}
});
