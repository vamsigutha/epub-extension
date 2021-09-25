if (window.top !== window) {
    chrome.extension.sendRequest({type: "urlUpdate", url: location.href});
 }