/*
var linkTitle = "";
browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  switch (request.type) {
  	// в ответ на запрос отправляет в background linkTitle
  	case "GetLinkTitle":
      {
        let temp = linkTitle;
        linkTitle = "";
        return Promise.resolve({"linkTitle": temp});
      }
    case "ShowEditDialog":
      {
        console.log(JSON.stringify(request));
        openBkmkDialog("GBE2_BkmkDialog");
        break;
      }
    case "ShowAddDialog":
      {

      }
      console.log(JSON.stringify(request));
      break;
      // browser.runtime.sendMessage({type: "openBkmkDialog", "url": e.target.href});
  }
});

console.log("I'm content script");

var BkmkDialog = null;


function openBkmkDialog (dlgName)
{
	if (BkmkDialog == null)
	{
		  // Add the dialog
		  //$("body").append(
		  //   '<div id="yagbe_addDialog" class="yagbe_dialog" style="display: none;">' +
		  //     '<div>' +
		  //       '<label for="yagbe_addName">Name:</label>&nbsp;' +
		  //       '<input type="text" name="yagbe_addName" id="yagbe_addName" class="yagbe_ui-widget-content yagbe_ui-corner-all" /><br />' +
		  //       '<label for="yagbe_addUrl" id="yagbe_addUrlLbl">Location (URL):</label>&nbsp;' +
		  //       '<input type="text" name="yagbe_addUrl" id="yagbe_addUrl" class="yagbe_ui-widget-content yagbe_ui-corner-all" /><br />' +
		  //       '<label for="yagbe_addLabels" id="yagbe_addLabelsLbl">Labels:</label>&nbsp;' +
		  //       '<input type="text" name="yagbe_addLabels" id="yagbe_addLabels" class="yagbe_ui-widget-content yagbe_ui-corner-all" /><br />' +
		  //       '<label for="yagbe_addNotes" id="yagbe_addNotesLbl">Notes:</label>&nbsp;' +
		  //       '<textarea rows="3" cols="20" name="yagbe_addNotes" id="yagbe_addNotes" class="yagbe_ui-widget-content yagbe_ui-corner-all"></textarea>' +
		  //     '</div>' +
		  //   '</div>'
		  // );
		  $("body").append('<div id="GBE2_BkmkDialog" title="Редактирование закладки" class="dialog">'+
	      '<label for="GBE2_BkmkDialog-name">Название:</label><br/>' +
	      '<input type="text" name="GBE2_BkmkDialog-name" id="GBE2_BkmkDialog-name"><br/>' +
	      '<label for="GBE2_BkmkDialog-url">URL:</label><br/>' +
	      '<span>' +
	        '<input type="text" name="GBE2_BkmkDialog-url" id="GBE2_BkmkDialog-url">' +
	        '<input id="GBE2_BkmkDialog-enableUrlEdit" type="checkbox"><br/>' +
	      '</span>' +
	      '<label for="GBE2_BkmkDialog-labels">Метки:</label><br/>' +
	      '<input type="text" name="GBE2_BkmkDialog-labels" id="GBE2_BkmkDialog-labels"><br/>' +
	      '<label for="GBE2_BkmkDialog-notes">Заметки:</label><br/>' +
	      '<textarea rows="3" name="GBE2_BkmkDialog-notes" id="GBE2_BkmkDialog-notes"></textarea> ' +
	    '</div>'
    );


		// addDialog = $("#yagbe_addDialog");
		BkmkDialog = $("#" + dlgName);
		BkmkDialog.dialog({
			dialogClass: "no-close",
      autoOpen: false,
      modal: true,
      draggable: false,
      resizable: false,
      // closeOnEscape: false
      minWidth: 340,
      buttons: [
        {
          text: "Save",
          // icons: {
          //   primary: "ui-icon-heart"
          // },
          click: function() {
            // $( this ).dialog( "close" );
          }
        },
        {
          text: "Cancel",
          click: function() {
            $(this).dialog( "close" );
          }
        },
      ]

     });
	}
	//BkmkDialog.parent('.ui-dialog').appendTo('.myCustomScope');
	BkmkDialog.dialog("open");
}

// content-script.js

// window.addEventListener("click", getCntxMenuLinkTitle);

// function getCntxMenuLinkTitle(e) {
//   if (e.target.tagName != "A") {
//     return;
//   }
//   // browser.tabs.getCurrent().then((aTab) => {
//   	console.log("content.js " + JSON.stringify(e.target));
//  		//browser.runtime.sendMessage({type: "openBkmkDialog", "url": e.target.href});
//   // });
// }

// при открытии контекстного меню для ссылок сохраняем в linkTitle заголовок ссылки
$("A").on( "contextmenu", function(e) {
  var t = $(this);
  var text = $.trim(t.text());
  var title = $.trim(t.attr("title"));
  var img = t.children("img").first();
  if ((title != null) && (title.length > 0)) {
    linkTitle = title;
  } 
  else if ((text != null) && (text.length > 0)) {
    linkTitle = text;
  }
  else if (img != null && img.attr("alt")) {
    linkTitle = img.attr("alt");
  }
  else {
  	linkTitle = t.attr("href").replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/')[0];
  }
  // console.log (linkTitle);
});*/



//   "content_scripts": [ {
//        "css": [ "lib/jquery-ui.min.css", "content/content.css" ],
//        "js": [ "lib/jquery-3.2.1.min.js", "lib/jquery-ui.min.js", "content/content.js" ],
//        "matches": [ "*://*/*" ]
//     }
//   ],