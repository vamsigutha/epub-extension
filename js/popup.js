var popup =
{
   init: function()
   {
      var browserAction = chrome.browserAction || browser.browserAction;
      var tabs = chrome.tabs || browser.tabs;
      var extension = chrome.extension || browser.extension;
      var i18n = chrome.i18n || browser.i18n;

      if(localStorage["is_updated"] == "true")
      {
         var x = new XMLHttpRequest();
         x.open("GET", "changes.html");

         x.onloadend = function(e)
         {
            document.getElementById("notice").innerHTML = x.responseText;
            document.getElementsByTagName("html")[0].style.direction = i18n.getMessage("direction");

            if(!popup.isFirefox())
            {
               document.getElementById("donate").style.display = "block";
            }

            document.getElementById("start").textContent = i18n.getMessage("hintStart");
            document.getElementById("start").onclick = function(e)
            {
               tabs.create({"url": extension.getURL("reader.html"), "active": true});
               window.close();
            };
         };

         x.send();

         localStorage["is_installed"] = "false";
         localStorage["is_updated"] = "false";
         browserAction.setBadgeText({text: ""});
      }
      else
      {
         browserAction.setBadgeText({text: ""});
         tabs.create({'url': extension.getURL('reader.html'), 'active': true});
         window.close();
      }
   },

   isFirefox: function()
   {
      return navigator.userAgent.match(/Firefox/);
   }
}

window.addEventListener("DOMContentLoaded", popup.init, true);