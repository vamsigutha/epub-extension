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

var core =
{
   logging: false,

   nav_forwards: 1,
   nav_backwards: 2,

   page_none: 0,
   page_forwards: 1,
   page_backwards: 2,
   page_bookmark: 3,

   paging_dir_horizontal: 1,
   paging_dir_vertical: 2,

   reading_dir_ltr: 1,
   reading_dir_rtl: 2,

   origin_web: 1,
   origin_disk: 2,

   exception_encrypted: -1,
   exception_container_missing: -2,
   exception_opf_missing: -3,
   exception_file_missing: -4,
   exception_invalid_xml: -5,
   exception_other: -6,

   zoom_smaller: 1,
   zoom_larger: 2,

   column_gap: 0,
   margin_top_bottom: 6,
   progress_height: 18,

   auto_bookmark_wait: 5000,

   throbber: null,
   spine: null,
   ebook: null,
   origin: null,
   meta: null,
   marginLr: null,
   columnWidth: null,
   pagingDir: null,
   pagingNavDir: null,
   readingDir: null,
   fontFace: null,
   fontSize: null,
   fontColor: null,
   bkgColor: null,
   lineHeight: null,
   loadFonts: null,
   navPosition: 1,
   navBackwardsEnabled: false,
   navForwardsEnabled: false,
   bookmark: null,
   fileStore: null,
   styleStore: null,
   fontStore: null,
   preparePos: 0,
   opf: null,
   id: null,
   root: null,
   url: null,
   hash: null,
   style: null,
   autoBookmarkCounter: 0,
   autoBookmarkActive: false,
   scrollCorrection: true,
   autoScrollBottom: false,
   autoScrollTop: false,
   isEdge: false,
   isChrome: false,
   isAndroid: false,
   isTouch: false,

   init: function()
   {
      core.log("core.init");

      core.isEdge = core.isEdgeFunc();
      core.isChrome = core.isChromeFunc();
      core.isAndroid = core.isAndroidFunc();
      core.isTouch = reader.isTouchFunc();
      zip['workerScriptsPath'] = "js/zip/";

      var extension = browser.extension || chrome.extension;
      core.throbber = extension.getURL("skin/throbber.gif");

      var contentFrame = document.getElementById("content_frame");
      contentFrame.addEventListener("load", core.load, true);

      var navFrame = document.getElementById("nav_frame");
      var height = contentFrame.contentWindow.innerHeight - 1;
      navFrame.style.height = height + "px";

      window.setTimeout(function()
      {
         var browserHeight = document.getElementById("browser").offsetHeight;
         contentFrame.style.height = (browserHeight - core.progress_height) + "px";
      }, 100);

      core.getPreferences();
   },

   initFinished: function()
   {
      reader.init();
   },

   initReading: function(ebook, origin)
   {
      core.log("initReading: " + ebook);

      core.preparePos = 0;
      core.autoBookmarkCounter = 0;
      core.autoBookmarkActive = false;
      core.origin = origin;
      core.fileStore = null;
      core.styleStore = null;
      core.fontStore = null;
      core.opf = null;
      core.meta = null;
      core.id = null;
      core.root = null;
      core.url = null;
      core.hash = null;
      core.spine = null;
      core.bookmark = null;
      core.pagingNavDir = core.page_none;
      document.title = "EPUBReader";

      reader.initReading();
      core.prepare(ebook, null);
   },

   load: function(event)
   {
      core.log("load: " + core.url);

      if(!core.url)
      {
         return;
      }

      var contentFrame = document.getElementById("content_frame");

      contentFrame.contentDocument.addEventListener("keydown", reader.handleKey, true);
      contentFrame.contentWindow.addEventListener("unload", core.unload);
      contentFrame.contentWindow.addEventListener("scroll", core.scroll, true);

      if(!core.isTouch || !core.isAndroid)
      {
         contentFrame.contentDocument.addEventListener("click", reader.click, true);
      }

      if(core.isTouch)
      {
         contentFrame.contentDocument.addEventListener("touchstart", swipe.touchStart, true);
         contentFrame.contentDocument.addEventListener("touchend", swipe.touchEnd, true);
         contentFrame.contentDocument.addEventListener("touchmove", swipe.touchMove, true);
         contentFrame.contentDocument.addEventListener("touchcancel", swipe.touchCancel, true);

         /* needed for android 4.4 and later. otherwise pages with very few text can't be paged by swipe */
         if(core.isAndroid)
         {
            document.addEventListener("touchstart", swipe.touchStart, true);
            document.addEventListener("touchend", swipe.touchEnd, true);
            document.addEventListener("touchmove", swipe.touchMove, true);
            document.addEventListener("touchcancel", swipe.touchCancel, true);
         }
      }

      if(core.pagingDir == core.paging_dir_horizontal)
      {
         contentFrame.contentWindow.addEventListener("resize", core.resize, true);

         if(core.autoScrollTop == true)
         {
            core.autoScrollTop = false;
            contentFrame.contentWindow.scrollTo(0, 0);
         }
         else if(core.autoScrollBottom == true)
         {
            core.autoScrollBottom = false;
            var scrollMaxX = contentFrame.contentWindow.scrollMaxX || contentFrame.contentDocument.documentElement.scrollWidth - contentFrame.contentDocument.documentElement.clientWidth;
            core.log("load: " + scrollMaxX);
            contentFrame.contentWindow.scrollTo(scrollMaxX, 0);
         }
      }

      if(core.bookmark)
      {
         core.goToBookmark(core.bookmark['text']);
         core.bookmark = null;
      }

      if(core.hash)
      {
         contentFrame.contentDocument.location.hash = core.hash;
      }

      imageQueue.init();
      core.modifyPageContent(core.url, core.pagingNavDir);
      core.getPosition(core.url);

      if(core.isTouch)
      {
         var width = contentFrame.contentDocument.documentElement.clientWidth;
         document.getElementById("nav_inner_page_forwards").style.left = (width - 17) + "px";
      }

      core.setProgress();
      reader.enable();
      reader.loadFinished();

      core.autoBookmarkCounter++;
      var counter = core.autoBookmarkCounter;
      window.setTimeout(core.setAutoBookmark, core.auto_bookmark_wait, counter);

      window.setTimeout(function(){contentFrame.contentWindow.focus();}, 100);
   },

   getPosition: function(page)
   {
      page = decodeURI(page);

      if(core.root != "")
      {
         page = page.substring(core.root.length + 1);
      }

      for(var i = 1; i < core.spine.length; i++)
      {
         console.log(core.spine.length);
         var url = decodeURI(core.spine[i]);

         url = url.replace(/[\[\]?+*.{}()]/g, function(a)
         {
            return "\\" + a;
         });

         var reg = new RegExp("^" + url + ".*");

         if(page.match(reg))
         {
            core.navPosition = i;
            break;
         }
      }
   },

   navigateSpine: function(direction)
   {
      core.log("navigateSpine: " + direction);

      if((direction == core.nav_forwards && core.navForwardsEnabled) ||
          (direction == core.nav_backwards && core.navBackwardsEnabled))
      {
         if(direction == core.nav_forwards)
         {
            
            core.navPosition = core.navPosition + 1;
            document.getElementById("pageNumber").innerHTML=`${core.navPosition}/${core.spine.length}`;
            console.log(core.navPosition);
         }
         else if(direction == core.nav_backwards)
         {
            core.navPosition = core.navPosition - 1;
            document.getElementById("pageNumber").innerHTML=`${core.navPosition}/${core.spine.length}`;
            console.log(core.navPosition);
         }
      }

      var url = core.spine[core.navPosition];
      core.loadPage(url);
   },

   page: function(direction)
   {
      core.log("page: direction: " + direction);

      var contentFrame = document.getElementById("content_frame");
      var contentWindow = contentFrame.contentWindow;
      var scrollX = contentWindow.pageXOffset;

      core.pagingNavDir = direction;

      if(core.isAndroid)
      {
         contentFrame.style.overflow = "hidden";
      }

      if(direction == core.page_backwards)
      {
         core.scrollCorrection = false;

         if(core.readingDir == core.reading_dir_ltr)
         {
            var factor = 1;
         }
         else
         {
            var factor = -1;
         }

         contentWindow.scroll(contentWindow.pageXOffset - (contentWindow.innerWidth - core.column_gap) * factor, 0);
      }
      else
      {
         core.scrollCorrection = false;

         if(core.readingDir == core.reading_dir_ltr)
         {
            var factor = 1;
         }
         else
         {
            var factor = -1;
         }

         contentWindow.scroll(contentWindow.pageXOffset + (contentWindow.innerWidth + core.column_gap) * factor, 0);
      }

      if(core.isAndroid)
      {
         contentFrame.style.overflow = "auto";
      }

      core.log("page: scrollX: " + scrollX + ", pageXOffset: " + contentWindow.pageXOffset);

      // new page to load
      if(scrollX == contentWindow.pageXOffset)
      {
         core.log("page: new page to load, direction: " + direction + ", navForwardsEnabled: " + core.navForwardsEnabled + ", navBackwardsEnabled: " + core.navBackwardsEnabled);
         core.scrollCorrection = true;

         if(direction == core.page_forwards)
         {
            if(core.navForwardsEnabled == true)
            {
               core.autoScrollTop = true;
               core.navigateSpine(core.nav_forwards);
            }
         }
         else if(direction == core.page_backwards)
         {
            if(core.navBackwardsEnabled == true)
            {
               core.autoScrollBottom = true;
               core.navigateSpine(core.nav_backwards);
            }
         }
      }
      // no new page to load
      else
      {
         core.displayImages();
         core.displayVideos();
         reader.enable();
      }

      core.autoBookmarkCounter++;
      var counter = core.autoBookmarkCounter;
      window.setTimeout(core.setAutoBookmark, core.auto_bookmark_wait, counter);

      window.setTimeout(function(){contentWindow.focus();}, 100);
   },

   displayImages: function()
   {
      function display(images)
      {
         var contentFrame = document.getElementById("content_frame");
         var height = contentFrame.contentWindow.innerHeight - core.margin_top_bottom*2 - core.progress_height;
         var width = contentFrame.contentWindow.innerWidth;

         for(var i = 0; i < images.length; i++)
         {
            var image = images[i];
            var rect = image.getBoundingClientRect();
            var load = false;

            if(core.pagingDir == core.paging_dir_horizontal)
            {
               if(rect.left >= width * -2 && rect.left <= width * 2)
               {
                  load = true;
               }
            }
            else
            {
               if(rect.top >= height * -2 && rect.top <= height * 2)
               {
                  load = true;
               }
            }

            if(load == true)
            {
               var imageUrl = "";
               var isSvg = false;

               if(image.title)
               {
                  imageUrl = image.title;
               }
               else if(image.getAttribute("xlink:title"))
               {
                  imageUrl = image.getAttribute("xlink:title");
                  isSvg = true;
               }

               if(imageUrl != "")
               {
                  if(core.isAndroid)
                  {
                     if(isSvg == true)
                     {
                        image.setAttribute("xlink:href", core.getImage(imageUrl));
                     }
                     else
                     {
                        image.src = core.getImage(imageUrl);
                     }

                     image.style.backgroundImage = "";
                  }
                  else
                  {
                     image.onload = function(e)
                     {
                        window.URL.revokeObjectURL(this.src);
                     }

	                 var writer = new zip.BlobWriter();
                     var entry = core.fileStore[imageUrl];

                     if(entry)
                     {
                       image.removeAttribute("title");
                       image.removeAttribute("xlink:title");

                       var imageData = {"entry": entry, "writer": writer, "image": image, "height": height, "url": imageUrl};
                       imageQueue.add(imageData);
                     }
                  }
               }
            }
         }
      }

      var contentDocument = document.getElementById("content_frame").contentDocument;

      var images = contentDocument.getElementsByTagName("img");
      display(images);

      var images = contentDocument.getElementsByTagName("image");
      display(images);
   },

   displayVideos: function()
   {
      var contentFrame = document.getElementById("content_frame");
      var width = contentFrame.contentWindow.innerWidth;
      var height = contentFrame.contentWindow.innerHeight - core.margin_top_bottom*2 - core.progress_height;
      var videos = document.getElementsByTagName("video");

      for(var i = 0; i < videos.length; i++)
      {
         var video = videos[i];
         var helper = contentFrame.contentDocument.getElementById(video.src);

         if(helper)
         {
            var rect = helper.getBoundingClientRect();
            var display = false;

            if(core.pagingDir == core.paging_dir_horizontal)
            {
               if(rect.left >= 0 && rect.left <= width * 2)
               {
                  display = true;
               }
            }
            else
            {
               if(rect.bottom >= 0 && rect.bottom <= height * 2)
               {
                  video.style.top = (parseInt(helper.style.top) - contentFrame.contentWindow.pageYOffset) + "px";
                  display = true;
               }
            }

            if(display == true)
            {
               helper.style.backgroundImage = "";
               video.style.display = "";
            }
            else
            {
               video.style.display = "none";
            }
         }
      }
   },

   modifyPageContent: function(url, pagingDir)
   {
      core.log("modifyPageContent: url: " + url + ", pagingDir: " + pagingDir);

      function setMediumSrc(medium, url)
      {
         return function(blob)
         {
            core.log("medium url: " + url + ", core url: " + core.url);

            if(url == core.url)
            {
               var blobUrl = URL.createObjectURL(blob);

               if(medium.tagName.match(/audio/i))
               {
                  core.log("match! -> add audio");
                  var helper = document.getElementById("content_frame").contentDocument.getElementById(medium.getAttribute("src"));
                  medium.src = blobUrl;
                  medium.style.display = "block";
                  medium.parentNode.removeChild(helper);
               }
               else if(medium.tagName.match(/video/i))
               {
                  core.log("match! -> add video");
                  var helper = document.getElementById("content_frame").contentDocument.getElementById(medium.getAttribute("id"));
                  helper.id = blobUrl;
                  medium.src = blobUrl;

                  core.displayVideos();
               }
            }
            else
            {
               core.log("no match!");
            }
         }
      }

      function prepareMedia(media, root, anchor, baseUrl, pagingDir)
      {
         for(var i = 0; i < media.length; i++)
         {
            var medium = media[i];

            var contentFrame = document.getElementById("content_frame");
            var width = contentFrame.contentWindow.innerWidth;
            var rect = medium.getBoundingClientRect();
            var mediumUrl = "";
            var mediumUrlMaybe = "";

            if(medium.getAttribute("src"))
            {
               mediumUrl = medium.getAttribute("src");
            }
            else
            {
               for(var j = 0; j < medium.childNodes.length; j++)
               {
                  var node = medium.childNodes[j];

                  if(node.tagName && node.tagName.match(/source/i))
                  {
                     var canPlay = medium.canPlayType(node.getAttribute("type"));

                     if(canPlay == "probably")
                     {
                        mediumUrl = node.getAttribute("src");
                        break;
                     }
                     else if(canPlay == "maybe")
                     {
                        mediumUrlMaybe = node.getAttribute("src");
                     }
                  }
               }

               if(mediumUrl == "" && mediumUrlMaybe != "")
               {
                  mediumUrl = mediumUrlMaybe;
               }
            }

            if(mediumUrl != "")
            {
               if(root != "")
               {
                  mediumUrl = root + "/" + mediumUrl;
               }

               anchor.href = baseUrl + mediumUrl;
               mediumUrl = anchor.href.substring(baseUrl.length);
               medium.src = mediumUrl;

               var writer = new zip.BlobWriter();
               var entry = core.fileStore[mediumUrl];

               if(entry)
               {
                  if(medium.tagName.match(/audio/i))
                  {
                     var doc = document.getElementById("content_frame").contentDocument;
                     var helper = doc.createElement("div");
                     helper.style.width = medium.offsetWidth + "px";
                     helper.style.height = medium.offsetHeight + "px";
                     helper.style.top = medium.offsetTop + "px";
                     helper.style.left = medium.offsetLeft + "px";
                     helper.style.backgroundImage = "url('" + core.throbber + "')";
                     helper.style.backgroundRepeat = "no-repeat";
                     helper.style.backgroundPosition = "center center";
                     helper.id = medium.getAttribute("src");

                     medium.parentNode.appendChild(helper);
                     medium.style.display = "none";
                  }
                  else if(medium.tagName.match(/video/i))
                  {
                     var video = document.createElement("video");
                     video.style.width = medium.offsetWidth + "px";
                     video.style.height = medium.offsetHeight + "px";
                     video.style.top = medium.offsetTop + 10 + "px";
                     video.style.left = medium.offsetLeft + "px";
                     video.style.position = "absolute";
                     video.style.zIndex = 200;
                     video.style.display = "none";
                     video.id = medium.getAttribute("src");
                     video["controls"] = "true";

                     if(medium.getAttribute("autoplay"))
                     {
                        video["autoplay"] = "true";
                     }

                     document.getElementById("videos").appendChild(video);

                     var doc = document.getElementById("content_frame").contentDocument;
                     var helper = doc.createElement("div");
                     helper.style.width = medium.offsetWidth + "px";
                     helper.style.height = medium.offsetHeight + "px";
                     helper.style.top = medium.offsetTop + "px";
                     helper.style.backgroundImage = "url('" + core.throbber + "')";
                     helper.style.backgroundRepeat = "no-repeat";
                     helper.style.backgroundPosition = "center center";
                     helper.style.margin = "0px auto";
                     helper.id = medium.getAttribute("src");

                     medium.parentNode.replaceChild(helper, medium);
                     medium = video;
                  }

                  entry.getData(writer, setMediumSrc(medium, core.url));
               }
            }
         }
      }

      function prepareImages(images, root, anchor, baseUrl, pagingDir)
      {
         var contentFrame = document.getElementById("content_frame");
         var height = contentFrame.contentWindow.innerHeight - core.margin_top_bottom*2 - core.progress_height;
         var width = contentFrame.contentWindow.innerWidth;

         for(var i = 0; i < images.length; i++)
         {
            var image = images[i];
            var isSvg = false;

            if(image.tagName.match(/image/i))
            {
               isSvg = true;
            }

            if(isSvg == true)
            {
               var imageUrl = image.getAttribute("xlink:title");
            }
            else
            {
               var imageUrl = image.title;
            }

            if(root != "")
            {
               imageUrl = root + "/" + imageUrl;
            }

            anchor.href = baseUrl + imageUrl;
            imageUrl = decodeURI(anchor.href.substring(baseUrl.length));

            var rect = image.getBoundingClientRect();
            var load = false;

            if(core.pagingDir == core.paging_dir_horizontal)
            {
               if(rect.left >= width * -2 && rect.left <= width * 2)
               {
                  load = true;
               }
            }
            else
            {
               if(rect.top >= height * -2 && rect.top <= height * 2)
               {
                  load = true;
               }
            }

            if(load == true)
            {
               if(core.isAndroid)
               {
                  if(isSvg == true)
                  {
                     image.setAttribute("xlink:href", core.getImage(imageUrl));
                  }
                  else
                  {
                     image.src = core.getImage(imageUrl);
                  }

                  image.style.backgroundImage = "";
               }
               else
               {
                  image.onload = function(e)
                  {
                     window.URL.revokeObjectURL(this.src);
                  }

	              var writer = new zip.BlobWriter();
                  var entry = core.fileStore[imageUrl];

                  if(entry)
                  {
                     image.removeAttribute("title");
                     image.removeAttribute("xlink:title");

                     var imageData = {"entry": entry, "writer": writer, "image": image, "height": height, "url": imageUrl};
                     imageQueue.add(imageData);
                  }
               }
            }
            else
            {
               if(isSvg == true)
               {
                  image.setAttribute("xlink:title", imageUrl);
               }
               else
               {
                  image.setAttribute("title", imageUrl);
               }
            }
         }
      }

      function setLinkAction(link)
      {
         return function(e)
         {
            e.preventDefault();

            var currentPage = core.spine[core.navPosition];
            var page = link.getAttribute("href");

            if(page.indexOf("#") == 0)
            {
               page = currentPage + page;
            }
            else if(currentPage.lastIndexOf("/") != -1)
            {
               var path = currentPage.substring(0, currentPage.lastIndexOf("/"));
               page = path + "/" + page;
            }

            anchor.href = baseUrl + page;
            page = anchor.href.substring(baseUrl.length);

            core.loadPage(page);
         }
      }

      function prepareLinks(links)
      {
         for(var i = 0; i < links.length; i++)
         {
            if(links[i].href.match(/http.*/) && !core.isAndroid)
            {
               links[i].target = "_blank";
            }
            else
            {
               links[i].onclick = setLinkAction(links[i]);
            }
         }
      }

      var contentFrame = document.getElementById("content_frame");
      var root = url.substring(0, url.lastIndexOf("/"));
      var baseUrl = "http://base/";
      var anchor = contentFrame.contentDocument.createElement("a");

      var links = contentFrame.contentDocument.getElementsByTagNameNS("*", "a");
      prepareLinks(links);

      var images = contentFrame.contentDocument.getElementsByTagNameNS("*", "img");
      prepareImages(images, root, anchor, baseUrl, pagingDir);

      var images = contentFrame.contentDocument.getElementsByTagNameNS("*", "image");
      prepareImages(images, root, anchor, baseUrl, pagingDir);

      var audios = contentFrame.contentDocument.getElementsByTagNameNS("*", "audio");
      prepareMedia(audios, root, anchor, baseUrl, pagingDir);

      var videos = contentFrame.contentDocument.getElementsByTagNameNS("*", "video");
      prepareMedia(videos, root, anchor, baseUrl, pagingDir);

      core.setStyle();

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
   },

   prepare: function(ebook, content)
   {
      if(core.preparePos == 0)
      {
         core.log("preparePos 0");
         core.preparePos++;
         core.ebook = ebook;

         if(core.isAndroid)
         {
            core.prepare(ebook, null);
         }
         else
         {
            core.checkArchive(ebook, core.prepare);
         }
      }
      else if(core.preparePos == 1)
      {
         core.log("preparePos 1");
         core.preparePos++;

         try
         {
            core.readArchive(ebook, core.prepare);
         }
         catch(e)
         {
            if(e == core.exception_file_missing)
            {
               reader.onError();
               reader.showMessage(app.msg.error_file_missing);
            }
         }
      }
      else if(core.preparePos == 2)
      {
         core.log("preparePos 2");

         try
         {
            if(!core.fileStore["META-INF/container.xml"] && !core.fileStore["meta-inf/container.xml"])
            {
               throw core.exception_container_missing;
            }

            if(core.fileStore["META-INF/encryption.xml"] || core.fileStore["meta-inf/encryption.xml"])
            {
               if(core.fileStore["META-INF/encryption.xml"])
               {
                  core.preparePos++;
                  core.getContent(core.fileStore["META-INF/encryption.xml"], core.prepare);
               }
               else if(core.fileStore["meta-inf/encryption.xml"])
               {
                  core.preparePos++;
                  core.getContent(core.fileStore["meta-inf/encryption.xml"], core.prepare);
               }
            }
            else
            {
               if(core.fileStore["META-INF/container.xml"])
               {
                  core.preparePos = core.preparePos + 2;
                  core.getContent(core.fileStore["META-INF/container.xml"], core.prepare);
               }
               else
               {
                  core.preparePos = core.preparePos + 2;
                  core.getContent(core.fileStore["meta-inf/container.xml"], core.prepare);
               }
            }
         }
         catch(e)
         {
            reader.onError();

            if(e == core.exception_container_missing)
            {
               reader.showMessage(core.getMessage("errorInvalid"));
            }
            else
            {
               reader.showMessage(core.getMessage("errorOther"), "prepare 2: " + e);
            }

            if(core.isAndroid)
            {
               app.handleError(core.ebook);
            }
         }
      }
      else if(core.preparePos == 3)
      {
         core.log("preparePos 3");

         try
         {
            var parser = new DOMParser();
            content = content.replace(/xml version="1\.1"/, 'xml version="1.0"');

            var encrypted = false;
            var encryption = parser.parseFromString(content, "text/xml");
            var encryptedData = encryption.getElementsByTagNameNS("*", "EncryptedData");

            for(var i = 0; i < encryptedData.length; i++)
            {
               var keyInfo = encryptedData[i].getElementsByTagNameNS("*", "KeyInfo");

               if(keyInfo.length > 0)
               {
                  encrypted = true;
                  break;
               }
            }

            if(encrypted == true)
            {
               throw core.exception_encrypted;
            }

            if(core.fileStore["META-INF/container.xml"])
            {
               core.preparePos++;
               core.getContent(core.fileStore["META-INF/container.xml"], core.prepare);
            }
            else
            {
               core.preparePos++;
               core.getContent(core.fileStore["meta-inf/container.xml"], core.prepare);
            }
         }
         catch(e)
         {
            reader.onError();

            if(e == core.exception_encrypted)
            {
               reader.showMessage(core.getMessage("errorEncrypted"));
            }
            else
            {
               reader.showMessage(core.getMessage("errorOther"), "prepare 3: " + e);
            }

            if(core.isAndroid)
            {
               app.handleError(core.ebook);
            }
         }
      }
      else if(core.preparePos == 4)
      {
         core.log("preparePos 4");

         try
         {
            var parser = new DOMParser();

            content = content.replace(/xml version="1\.1"/, 'xml version="1.0"');

            var container = parser.parseFromString(content, "text/xml");
            var rootfile = container.getElementsByTagNameNS("*", "rootfile")[0];
            var opffile = rootfile.getAttribute("full-path");

            core.root = opffile.substring(0, opffile.lastIndexOf("/"));

            if(!core.fileStore[opffile])
            {
               throw core.exception_opf_missing;
            }

            core.preparePos++;
            core.getContent(core.fileStore[opffile], core.prepare);
         }
         catch(e)
         {
            reader.onError();

            if(e == core.exception_opf_missing)
            {
               reader.showMessage(core.getMessage("errorInvalid"));
            }
            else
            {
               reader.showMessage(core.getMessage("errorOther"), "prepare 4: " + e);
            }

            if(core.isAndroid)
            {
               app.handleError(core.ebook);
            }
         }
      }
      else if(core.preparePos == 5)
      {
         core.log("preparePos 5");

         try
         {
            var parser = new DOMParser();
            var opfData = content.replace(/xml version="1\.1"/, 'xml version="1.0"');

            core.opf = parser.parseFromString(opfData, "text/xml");
            var mypackage = core.opf.getElementsByTagNameNS("*", "package")[0];
            var metadata = core.opf.getElementsByTagNameNS("*", "metadata")[0];
            var manifest = core.opf.getElementsByTagNameNS("*", "manifest")[0];
            var spine = core.opf.getElementsByTagNameNS("*", "spine")[0];

            core.id = CryptoJS.MD5(content);
            core.log("preparePos: id: " + core.id);

            var toc = spine.getAttribute("toc");

            if(!toc)
            {
               toc = "ncx";
            }

            var itemref = spine.getElementsByTagNameNS("*", "itemref")[0];
            var idFirst = itemref.getAttribute("idref");

            var items = manifest.getElementsByTagNameNS("*", "item");

            for(var i = 0; i < items.length; i++)
            {
               var id = items[i].getAttribute("id");

               if(id == idFirst)
               {
                  var hrefFirst = items[i].getAttribute("href");
               }
               else if(id == toc)
               {
                  var hrefNcx = items[i].getAttribute("href");
               }
            }

            var epub = [];

            try
            {
               var title = metadata.getElementsByTagNameNS("*", "title")[0].childNodes[0].nodeValue;
            }
            catch(e)
            {
            }

            if(title)
            {
               epub['title'] = title;
            }
            else
            {
               epub['title'] = "Unknown";
            }

            try
            {
               var author = metadata.getElementsByTagNameNS("*", "creator")[0].getAttribute("opf:file-as");
            }
            catch(e)
            {
            }

            if(!author)
            {
               try
               {
                  var author = metadata.getElementsByTagNameNS("*", "creator")[0].childNodes[0].nodeValue;
               }
               catch(e)
               {
               }
            }

            if(author)
            {
               epub['author'] = author;
            }
            else
            {
               epub['author'] = "Anonymous";
            }

            core.meta = epub;

            var title = epub['title'].replace(/["']/g, "") + " - " + epub['author'].replace(/["']/g, "");
            document.title = title;

            core.preparePos++;

            if(hrefNcx)
            {
               if(core.root != "")
               {
                  hrefNcx = core.root + "/" + hrefNcx;
               }

               if(hrefNcx in core.fileStore)
               {
                  core.getContent(core.fileStore[hrefNcx], core.prepare);
               }
               else
               {
                  core.prepare(null, null);
               }
            }
            else
            {
               core.prepare(null, null);
            }
         }
         catch(e)
         {
            reader.onError();
            reader.showMessage(core.getMessage("errorOther"), "prepare 5: " + e);

            if(core.isAndroid)
            {
               app.handleError(core.ebook);
            }
         }
      }
      else if(core.preparePos == 6)
      {
         core.log("preparePos 6");

         try
         {
            var html =
            {
               get: function(pointsToc, error, template)
               {
                  template = template.replace(/%root%/, "");

                  var repeat_begin = "%repeat-begin-toc%";
                  var repeat_end = "%repeat-end-toc%";
                  var repeat = template.substring(template.search(new RegExp(repeat_begin)) + repeat_begin.length, template.search(new RegExp(repeat_end)));

                  var error_begin = "%begin-error%";
                  var error_end = "%end-error%";
                  var errorTemplate = template.substring(template.search(new RegExp(error_begin)) + error_begin.length, template.search(new RegExp(error_end)));

                  var content = "";

                  if(error == true)
                  {
/*
                     var msg = this.getProperty("core.info.error_toc");
                     var element = errorTemplate;

                     element = element.replace(/%nav_error%/, msg);

                     content = content + element;
*/
                  }

                  for(var i = 0; i < pointsToc.length; i++)
                  {
                     var spacer = "";
                     var fontSize;

                     for(var j = 1; j < pointsToc[i]['level']; j++)
                     {
                        spacer = spacer + "&nbsp;&nbsp;&nbsp;";
                     }

                     if(pointsToc[i]['level'] == 1)
                     {
                        var level = "firstLevel";
                     }
                     else
                     {
                        var level = "childLevel";
                     }

                     var element = repeat;
                     element = element.replace(/%spacer%/, spacer);
                     element = element.replace(/%level%/, level);
                     element = element.replace(/%indent%/, ((pointsToc[i]['level'] - 1) * 15) + 10);
                     element = element.replace(/%id%/g, pointsToc[i]['content']);
                     element = element.replace(/%desc%/, pointsToc[i]['label']);

                     content = content + element;
                  }

                  template = template.replace(/%begin-error%(.|\s)*%repeat-end-toc%/, content);
                  return template;
               }
            }

            var error = false;

            if(content)
            {
               try
               {
                  var parser = new DOMParser();

                  content = content.replace(/xml version="1\.1"/, 'xml version="1.0"');
                  content = content.replace(/&(?!amp;)([a-z]+;)/gi, "&amp;$1");
                  content = content.replace(/&(?![a-z]+;)/gi, "&amp;");

                  var nav = parser.parseFromString(content, "text/xml");
                  var navMap = nav.getElementsByTagNameNS("*", "navMap")[0];
                  var navPoints = navMap.getElementsByTagNameNS("*", "navPoint");
               }
               catch(e)
               {
                  //mylog.log(e);
                  error = true;
               }
            }

            var pointsToc = [];

            if(navPoints && navPoints.length > 0)
            {
               var pointCounter = 0;

               for(var i = 0; i < navPoints.length; i++)
               {
                  try
                  {
                     var label = navPoints[i].getElementsByTagNameNS("*", "navLabel")[0]
                                 .getElementsByTagNameNS("*", "text")[0].textContent;

                     var content = navPoints[i].getElementsByTagNameNS("*", "content")[0].getAttribute("src");
                     var navPoint = navPoints[i];
                     var point = [];

                     for(var j = 1; j < 10; j++)
                     {
                        var parent = navPoint.parentNode;

                        if(!parent.nodeName.match("navPoint"))
                        {
                           point['level'] = j;
                           break;
                        }
                        else
                        {
                           navPoint = parent;
                        }
                     }

                     point['label'] = label;
                     point['content'] = content;

                     pointsToc[pointCounter] = point;
                     pointCounter++;
                  }
                  catch(e)
                  {
                  }
               }
            }
            else
            {
               var spine = core.opf.getElementsByTagNameNS("*", "spine")[0];
               var itemrefs = spine.getElementsByTagNameNS("*", "itemref");

               var manifest = core.opf.getElementsByTagNameNS("*", "manifest")[0];
               var items = manifest.getElementsByTagNameNS("*", "item");

               var pointCounter = 0;

               for(var i = 0; i < itemrefs.length; i++)
               {
                  for(var j = 0; j < items.length; j++)
                  {
                     var idref = itemrefs[i].getAttribute("idref");
                     var id = items[j].getAttribute("id");

                     if(idref == id)
                     {
                        var href = items[j].getAttribute("href");
                        var point = [];

                        point['label'] = (i+1).toString() + ".";
                        point['content'] = href;
                        point['level'] = 1;

                        pointsToc[pointCounter] = point;
                        pointCounter++;
                        break;
                     }
                  }
               }
            }

            var spine = core.opf.getElementsByTagNameNS("*", "spine")[0];
            var itemrefs = spine.getElementsByTagNameNS("*", "itemref");

            var manifest = core.opf.getElementsByTagNameNS("*", "manifest")[0];
            var items = manifest.getElementsByTagNameNS("*", "item");

            core.spine = new Array();
            var pointCounter = 1;

            for(var i = 0; i < itemrefs.length; i++)
            {
               for(var j = 0; j < items.length; j++)
               {
                  var idref = itemrefs[i].getAttribute("idref");
                  var id = items[j].getAttribute("id");

                  if(idref == id)
                  {
                     var href = items[j].getAttribute("href");
                     core.spine[pointCounter] = href;
                     pointCounter++;
                     break;
                  }
               }
            }

            var navContent = html.get(pointsToc, error, reader.navTemplate);
            var navFrame = document.getElementById("nav_frame");
            navFrame.innerHTML = core.makeHtmlSafe(navContent);

            var doc = navFrame.contentDocument.open("text/html");
            doc.write(navContent);
            doc.close(navContent);

            var doc = navFrame.contentDocument;
            var tds = doc.getElementsByTagNameNS("*", "td");

            for(var i = 0; i < tds.length; i++)
            {
               var td = tds[i];
               var id = td.getAttribute("id");
               td.addEventListener("click", core.navigate);
            }

            var close = doc.getElementById("closetoc");

            if(close)
            {
               close.addEventListener("click", reader.toggleNavigationbar);
            }

            core.preparePos++;

            if(core.isAndroid)
            {
               var bookmark = Android.getBookmark(core.ebook);
               core.log("bookmark: " + bookmark);
               core.prepare(bookmark, null);
            }
            else
            {
               var key = "bookmark_" + core.id;
               var storage = chrome.storage || browser.storage;
               storage.local.get(key, core.prepare);
            }
         }
         catch(e)
         {
            core.log(e);
            reader.onError();
            reader.showMessage(core.getMessage("errorOther"), "prepare 6: " + e);

            if(core.isAndroid)
            {
               app.handleError(core.ebook);
            }
         }
      }
      else if(core.preparePos == 7)
      {
         core.log("preparePos 7");

         try
         {
            var bookmark = ebook;

            if(typeof bookmark === "object")
            {
               for(key in bookmark)
               {
                  var value = bookmark[key];
                  core.log("preparePos: key: " + key + " value: " + value);
               }

               bookmark = value;
            }

            if(bookmark)
            {
               var bookmark = JSON.parse(bookmark);
               core.log("prepare: bookmarktext: " + bookmark['text']);
               core.bookmark = bookmark;

               var startPage = core.spine[core.bookmark['spine']];
               core.log("prepare: spine: " + core.bookmark['spine'] + ", bookmarkpage: " + startPage);

               core.pagingNavDir = core.page_bookmark;
               core.navPosition = core.bookmark['spine'];
            }
            else
            {
               var startPage = core.spine[1];
               core.navPosition = 1;
               core.autoScrollTop = true;
            }

            core.loadPage(startPage);
            reader.enable();
         }
         catch(e)
         {
            core.log(e);
            reader.onError();
            reader.showMessage(core.getMessage("errorOther"), "prepare 7: " + e);

            if(core.isAndroid)
            {
               app.handleError(core.ebook);
            }
         }
      }
   },

   navigate: function(event)
   {
      var url = decodeURIComponent(event.target.getAttribute("id"));
      core.log("navigate:" + url);

      reader.showLoading();
      core.autoScrollTop = true;

      if(core.isAndroid)
      {
         var wait = 100;
      }
      else
      {
         var wait = 0;
      }

      window.setTimeout(function(){core.loadPage(url);reader.toggleNavigationbar();}, wait);
   },

   checkArchive: function(ebook, callback)
   {
      var readerCheck = new FileReader();

      readerCheck.onloadend = function(evt)
      {
         if(evt.target.readyState == FileReader.DONE)
         {
            var data = evt.target.result;
            var view = new DataView(data);
            var check = [80,75];
            var no_match = false;

            for(var i = 0; i < check.length; i++)
            {
               if(view.getInt8(i) != check[i])
               {
                  no_match = true;
                  break;
               }
            }

            if(no_match == false)
            {
               callback(ebook, null);
            }
            else
            {
               reader.onError();
               reader.showMessage(core.getMessage("errorUnzip"));
            }
         }
         else
         {
            reader.onError();
            reader.showMessage(core.getMessage("errorUnzip"));
         }
      }

      var blob = ebook.slice(0, 2);
      readerCheck.readAsArrayBuffer(blob);
   },

   readArchive: function(ebook, callback)
   {
      function finalizeStyles()
      {
         for(style in core.styleStore)
         {
            var text = core.styleStore[style];

            if(fontCounter > 0)
            {
               var text = text.replace(/(@font-face\s*\{[^}]*url\([\s"']*)([^"')]*)([\s"']*\)[^}]*\})/gi, function(a, b, c, d)
               {
                  var split = c.split("/");
                  var font = core.fontStore[split[split.length - 1]];

                  if(font)
                  {
                     core.log("readArchive: font replaced: " + split[split.length - 1]);
                     return b + font + d;
                  }
                  else
                  {
                     core.log("readArchive: font not found in fontstore: " + split[split.length - 1]);
                     return a;
                  }
               });
            }

            var blob = new Blob([text], {type: 'text/css'});
            var blobUrl = URL.createObjectURL(blob);
            core.styleStore[style] = blobUrl;
         }

         callback(null, null);
      }

      function fontCallback(font)
      {
         return function(blob)
         {
            var blobUrl = URL.createObjectURL(blob);
            core.fontStore[font] = blobUrl;
            fontStoreCounter++;

            if(fontStoreCounter == fontCounter)
            {
               finalizeStyles();
            }
         }
      }

      function loadFonts()
      {
         for(font in core.fontStore)
         {
            var found = false;

            for(file in core.fileStore)
            {
               var regexp = new RegExp(font);

               if(file.match(regexp))
               {
                  found = true;
                  var writer = new zip.BlobWriter();
                  core.fileStore[file].getData(writer, fontCallback(font));
                  break;
               }
            }

            if(found == false)
            {
               fontCounter--;
               core.log("readArchive: font not found in epub: " + font);

               if(fontStoreCounter == fontCounter)
               {
                  finalizeStyles();
               }
            }
         }
      }

      function styleCallback(fileName)
      {
         return function(text)
         {
            core.styleStore[fileName] = text;
            styleStoreCounter++;

            if(core.loadFonts == true)
            {
               text.replace(/@font-face\s*\{[^}]*url\([\s"']*([^"')]*)[\s"']*\)[^}]*\}/gi, function(a, b)
               {
                  var split = b.split("/");

                  if(!(split[split.length - 1] in core.fontStore))
                  {
                     core.log("font found: " + split[split.length - 1]);
                     fontCounter++;
                     core.fontStore[split[split.length - 1]] = "";
                  }
               });
            }

            if(styleStoreCounter == styleCounter)
            {
               if(fontCounter == 0)
               {
                  finalizeStyles();
               }
               else
               {
                  loadFonts();
               }
            }
         }
      }

      function entriesCallback(entries)
      {
         for(var i = 0; i < entries.length; i++)
         {
            if(entries[i].filename.match(/\.css/))
            {
               styleCounter++;
            }
         }

         for(var i = 0; i < entries.length; i++)
         {
            if(entries[i].filename.match(/\.css/))
            {
               var writer = new zip.TextWriter("text/css");
               entries[i].getData(writer, styleCallback(entries[i].filename));
            }
            else
            {
               core.log("readArchive: add to fileStore: file: " + entries[i].filename);
               core.fileStore[entries[i].filename] = entries[i];
            }
         }

         if(styleCounter == 0)
         {
            callback(null, null);
         }
      }

      function entriesError()
      {
         //reader.onError();
         //reader.showMessage(reader.msg.error_unzip);
      }

      core.fileStore = [];

      core.styleStore = [];
      var styleStoreCounter = 0;
      var styleCounter = 0;

      core.fontStore = [];
      var fontStoreCounter = 0;
      var fontCounter = 0;

      if(core.isAndroid)
      {
         var entries = Android.getZipEntries(ebook);

         if(entries != "")
         {
            entries = JSON.parse(entries);

            for(var i = 0; i < entries.length; i++)
            {
               core.fileStore[entries[i]] = entries[i];

               if(entries[i].match(/\.css/))
               {
                  var css = Android.getZipContent(entries[i]);
                  core.styleStore[entries[i]] = css;
               }
            }

            callback(null, null);
         }
         else
         {
            throw core.exception_file_missing;
         }
      }
      else
      {
         var reader = new zip.BlobReader(ebook);
         zip.createReader(reader, function(zipReader){zipReader.getEntries(entriesCallback);}, entriesError);
      }
   },

   getContent: function(entry, callback)
   {
      core.log("getContent: file " + entry.filename);

      if(core.isAndroid)
      {
         core.log("getContent: " + entry);
         var text = Android.getZipContent(entry);
         callback(null, text);
      }
      else
      {
         var writer = new zip.TextWriter();
	     entry.getData(writer, writerCallback);
	  }

      function writerCallback(text)
      {
         callback(null, text);
      }
   },

   getImage: function(image)
   {
      core.log("getImage: " + image);

      var src = Android.getZipContent(decodeURI(image));

      if(image.match(/\.gif/gi))
      {
         var mime = "gif";
      }
      else if(image.match(/\.png/gi))
      {
         var mime = "png";
      }
      else if(image.match(/(\.jpeg|\.jpg|\.jpe)/gi))
      {
         var mime = "jpeg";
      }

      src = "data:image/" + mime + ";base64," + src;
      return src;
   },

   loadPage: function(url)
   {
      parts = url.split("#");
      url = parts[0];

      if(core.root != "")
      {
         url = core.root + "/" + url;
      }

      var doc = document.getElementById("content_frame").contentDocument;
      var anchor = doc.createElement("a");
      var baseUrl = "http://base/";
      anchor.href = baseUrl + url;
      url = anchor.href.substring(baseUrl.length);

      core.log("loadPage: " + decodeURI(url));

      if(!core.fileStore[decodeURI(url)])
      {
         core.log("loadPage: url not found in fileStore");
         reader.onError();
         reader.showMessage(core.getMessage("errorInvalid"));
         return;
      }

      reader.loadBegin();
      core.url = url;

      if(parts[1])
      {
         core.hash = "#" + parts[1];
      }
      else
      {
         core.hash = null;
      }

      if(core.isAndroid)
      {
         var text = Android.getZipContent(decodeURI(url));
         writerCallbackText(text);
      }
      else
      {
         var writer = new zip.TextWriter("text/html");
         var entry = core.fileStore[decodeURI(url)];
	     entry.getData(writer, writerCallbackText);
	  }

      function writerCallbackText(text)
      {
         function prepareImages(images)
         {
            for(var i = 0; i < images.length; i++)
            {
               var image = images[i];

               if(image.tagName.match(/img/i))
               {
                  var src = image.getAttribute("src");
                  image.setAttribute("title", src);
               }
               else if(image.tagName.match(/image/i))
               {
                  var src = image.getAttribute("xlink:href");
                  image.setAttribute("xlink:title", src);
               }

               image.style.backgroundImage = "url('" + core.throbber + "')";
               image.style.backgroundRepeat = "no-repeat";
               image.style.backgroundPosition = "center center";
            }
         }

         try
         {
            var parser = new DOMParser();
            var serializer = new XMLSerializer();

            var contentFrame = document.getElementById("content_frame");
            var doc = parser.parseFromString(text, "text/xml");

            if(doc.documentElement.tagName == "parsererror")
            {
               throw core.exception_invalid_xml;
            }

            try
            {
               var lang = doc.documentElement.getAttribute("xml:lang");

               if(lang)
               {
                  doc.documentElement.setAttribute("lang", lang);
               }
            }
            catch(e)
            {
               core.log("loadPage: " + e);
            }

            var images = doc.getElementsByTagNameNS("*", "img");
            prepareImages(images);

            var images = doc.getElementsByTagNameNS("*", "image");
            prepareImages(images);

            var links = doc.getElementsByTagNameNS("*", "link");

            for(var i = 0; i < links.length; i++)
            {
               var link = links[i];

               if(link.getAttribute("type") == "text/css")
               {
                  var styleUrl = link.getAttribute("href");
                  styleUrl = styleUrl.substr(styleUrl.lastIndexOf("/") + 1);

                  for(fileName in core.styleStore)
                  {
                     var pattern = new RegExp(styleUrl);

                     if(fileName.match(pattern))
                     {
                        if(core.isAndroid)
                        {
                           var style = doc.createElement("style");
                           style.setAttribute("type", "text/css");
                           style.textContent = core.styleStore[fileName];

                           link.parentNode.replaceChild(style, link);
                        }
                        else
                        {
                           var url = core.styleStore[fileName];
                           link.setAttribute("href", url);
                        }

                        break;
                     }
                  }
               }
            }

            if(core.pagingDir == core.paging_dir_horizontal)
            {
               var height = contentFrame.contentWindow.innerHeight;
               doc.documentElement.style.height = (height - core.margin_top_bottom*2 - core.progress_height) + "px";
               doc.documentElement.style.overflow = "hidden";
            }

            var head = doc.getElementsByTagNameNS("*", "head")[0];

            if(!head)
            {
               head = doc.createElement("head");
               doc.documentElement.insertBefore(head, doc.documentElement.firstChild);
            }
            else
            {
               var metas = head.getElementsByTagNameNS("*", "meta");

               for(var i = metas.length - 1; i >= 0; i--)
               {
                  var remove = false;

                  if(metas[i].hasAttribute("charset"))
                  {
                     remove = true;
                  }
                  else if(metas[i].hasAttribute("http-equiv") &&
                          metas[i].getAttribute("http-equiv").match(/content-type/i))
                  {
                     remove = true;
                  }

                  if(remove == true)
                  {
                     head.removeChild(metas[i]);
                  }
               }
            }

            var meta = doc.createElement("meta");
            meta.setAttribute("charset", "utf-8");
            head.insertBefore(meta, head.firstChild);

            var css = doc.createElement('style');
            css.setAttribute("type", "text/css");
            css.setAttribute("id", "epubreader_styles");
            css.textContent = core.getStyle();
            head.appendChild(css);

            var text = serializer.serializeToString(doc);

            if(!core.isEdge && !core.isAndroid)
            {
               text = text.replace(/"/g, "'");
               var data = [text];
               var myBlob = new Blob(data, {"type":"text\/html"});
               var blobUrl = window.URL.createObjectURL(myBlob);
               contentFrame.contentWindow.location = blobUrl;
            }
            else
            {
               var doc = contentFrame.contentDocument.open("text/html");
               doc.write(text);
               doc.close(text);
            }
         }
         catch(e)
         {
            core.log("loadPage: " + e);
            reader.onError();

            if(e == core.exception_invalid_xml)
            {
               reader.showMessage(core.getMessage("errorInvalid"));
            }
            else
            {
               reader.showMessage(core.getMessage("errorOther"), "loadPage: " + e);
            }

            if(core.isAndroid)
            {
               app.handleError(core.ebook);
            }
         }
      }
   },

   unload: function(e)
   {
      core.log("unload");

      var audios = document.getElementById("content_frame").contentDocument.getElementsByTagNameNS("*", "audio");

      for(var i = 0; i < audios.length; i++)
      {
         window.URL.revokeObjectURL(audios[i].src);
      }

      var videos = document.getElementsByTagNameNS("*", "video");
      var videoArray = [];

      for(var i = 0; i < videos.length; i++)
      {
         videoArray.push(videos[i]);
      }

      core.log("videos in array: " + videoArray.length);

      for(var i = 0; i < videoArray.length; i++)
      {
         window.URL.revokeObjectURL(videoArray[i].src);
         document.getElementById("videos").removeChild(videoArray[i]);
      }
   },

   scroll: function()
   {
      var contentFrame = document.getElementById("content_frame");
      var contentWindow = contentFrame.contentWindow;

      if(core.pagingDir == core.paging_dir_horizontal)
      {
         if(core.scrollCorrection == true)
         {
            var pageWidth = contentWindow.innerWidth + core.column_gap;
            var pages = contentWindow.pageXOffset/pageWidth;

            if(pages - Math.floor(contentWindow.pageXOffset/pageWidth) < 0.5)
            {
               pages = Math.floor(contentWindow.pageXOffset/pageWidth);
            }
            else
            {
               pages = Math.ceil(contentWindow.pageXOffset/pageWidth);
            }

            if(contentWindow.pageXOffset/pageWidth != pages)
            {
               if(core.isAndroid)
               {
                  contentFrame.style.overflow = "hidden";
               }

               contentWindow.scrollTo(pages * pageWidth, 0);

               if(core.isAndroid)
               {
                  contentFrame.style.overflow = "hidden";
               }
            }
         }
         else
         {
            core.scrollCorrection = true;
         }

         core.setProgress();
      }
      else
      {
         core.displayImages();
         core.displayVideos();
      }
   },

   resize: function()
   {
      contentFrame = document.getElementById("content_frame");
      navFrame = document.getElementById("nav_frame");

      var height = contentFrame.contentWindow.innerHeight;

      navFrame.style.height = (height - 1) + "px";
      contentFrame.contentDocument.documentElement.style.height = (height - core.margin_top_bottom*2 - core.progress_height) + "px";

      if(core.isTouch)
      {
         var width = contentFrame.contentDocument.documentElement.clientWidth;
         document.getElementById("nav_inner_page_forwards").style.left = (width - 17) + "px";
      }

      var contentWindow = document.getElementById("content_frame").contentWindow;
      contentWindow.location.reload();
   },

   zoomFont: function(direction)
   {
      var storage = chrome.storage || browser.storage;

      if(direction == core.zoom_smaller && core.fontSize > 1)
      {
         core.fontSize = core.fontSize - 1;
      }
      else if(direction == core.zoom_larger && core.fontSize < 30)
      {
         core.fontSize = core.fontSize + 1;
      }

      storage.local.set({"fontSize": core.fontSize});

      core.log(core.fontSize);
      core.resetStyle();
      core.setStyle();
   },

   setAutoBookmark: function(counter)
   {
      core.log(counter + ", " + core.autoBookmarkCounter);

      if(core.autoBookmarkActive == true && counter == core.autoBookmarkCounter)
      {
         core.setBookmark(false);
      }
   },

   setBookmark: function(feedback)
   {
      var storage = chrome.storage || browser.storage;
      var text = core.getBookmarkText();

      var bookmark = {};
      bookmark['spine'] = core.navPosition;
      bookmark['text'] = text;

      core.log("setBookmark: spine: " + bookmark['spine'] + ", text: " + bookmark['text']);

      var bookmark = JSON.stringify(bookmark);
      core.log("setBookmark: stringified: " + bookmark);

      if(core.isAndroid)
      {
         Android.storeBookmark(core.ebook, bookmark);
      }
      else
      {
         var key = "bookmark_" + core.id;
         var obj = {};
         obj[key] = bookmark;
         storage.local.set(obj);
      }

      if(feedback == true)
      {
         reader.setBookmarkFinished(core.getMessage("hintBookmark"));

         var contentFrame = document.getElementById("content_frame");
         contentFrame.contentWindow.focus();
      }
   },

   getBookmarkText: function()
   {
      var contentDocument = document.getElementById("content_frame").contentDocument;
      var element = core.getElement();

      if(element)
      {
         var tagName = element.tagName.toLowerCase();
         var elements = contentDocument.getElementsByTagNameNS("*", tagName);

         for(var i = 0; i < elements.length; i++)
         {
            if(elements[i] == element)
            {
               break;
            }
         }

         text = "<tag name=\"" + tagName + "\" pos=" + i + " />";
      }
      else
      {
         if(core.pagingDir == core.paging_dir_horizontal)
         {
            var scroll = scrollX;
         }
         else
         {
            var scroll = scrollY;
         }

         text = "<scroll dir=" + core.pagingDir + " pos=" + scroll + " />";
      }

      return text;
   },

   getElement: function()
   {
      var contentFrame = document.getElementById("content_frame");
      var contentDocument = contentFrame.contentDocument;
      var width = contentFrame.contentWindow.innerWidth;
      var height = contentFrame.contentWindow.innerHeight;
      var element = null;

      outerLoop:
      for(var y = 0; y < height; y = y + 5)
      {
         for(var x = 0; x < width; x = x + 5)
         {
            var test = contentDocument.elementFromPoint(x, y);

            if(test && test.tagName.match(/.*[^html|body|em|b|strong|i]/i))
            {
               var rect = test.getBoundingClientRect();

               if(rect.left >= 0 && rect.top >= 0)
               {
                  element = test;
                  break outerLoop;
               }
            }
         }
      }

      return element;
   },

   goToBookmark: function(text)
   {
      core.log("goToBookmark: " + text);

      var contentFrame = document.getElementById("content_frame");
      var contentWindow = contentFrame.contentWindow;
      var contentDocument = contentFrame.contentDocument;

      if(text && text != "")
      {
         if(text.match(/<text.*>/))
         {
            var data = text.match(/<text pos=(.*) \/>(.*)/);
            var pos = data[1];
            text = data[2];

            for(var i = 0; i < pos; i++)
            {
               var found = contentWindow.find(text, false, false, false, false, false, false);
            }

            if(found == true)
            {
               if(core.pagingDir == core.paging_dir_horizontal)
               {
                  var selection = contentWindow.getSelection();
                  var range = selection.getRangeAt(0);

                  if("getClientRects" in range)
                  {
                     var body = contentDocument.getElementsByTagNameNS("*", "body")[0];
                     var style = window.getComputedStyle(body, null);
                     var margin = parseInt(style.marginLeft) + parseInt(style.paddingLeft);

                     var rect = range.getClientRects()[0];
                     var scroll = rect.left - margin;

                     var pageWidth = contentWindow.innerWidth + core.column_gap;
                     var pages = Math.floor(scroll/pageWidth);
                     contentWindow.scrollTo(pages * pageWidth, 0);
                  }
                  else
                  {
                     var node = selection.anchorNode;

                     if(node.nodeType == Components.interfaces.nsIDOMNode.TEXT_NODE)
                     {
                        node = node.parentNode;
                     }

                     node.scrollIntoView();

                     var text = selection.anchorNode.textContent;
                     var compare = text.replace(/^\s*/, "");
                     var diff = text.length - compare.length;

                     if(selection.anchorOffset - diff > 0)
                     {
                        //dump("goToBookmark: one page forward\n");
                        var scroll = contentWindow.pageXOffset;
                        var pageWidth = contentWindow.innerWidth + core.column_gap;
                        var pages = Math.floor(scroll/pageWidth);
                        contentWindow.scrollTo((pages + 1) * pageWidth, 0);
                     }
                  }
               }
               else
               {
                  if(contentWindow.scrollY > 0)
                  {
                     contentWindow.scrollByPages(1);
                  }
               }
            }
            else
            {
               return;
            }

            var selection = contentWindow.getSelection();
            selection.removeAllRanges();
         }
         else if(text.match(/<tag.*>$/))
         {
            var data = text.match(/<tag name="(.*)" pos=(.*) .*/);
            var tagName = data[1];
            var pos = parseInt(data[2]);

            var node = contentDocument.getElementsByTagNameNS("*", tagName)[pos];
            node.scrollIntoView();
         }
         else if(text.match(/<scroll.*>$/))
         {
            var data = text.match(/<scroll dir=(.*) pos=(.*) .*/);
            var dir = data[1];
            var pos = data[2];

            if(dir == core.pagingDir)
            {
               if(dir == core.paging_dir_horizontal)
               {
                  contentWindow.scrollTo(pos, 0);
               }
               else if(dir == core.paging_dir_vertical)
               {
                  contentWindow.scrollTo(0, pos);
               }
            }
         }
      }
      else
      {
         //dump("goToBookmark: bookmark text is empty.\n");
      }
   },

   downloadEbook: function()
   {
      var downloads = browser.downloads || chrome.downloads;
      downloads.download({"url": URL.createObjectURL(core.ebook), "filename": core.getFileName(core.meta['title'], core.meta['author']), "saveAs": true}, core.downloadEbookFinished);
   },

   downloadEbookFinished: function(id)
   {
      var runtime = chrome.runtime || browser.runtime;
      core.log("downloadEbookFinished: id: " + id + ", error: " + runtime.lastError);

      if(runtime.lastError)
      {
         reader.showMessage(core.getMessage("hintSavedError"), runtime.lastError.message, true);
      }
   },

   getFileName: function(title, author)
   {
      function replaceCharacters(text)
      {
         text = text.replace(/['`�"/<>\\|?*]/g, "");
         text = text.replace(/[:]/g, " ");
         text = text.replace(/[~]/g, "-");
         text = text.toLowerCase();

         return text;
      }

      var fileName = "";
      var underscore = [];

      if(title != "Unknown")
      {
         fileName = replaceCharacters(title);

         if(author != "Anonymous")
         {
            fileName = fileName + "_" + replaceCharacters(author);
         }

         fileName = fileName.replace(/[ ]{2,}/, " ");
         fileName = fileName.substr(0, 50);
         underscore = fileName.match(/_/g);
      }

      if(fileName == "" ||
         (fileName != "" && underscore && underscore.length > fileName.length/3))
      {
         fileName = core.id;
      }

      fileName = fileName + ".epub";
      return fileName;
   },

   getMessage: function(message)
   {
      if(core.isAndroid == true)
      {
         var msg = core.getMessageAndroid(message);
      }
      else
      {
         var i18n = chrome.i18n || browser.i18n;
         var msg = i18n.getMessage(message);
      }

      return msg;
   },

   getMessageAndroid: function(message)
   {
      var msg =
      {
         errorUnzip: "The file is not a valid epub file",
         errorEncrypted: "The ebook is enctypted by DRM and can unfortunately not be opened",
         errorInvalid: "The ebook is incomplete and can unfortunately not be opened",
         errorOther: "Unfortunately an unexpected error occurred opening the ebook",
         hintToolbar: "Click/Tap in the middle to open the toolbar or another ebook",
         hintScanning: "Scanning eBooks...",
         hintBookmark: "Bookmark has been set",
         prefBook: "As defined in book",
         prefUser: "User defined",
         prefNormal: "Normal",
         prefBkgColor: "Background",
         prefFontFace: "Font-face",
         prefFontColor: "Font-color",
         prefMarginLr: "Margin width",
         prefLineHeight: "Line height"
      }

      return msg[message];
   },

   getStyle: function()
   {
      if(!core.style)
      {
         if(core.pagingDir == core.paging_dir_horizontal)
         {
            var columnWidthValue = core.columnWidth;
            var columnWidth = "-moz-column-width:" + columnWidthValue + "mm !important; -webkit-column-width:" + columnWidthValue + "mm !important; column-width:" + columnWidthValue + "mm !important;";
            var columnCount = "-moz-column-count:auto !important; -webkit-column-count:auto !important; column-count:auto !important;";
            var columnFill = "-moz-column-fill:auto !important; -webkit-column-fill:auto !important; column-fill:auto !important;";
            var columnGap = "-moz-column-gap:0px !important; -webkit-column-gap:0px !important; column-gap:0px !important;";
            var breakBeforeAfter = "";
         }
         else
         {
            var columnWidth = "";
            var columnCount = "-moz-column-count:1 !important; -webkit-column-count:1 !important; column-count:1 !important;";
            var columnFill = "-moz-column-fill:balance !important; -webkit-column-fill:balance !important; column-fill:balance !important;";
            var columnGap = "";
            var breakBeforeAfter = "break-before:auto !important; break-after:auto !important;";
         }

         if(core.bkgColor)
         {
            var bkgColor = "background-color:" + core.bkgColor + " !important;";
         }
         else
         {
            var bkgColor = "";
         }

         if(core.fontFace)
         {
            var fontFace = "font-family:" + core.fontFace + " !important;";
         }
         else
         {
            var fontFace = "";
         }

         if(core.fontColor)
         {
            var fontColor = "color:" + core.fontColor + " !important;";
         }
         else
         {
            var fontColor = "";
         }

         var marginLr = "padding-left:" + core.marginLr + "mm !important; padding-right:" + core.marginLr + "mm !important;";

         if(core.lineHeight)
         {
            var lineHeight = core.lineHeight + "em";
         }
         else
         {
            var lineHeight = "normal";
         }

         if(core.readingDir == core.reading_dir_ltr)
         {
            var direction = "ltr";
         }
         else
         {
            var direction = "rtl";
         }

         var style =
         "html {direction: " + direction + " !important; margin-top:" + (2 * core.margin_top_bottom) + "px !important;" + columnWidth + columnCount + columnFill + columnGap + bkgColor + "}\
         body {margin-left:0px !important; margin-right:0px !important; font-size:" + core.fontSize + "pt !important; text-align:justify !important;" + marginLr + bkgColor + fontColor + fontFace + "}\
         div, span, p, ul, li, code, pre, a {-moz-hyphens:auto !important; -webkit-hyphens:auto !important; -ms-hyphens:auto !important; hypens:auto !important; font-size:" + core.fontSize + "pt !important; line-height:" + lineHeight + " !important;" + bkgColor + fontColor + fontFace + breakBeforeAfter + "}\
         h1, h2, h3, h4, h5, h6 {" + bkgColor + fontColor + fontFace + breakBeforeAfter + "}\
         img {max-width:100% !important;}";

         core.style = style;
      }

      return core.style;
   },

   resetStyle: function()
   {
      core.style = null;
   },

   setStyle: function()
   {
      var contentFrame = document.getElementById("content_frame");
      var style = contentFrame.contentDocument.getElementById("epubreader_styles");

      if(style)
      {
         style.textContent = core.getStyle();
      }
   },

   setProgress: function()
   {
      var contentFrame = document.getElementById("content_frame");
      var contentWindow = contentFrame.contentWindow;
      var progressMeter = document.getElementById("progress_meter");

      var progressPerFile = 100/core.spine.length;
      var base = progressPerFile * (core.navPosition - 1);

      if(core.pagingDir == core.paging_dir_horizontal)
      {
         var scrollMaxX = contentFrame.contentWindow.scrollMaxX || contentFrame.contentDocument.documentElement.scrollWidth - contentFrame.contentDocument.documentElement.clientWidth;

         if(contentWindow.pageXOffset == 0 && scrollMaxX == 0)
         {
            var progressPage = 100;
         }
         else
         {
            var progressPage = Math.floor((contentWindow.pageXOffset/scrollMaxX)*100);
         }
      }
      else
      {
         if(core.navPosition < core.spine.length - 1)
         {
            var progressPage = 50;
         }
         else
         {
            var progressPage = 100;
         }
      }

      var progress = base + ((progressPage/100) * progressPerFile);
      progressMeter.style.width = progress + "%";
   },

   getPreferences: function()
   {
      var storage = chrome.storage || browser.storage;

      storage.local.get(
      {
         "marginLr": reader.getMarginDefault(),
         "pagingDir": core.paging_dir_horizontal,
         "readingDir": core.reading_dir_ltr,
         "columnWidth": 120,
         "fontFace": null,
         "fontColor": null,
         "fontSize": reader.getFontSizeDefault(),
         "lineHeight": null,
         "bkgColor": "transparent",
         "loadFonts": 0,
         "saveHintShown": null,
         "toolbarHintShown": null
      }, core.getPreferencesFinished);
   },

   getPreferencesFinished: function(pref)
   {
      for(key in pref)
      {
         core.log("getPreferencesFinished: " + key + ": " + pref[key]);
      }

      core.marginLr = pref["marginLr"];
      core.pagingDir = pref["pagingDir"];
      core.readingDir = pref["readingDir"];
      core.columnWidth = pref["columnWidth"];
      core.fontFace = pref["fontFace"];
      core.fontColor = pref["fontColor"];
      core.fontSize = pref["fontSize"];
      core.lineHeight = pref["lineHeight"];
      core.bkgColor = pref["bkgColor"];
      core.loadFonts = pref["loadFonts"];
      reader.saveHintShown = pref["saveHintShown"];
      reader.toolbarHintShown = pref["toolbarHintShown"];

      core.initFinished();
   },

   isEdgeFunc: function()
   {
      var browser = navigator.userAgent;

      if(browser.match(/Edge/))
      {
         return true;
      }
      else
      {
         return false;
      }
   },

   isChromeFunc: function()
   {
      var browser = navigator.userAgent;

      if(browser.match(/Chrome/))
      {
         return true;
      }
      else
      {
         return false;
      }
   },

   isAndroidFunc: function()
   {
      if(typeof Android != 'undefined')
      {
         return true;
      }
      else
      {
         return false;
      }
   },

   makeHtmlSafe: function(text)
   {
      if(text)
      {
         text = text.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      }

      return text;
   },

   log: function(text)
   {
      if(core.logging == true)
      {
         console.log(text);
      }
   }
}

var imageQueue =
{
   queue: [],
   isProcessing: false,

   init: function()
   {
      imageQueue.isProcessing = false;
      imageQueue.queue = [];
   },

   setImageSrc: function(image, url, height, startTime)
   {
      return function(blob)
      {
         var blobUrl = URL.createObjectURL(blob);

         if(image.tagName.match(/img/i))
         {
            image.removeAttribute("alt");
            image.removeAttribute("height");
            image.removeAttribute("width");
            image.style.backgroundImage = "";
            image.style.maxHeight = height + "px";

            if(blob.size > 2000)
            {
               image.style.pageBreakInside = "avoid";
               image.style.display = "block";
            }

            image.src = blobUrl;
         }
         else if(image.tagName.match(/image/))
         {
            image.style.backgroundImage = "";
            image.parentNode.removeAttribute("preserveAspectRatio");

            if(blob.size > 2000)
            {
               image.style.pageBreakInside = "avoid";
               image.style.display = "block";
            }

            image.setAttribute("xlink:href", blobUrl);
         }

         var endTime = new Date().getTime();
         core.log("imageQueue: setImgSrc: url: " + url + ", duration: " + (endTime - startTime)/1000 + " sec, size: " + blob.size/1000 + " kb");

         imageQueue.isProcessing = false;
         imageQueue.process();
      }
   },

   add: function(image)
   {
      core.log("imageQueue: add: image: " + image['url'] + ", queue length: " + imageQueue.queue.length);
      imageQueue.queue.push(image);
      imageQueue.process();
   },

   process: function()
   {
      if(imageQueue.isProcessing == false)
      {
         core.log("imageQueue: process: queue length: " + imageQueue.queue.length);
         var image = imageQueue.queue.shift();

         if(image)
         {
            core.log("imageQueue: process: load image: " + image['url']);
            imageQueue.isProcessing = true;
            image['entry'].getData(image['writer'], imageQueue.setImageSrc(image['image'], image['url'], image['height'], new Date().getTime()));
         }
      }
   }
}

window.addEventListener("DOMContentLoaded", core.init, true);