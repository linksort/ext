const main = document.querySelector("main");

function renderError(error) {
  main.innerHTML = `<div class="error"><img src="hushed-face.svg"><h1>Uh oh!</h1><p>${error}</p></div>`;
}

function renderSuccess() {
  main.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M0 0h24v24H0z" fill="none" /><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" fill="#1b1f23" /></svg>';
}

chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
  const tab = tabs[0];

  fetch("http://localhost:8080/api/links", {
    headers: new Headers({
      "Content-Type": "application/json",
    }),
    method: "POST",
    body: JSON.stringify({
      title: tab.title,
      url: tab.url,
      favicon:
        tab.favIconUrl && tab.favIconUrl.startsWith("https")
          ? tab.favIconUrl
          : "",
    }),
  })
    .then((response) => {
      response.json().then((body) => {
        switch (response.status) {
          case 201:
            renderSuccess();
            break;
          case 400:
            const message = body.url ? body.url : body.message;
            if (message === "This link has already been saved.") {
              renderSuccess();
            } else {
              renderError(message);
            }
            break;
          case 401:
          case 403:
            renderError(
              "You'll need to sign in at linksort.com for that to work."
            );
            break;
          default:
            renderError("Something went wrong.");
            break;
        }
      });
    })
    .catch(() => {
      renderError("Failure to launch.");
    });
});
