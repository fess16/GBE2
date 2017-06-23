// получаем ссылку на background страницу
browser.runtime.onMessage.addListener(notify);
var getting = browser.runtime.getBackgroundPage();
var bg, aTab;
getting.then((page) => {bg = page}, (error) => {_errorLog ("Popup-getBackgroundPage", error)});

browser.tabs.query({active: true, currentWindow: true}).then((tabs) => {aTab = tabs[0]});


$(document).ready(function(){

  $("#bkm-tree").fancytree({
  	autoScroll: true, // Automatically scroll nodes into visible area
    clickFolderMode: 3, // 1:activate, 2:expand, 3:activate and expand, 4:activate (dblclick expands)
    debugLevel: 2, // 0:quiet, 1:normal, 2:debug
    focusOnSelect: true, // Set focus when node is checked by a mouse click
    quicksearch: true, // Navigate to next node by typing the first letters
    selectMode: 1, // 1:single, 2:multi, 3:multi-hier
    tabindex: "0", // Whole tree behaves as one single control
    tooltip: true, // Use title as tooltip (also a callback could be specified)
  	source: bg.GBE2.m_treeSource
  });
	$(".filterHBox label").text(browser.i18n.getMessage("popupFilterLabel"));

	// отключаем контекстное меню на кнопках дополнения
	$(".nav-bar li").on("contextmenu",function(){
   return false;
	}); 

	console.log("I am popup.js");

	// если m_dlgInfo.needOpen == true, то необходимо открыть диалог редактирования закладки
	// с параметрами из m_dlgInfo
	if (bg.GBE2.m_dlgInfo !== null && bg.GBE2.m_dlgInfo.needOpen)
	{
		$("#editBkmkDialog-name").val(bg.GBE2.m_dlgInfo.title);
		$("#editBkmkDialog-url").val(bg.GBE2.m_dlgInfo.url);
		bg.GBE2.m_dlgInfo.needOpen = false;
		// setTimeout(() => {
		openBkmkDialog("editBkmkDialog");
		$("#editBkmkDialog").dialog('option', 'position', { my: "center", at: "center", of: "#wrapper" })
		// }, 100);
	}

	$(".hmenuRefresh a")
		.attr('title', browser.i18n.getMessage("popupHmenuRefresh"))
		.click(function(event) { refresh();	});

	$(".hmenuEdit a").click(function(event) {
		openBkmkDialog("editBkmkDialog");
	});
	

	$(".hmenuOpt a").click(function(event) {
		openOptionsPage();
	});

	$(".hmenuDel a").click(function(event) {
		// browser.tabs.executeScript(null, {
		//       file: "/content/content.js"
  //   });
    console.log ("aTab  " + aTab.url);
    	// if (aTab.url == "" || aTab.url.indexOf("about:") == 0 )
    	// {
    		// console.log ("url 1  " + aTab.url);
    		openBkmkDialog("editBkmkDialog");
    	// }
    	// else
    	// {
    	// 	console.log ("url 2  " + aTab.url);
     //  	window.close();
     //  	browser.tabs.sendMessage(aTab.id, {type: "ShowEditDialog", message: "Show Edit Bookmark Dialog"});
     //  }
	});

	$(".hmenuAdd a").click(function(event) {
		$("#editBkmkDialog-name").val(aTab.title);
		$("#editBkmkDialog-url").val(aTab.url);
		openBkmkDialog("editBkmkDialog");
	});

	$(".hmenuAddOpenTabs a").click(function(event) {
		test1();
	});

	$(".hmenuGBs a").click(function(event) {
		chrome.tabs.create({active: true, url: "https://www.google.com/bookmarks/"});
		window.close();
	});


});

var editBkmkDialog = null;
function openBkmkDialog (dlgName)
{
	if (editBkmkDialog == null)
	{
		var dlg = $("#" + dlgName);
		dlg.dialog({
			dialogClass: "no-close",
      autoOpen: false,
      modal: true,
      draggable: true,
      resizable: false,
      position: { my: "center", at: "center", of: "#wrapper" },
      // closeOnEscape: false
      // minWidth: "480px",
      width: 500,
      buttons: [
        {
          text: "!Save",
          // icons: {
          //   primary: "ui-icon-heart"
          // },
          click: function() {
            // $( this ).dialog( "close" );
          }
        },
        {
          text: "!Cancel",
          click: function() {
            $( this ).dialog( "close" );
          }
        },
      ],
      close: function( event, ui ) {$("#wrapper").width("350px");}

     });
	}
	$("#wrapper").width("500px");
	dlg.dialog("open");
}


function notify(message)
{
	if (message.type == "refreshed")
	{
		console.log (JSON.stringify(message));

		$.ui.fancytree.getTree("#bkm-tree").reload(
          // message.text
          bg.GBE2.m_treeSource
        ).done(function(){
          console.log ("reloaded");
        });
    $("#bkm-tree").fancytree("enable").show();
     $(".info-box").css({display: 'none'});

	}
	if (message.type == "CntxOpenBkmkDialog")
	{
		$("#editBkmkDialog-name").val(message.title);
		$("#editBkmkDialog-url").val(message.url);
		openBkmkDialog("editBkmkDialog");
	}
}

function refresh() {
  console.log("refresh");
  $(".info-box").css({display: 'flex'});
  // TODO сообщение изменить
  $(".info-box label").text("!Loading bookmarks");
  $("#bkm-tree").fancytree("disable").hide();
  chrome.runtime.sendMessage({
      type: "refresh"
    }
  );
}

function openOptionsPage () {
	browser.runtime.openOptionsPage().then( ()=> {window.close();});
}



function test1() {
  console.log("test1");
  chrome.runtime.sendMessage({
      type: "test1"
    },
    function(response) {
    	// if (response) document.getElementById("div").textContent = response.msg;
    });
}



var tSourse = [
	{"title": "Node 1", "key": "Node 1", "folder": true, "children" : []}, 
	{"title": "Folder 2", "key":"Folder 2", "folder": true, "children": [ 
		{"title": "Node 2.1", "key": "Node 2.1"},
		{"title": "Node 2.2", "key": "Node 2.2_1", refKey: "Node 2.2"} ]
	},
	{"title": "Folder 3", "key":"Folder 3", "folder": true, "children": [ 
		{"title": "Node 3.1", "key": "Node 3.1"},
		{"title": "Node 2.2", "key": "Node 2.2_2", refKey: "Node 2.2"} ]
	}
]

  
// 
/*var q = [
{"title":"test","key":2087933171,"folder":true,"children":[],"path":"test"},
{"title":"test21","key":3779995472,"folder":true,"children":[],"path":"test21"},
{"title":"Work","key":2088063268,"folder":true,"children":[],"path":"Work"},
{"title":"Графика","key":3874890736,"folder":true,"children":[
        {"title":"все о inkscape","key":1666563759,"folder":true,"children":[],"path":"Графика/все о inkscape"}
    ] ,"path":"Графика"}
];
*/

