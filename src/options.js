const message = document.getElementById("message");
const clearButton = document.getElementById("clear");
const authenticateButton = document.getElementById("authenticate");

function showLogin() {
  message.innerText = "Please sign in to save your links to Linksort.";
  clearButton.style.display = "none";
  authenticateButton.style.display = "inline-block";
}

function showLogout() {
  message.innerHTML = "You are signed into Linksort. &#x1f60a";
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
  const redirectURL = `https://linksort.com/oauth`;
  const encodedRedirectURL = encodeURIComponent(redirectURL);
  const authURL = `https://linksort.com/oauth?redirect_uri=${encodedRedirectURL}`;

  return window.webextLaunchWebAuthFlow(
    {
      interactive: true,
      url: authURL,
    },
    handleRedirect
  );
}

function doAuthWithIdentity() {
  const redirectURL = encodeURIComponent(chrome.identity.getRedirectURL());
  const authURL = `https://linksort.com/oauth?redirect_uri=${redirectURL}`;

  return chrome.identity.launchWebAuthFlow(
    {
      interactive: true,
      url: authURL,
    },
    handleRedirect
  );
}

chrome.storage.local.get(["token"], (values) => {
  if (values.token) {
    showLogout();
  } else {
    showLogin();
    doAuth();
  }
});

clearButton.addEventListener("click", () => {
  chrome.storage.local.set({ token: null }, () => {
    showLogin();
  });
});

authenticateButton.addEventListener("click", doAuth);
