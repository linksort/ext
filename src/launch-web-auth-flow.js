// Copied from https://github.com/eight04/webext-launch-web-auth-flow
window.webextLaunchWebAuthFlow = (function () {
  function launchWebAuthFlow({ url, interactive = false }, callback) {
    chrome.windows.create(
      {
        type: "popup",
        url,
        state: "normal",
        width: 600,
        height: 600,
      },
      (wInfo) => {
        const windowId = wInfo.id;
        const tabId = wInfo.tabs[0].id;

        chrome.webRequest.onBeforeRedirect.addListener(onBeforeRedirect, {
          urls: ["*://*/*"],
          tabId,
          types: ["main_frame"],
        });
        chrome.webNavigation.onDOMContentLoaded.addListener(onDOMContentLoaded);
        chrome.tabs.onRemoved.addListener(onTabRemoved);

        function onBeforeRedirect(details) {
          if (details.redirectUrl && details.redirectUrl.includes("token")) {
            callback(details.redirectUrl);
            cleanup();
          }
        }

        function onDOMContentLoaded(details) {
          if (details.frameId || details.tabId !== tabId) return;

          if (interactive) {
            chrome.windows.update(windowId, {
              focused: true,
              state: "normal",
            });
          }

          chrome.webNavigation.onDOMContentLoaded.removeListener(
            onDOMContentLoaded
          );
        }

        function onTabRemoved(removedTabId) {
          if (removedTabId === tabId) {
            throw new Error("Canceled by user");
          }
        }

        function cleanup() {
          chrome.webRequest.onBeforeRedirect.removeListener(onBeforeRedirect);
          chrome.webNavigation.onDOMContentLoaded.removeListener(
            onDOMContentLoaded
          );
          chrome.tabs.onRemoved.removeListener(onTabRemoved);
          chrome.windows.remove(windowId);
        }
      }
    );
  }

  return launchWebAuthFlow;
})();
