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

var api =
{
   init: function()
   {
      var runtime = chrome.runtime || browser.runtime;
      runtime.onMessage.addListener(api.handleMessage);
   },

   handleMessage: function(message, sender, sendResponse)
   {
      Promise.resolve().then(function()
      {
         if(message.name == "getDocumentInfo")
         {
            return api.getDocumentInfo();
         }
         else if(message.name == "getPageText")
         {
            return api.getPageText();
         }
         else if(message.name == "pageForward")
         {
            return api.pageForward();
         }
         else if(message.name == "pageBackward")
         {
            return api.pageBackward();
         }
         else
         {
            return Promise.resolve();
         }
      }).then(function(response)
      {
         sendResponse(response);
      });

      return true;
   },

   getDocumentInfo: function()
   {
      return new Promise(function(resolve, reject)
      {
         var response = {title: document.title};

         try
         {
            var metadata = core.opf.getElementsByTagNameNS("*", "metadata")[0];
            var lang = metadata.getElementsByTagNameNS("*", "language")[0].childNodes[0].nodeValue;

            if(lang)
            {
               response.lang = lang;
            }
         }
         catch(e)
         {
         }

         resolve(response);
      });
   },

   getPageText: function()
   {
      return new Promise(function(resolve, reject)
      {
         try
         {
            var serializer = new XMLSerializer();
            var doc = document.getElementById("content_frame").contentDocument;
            var text = serializer.serializeToString(doc);
            var response = {text: text};
         }
         catch(e)
         {
         }

         resolve(response);
      });
   },

   pageForward: function()
   {
      return new Promise(function(resolve, reject)
      {
         if(core.navForwardsEnabled == true)
         {
            var contentFrame = document.getElementById("content_frame");

            contentFrame.addEventListener("load", function()
            {
               resolve({paged: true});
            }, {once: true}, true);

            core.navigateSpine(core.nav_forwards);
         }
         else
         {
            resolve({paged: false});
         }
      });
   },

   pageBackward: function()
   {
      return new Promise(function(resolve, reject)
      {
         if(core.navBackwardsEnabled == true)
         {
            var contentFrame = document.getElementById("content_frame");

            contentFrame.addEventListener("load", function()
            {
               resolve({paged: true});
            }, {once: true}, true);

            core.navigateSpine(core.nav_backwards);
         }
         else
         {
            resolve({paged: false});
         }
      });
   }
}

window.addEventListener("DOMContentLoaded", api.init, true);