const message = document.getElementById("message");
const clearButton = document.getElementById("clear");
const authenticateButton = document.getElementById("authenticate");

const BASE_URI = `https://linksort.com`;
const NULL = "NULL";

function showLogin() {
  message.innerText = "Please sign in to save your links to Linksort.";
  clearButton.style.display = "none";
  authenticateButton.style.display = "inline-block";
}

function showLogout() {
  message.innerHTML =
    "You are now signed into your Linksort browser extension. <br /><br />Close this window and use the Linksort icon in your browser's toolbar to save links as you browse.";
  clearButton.style.display = "inline-block";
  authenticateButton.style.display = "none";
}

function handleRedirect(redirect) {
  const parsed = new URL(redirect);
  const encodedToken = parsed.searchParams.get("token");
  const token = decodeURIComponent(encodedToken);
  chrome.storage.local.set({ token }, () => {
    showLogout();
  });
}

function doAuth() {
  doAuthWithPolyfill();
}

function doAuthWithPolyfill() {
  const redirectURL = `${BASE_URI}/oauth`;
  const encodedRedirectURL = encodeURIComponent(redirectURL);
  const authURL = `${BASE_URI}/oauth?redirect_uri=${encodedRedirectURL}`;

  return launchWebAuthFlow(
    {
      interactive: true,
      url: authURL,
    },
    handleRedirect
  );
}

function doAuthWithIdentity() {
  const redirectURL = encodeURIComponent(chrome.identity.getRedirectURL());
  const authURL = `${BASE_URI}/oauth?redirect_uri=${redirectURL}`;

  return chrome.identity.launchWebAuthFlow(
    {
      interactive: true,
      url: authURL,
    },
    handleRedirect
  );
}

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

      chrome.webNavigation.onCompleted.addListener(onBeforeRedirect);
      chrome.webNavigation.onDOMContentLoaded.addListener(onDOMContentLoaded);

      function onBeforeRedirect(details) {
        if (details.url && details.url.includes("token")) {
          callback(details.url);
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

      function cleanup() {
        chrome.windows.remove(windowId);
      }
    }
  );
}

chrome.storage.local.get(["token"], (values) => {
  if (values.token && values.token !== NULL) {
    showLogout();
  } else {
    showLogin();
    doAuth();
  }
});

clearButton.addEventListener("click", () => {
  chrome.storage.local.set({ token: NULL }, () => {
    showLogin();
  });
});

authenticateButton.addEventListener("click", doAuth);
