/**
 @license EPUBReader: http://www.epubread.com/
 Copyright (C) 2020 Michael Volz (epubread at gmail dot com). All rights reserved.

 It's not permitted to copy from, to modify or redistribute this script or it's source.
 See the attached license (license.txt) for more details.

 You should have received a copy of the license (license.txt)
 along with this program. If not, see <http://www.epubread.com/license/>.

 THIS SOFTWARE IS PROVIDED ``AS IS'' AND ANY EXPRESSED OR IMPLIED WARRANTIES,
 INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
 FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL JCRAFT,
 INC. OR ANY CONTRIBUTORS TO THIS SOFTWARE BE LIABLE FOR ANY DIRECT, INDIRECT,
 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
 OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

var browserAction = chrome.browserAction || browser.browserAction;
var webRequest = chrome.webRequest || browser.webRequest;
var webNavigation = chrome.webNavigation || browser.webNavigation;
var tabs = chrome.tabs || browser.tabs;
var extension = chrome.extension || browser.extension;
var runtime = chrome.runtime || browser.runtime;
var i18n = chrome.i18n || browser.i18n;
var storage = chrome.storage || browser.storage;

function isFirefox()
{
   return navigator.userAgent.match(/Firefox/);
}

function handleInstall(data)
{
   var pref = data["pref"];

   // new installation
   if(pref["version"] == 0 && !localStorage["version"])
   {
      storage.local.set({"pref": {"version": currentVersion}});
      localStorage["is_installed"] = "true";
      browserAction.setBadgeText({"text": "New"});

      if(typeof i18n.getUILanguage === "function")
      {
         var lang = "?lang=" + i18n.getUILanguage();
      }
      else
      {
         var lang = "";
      }

      tabs.create({"url":"https://epubread.com/welcome_new.php" + lang, "active":true});
   }
   // update
   else if(pref["version"] != currentVersion)
   {
      storage.local.set({"pref": {"version": currentVersion}});
      localStorage["is_updated"] = "true";
      browserAction.setBadgeText({"text": "Update"});
   }
}

if(!localStorage["is_installed"])
{
   localStorage["is_installed"] = "false";
}

if(!localStorage["is_updated"])
{
   localStorage["is_updated"] = "false";
}

runtime.setUninstallURL("https://www.epubread.com/goodbye.php");

var currentVersion = runtime.getManifest()["version"];
storage.local.get({"pref": {"version": 0}}, handleInstall);

if(isFirefox())
{
   webRequest.onBeforeRequest.addListener
   (
      function(data)
      {
         if(data.url.match(/(http|https):\/\/.*\.epub($|\?)/i))
         {
            var readerUrl = extension.getURL("reader.html") + "?filename=" + encodeURIComponent(data.url);
            tabs.update(tabs.getCurrent.id, {"url": readerUrl});
            return {"cancel": true};
         }
         else
         {
            return {"cancel": false};
         }
      },
      {
         "urls": ["http://*/*.epub*", "http://*/*.EPUB*", "https://*/*.epub*", "https://*/*.EPUB*"],
         "types": ["main_frame", "sub_frame"]
      },
      ["blocking"]
   );
}
else
{
   webRequest.onBeforeRequest.addListener
   (
      function(data)
      {
         var readerUrl = extension.getURL("reader.html") + "?filename=" + encodeURIComponent(data.url);
         return {"redirectUrl": readerUrl};
      },
      {
         "urls": ["file://*/*.epub", "file://*/*.EPUB"],
         "types": ["main_frame", "sub_frame"]
      },
      ["blocking"]
   );

   extension.isAllowedFileSchemeAccess
   (
      function(isAllowedAccess)
      {
         if(isAllowedAccess)
         {
            return;
         }

         webNavigation.onBeforeNavigate.addListener
         (
            function(data)
            {
               if(data["frameId"] === 0)
               {
                  var readerUrl = extension.getURL("reader.html") + "?nofileaccess=" + runtime["id"];
                  tabs.update(data["tabId"], {"url": readerUrl});
               }
            },
            {
               "url": [{"urlPrefix": "file://", "pathSuffix": ".epub"}, {"urlPrefix": "file://", "pathSuffix": ".EPUB"}]
            }
         );
      }
   );

   webRequest.onHeadersReceived.addListener
   (
      function(data)
      {
         function isEpub(headers, url)
         {
            var isEpub = false;

            for(var i = 0; i < headers.length; i++)
            {
               var header = headers[i];

               if(header["name"].match(/^content-type$/i))
               {
                  var type = header["value"];
               }
               else if(header["name"].match(/^content-disposition$/i))
               {
                  var disposition = header["value"];
               }
               else if(header["name"].match(/^status$/i))
               {
                  var status = header["value"];
               }
            }

            if(!status || (status && status.match(/200/)))
            {
               if(type && type.match(/application\/epub\+zip/g))
               {
                  isEpub = true;
               }
               else if(url.match(/.*[^=]\.epub$/g))
               {
                  isEpub = true;
               }
               else
               {
                  if(disposition && disposition.match(/.*\.epub/g))
                  {
                     isEpub = true;
                  }
               }
            }

            return isEpub;
         }

         var isEpub = isEpub(data["responseHeaders"], data["url"]);

         if(isEpub == true && data["method"] === "GET")
         {
            var readerUrl = extension.getURL('reader.html') + '?filename=' + encodeURIComponent(data.url);
            return {"redirectUrl": readerUrl};
         }
         else
         {
            return;
         }
      },
      {
         "urls": ["<all_urls>"],
         "types": ["main_frame", "sub_frame"]
      },
      ["responseHeaders", "blocking"]
   );
}

runtime.onMessageExternal.addListener(handleApiRequest);
var currentTab = -1;

function handleApiRequest(message, sender, sendResponse)
{
   function sendRequest(currentTab, message, sendResponse)
   {
      tabs.sendMessage(currentTab, message, function(response)
      {
         if(!runtime.lastError && response)
         {
            response.success = true;
            sendResponse(response);
         }
         else
         {
            sendResponse({success: false});
         }
      });
   }

   if(message.name == "getDocumentInfo")
   {
      tabs.query({active: true}, function(result)
      {
         currentTab = result[0].id;
         sendRequest(currentTab, message, sendResponse);
      });
   }
   else if(currentTab != -1)
   {
      sendRequest(currentTab, message, sendResponse);
   }
   else
   {
      sendResponse({success: false});
   }

   return true;
}