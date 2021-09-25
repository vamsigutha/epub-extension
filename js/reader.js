/**
 EPUBReader: http://www.epubread.com/
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

var reader =
{
   saveHintShown: null,
   toolbarHintShown: null,

   loading_white: 1,
   loading_black: 2,

   key_nav_backwards: 37,
   key_nav_forwards: 39,
   key_zoom_in: 107,
   key_zoom_out: 109,
   key_bookmark: 68,
   key_save: 83,
   key_toggle_toc: 84,
   key_toggle_toc_old: 46,

   toolbar_location_top: 1,
   toolbar_location_bottom: 2,

   navTemplate:
'<html style="margin:0px; padding:0px;">\
<head>\
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />\
<style type="text/css">\
.childLevel\
{\
   font-size:80%;\
}\
\
.navPoint:hover\
{\
   cursor:pointer;\
}\
\
.navPoint:active\
{\
   background-color: lightgrey;\
}\
#closetoc:hover\
{\
   cursor:pointer;\
}\
</style>\
</head>\
<body style="margin:0px; padding:0px;">\
<center>\
<div style="position:fixed; z-index:2; width:100%; top:0px; background-color:grey; padding-top:10px; padding-bottom:10px;"><img src="skin/close.png" id="closetoc" style="width:32px;"></div>\
<div style="max-width:600px; position:relative; z-index:1; border-left:1px dashed lightgrey; border-right:1px dashed lightgrey; border-bottom:1px dashed lightgrey; text-align:left;">\
<table id="toc" style="border-collapse:collapse; font-family:Times New Roman; font-size:16pt; margin-top:50px; width:100%;" cellspacing="0px" cellpadding="0px">\
%begin-error%\
<tr>\
   <td>\
      <table style="border-spacing:0px;">\
      <tr>\
         <td></td>\
         <td>\
            <ul id="navError">\
               <li><span style="font-size:16pt;">&#9888;</span>\
                  <ul>\
                     <li>%nav_error%</li>\
                  </ul>\
               </li>\
            </ul>\
         </td>\
      </tr>\
      </table>\
   </td>\
</tr>\
%end-error%\
%repeat-begin-toc%\
<tr>\
   <td id="%id%" class="navPoint %level%" style="width:100%; height:100%; padding-left:30px; padding-right:30px; padding-top:10px; padding-bottom:10px;">%spacer%%desc%</td>\
</tr>\
%repeat-end-toc%\
</table>\
</div>\
</body>\
</html>',

   init: function()
   {
      core.log("reader.init");
      reader.setTooltips();

      document.getElementById("open").onclick = reader.selectEbook;
/*
      document.getElementById("open").ondragover = reader.dragOver;
      document.getElementById("open").ondragleave = reader.dragLeave;
      document.getElementById("open").ondrop = reader.drop;
*/

      document.getElementById("toc").onclick = function(){reader.toggleNavigationbar(); reader.toggleTools();};

      if(document.getElementById("font_less"))
      {
         document.getElementById("font_less").onclick = function(){core.zoomFont(core.zoom_smaller);};
      }

      if(document.getElementById("font_more"))
      {
         document.getElementById("font_more").onclick = function(){core.zoomFont(core.zoom_larger);};
      }

      if(document.getElementById("reading_style"))
      {
         document.getElementById("reading_style").onclick = reader.toggleReadingStyle;
      }

      if(document.getElementById("download"))
      {
         document.getElementById("download").onclick = core.downloadEbook;
      }

      if(document.getElementById("bookmark"))
      {
         document.getElementById("bookmark").onclick = function(){core.setBookmark(true);};
      }

      if(document.getElementById("preferences"))
      {
         document.getElementById("preferences").onclick = function(){app.showPreferences();};
      }

      document.getElementById("toolbar_teaser_top").onmouseover = function(){reader.toggleTools(true, reader.toolbar_location_top);};
      document.getElementById("toolbar_teaser_bottom").onmouseover = function(){reader.toggleTools(true, reader.toolbar_location_bottom);};

      document.getElementById("browse-files").onchange = function(){core.initReading(this.files[0], core.origin_disk)};
      document.getElementById("message_content").style.direction = core.getMessage("direction");

      var navFrame = document.getElementById("nav_frame");
      navFrame.addEventListener("keydown", reader.handleKey, true);

      if(core.isAndroid)
      {
         reader.showLoading(reader.loading_white);

         var location = window.location.href;

         if(location.match(/.*filename.*/))
         {
            var filename = decodeURI(location.match(/.*filename=(.*)/)[1]);
            core.log("init: filename: " + filename);

            window.setTimeout(function(){app.openEbookFile(filename)}, 500);
         }
         else
         {
            window.setTimeout(app.init, 500);
         }
      }
      else
      {
         if(app)
         {
            app.init();
         }

         var location = window.location.href;

         if(location.match(/.*filename=.*/))
         {
            var url = decodeURIComponent(location.match(/.*filename=(.*)/)[1]);
            reader.downloadEbook(url);
         }
         else if(location.match(/.*nofileaccess=.*/))
         {
            var id = decodeURIComponent(location.match(/.*nofileaccess=(.*)/)[1]);
            reader.showNoFileAccess(id);
         }
      }
   },

   initReading: function()
   {
      core.log("reader.initReading");

      reader.closeMessage();
      reader.hideTools();

      document.getElementById("toolbar_teaser_top").style.display = "";
      document.getElementById("toolbar_teaser_bottom").style.display = "";

      document.getElementById("browse").onmouseleave = function(e)
      {
         if(e.clientY >= 0)
         {
            reader.toggleTools(false);
         }
      };

      document.getElementById("toolbar").onmouseleave = function(e)
      {
         if(e.clientY < document.documentElement.offsetHeight - 10)
         {
            reader.toggleTools(false);
         }
      };

      var navFrame = document.getElementById("nav_frame");
      navFrame.innerHTML = "";

      var contentFrame = document.getElementById("content_frame");
      contentFrame.contentWindow.location = "about:blank";

      document.getElementById("loading").style.display = "";

      if(core.origin == core.origin_web)
      {
         document.getElementById("download").style.display = "inline-block";
      }
      else
      {
         document.getElementById("download").style.display = "none";
      }
   },

   loadBegin: function()
   {
      reader.showLoading();
   },

   loadFinished: function()
   {
      core.log("toolbarhint: " + reader.toolbarHintShown);
      var storage = chrome.storage || browser.storage;
      reader.hideLoading();

      if(core.origin == core.origin_web && !reader.saveHintShown)
      {
         if(!reader.toolbarHintShown)
         {
            reader.showMessage(core.getMessage("hintToolbar") + "<br><br>" + core.getMessage("hintSave"), null, true);
            reader.toolbarHintShown = true;
            reader.saveHintShown = true;
            storage.local.set({"toolbarHintShown": true, "saveHintShown": true});
         }
         else
         {
            reader.showMessage(core.getMessage("hintSave"), null, true);
            reader.saveHintShown = true;
            storage.local.set({"saveHintShown": true});
         }
      }
      else if(!reader.toolbarHintShown)
      {
         reader.showMessage(core.getMessage("hintToolbar"), null, true);
         reader.toolbarHintShown = true;
         storage.local.set({"toolbarHintShown": true});
      }
   },

   onError: function()
   {
      reader.hideLoading();
      document.getElementById("browse").style.display = "";
   },

   showLoading: function(color)
   {
      if(core.isAndroid && !color)
      {
         if(app.view == app.view_none)
         {
            color = reader.loading_black;
         }
         else if(app.view == app.view_ebook)
         {
            if(localStorage['theme'] == app.theme_day)
            {
               color = reader.loading_black;
            }
            else if(localStorage['theme'] == app.theme_night)
            {
               color = reader.loading_white;
            }
         }
         else
         {
            color = reader.loading_white;
         }
      }

      if(color && color == reader.loading_white)
      {
         document.getElementById("loading").style.borderColor = "#f4f0f4 transparent";
      }
      else if(color && color == reader.loading_black)
      {
         document.getElementById("loading").style.borderColor = "#666 transparent";
      }

      var loading = document.getElementById("loading");
      loading.style.display = "";
   },

   hideLoading: function()
   {
      var loading = document.getElementById("loading");
      loading.style.display = "none";
   },

   enable: function()
   {
      posForwards = core.navPosition + 1;
      posBackwards = core.navPosition - 1;

      var urlForwards = core.spine[posForwards];
      var urlBackwards = core.spine[posBackwards];

      if(urlBackwards)
      {
         core.navBackwardsEnabled = true;
      }
      else
      {
         core.navBackwardsEnabled = false;
      }

      if(urlForwards)
      {
         core.navForwardsEnabled = true;
      }
      else
      {
         core.navForwardsEnabled = false;
      }

      if(core.readingDir == core.reading_dir_ltr)
      {
         var innerPageBack = document.getElementById("nav_inner_page_backwards");
         var innerPageFor = document.getElementById("nav_inner_page_forwards");
      }
      else
      {
         var innerPageBack = document.getElementById("nav_inner_page_forwards");
         var innerPageFor = document.getElementById("nav_inner_page_backwards");
      }

      if(core.navBackwardsEnabled)
      {
         innerPageBack.style.display = "block";
      }
      else
      {
         var contentWindow = document.getElementById("content_frame").contentWindow;

         if(contentWindow.pageXOffset > 0)
         {
            innerPageBack.style.display = "block";
         }
         else
         {
            innerPageBack.style.display = "none";
         }
      }

      if(core.navForwardsEnabled)
      {
         innerPageFor.style.display = "block";
      }
      else
      {
         var contentFrame = document.getElementById("content_frame");
         var contentWindow = contentFrame.contentWindow;
         var scrollMaxX = contentFrame.contentWindow.scrollMaxX || contentFrame.contentDocument.documentElement.scrollWidth - contentFrame.contentDocument.documentElement.clientWidth;

         if(contentWindow.pageXOffset == scrollMaxX)
         {
            innerPageFor.style.display = "none";
         }
         else
         {
            innerPageFor.style.display = "block";
         }
      }

      //core.autoBookmarkActive = true;
   },

   handleKey: function(event)
   {
      if(event.ctrlKey == false && event.metaKey == false && event.altKey == false)
      {
         if(event.keyCode == reader.key_nav_backwards)
         {
            event.preventDefault();

            if(core.readingDir == core.reading_dir_ltr)
            {
               var direction = core.page_backwards;
            }
            else
            {
               var direction = core.page_forwards;
            }

            core.page(direction);
         }
         else if(event.keyCode == reader.key_nav_forwards)
         {
            event.preventDefault();

            if(core.readingDir == core.reading_dir_ltr)
            {
               var direction = core.page_forwards;
            }
            else
            {
               var direction = core.page_backwards;
            }

            core.page(direction);
         }
         else if(event.keyCode == reader.key_zoom_in)
         {
            event.preventDefault();
            core.zoomFont(core.zoom_larger);
         }
         else if(event.keyCode == reader.key_zoom_out)
         {
            event.preventDefault();
            core.zoomFont(core.zoom_smaller);
         }
         else if(event.keyCode == reader.key_bookmark)
         {
            event.preventDefault();
            core.setBookmark(true);
         }
         else if(event.keyCode == reader.key_save)
         {
            event.preventDefault();

            if(core.origin == core.origin_web)
            {
               core.downloadEbook();
            }
            else
            {
               reader.showMessage(core.getMessage("hintSaveDownloadOnly"));
               window.setTimeout(function(){reader.closeMessage();}, 3000);
            }
         }
         else if(event.keyCode == reader.key_toggle_toc || event.keyCode == reader.key_toggle_toc_old)
         {
            reader.toggleNavigationbar();
         }
      }
   },

   click: function(event)
   {
      var contentFrame = document.getElementById("content_frame");
      var contentWindow = contentFrame.contentWindow;

      var docX = contentWindow.innerWidth;
      var docY = contentWindow.innerHeight;

      var posX = event.pageX - contentWindow.pageXOffset;
      var posY = event.pageY - contentWindow.pageYOffset;

      core.log("click: posX: " + posX + ", posY: " + posY);

      if(posX <= 50)
      {
         if(core.readingDir == core.reading_dir_ltr)
         {
            var direction = core.page_backwards;
         }
         else
         {
            var direction = core.page_forwards;
         }

         core.page(direction);
      }
      else if((docX - posX <= 50))
      {
         if(core.readingDir == core.reading_dir_ltr)
         {
            var direction = core.page_forwards;
         }
         else
         {
            var direction = core.page_backwards;
         }

         core.page(direction);
      }
      else if(Math.abs(docX/2 - posX) <= 100 && Math.abs(docY/2 - posY) <= 100)
      {
         reader.toggleTools();
      }

      return false;
   },

   selectEbook: function()
   {
      if(core.isAndroid)
      {
         app.selectEbook();
      }
      else
      {
         document.getElementById('browse-files').click();
      }
   },

   downloadEbook: function(url)
   {
      core.log("downloadEbook: " + url);
      document.getElementById("browse").style.display = "none";

      if(!url.match(/.*file:\/\/.*/))
      {
         var origin = core.origin_web;
         document.getElementById("downloading").textContent = core.getMessage("hintDownloading");
         document.getElementById("downloading").style.display = "block";
         document.getElementById("downloading_progress_meter").style.width = "0%";
      }
      else
      {
         var origin = core.origin_disk;
      }

      reader.showLoading();

      var x = new XMLHttpRequest();
      x.open('GET', url);
      x.responseType = "blob";

      x.onprogress = function(e)
      {
         if(e.lengthComputable)
         {
            document.getElementById("downloading_progress").style.display = "";
            document.getElementById("downloading_progress_meter").style.width = (e.loaded/e.total) * 100 + "%";
         }
      }

      x.onloadend = function(e)
      {
         core.log("downloadEbook: onloadend: status: " + e.target['status']);

         document.getElementById("downloading").style.display = "none";
         document.getElementById("downloading_progress").style.display = "none";

         if(e.target['status'] == 0 && origin == core.origin_web)
         {
            reader.onError();
            reader.showMessage(core.getMessage("errorDownloading"));
         }
         else if(e.target['status'] == 401 || e.target['status'] == 403)
         {
            reader.onError();
            reader.showMessage(core.getMessage("errorAuthentication"));
         }
         else if(e.target['status'] == 404)
         {
            reader.onError();
            reader.showMessage(core.getMessage("errorNotFound"));
         }
         else if(e.target['status'] >= 400)
         {
            reader.onError();
            reader.showMessage(core.getMessage("errorErrorCode") + " " + e.target['status']);
         }
         else
         {
            core.initReading(x.response, origin);
         }
      };

      x.onerror = function(e)
      {
         core.log("downloadEbook: onerror");
         reader.onError();
         document.getElementById("downloading").style.display = "none";
         document.getElementById("downloading_progress").style.display = "none";
         reader.showMessage(core.getMessage("errorDownloading"));
      }

      x.onabort = function(e)
      {
         core.log("downloadEbook: onabort");
         reader.onError();
         document.getElementById("downloading").style.display = "none";
         document.getElementById("downloading_progress").style.display = "none";
      }

      x.send();
   },

   toggleNavigationbar: function()
   {
      var navFrame = document.getElementById("nav_frame");
      var contentFrame = document.getElementById("content_frame");

      if(core.isAndroid)
      {
         if(navFrame.style.zIndex == 0)
         {
            navFrame.style.zIndex = 102;

            if(localStorage['theme'] == app.theme_day)
            {
               navFrame.contentDocument.getElementById("toc").style.color = "black";
            }
            else if(localStorage['theme'] == app.theme_night)
            {
               navFrame.contentDocument.getElementById("toc").style.color = "#f4f0f4";
            }
         }
         else
         {
            navFrame.style.zIndex = 0;
         }
      }
      else
      {
         if(navFrame.style.display == "")
         {
            navFrame.style.display = "none";
            contentFrame.style.display = "";
            document.getElementById("progress_div").style.display = "";

            window.setTimeout(function(){contentFrame.contentWindow.focus();}, 100);
         }
         else
         {
            contentFrame.style.display = "none";
            document.getElementById("progress_div").style.display = "none";
            navFrame.style.display = "";

            // is needed, otherwise sometimes the vertical scrollbar is missing in Chrome
            navFrame.style.height = "99%";
            window.setTimeout(function(){navFrame.style.height = "100%";}, 10);

            window.setTimeout(function(){navFrame.contentWindow.focus();}, 100);
         }
      }
   },

   toggleTools: function(show, location)
   {
      var browse = document.getElementById("browse");
      var toolbar = document.getElementById("toolbar");

      if(toolbar.style.display == "" || show == false)
      {
         if(core.isAndroid)
         {
            document.addEventListener("touchstart", swipe.touchStart, true);
            document.addEventListener("touchend", swipe.touchEnd, true);
            document.addEventListener("touchmove", swipe.touchMove, true);
            document.addEventListener("touchcancel", swipe.touchCancel, true);
         }

         browse.style.display = "none";
         toolbar.style.display = "none";
      }
      else if(toolbar.style.display == "none" || show == true)
      {
         if(core.isAndroid)
         {
            document.removeEventListener("touchstart", swipe.touchStart, true);
            document.removeEventListener("touchend", swipe.touchEnd, true);
            document.removeEventListener("touchmove", swipe.touchMove, true);
            document.removeEventListener("touchcancel", swipe.touchCancel, true);
         }

         if((location != null && location == reader.toolbar_location_top) || location == null)
         {
            browse.style.display = "";
         }

         if((location != null && location == reader.toolbar_location_bottom) || location == null)
         {
            toolbar.style.display = "";
            toolbar.style.top = (window.innerHeight - toolbar.offsetHeight) + "px";
         }
      }
   },

   hideTools: function()
   {
      reader.toggleTools(false);
   },

   toggleReadingStyle: function()
   {
      var storage = chrome.storage || browser.storage;

      if(core.pagingDir == core.paging_dir_horizontal)
      {
         core.pagingDir = core.paging_dir_vertical;
         storage.local.set({"pagingDir": core.paging_dir_vertical});
      }
      else
      {
         core.pagingDir = core.paging_dir_horizontal;
         storage.local.set({"pagingDir": core.paging_dir_horizontal});
      }

      core.resetStyle();
      core.getStyle();
      core.setStyle();

      var contentFrame = document.getElementById("content_frame");

      if(core.pagingDir == core.paging_dir_horizontal)
      {
         var height = contentFrame.contentWindow.innerHeight;
         contentFrame.contentDocument.documentElement.style.height = (height - core.margin_top_bottom*2 - core.progress_height) + "px";
         contentFrame.contentDocument.documentElement.style.overflow = "hidden";
      }
      else
      {
         contentFrame.contentDocument.documentElement.style.height = "";
         contentFrame.contentDocument.documentElement.style.overflow = "auto";
      }

      contentFrame.contentWindow.location.reload();
      reader.hideTools();
   },

   showMessage: function(message, details, showOkay, showTitle)
   {
      var contentFrame = document.getElementById("content_frame");
      var frameHeight = contentFrame.contentWindow.innerHeight;
      var frameWidth = contentFrame.contentWindow.innerWidth;

      var msg = document.getElementById("message_content");

      if(showTitle == true)
      {
         message = "<div style='font-weight:bold; margin-bottom:10px; padding-bottom:10px; text-align:center; border-bottom:1px solid grey;'><img src='skin/icon_32.png' style='margin-right:15px; vertical-align:middle;'>EPUBReader</div>" + message;
      }

      if(details)
      {
         message = message + ": " + details;
      }

      msg.innerHTML = message;
      msg.style.border = "1px solid grey";
      msg.style.backgroundColor = "#f0f0f0";
      msg.style.backgroundColor = "-moz-Dialog";
      msg.style.marginTop = (msg.offsetHeight/2 * - 1) + "px";
      msg.style.zIndex = "103";

      if(showOkay == true)
      {
         if(!document.getElementById("message_content_okay"))
         {
            var okay = document.createElement("div");
            okay.id = "message_content_okay";
            okay.innerHTML = "OK";
            okay.onclick = function(){reader.closeMessage(); contentFrame.contentWindow.focus();};

            msg.appendChild(okay);
         }
      }
   },

   closeMessage: function()
   {
      var msg = document.getElementById("message_content");
      msg.innerHTML = "";
      msg.style.border = "";
      msg.style.backgroundColor = "transparent";
      msg.style.zIndex = -1;
   },

   showNoFileAccess: function(id)
   {
      if(core.isChrome == true)
      {
         var url = "chrome://extensions/?id=" + id;
      }

      document.getElementById("browse").style.display = "none";
      var msg = core.getMessage("hintFileaccess") + "<center><div style='margin-top:10px;'><a id='extensions' href='" + url + "'>" + core.getMessage("hintSetupFileaccess") + "</a></div>";
      reader.showMessage(msg, "", false, true);

      var tabs = chrome.tabs || browser.tabs;
      document.getElementById("extensions").onclick = function(){tabs.update({url:url})};
   },

   setTooltips: function()
   {
      document.getElementById("toc").title = core.getMessage("tooltipToc");
      document.getElementById("open").title = core.getMessage("tooltipOpen");

      if(document.getElementById("bookmark"))
      {
         document.getElementById("bookmark").title = core.getMessage("tooltipBookmark");
      }

      if(document.getElementById("donate"))
      {
         document.getElementById("donate").title = core.getMessage("tooltipDonate");
      }

      if(document.getElementById("help"))
      {
         document.getElementById("help").title = core.getMessage("tooltipHelp");
      }

      if(document.getElementById("font_less"))
      {
         document.getElementById("font_less").title = core.getMessage("tooltipFontLess");
      }

      if(document.getElementById("font_more"))
      {
         document.getElementById("font_more").title = core.getMessage("tooltipFontMore");
      }

      if(document.getElementById("reading_style"))
      {
         document.getElementById("reading_style").title = core.getMessage("tooltipReadingStyle");
      }

      if(document.getElementById("download"))
      {
         document.getElementById("download").title = core.getMessage("tooltipSave");
      }

      if(document.getElementById("preferences"))
      {
         document.getElementById("preferences").title = core.getMessage("tooltipPref");
      }
   },

   setBookmarkFinished: function(text)
   {
      reader.showMessage(text);
      window.setTimeout(function(){reader.closeMessage();reader.toggleTools(false);}, 1000);
   },

   isTouchFunc: function()
   {
      return true;
   },

   dragOver: function(e)
   {
      e.preventDefault();
      document.getElementById("open").style.borderColor = "#fff";
   },

   dragLeave: function(e)
   {
      e.preventDefault;
      document.getElementById("open").style.borderColor = "#ccc";
   },

   drop: function(e)
   {
      e.preventDefault();
      core.initReading(e.dataTransfer.files[0], core.origin_disk);
   },

   getMarginDefault: function()
   {
      if(core.isAndroid)
      {
         var margin = 4;
      }
      else
      {
         var margin = 6;
      }

      return margin;
   },

   getFontSizeDefault: function()
   {
      if(core.isAndroid)
      {
         var fontSize = 10;
      }
      else
      {
         var fontSize = 14;
      }

      return fontSize;
   },

   checkBrowser: function()
   {
      var supported = false;
      var browser = navigator.userAgent;
      var matches = null;

      if((matches = browser.match(/Firefox\/(.*) */)))
      {
         if(parseInt(matches[1]) >= 15)
         {
            supported = true;
         }
      }
      else if((matches = browser.match(/Chrome\/(.*) */)))
      {
         if(!browser.match(/Android/))
         {
            supported = true;
         }
      }

      return supported;
   }
}

var swipe =
{
   fingerCount: 0,
   startX: 0,
   startY: 0,
   curX: 0,
   curY: 0,
   isMoved: false,
   isStopped: false,

   min_length: 72,
   dir_left: 0,
   dir_right: 1,
   dir_up: 2,
   dir_down: 3,

   touchStart: function(event)
   {
	  core.log("touch start. target: " + event.target.tagName);
	  swipe.fingerCount = event.touches.length;

	  if(swipe.fingerCount == 1)
	  {
	     swipe.startX = event.touches[0].pageX;
		 swipe.startY = event.touches[0].pageY;
	  }
	  else
	  {
	     swipe.touchCancel(event);
	  }
   },

   touchMove: function(event)
   {
	  core.log("touch move. target: " + event.target.tagName);
      event.preventDefault();

	  if(event.touches.length == 1)
	  {
	     swipe.curX = event.touches[0].pageX;
		 swipe.curY = event.touches[0].pageY;
		 swipe.isMoved = true;
	  }
	  else
	  {
	     swipe.touchCancel(event);
	  }
   },

   touchEnd: function(event)
   {
	  core.log("touch end: target: " + event.target.tagName + ", fingerCount: " + swipe.fingerCount + ", curX: " + swipe.curX);
      event.preventDefault();

      swipe.isStopped = true;

	  if(swipe.fingerCount == 1 && swipe.curX != 0 )
	  {
	     var length = Math.round(Math.sqrt(Math.pow(swipe.curX - swipe.startX, 2) + Math.pow(swipe.curY - swipe.startY,2)));

		 if(length >= swipe.min_length)
		 {
            var direction = swipe.getDirection();
		    swipe.touchCancel(event);

            if(direction == swipe.dir_left)
            {
               if(core.readingDir == core.reading_dir_ltr)
               {
                  var direction = core.page_forwards;
               }
               else
               {
                  var direction = core.page_backwards;
               }

               core.page(direction);
            }
            else if(direction == swipe.dir_right)
            {
               if(core.readingDir == core.reading_dir_ltr)
               {
                  var direction = core.page_backwards;
               }
               else
               {
                  var direction = core.page_forwards;
               }

               core.page(direction);
            }
		 }
		 else
		 {
		    swipe.touchCancel(event);
		 }
	  }
	  else
	  {
	     swipe.touchCancel(event);
	  }
   },

   touchCancel: function(event)
   {
	  core.log("touch cancel: target: " + event.target.tagName);

	  /* needed for images because no touchend is fired */
	  if(swipe.isMoved == true && swipe.isStopped == false && swipe.fingerCount == 1 && swipe.curX != 0 )
	  {
	     core.log("touchCancel: no stop");

         var direction = swipe.getDirection();

         if(direction == swipe.dir_left)
         {
            if(core.readingDir == core.reading_dir_ltr)
            {
               var direction = core.page_forwards;
            }
            else
            {
               var direction = core.page_backwards;
            }

            core.page(direction);
         }
         else if(direction == swipe.dir_right)
         {
            if(core.readingDir == core.reading_dir_ltr)
            {
               var direction = core.page_backwards;
            }
            else
            {
               var direction = core.page_forwards;
            }

            core.page(direction);
         }
	  }
	  /* simulate click. not for iframes because the coordinates are wrong. */
	  else if(swipe.isMoved == false && event.target.tagName != "IFRAME")
	  {
	     var clickEvent = document.createElement("event");
	     clickEvent.type = "click";
	     clickEvent.pageX = swipe.startX;
	     clickEvent.pageY = swipe.startY;

	     reader.click(clickEvent);
	  }

      swipe.fingerCount = 0;
	  swipe.startX = 0;
	  swipe.startY = 0;
	  swipe.curX = 0;
	  swipe.curY = 0;
	  swipe.isMoved = false;
      swipe.isStopped = false;
   },

   getDirection: function()
   {
      var x = swipe.startX - swipe.curX;
	  var y = swipe.curY - swipe.startY;
	  var z = Math.round(Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)));
	  var r = Math.atan2(y, x);
	  var angle = Math.round(r*180/Math.PI);

	  if(angle < 0)
	  {
	     angle = 360 - Math.abs(angle);
	  }

	  if((angle <= 45 && angle >= 0) || (angle <= 360 && angle >= 315))
	  {
         var direction = swipe.dir_left;
	  }
	  else if(angle >= 135 && angle <= 225)
	  {
         var direction = swipe.dir_right;
	  }
	  else if((angle > 45) && (angle < 135))
	  {
         var direction = swipe.dir_down;
	  }
	  else
	  {
         var direction = swipe.dir_up;
	  }

	  return direction;
   }
}

window['reader'] = reader;
reader['showLoading'] = reader.showLoading;