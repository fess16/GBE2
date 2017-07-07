// получаем ссылку на background страницу
browser.runtime.onMessage.addListener(bgListener);
var getting = browser.runtime.getBackgroundPage();
var bg, aTab, aBkmk = null;
var popup = window;
getting.then((page) => {bg = page}, (error) => {_errorLog ("Popup-getBackgroundPage", error)});
browser.tabs.query({active: true, currentWindow: true}).then((tabs) => {aTab = tabs[0]});

function split(val) {
    return val.split(/,\s*/);
}

function extractLast(term) {
    return split(term).pop();
}


function setClickHandlers (aBkmk)
{
	removeClickHandlers();
	$(".hmenuAdd a").attr('title', browser.i18n.getMessage("popup_hmenuAdd"));
	$(".hmenuEdit a").attr('title', browser.i18n.getMessage("popup_hmenuEdit"))
	$(".hmenuDel a").attr('title', browser.i18n.getMessage("popup_hmenuDel"))
	
	if (aBkmk !== null) {
		$(".hmenuAdd a")
			.addClass('disabled-link')
			.click(function(event) {
				return false;
			});	
		$(".hmenuEdit a")
			.removeClass('disabled-link')
			.click(function(event) {
				openBkmkDialog(aBkmk);
		});
		$(".hmenuDel a")
			.removeClass('disabled-link')
			.click(function(event) {
				// $("#delBkmkDlg label").text(browser.i18n.getMessage("delBkmkDlg_label", aBkmk.title));
				openDelBkmkDlg(aBkmk);
		});
	}
	else {
		$(".hmenuAdd a")
			.removeClass('disabled-link')
			.click(function(event) {
				openBkmkDialog({id: null, title: aTab.title, url: aTab.url, labels: "", notes: ""});
		});
		$(".hmenuEdit a")
			.addClass('disabled-link')
			.click(function(event) {
				return false;
		});
		$(".hmenuDel a")
			.addClass('disabled-link')
			.click(function(event) {
				return false;
		});

	}
}

function removeClickHandlers () {
	$(".hmenuAdd a, .hmenuEdit a").off( "click", "**" );
}


$(document).ready(function(){


  $("#bkmk-tree").fancytree({
  	autoScroll: true, // Automatically scroll nodes into visible area
    clickFolderMode: 4, // 1:activate, 2:expand, 3:activate and expand, 4:activate (dblclick expands)
    debugLevel: 1, // 0:quiet, 1:normal, 2:debug
    focusOnSelect: true, // Set focus when node is checked by a mouse click
    quicksearch: true, // Navigate to next node by typing the first letters
    selectMode: 1, // 1:single, 2:multi, 3:multi-hier
    tabindex: "0", // Whole tree behaves as one single control
    tooltip: true, // Use title as tooltip (also a callback could be specified)
  	source: bg.GBE2.m_treeSource
  });


  $("#bkmk-tree").contextmenu({
    delegate: "span.fancytree-title, img.fancytree-icon, span.fancytree-expander",
    addClass : "GBE-ui-contextmenu",
    autoFocus: true,
    // hide : "fast",
    show : "fast",
//      menu: "#options",
    menu: [
    	// folder (label) menu
      {title: browser.i18n.getMessage("cntx-folder-menuEdit"), cmd: "menuEdit", uiIcon: "cntx-folder-menuEdit"},
      {title: browser.i18n.getMessage("cntx-folder-menuRemove"), cmd: "menuRemove", uiIcon: "cntx-folder-menuRemove"},
      {title: "----", cmd: "msepf"},
      {title: browser.i18n.getMessage("cntx-folder-menuOpenAll"), cmd: "menuOpenAll", uiIcon: "cntx-folder-menuOpenAll"},
      {title: "----", cmd: "msepf"},
      {title: browser.i18n.getMessage("cntx-folder-menuAddHere"), cmd: "menuAddHere", uiIcon: "cntx-folder-menuAddHere"},
      {title: browser.i18n.getMessage("cntx-folder-menuAddAllTabs"), cmd: "menuAddAllTabs", uiIcon: "cntx-folder-menuAddAllTabs"},
      {title: "----", cmd: "msepf"},
      {title: browser.i18n.getMessage("cntx-folder-menuHideFolder"), cmd: "menuHideFolder", uiIcon: "cntx-folder-menuHideFolder"},
      {title: browser.i18n.getMessage("cntx-folder-menuUnhideFolder"), cmd: "menuUnhideFolder", uiIcon: "cntx-folder-menuUnhideFolder"},
      {title: browser.i18n.getMessage("cntx-folder-menuUnhideAll"), cmd: "menuUnhideAll", uiIcon: "cntx-folder-menuUnhideAll"},
      {title: "----", cmd: "msepf"},
      {title: browser.i18n.getMessage("cntx-folder-menuExport"), cmd: "menuExport"},
      // bookmark menu
      {title: browser.i18n.getMessage("cntx-page-go"), cmd: "page-go", uiIcon: "cntx-page-go"},
      {title: browser.i18n.getMessage("cntx-page-edit"), cmd: "page-edit", uiIcon: "cntx-page-edit"},
      {title: browser.i18n.getMessage("cntx-page-delete"), cmd: "page-delete", uiIcon: "cntx-page-delete"},
      {title: browser.i18n.getMessage("cntx-qrcode-icon"), cmd: "qrcode-icon", uiIcon: "cntx-qrcode-icon"},
      {title: "----", cmd: "msepp"},
      {title: "E-mail...", cmd: "bookmark-emai", uiIcon: "cntx-bookmark-emai"},
      {title: "Facebook...", cmd: "bookmark-fbshare", uiIcon: "cntx-bookmark-fbshare"},
      {title: "Twitter...", cmd: "bookmark-twshare", uiIcon: "cntx-bookmark-twshare"},
    ],
    beforeOpen: function(event, ui) {
      var node = $.ui.fancytree.getNode(ui.target);
      // Modify menu entries depending on node status
      $("#bkmk-tree").contextmenu("enableEntry", "paste", node.isFolder());
      // Show/hide single entries
      if (node.isFolder()) {
      	$("#bkmk-tree").contextmenu("showEntry", "menuEdit", true);
      	$("#bkmk-tree").contextmenu("showEntry", "menuRemove", true);
      	$("#bkmk-tree").contextmenu("showEntry", "menuOpenAll", true);
      	$("#bkmk-tree").contextmenu("showEntry", "menuAddHere", true);
      	$("#bkmk-tree").contextmenu("showEntry", "menuAddAllTabs", true);
      	$("#bkmk-tree").contextmenu("showEntry", "menuHideFolder", true);
      	$("#bkmk-tree").contextmenu("showEntry", "menuUnhideFolder", true);
      	$("#bkmk-tree").contextmenu("showEntry", "menuUnhideAll", true);
      	$("#bkmk-tree").contextmenu("showEntry", "menuExport", true);
      	$("#bkmk-tree").contextmenu("showEntry", "msepf", true);

      	$("#bkmk-tree").contextmenu("showEntry", "page-go", false);
      	$("#bkmk-tree").contextmenu("showEntry", "page-edit", false);
      	$("#bkmk-tree").contextmenu("showEntry", "page-delete", false);
      	$("#bkmk-tree").contextmenu("showEntry", "qrcode-icon", false);
      	$("#bkmk-tree").contextmenu("showEntry", "bookmark-emai", false);
      	$("#bkmk-tree").contextmenu("showEntry", "bookmark-fbshare", false);
      	$("#bkmk-tree").contextmenu("showEntry", "bookmark-twshare", false);
      	$("#bkmk-tree").contextmenu("showEntry", "msepp", false);
			}
      else {
      	$("#bkmk-tree").contextmenu("showEntry", "page-go", true);
      	$("#bkmk-tree").contextmenu("showEntry", "page-edit", true);
      	$("#bkmk-tree").contextmenu("showEntry", "page-delete", true);
      	$("#bkmk-tree").contextmenu("showEntry", "qrcode-icon", true);
      	$("#bkmk-tree").contextmenu("showEntry", "bookmark-emai", true);
      	$("#bkmk-tree").contextmenu("showEntry", "bookmark-fbshare", true);
      	$("#bkmk-tree").contextmenu("showEntry", "bookmark-twshare", true);
      	$("#bkmk-tree").contextmenu("showEntry", "msepp", true);

      	$("#bkmk-tree").contextmenu("showEntry", "menuEdit", false);
      	$("#bkmk-tree").contextmenu("showEntry", "menuRemove", false);
      	$("#bkmk-tree").contextmenu("showEntry", "menuOpenAll", false);
      	$("#bkmk-tree").contextmenu("showEntry", "menuAddHere", false);
      	$("#bkmk-tree").contextmenu("showEntry", "menuAddAllTabs", false);
      	$("#bkmk-tree").contextmenu("showEntry", "menuHideFolder", false);
      	$("#bkmk-tree").contextmenu("showEntry", "menuUnhideFolder", false);
      	$("#bkmk-tree").contextmenu("showEntry", "menuUnhideAll", false);
      	$("#bkmk-tree").contextmenu("showEntry", "menuExport", false);
      	$("#bkmk-tree").contextmenu("showEntry", "msepf", false);
      	
      }

      // Activate node on right-click
      node.setActive();
      // Disable tree keyboard handling
      ui.menu.prevKeyboard = node.tree.options.keyboard;
      node.tree.options.keyboard = false;
    },
    close: function(event, ui) {
      // Restore tree keyboard handling
      // console.log("close", event, ui, this)
      // Note: ui is passed since v1.15.0
      var node = $.ui.fancytree.getNode(ui.target);
      node.tree.options.keyboard = ui.menu.prevKeyboard;
      node.setFocus();
    },
    select: handleContextMenuClick
  });

	$(".filterHBox label").text(browser.i18n.getMessage("popup_filterLabel"));

	$("#editBkmkDlg").attr("title", browser.i18n.getMessage("editBkmkDlg_title"));
	$("label[for='editBkmkDlg-name']").text(browser.i18n.getMessage("editBkmkDlg_name"));
	$("label[for='editBkmkDlg-url']").text(browser.i18n.getMessage("editBkmkDlg_url"));
	$("label[for='editBkmkDlg-labels']").text(browser.i18n.getMessage("editBkmkDlg_labels"));
	$("label[for='editBkmkDlg-notes']").text(browser.i18n.getMessage("editBkmkDlg_notes"));
	
	// отключаем контекстное меню на кнопках дополнения
	$(".nav-bar li").on("contextmenu",function(){
   return false;
	}); 

	console.log("I am popup.js");

	// если m_dlgInfo.needOpen == true, то необходимо открыть диалог редактирования закладки
	// с параметрами из m_dlgInfo
	if (bg.GBE2.m_dlgInfo !== null && bg.GBE2.m_dlgInfo.needOpen)
	{
		// $("#editBkmkDlg-name").val(bg.GBE2.m_dlgInfo.title);
		// $("#editBkmkDlg-url").val(bg.GBE2.m_dlgInfo.url);
		bg.GBE2.m_dlgInfo.needOpen = false;
		// setTimeout(() => {
		openBkmkDialog({id: null, title: bg.GBE2.m_dlgInfo.title, url: bg.GBE2.m_dlgInfo.url, labels: "", notes: ""});
		$("#editBkmkDlg").dialog('option', 'position', { my: "center", at: "center", of: "#wrapper" })
		// }, 100);
	}

	aBkmk = bg.GBE2.getBookmark({ url : aTab.url});
	setClickHandlers (aBkmk);
	// назначем обработчики кнопок
	// 
	// обновление списка закладок
	$(".hmenuRefresh a")
		.attr('title', browser.i18n.getMessage("popup_hmenuRefresh"))
		.click(function(event) { 
			refresh();	
	});

	$(".hmenuOpt a").click(function(event) {
		openOptionsPage();
	});

/*	$(".hmenuDel a").click(function(event) {
		// browser.tabs.executeScript(null, {
		//       file: "/content/content.js"
  //   });
    console.log ("aTab  " + aTab.url);
    	// if (aTab.url == "" || aTab.url.indexOf("about:") == 0 )
    	// {
    		// console.log ("url 1  " + aTab.url);
    		openBkmkDialog("editBkmkDlg");
    	// }
    	// else
    	// {
    	// 	console.log ("url 2  " + aTab.url);
     //  	window.close();
     //  	browser.tabs.sendMessage(aTab.id, {type: "ShowEditDialog", message: "Show Edit Bookmark Dialog"});
     //  }
	});*/


	$(".hmenuAddOpenTabs a").click(function(event) {
		test1();
	});
	
	$(".hmenuGBs a").click(function(event) {
		chrome.tabs.create({active: true, url: "https://www.google.com/bookmarks/"});
		window.close();
	});

	// клик на QR-коде - открываем его в новой вкладке 
	$("#qr_dialog_image").on("click", function () {
		chrome.tabs.create({active: true, url: $(this).attr("src")});
		window.close();
	});

	// разрешение/запрет редактирования адреса
	$("#editBkmkDlg-enableUrlEdit").on("click", function() {
		let urlCtrl = $("#editBkmkDlg-url");
		// включили флаг - снимаем readonly атрибут
		if ($(this).prop("checked")) {
			urlCtrl.attr("readonly",false);
		}
		// выключили - ставим readonly и возвращаем исходное значение
		else {
			urlCtrl.attr("readonly",true);
			urlCtrl.val($("#editBkmkDlg-oldUrl").val());
		}
	});



}); // document ready

function setBkmkControls (bkmk)
{
	$("#editBkmkDlg-name").val(bkmk.title);
	$("#editBkmkDlg-url").val(bkmk.url);
	$("#editBkmkDlg-labels").val(bkmk.labels);
	$("#editBkmkDlg-notes").val(bkmk.notes);
	$("#editBkmkDlg-id").val(bkmk.id);
	if (bkmk.labels.length > 0) 
	{
		$("#editBkmkDlg-labels").val(bkmk.labels + ",");
	}
	$("#editBkmkDlg-notes").val(bkmk.notes);

	if (bkmk.id == null) 	{
		$("#editBkmkDlg-enableUrlEdit").attr("disabled",true);
	}
	else {
		// $("#editBkmkDlg-id").val(bkmk.id);
		$("#editBkmkDlg-oldUrl").val(bkmk.url);
		$("#editBkmkDlg-enableUrlEdit").prop("checked", false).attr("disabled",false);
		$("#editBkmkDlg-url").attr("readonly",true);
		if (!bg.GBE2.opt.enableNotes && bkmk.notes == "") {
			bg.GBE2.doRequestBookmarkNote(bkmk)
			.then(result => {
				$("#editBkmkDlg-notes").val(result);
			})
			.catch((error) => {
	    	_errorLog("popup:setBkmkControls", error);
 	 		});
		}
		bkmk.url = "";
		if (bkmk.url == "") {
			bg.GBE2.doRequestBookmarkURL(bkmk)
			.then(result => {
				$("#editBkmkDlg-oldUrl").val(result.url);
				$("#editBkmkDlg-url").val(result.url);
			})
			.catch((error) => {
	    	_errorLog("popup:setBkmkControls", error);
 	 		});
		}
	}
}

var editBkmkDlg = null;
var delBkmkDlg = null;
var editLblDlg = null;
var delLblkDlg = null;

// function openBkmkDialog (dlgName)
function openBkmkDialog (bkmk)
{
	// var dlg = $("#" + dlgName);
	if (editBkmkDlg == null)
	{
		editBkmkDlg = $("#editBkmkDlg");
		editBkmkDlg.dialog({
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
          text: browser.i18n.getMessage("btn_Save"),
          click: function() {
          	let result = {
	          	id: $("#editBkmkDlg-id").val().trim(),
	          	oldUrl: $("#editBkmkDlg-oldUrl").val().trim(),
	          	title: $("#editBkmkDlg-name").val().trim(),
	          	url: $("#editBkmkDlg-url").val().trim(),
	          	labels: $("#editBkmkDlg-labels").val().trim(),
	          	notes: $("#editBkmkDlg-notes").val().trim()
          	}
          	// console.log ("|" + result.oldUrl + "|");
          	browser.runtime.sendMessage({
		      		"type": "editBookmark",
		      		"data": result
	      		}).then((result) => {
	      			setBkmkControls({id: null, title: "", url: "", labels: "", notes: ""});
            	$(this).dialog("close");
	      		});
          }
        },
        {
          text: browser.i18n.getMessage("btn_Cancel"),
          click: function() {
          	setBkmkControls({id: null, title: "", url: "", labels: "", notes: ""});
            $(this).dialog("close");
          }
        },
      ],
      close: function( event, ui ) {$("#wrapper").width("350px");}
     });
	}
	$("#wrapper").width("500px");
	setBkmkControls(bkmk);

	$('#editBkmkDlg-labels').autocomplete({
	  minLength: 1,
	  delay: 50,
	  source: function (request, response) {
	      let term = request.term;

	      // substring of new string (only when a comma is in string)
	      if (term.indexOf(', ') > 0) {
	          var index = term.lastIndexOf(', ');
	          term = term.substring(index + 2);
	      }

	      // regex to match string entered with start of suggestion strings
	      let re = $.ui.autocomplete.escapeRegex(term);
	      let matcher = new RegExp("(^|"+ bg.GBE2.opt.nestedLabelSep + ")"+ re, 'i');
	      let regex_validated_array = $.grep(bg.GBE2.m_labelsArr, function (item, index) {
	          return matcher.test(item);
	      });
	      // pass array `regex_validated_array ` to the response and 
	      // `extractLast()` which takes care of the comma separation

	      response($.ui.autocomplete.filter(regex_validated_array, 
	           extractLast(term)));
	  },
	  focus: function () {
	      return false;
	  },
	  select: function (event, ui) {
	      let terms = split(this.value);
	      terms.pop();
	      terms.push(ui.item.value);
	      terms.push('');
	      this.value = terms.join(', ');
	      return false;
	  }
	});

	editBkmkDlg.dialog("open");
}

function openDelBkmkDlg (aBkmk){
	if (delBkmkDlg == null) {
		delBkmkDlg = $("#delBkmkDlg");
		delBkmkDlg.dialog({
			dialogClass: "no-close",
	    autoOpen: false,
	    modal: true,
	    draggable: false,
	    resizable: false,
	    // width: 500,
	    position: { my: "center", at: "center", of: "#wrapper" },
	    title: 	browser.i18n.getMessage("delBkmkDlg_title"),
	    buttons: [
	      {
	        text: browser.i18n.getMessage("btn_Delete"),
	        click: function() {
	        	browser.runtime.sendMessage({
		      		"type": "deleteBookmark",
		      		"data": bg.GBE2.getBookmark({id: $("#delBkmkDlg-id").val()})
	      		}).then((result) => {
	          	$(this).dialog("close");
	      		});
	        }
	      },
	      {
	        text: browser.i18n.getMessage("btn_Cancel"),
	        click: function() {
	        	// $("#delBkmkDlg label").text("");
	        	// $("#delBkmkDlg-id").val("");
	          $(this).dialog("close");
	        }
	      },
	    ]
		});
	}
	$("#delBkmkDlg label").html(browser.i18n.getMessage("delBkmkDlg_label", aBkmk.title));
	$("#delBkmkDlg-id").val(aBkmk.id);

	delBkmkDlg.dialog("open");
}

function openEditLblDlg (aLbl) {
	if (editLblDlg == null){
		editLblDlg = $("#editLblDlg");
		editLblDlg.dialog({
			dialogClass: "no-close",
	    autoOpen: false,
	    modal: true,
	    draggable: false,
	    resizable: false,
	    width: 320,
	    position: { my: "center", at: "center", of: "#wrapper" },
	    title: 	browser.i18n.getMessage("editLblDlg_title"),
      buttons: [
        {
          text: browser.i18n.getMessage("btn_Save"),
          click: function() {
          	let result = {
	          	oldName: $("#editLblDlg-oldName").val(),
	          	name: $("#editLblDlg-name").val(),
          	}
          	browser.runtime.sendMessage({
		      		"type": "editLabel",
		      		"data": result
	      		}).then((result) => {
            	$(this).dialog("close");
	      		});
          }
        },
        {
          text: browser.i18n.getMessage("btn_Cancel"),
          click: function() {
            $(this).dialog("close");
          }
        },
      ]
		});
	}
	$("#editLblDlg-oldName").val(aLbl.name),
	$("#editLblDlg-name").val(aLbl.name),

	editLblDlg.dialog("open");
}

function openDelLblDlg (aLbl){
	if (delLblkDlg == null) {
		delLblkDlg = $("#delLblkDlg");
		delLblkDlg.dialog({
			dialogClass: "no-close",
	    autoOpen: false,
	    modal: true,
	    draggable: false,
	    resizable: false,
	     width: 320,
	    position: { my: "center", at: "center", of: "#wrapper" },
	    title: 	browser.i18n.getMessage("delLblkDlg_title"),
	    buttons: [
	      {
	        text: browser.i18n.getMessage("btn_Delete"),
	        click: function() {
	        	browser.runtime.sendMessage({
		      		"type": "deleteLabel",
		      		"data": { 
		      			name: $("#delLblkDlg-name").val(), 
		      			delChildren: $("#delLblkDlg-deleteChildren").prop("checked")
		      		}
	      		}).then((result) => {
	          	$(this).dialog("close");
	      		});
	        }
	      },
	      {
	        text: browser.i18n.getMessage("btn_Cancel"),
	        click: function() {
	          $(this).dialog("close");
	        }
	      },
	    ]
		});
	}
	$("#delLblkDlg-lblChildren").text(browser.i18n.getMessage("delLblkDlg_lblChildren"));
	$("#delLblkDlg-lblInfo").html(browser.i18n.getMessage("delLblkDlg_lblInfo", aLbl.name));
	$("#delLblkDlg-name").val(aLbl.name);

	delLblkDlg.dialog("open");
}


function openQRdialog(aBkmk){
	let dlg = $("#QRdialog");
	dlg.dialog({
		autoOpen: false,
		modal: true,
		draggable: false,
		resizable: false,
		position: { my: "center", at: "center", of: "#wrapper" },
		width: 225,
		title: 	"QR-code for bookmark",
    open: function( event, ui ) {
    	$("#qr_dialog_image")
    		.attr("src", "https://chart.googleapis.com/chart?cht=qr&chl=" + encodeURIComponent(aBkmk.url) + "&choe=UTF-8&chs=200x200");
    }
	});
	dlg.dialog("open");
}

function contextMenuShareBookmark (bkmk, mode) {
	if (bkmk !== null)
	{
		let link = "";
		switch (mode) {
			case "fb":
				link = "https://www.facebook.com/sharer/sharer.php?u=" + bkmk.url;
				break;
			case "tw":
				link = "https://twitter.com/intent/tweet?text=" + bkmk.url + "&source=webclient";
				break;
			case "email":
				link = "mailto:test@example.com?"
         + "&subject=" + bkmk.title
         + "&body=" + bkmk.title + "%0D%0A" + escape(bkmk.url);
		}
		if (link.length > 0) chrome.tabs.create({active: true, url: link});
		window.close();
	}
}

function labelMenuOpenAll(lbl){
	bg.GBE2.m_bookmarkList.forEach((bkmk) => {
		if (bkmk.labels.length && bkmk.labels.indexOf(lbl.name) >=0){
			browser.tabs.create({active: false, url: bkmk.url})
				.catch((e) => {_errorLog("labelMenuOpenAll", e)});
		}
	});
}

function labelMenuAddHere(lbl) {
	browser.tabs.query({active: true, currentWindow: true})
		.then((tabs) => {
			let tab = tabs[0];
			let bkmk = bg.GBE2.getBookmark({ url : tab.url});
			if (bkmk == null) 
				openBkmkDialog ({id: null, title: aTab.title, url: aTab.url, labels: lbl.name, notes: ""});
			else {
				let tbkmk = {
					id: bkmk.id, title: bkmk.title, url: bkmk.url, 
					labels: (bkmk.labels.length>0 ? (bkmk.labels+","+lbl.name):lbl.name), 
					notes: bkmk.notes
				};
				openBkmkDialog (tbkmk);
			}
		});
}

function handleContextMenuClick(event, ui) {
  var node = $.ui.fancytree.getNode(ui.target);
  console.log("select " + ui.cmd + " on " + node);
  let bkmk = null;
  switch (ui.cmd) {
  	// bookmark
  	case "page-go":
  			if (node.data.url.length) {
  				let SearchString = new RegExp("^chrome:|^javascript:|^data:|^about:.*" );
  				if (SearchString.test(node.data.url)) {
  					console.log("In Firefox, you can't open, or navigate to privileged URLs: chrome:, javascript:, data:, about:");
  					console.log("https://developer.mozilla.org/ru/Add-ons/WebExtensions/Chrome_incompatibilities");
  				}
  				else {
  					chrome.tabs.update(aTab.id,{url: node.data.url});
  				}
  				//$("#bkmk-tree").contextmenu("close");
  				window.close();
  			}
  		break;
  	case "page-edit":
  		bkmk = bg.GBE2.getBookmark({id: node.refKey});
  		openBkmkDialog(bkmk);
  		break;
  	case "page-delete":
  		bkmk = bg.GBE2.getBookmark({id: node.refKey});
  		// $("#delBkmkDlg label").text(browser.i18n.getMessage("delBkmkDlg_label", bkmk.title));
  		openDelBkmkDlg(bkmk);
  		break;
  	case "qrcode-icon":
  		bkmk = bg.GBE2.getBookmark({id: node.refKey});
  		openQRdialog(bkmk);
  		break;
  	case "bookmark-emai":
  		bkmk = bg.GBE2.getBookmark({id: node.refKey});
  		contextMenuShareBookmark(bkmk, "email");
  		break;
  	case "bookmark-fbshare":
	  	bkmk = bg.GBE2.getBookmark({id: node.refKey});
	  	contextMenuShareBookmark(bkmk, "fb");
  		break;
  	case "bookmark-twshare":
  		bkmk = bg.GBE2.getBookmark({id: node.refKey});
  		contextMenuShareBookmark(bkmk, "tw");
  		break;
  	// label
  	case "menuEdit":
  		lbl = {id: node.key, name: node.data.path};
  		// console.log(lbl);
  		openEditLblDlg(lbl);
  		break;
  	case "menuRemove":
  		lbl = {id: node.key, name: node.data.path};
  		// console.log(lbl);
  		openDelLblDlg(lbl);
  		break;
  	case "menuOpenAll":
  		lbl = {id: node.key, name: node.data.path};
  		labelMenuOpenAll(lbl);
  		break;
  	case "menuAddHere":
  		lbl = {id: node.key, name: node.data.path};
  		labelMenuAddHere(lbl);
  		break;
  }
}


function bgListener(message)
{
	switch (message.type){
		case "needRefresh":
			refresh();
			break;
		case "refreshed":
			aBkmk = bg.GBE2.getBookmark({ url : aTab.url});
			setClickHandlers (aBkmk);
			// console.log (JSON.stringify(message));

			$.ui.fancytree.getTree("#bkmk-tree").reload(
	          // message.text
	          bg.GBE2.m_treeSource
	        ).done(function(){
	          console.log ("reloaded");
	        });
	    $("#bkmk-tree").fancytree("enable").show();
	    $(".info-box").css({display: 'none'});
	    break;
		case "CntxOpenBkmkDialog":
			openBkmkDialog({id: null, title: message.title, url: message.url, labels: "", notes: ""});
			break;
	}
}

function refresh() {
  console.log("refresh");
  $(".info-box").css({display: 'flex'});
  // TODO сообщение изменить
  $(".info-box label").text("!Loading bookmarks");
  $("#bkmk-tree").fancytree("disable").hide();
  chrome.runtime.sendMessage({
      type: "refresh",
      tab: aTab
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

