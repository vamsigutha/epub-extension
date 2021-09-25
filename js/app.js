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

var app =
{
   fonts: null,
   prefInit: false,

   pref_bkg_color_book: 1,
   pref_bkg_color: 2,
   pref_font_book: 3,
   pref_font: 4,
   pref_font_size_book: 5,
   pref_font_size: 6,
   pref_font_color_book: 7,
   pref_font_color: 8,
   pref_margin_width_book: 9,
   pref_margin_width: 10,
   pref_line_height_book: 11,
   pref_line_height: 12,
   pref_reading_style_book: 13,
   pref_reading_style_website: 14,
   pref_column_width: 15,
   pref_reading_dir_ltr: 16,
   pref_reading_dir_rtl: 17,
   pref_load_fonts_no: 18,
   pref_load_fonts_yes: 19,

   prefTemplate:
'<html style="margin:0px; padding:0px;">\
<head>\
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />\
<style type="text/css">\
#closepref:hover\
{\
   cursor:pointer;\
}\
</style>\
</head>\
<body style="margin:0px; padding:0px;">\
<center>\
<div style="position:fixed; z-index:2; width:100%; top:0px; background-color:grey; padding-top:10px; padding-bottom:10px;"><img src="skin/close.png" id="closepref" style="width:32px;"></div>\
<div style="max-width:650px; position:relative; z-index:1; border-left:1px dashed lightgrey; border-right:1px dashed lightgrey; border-bottom:1px dashed lightgrey; text-align:left;">\
<table id="pref" style="border-collapse:collapse; font-family:Arial; font-size:16pt; margin-top:50px; width:95%;" align="center" cellspacing="0px" cellpadding="20px">\
<tr style="border-bottom:1px solid lightgrey;">\
   <td id="bkg_color_name"></td>\
   <td>\
      <table>\
      <tr><td><input type="radio" name="bkgColor" id="bkg_color_book"></input><label class="book"></label></td></tr>\
      <tr><td style="text-align:center;"><input type="radio" name="bkgColor" id="bkg_color_user"></input><label class="user"></label><input id="bkg_color" type="color" style="margin-left:10px;"></input></td></tr>\
      </table>\
   </td>\
</tr>\
<tr style="border-bottom:1px solid lightgrey;">\
   <td id="font_face_name"></td>\
   <td>\
      <table>\
      <tr><td><input type="radio" name="font" id="font_book"></input><label class="book"></label></td></tr>\
      <tr><td><input type="radio" name="font" id="font_user"></input><label class="user"></label><select id="fonts" style="margin-left:10px;"></select></td></tr>\
      </table>\
   </td>\
</tr>\
<tr style="border-bottom:1px solid lightgrey;">\
   <td id="font_size_name"></td>\
   <td>\
      <table>\
      <tr><td><input type="radio" name="fontSize" id="font_size_book"></input><label class="book"></label></td></tr>\
      <tr><td nowrap><input type="radio" name="fontSize" id="font_size_user"></input><label class="user"></label><input id="font_size" type="range" min="5" max="100" step="1" style="max-width:100px; margin-left:10px; margin-right:5px; vertical-align:middle;"></input><div id="font_size_value" style="display:inline-block; width:40px;"></div></td></tr>\
      </table>\
   </td>\
</tr>\
<tr style="border-bottom:1px solid lightgrey;">\
   <td id="font_color_name"></td>\
   <td>\
      <table>\
      <tr><td><input type="radio" name="fontColor" id="font_color_book"></input><label class="book"></label></td></tr>\
      <tr><td><input type="radio" name="fontColor" id="font_color_user"></input><label class="user"></label><input id="font_color" type="color" style="margin-left:10px;"></input></td></tr>\
      </table>\
   </td>\
</tr>\
<tr style="border-bottom:1px solid lightgrey;">\
   <td id="margin_width_name"></td>\
   <td>\
      <table>\
      <tr><td><input type="radio" name="marginWidth" id="margin_width_book"></input><label class="book"></label></td></tr>\
      <tr><td nowrap><input type="radio" name="marginWidth" id="margin_width_user"></input><label class="user"></label><input id="margin_width" type="range" min="0" max="200" step="1" style="max-width:100px; margin-left:10px; margin-right:5px; vertical-align:middle;"></input><div id="margin_width_value" style="display:inline-block; width:50px;"></div></td></tr>\
      </table>\
   </td>\
</tr>\
<tr style="border-bottom:1px solid lightgrey;">\
   <td id="line_height_name"></td>\
   <td>\
      <table>\
      <tr><td><input type="radio" name="lineHeight" id="line_height_book"></input><label class="book"></label></td></tr>\
      <tr><td nowrap><input type="radio" name="lineHeight" id="line_height_user"></input><label class="user"></label><input id="line_height" type="range" min="1" max="5" step="0.1" style="max-width:100px; margin-left:10px; margin-right:5px; vertical-align:middle;"></input><div id="line_height_value" style="display:inline-block; width:50px;"></div></td></tr>\
      </table>\
   </td>\
</tr>\
<tr style="border-bottom:1px solid lightgrey;">\
   <td id="reading_style_name"></td>\
   <td>\
      <table>\
      <tr><td><input type="radio" name="readingStyle" id="reading_style_website" value="2"></input><label id="reading_style_website_label"></label></td></tr>\
      <tr><td><input type="radio" name="readingStyle" id="reading_style_book" value="1"></input><label id="reading_style_book_label"></label></td><td></td></tr>\
      <tr><td nowrap style="padding-left:22px;"><label id="column_width_label"></label><input id="column_width" type="range" min="50" max="250" step="1" style="max-width:80px; margin-left:10px; margin-right:5px; vertical-align:middle;"></input><div id="column_width_value" style="display:inline-block; width:50px;"></div></td></tr>\
      </table>\
   </td>\
</tr>\
<tr style="border-bottom:1px solid lightgrey;">\
   <td id="reading_dir_name"></td>\
   <td>\
      <table>\
      <tr><td><input type="radio" name="readingDir" id="reading_dir_ltr" value="1"></input><label id="reading_dir_ltr_label"></label></td></tr>\
      <tr><td><input type="radio" name="readingDir" id="reading_dir_rtl" value="2"></input><label id="reading_dir_rtl_label"></label></td></tr>\
      </table>\
   </td>\
</tr>\
<tr>\
   <td id="load_fonts_name"></td>\
   <td>\
      <table>\
      <tr><td><input type="radio" name="loadFonts" id="load_fonts_no" value="0"></input><label id="load_fonts_no_label"></label></td></tr>\
      <tr><td><table><tr><td style="vertical-align:top;"><input type="radio" name="loadFonts" id="load_fonts_yes" value="1" style="margin:2px 0px 0px 2px;"></input></td><td><label id="load_fonts_yes_label"></label></td></tr></table></td></tr>\
      </table>\
   </td>\
</tr>\
</table>\
</div>\
</body>\
</html>',

   init: function()
   {
      app.fonts = app.getFonts();
   },

   showPreferences: function()
   {
      var prefFrame = document.getElementById("pref_frame");

      if(app.prefInit == false)
      {
         var doc = prefFrame.contentDocument.open("text/html");
         doc.write(app.prefTemplate);
         doc.close(app.prefTemplate);

         doc.getElementsByTagName("html")[0].style.direction = core.getMessage("direction");
         doc.getElementById("bkg_color_name").textContent = core.getMessage("prefBkgColor");
         doc.getElementById("font_face_name").textContent = core.getMessage("prefFontFace");
         doc.getElementById("font_size_name").textContent = core.getMessage("prefFontSize");
         doc.getElementById("font_color_name").textContent = core.getMessage("prefFontColor");
         doc.getElementById("margin_width_name").textContent = core.getMessage("prefMarginLr");
         doc.getElementById("line_height_name").textContent = core.getMessage("prefLineHeight");
         doc.getElementById("reading_dir_name").textContent = core.getMessage("prefReadingDir");
         doc.getElementById("reading_dir_ltr_label").textContent = core.getMessage("prefReadingDirLtr");
         doc.getElementById("reading_dir_rtl_label").textContent = core.getMessage("prefReadingDirRtl");
         doc.getElementById("reading_style_name").textContent = core.getMessage("prefReadingStyle");
         doc.getElementById("reading_style_book_label").innerHTML = core.getMessage("prefReadingStyleBook") + " &larr; &rarr;";
         doc.getElementById("reading_style_website_label").innerHTML = core.getMessage("prefReadingStyleWebsite") + " &uarr;&darr;";
         doc.getElementById("column_width_label").textContent = core.getMessage("prefColumnWidth");
         doc.getElementById("load_fonts_name").textContent = core.getMessage("prefLoadFonts");
         doc.getElementById("load_fonts_no_label").textContent = core.getMessage("prefNo");
         doc.getElementById("load_fonts_yes_label").textContent = core.getMessage("prefYes") + " (" + core.getMessage("prefFontsLoadSlower") + ")";

         var labels = doc.getElementsByTagName("label");

         for(var i = 0; i < labels.length; i++)
         {
            if(labels[i].className == "book")
            {
               labels[i].textContent = core.getMessage("prefBook");
            }
            else if(labels[i].className == "user")
            {
               labels[i].textContent = core.getMessage("prefUser");
            }
         }

         var fonts = doc.getElementById("fonts");

         for(var i = 0; i < app.fonts.length; i++)
         {
            var option = doc.createElement("option");
            option.text = app.fonts[i];
            fonts.appendChild(option);
         }

         var pref = document.getElementById("pref_frame").contentDocument;

         doc.getElementById("closepref").onclick = app.hidePreferences;

         doc.getElementById("bkg_color_book").onclick = function(){pref.getElementById("bkg_color").disabled = true; app.changePreference(app.pref_bkg_color_book);};
         doc.getElementById("bkg_color_user").onclick = function(){pref.getElementById("bkg_color").disabled = false; app.changePreference(app.pref_bkg_color);};
         doc.getElementById("bkg_color").onchange = function(){app.changePreference(app.pref_bkg_color);};

         doc.getElementById("font_book").onclick = function(){pref.getElementById("fonts").disabled = true; pref.getElementById("fonts").value = ""; app.changePreference(app.pref_font_book);};
         doc.getElementById("font_user").onclick = function(){pref.getElementById("fonts").disabled = false;};
         doc.getElementById("fonts").onchange = function(){app.changePreference(app.pref_font);};

         doc.getElementById("font_size_book").onclick = function(){app.changePreference(app.pref_font_size_book); pref.getElementById("font_size").disabled = true;};
         doc.getElementById("font_size_user").onclick = function(){pref.getElementById("font_size").disabled = false;};
         doc.getElementById("font_size").onchange = function(){app.changePreference(app.pref_font_size);};
         doc.getElementById("font_size").oninput = function(){pref.getElementById("font_size_value").textContent = pref.getElementById("font_size").value + " pt";};

         doc.getElementById("font_color_book").onclick = function(){pref.getElementById("font_color").disabled = true; app.changePreference(app.pref_font_color_book);};
         doc.getElementById("font_color_user").onclick = function(){pref.getElementById("font_color").disabled = false; app.changePreference(app.pref_font_color);};
         doc.getElementById("font_color").onchange = function(){app.changePreference(app.pref_font_color);};

         doc.getElementById("margin_width_book").onclick = function(){app.changePreference(app.pref_margin_width_book); pref.getElementById("margin_width").disabled = true;};
         doc.getElementById("margin_width_user").onclick = function(){pref.getElementById("margin_width").disabled = false;};
         doc.getElementById("margin_width").onchange = function(){app.changePreference(app.pref_margin_width);};
         doc.getElementById("margin_width").oninput = function(){pref.getElementById("margin_width_value").textContent = pref.getElementById("margin_width").value + " px";};

         doc.getElementById("line_height_book").onclick = function(){app.changePreference(app.pref_line_height_book); pref.getElementById("line_height").disabled = true;};
         doc.getElementById("line_height_user").onclick = function(){pref.getElementById("line_height").disabled = false;};
         doc.getElementById("line_height").onchange = function(){app.changePreference(app.pref_line_height);};
         doc.getElementById("line_height").oninput = function(){pref.getElementById("line_height_value").textContent = pref.getElementById("line_height").value + " em";};

         doc.getElementById("reading_style_website").onclick = function(){ pref.getElementById("column_width").disabled = true; app.changePreference(app.pref_reading_style_website);};
         doc.getElementById("reading_style_book").onclick = function(){app.changePreference(app.pref_reading_style_book); pref.getElementById("column_width").disabled = false;};
         doc.getElementById("column_width").onchange = function(){app.changePreference(app.pref_column_width);};
         doc.getElementById("column_width").oninput = function(){pref.getElementById("column_width_value").textContent = pref.getElementById("column_width").value + " mm";};

         doc.getElementById("reading_dir_ltr").onclick = function(){app.changePreference(app.pref_reading_dir_ltr);};
         doc.getElementById("reading_dir_rtl").onclick = function(){app.changePreference(app.pref_reading_dir_rtl);};

         doc.getElementById("load_fonts_no").onclick = function(){app.changePreference(app.pref_load_fonts_no);};
         doc.getElementById("load_fonts_yes").onclick = function(){app.changePreference(app.pref_load_fonts_yes);};

         app.prefInit = true;
      }

      app.setPreferences();
      prefFrame.style.display = "";
   },

   hidePreferences: function()
   {
      document.getElementById("pref_frame").style.display = "none";
      reader.hideTools();
      document.getElementById("content_frame").contentWindow.focus();
   },

   setPreferences: function()
   {
      var doc = document.getElementById("pref_frame").contentDocument;

      if(!core.bkgColor || core.bkgColor == "transparent")
      {
         doc.getElementById("bkg_color_book").checked = true;
         doc.getElementById("bkg_color").disabled = true;
      }
      else
      {
         doc.getElementById("bkg_color_user").checked = true;
         doc.getElementById("bkg_color").disabled = false;
         doc.getElementById("bkg_color").value = core.bkgColor;
      }

      var fonts = doc.getElementById("fonts");

      if(!core.fontFace)
      {
         doc.getElementById("font_book").checked = true;
         fonts.disabled = true;
         fonts.value = "";
      }
      else
      {
         doc.getElementById("font_user").checked = true;
         fonts.disabled = false;
         fonts.value = core.fontFace;
      }

      if(!core.fontSize)
      {
         doc.getElementById("font_size_book").checked = true;
         doc.getElementById("font_size").disabled = true;
         doc.getElementById("font_size").value = reader.getFontSizeDefault() + " pt";
         doc.getElementById("font_size_value").textContent = reader.getFontSizeDefault() + " pt";
      }
      else
      {
         doc.getElementById("font_size_user").checked = true;
         doc.getElementById("font_size").disabled = false;
         doc.getElementById("font_size").value = core.fontSize;
         doc.getElementById("font_size_value").textContent = core.fontSize + " pt";
      }

      if(!core.fontColor)
      {
         doc.getElementById("font_color_book").checked = true;
         doc.getElementById("font_color").disabled = true;
      }
      else
      {
         doc.getElementById("font_color_user").checked = true;
         doc.getElementById("font_color").disabled = false;
         doc.getElementById("font_color").value = core.fontColor;
      }

      if(core.marginLr == reader.getMarginDefault())
      {
         doc.getElementById("margin_width_book").checked = true;
         doc.getElementById("margin_width").disabled = true;
         doc.getElementById("margin_width").value = reader.getMarginDefault();
         doc.getElementById("margin_width_value").textContent = reader.getMarginDefault() + " px";
      }
      else
      {
         doc.getElementById("margin_width_user").checked = true;
         doc.getElementById("margin_width").disabled = false;
         doc.getElementById("margin_width").value = core.marginLr;
         doc.getElementById("margin_width_value").textContent = core.marginLr + " px";
      }

      if(!core.lineHeight)
      {
         doc.getElementById("line_height_book").checked = true;
         doc.getElementById("line_height").disabled = true;
         doc.getElementById("line_height").value = 1.2;
         doc.getElementById("line_height_value").textContent = "1.2 em";
      }
      else
      {
         doc.getElementById("line_height_user").checked = true;
         doc.getElementById("line_height").disabled = false;
         doc.getElementById("line_height").value = core.lineHeight;
         doc.getElementById("line_height_value").textContent = core.lineHeight + " em";
      }

      if(core.pagingDir == core.paging_dir_horizontal)
      {
         doc.getElementById("reading_style_book").checked = "checked";
         doc.getElementById("column_width").disabled = false;
      }
      else
      {
         doc.getElementById("reading_style_website").checked = "checked";
         doc.getElementById("column_width").disabled = true;
      }

      doc.getElementById("column_width").value = core.columnWidth;
      doc.getElementById("column_width_value").textContent = core.columnWidth + " mm";

      if(core.readingDir == core.reading_dir_ltr)
      {
         doc.getElementById("reading_dir_ltr").checked = "checked";
      }
      else
      {
         doc.getElementById("reading_dir_rtl").checked = "checked";
      }

      if(core.loadFonts == false)
      {
         doc.getElementById("load_fonts_no").checked = "checked";
      }
      else
      {
         doc.getElementById("load_fonts_yes").checked = "checked";
      }
   },

   changePreference: function(pref)
   {
      core.log("changePreference");
      var doc = document.getElementById("pref_frame").contentDocument;
      var storage = chrome.storage || browser.storage;

      if(pref == app.pref_bkg_color_book)
      {
         core.bkgColor = "transparent";
         storage.local.set({"bkgColor": "transparent"});
      }
      else if(pref == app.pref_bkg_color)
      {
         var color = doc.getElementById("bkg_color").value;
         core.bkgColor = color;
         storage.local.set({"bkgColor": color});
      }
      else if(pref == app.pref_font_book)
      {
         core.fontFace = null;
         storage.local.remove("fontFace");
      }
      else if(pref == app.pref_font)
      {
         var font = doc.getElementById("fonts").value;

         if(font == "")
         {
            core.fontFace = "";
            storage.local.remove("fontFace");
         }
         else
         {
            core.fontFace = font;
            storage.local.set({"fontFace": font});
         }
      }
      else if(pref == app.pref_font_size_book)
      {
         core.fontSize = reader.getFontSizeDefault();
         storage.local.remove("fontSize");
         doc.getElementById("font_size").value = core.fontSize;
         doc.getElementById("font_size_value").textContent = core.fontSize + " pt";
      }
      else if(pref == app.pref_font_size)
      {
         var size = doc.getElementById("font_size").value;
         core.fontSize = size;
         storage.local.set({"fontSize": size});
      }
      else if(pref == app.pref_font_color_book)
      {
         core.fontColor = null;
         storage.local.remove("fontColor");
      }
      else if(pref == app.pref_font_color)
      {
         var color = doc.getElementById("font_color").value;
         core.fontColor = color;
         storage.local.set({"fontColor": color});
      }
      else if(pref == app.pref_margin_width_book)
      {
         core.marginLr = reader.getMarginDefault();
         storage.local.set({"marginLr": reader.getMarginDefault()});
         doc.getElementById("margin_width").value = reader.getMarginDefault();
         doc.getElementById("margin_width_value").textContent = reader.getMarginDefault() + " px";
      }
      else if(pref == app.pref_margin_width)
      {
         var width = doc.getElementById("margin_width").value;
         core.marginLr = width;
         storage.local.set({"marginLr": width});
      }
      else if(pref == app.pref_line_height_book)
      {
         core.lineHeight = null;
         storage.local.remove("lineHeight");
         doc.getElementById("line_height").value = 1.2;
         doc.getElementById("line_height_value").textContent = "1.2 em";
      }
      else if(pref == app.pref_line_height)
      {
         var height = doc.getElementById("line_height").value;
         core.lineHeight = height;
         storage.local.set({"lineHeight": height});
      }
      else if(pref == app.pref_reading_style_book)
      {
         core.pagingDir = core.paging_dir_horizontal;
         storage.local.set({"pagingDir": core.paging_dir_horizontal});
      }
      else if(pref == app.pref_reading_style_website)
      {
         core.pagingDir = core.paging_dir_vertical;
         storage.local.set({"pagingDir": core.paging_dir_vertical});
      }
      else if(pref == app.pref_column_width)
      {
         var width = doc.getElementById("column_width").value;
         core.columnWidth = width;
         storage.local.set({"columnWidth": width});
      }
      else if(pref == app.pref_reading_dir_ltr)
      {
         core.readingDir = core.reading_dir_ltr;
         storage.local.set({"readingDir": core.reading_dir_ltr});
      }
      else if(pref == app.pref_reading_dir_rtl)
      {
         core.readingDir = core.reading_dir_rtl;
         storage.local.set({"readingDir": core.reading_dir_rtl});
      }
      else if(pref == app.pref_load_fonts_no)
      {
         core.loadFonts = false;
         storage.local.set({"loadFonts": 0});
      }
      else if(pref == app.pref_load_fonts_yes)
      {
         core.loadFonts = true;
         storage.local.set({"loadFonts": 1});
      }

      core.resetStyle();
      core.getStyle();
      core.setStyle();

      if(pref == app.pref_reading_style_book)
      {
         var contentFrame = document.getElementById("content_frame");
         var height = contentFrame.contentWindow.innerHeight;
         contentFrame.contentDocument.documentElement.style.height = (height - core.margin_top_bottom*2 - core.progress_height) + "px";
         contentFrame.contentDocument.documentElement.style.overflow = "hidden";
         contentFrame.contentWindow.location.reload();
      }
      else if(pref == app.pref_reading_style_website)
      {
         var contentFrame = document.getElementById("content_frame");
         contentFrame.contentDocument.documentElement.style.height = "";
         contentFrame.contentDocument.documentElement.style.overflow = "auto";
         contentFrame.contentWindow.location.reload();
      }
   },

   getFonts: function()
   {
      d = new Detector();

      var detected = [];
      detected.push("");

      var fonts = [];

      fonts.push("Arial");
      fonts.push("Arial Black");
	  fonts.push("Bookman Old Style");
	  fonts.push("Bradley Hand ITC");
	  fonts.push("Century");
	  fonts.push("Century Gothic");
	  fonts.push("Comic Sans MS");
	  fonts.push("Courier");
	  fonts.push("Georgia");
	  fonts.push("Gentium");
	  fonts.push("Helvetica");
	  fonts.push("Impact");
	  fonts.push("King");
	  fonts.push("Lucida Console");
	  fonts.push("Lalit");
	  fonts.push("Modena");
	  fonts.push("Monotype Corsiva");
	  fonts.push("Papyrus");
	  fonts.push("Tahoma");
	  fonts.push("TeX");
	  fonts.push("Times New Roman");
	  fonts.push("Trebuchet MS");
	  fonts.push("Verdana");
	  fonts.push("Verona");

      for(var i = 0; i < fonts.length; i++)
      {
         if(d.detect(fonts[i]))
         {
            detected.push(fonts[i]);
         }
      }

      return detected;
   }
}

var Detector = function()
{
   var baseFonts = ['monospace', 'sans-serif', 'serif'];
   var testString = "mmmmmmmmmmlli";
   var testSize = '72px';
   var h = document.getElementsByTagName("body")[0];

   var s = document.createElement("span");
   s.style.fontSize = testSize;
   s.innerHTML = testString;
   var defaultWidth = {};
   var defaultHeight = {};

   for (var index in baseFonts)
   {
      s.style.fontFamily = baseFonts[index];
      h.appendChild(s);
      defaultWidth[baseFonts[index]] = s.offsetWidth;
      defaultHeight[baseFonts[index]] = s.offsetHeight;
      h.removeChild(s);
   }

   function detect(font)
   {
      var detected = false;

      for (var index in baseFonts)
      {
         s.style.fontFamily = font + ',' + baseFonts[index];
         h.appendChild(s);
         var matched = (s.offsetWidth != defaultWidth[baseFonts[index]] || s.offsetHeight != defaultHeight[baseFonts[index]]);
         h.removeChild(s);
         detected = detected || matched;
      }

      return detected;
   }

   this.detect = detect;
};