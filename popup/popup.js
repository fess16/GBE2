// получаем ссылку на background страницу
browser.runtime.onMessage.addListener(bgListener);
var getting = browser.runtime.getBackgroundPage();
var bg, aTab, aBkmk = null;
var popup = window;
var fTree = null;
var editBkmkDlg = null;
var delBkmkDlg = null;
var editLblDlg = null;
var delLblkDlg = null;
var confirmDlg = null;
var addAllTabsDlg = null;
var dragInfo = {item : null, source : null,	target : null};

// получаем BackgroundPage
getting.then((page) => {bg = page}, (error) => {_errorLog ("Popup-getBackgroundPage", error)});
// получаем информацию о текущей вкладке и соответствующей закладке (по адресу)
browser.tabs.query({active: true, currentWindow: true}).then((tabs) => {
	aTab = tabs[0];
	// console.log(aTab.url);
	aBkmk = bg.GBE2.getBookmark({ url : aTab.url});
	setClickHandlers (aBkmk);
});


/**
 * Устанавливает отбаботчики клика по кнопкам редактирования закладки
 *
 * @param      {<type>}  aBkmk   закладка для текущей вкладки (или null, если закладки нет) 
 */
function setClickHandlers (aBkmk)
{
	removeClickHandlers();
	$(".hmenuLgt a").attr('title', "Logout");
	if (bg.GBE2.m_bookmarkList.length > 0 ) {
		$(".hmenuLgt a")
			.css({display: 'block'})
			.click(function(event) {
				logout();
			});
	}
	else {
		$(".hmenuLgt a").css({display: 'none'})
	}
	
	// console.log(jQuery._data( jQuery(".hmenuReadLater a")[0], "events" ));
	$(".hmenuAdd a").attr('title', _getMsg("popup_hmenuAdd"));
	$(".hmenuEdit a").attr('title', _getMsg("popup_hmenuEdit"))
	$(".hmenuDel a").attr('title', _getMsg("popup_hmenuDel"))
	$(".hmenuReadLater a").attr('title', _getMsg("popup_hmenuReadLater"))
	if (aBkmk !== null) {
		$(".hmenuAdd a, .hmenuReadLater a")
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
				openDelBkmkDlg(aBkmk);
		});
	}
	else {
		$(".hmenuAdd a")
			.removeClass('disabled-link')
			.click(function(event) {
				openBkmkDialog({id: null, title: aTab.title, url: aTab.url, labels: "", notes: "", favIconUrl: aTab.favIconUrl});
		});
		$(".hmenuReadLater a")
			.removeClass('disabled-link')
			.click(function(event) {
				readLater({id: null, title: aTab.title, url: aTab.url, labels: "", notes: "", favIconUrl: aTab.favIconUrl});
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

// удаляет предыдущие обработчики
function removeClickHandlers () {
	$(".hmenuAdd a, .hmenuEdit a, .hmenuReadLater a, .hmenuDel a, .hmenuLgt a").off();
}


function isSpecialUrl (url) {
	let SearchString = new RegExp("^chrome:|^javascript:|^data:|^about:|^file:.*" );
	return SearchString.test(url);
}

function logout () {
	_consoleLog("popup:logout");
	showURL("https://www.google.com/accounts/Logout");
	browser.runtime.sendMessage({	"type": "resetBookmarks" }).then();
	// bg.GBE2.m_bookmarkList = [];
	// bg.GBE2.m_labelsList = null;
	// bg.GBE2.m_treeSource = [];
	// bg.GBE2.m_signature = null;
	// bg.GBE2.m_needRefresh = null;
	$.ui.fancytree.getTree("#bkmk-tree").reload([]);
	// fTree.reload([]);
  popup.close();
}

// открывает ссылку в соответствии с переданными параметрами
function showURL (url, newTab = true, activate = true)
{
	if (url.length) {
		// пропускаем специальные адреса
		if (isSpecialUrl(url)) {
			let msg = "You are trying open privileged URL: " + url;
			msg += "\n(chrome:, javascript:, data:, about:)";
			msg += "\nhttps://developer.mozilla.org/ru/Add-ons/WebExtensions/Chrome_incompatibilities";
			console.log(msg);
			bg.GBE2.showNotify("Privileged URL", msg);
		}
		else {
			if (newTab)
			{
				// в новой вкладке
				browser.tabs.create({active: activate, url: url});
			}
			else {
				// в текущей вкладке
				browser.tabs.update(aTab.id,{url: url});
			}
		}
	}
}

// открывает ссылку в новом окне
function showURLinNewWindow(url, private = false)
{
	if (url.length) {
		if (private) {
			browser.windows.create({url: url, incognito: true})
		}
		else {
			browser.windows.create({url: url})
		}
	}
}

// очищаем поле фильтра, сбрасываем фильтр, разворачиваем метку 
// по клику (нажатию) на отфильтрованных метках
function filteredLabelAction (node) {
	$("#filterTextbox").val("");
	let tree = $.ui.fancytree.getTree();
	resetFilter();
	node.setExpanded();//.scrollIntoView();
}


$(document).ready(function(){
  $("#bkmk-tree").fancytree({
  	extensions: ["filter", "dnd", "edit"],
		quicksearch: true,
  	autoScroll: true, // Automatically scroll nodes into visible area
    clickFolderMode: 4, // 1:activate, 2:expand, 3:activate and expand, 4:activate (dblclick expands)
    debugLevel: 1, // 0:quiet, 1:normal, 2:debug
    focusOnSelect: false, // Set focus when node is checked by a mouse click
    quicksearch: true, // Navigate to next node by typing the first letters
    selectMode: 1, // 1:single, 2:multi, 3:multi-hier
    tabindex: "-1", // Whole tree behaves as one single control
    tooltip: true, // Use title as tooltip (also a callback could be specified)
  	source: bg.GBE2.m_treeSource,
  	// обработчик кликов по закладкам и меткам
  	// клик левой кнопкой назначается отдельно (ниже), для корректрой работы DnD
  	click: function(event, data) {
  		// console.log("FT_click " + event.originalEvent.which);
	    let node = data.node,
        // Only for click and dblclick events:
        // 'title' | 'prefix' | 'expander' | 'checkbox' | 'icon'
        targetType = data.targetType;
      if (targetType == "title" || targetType == "icon") {
      	// клик колесиком (средней кнопкой)
      	if (event.originalEvent.which == 2) {
      		if (node.isFolder())
      			// по метке - открываем вложенные закладки
      			labelMenuOpenAll({id: node.key, name: node.data.path});
    			else
    				// по закладке - открываем в той же вкладке (по-умолчанию), если reverseLeftClick = false
      			showURL(node.data.url, bg.GBE2.opt.reverseLeftClick);
      		window.close();
      	}
      }
	  },
	  // обработчки нажатия Enter на закладках и метках
	  keydown: function(event, data) {
	  	let node = data.node;
	  	if (event.which == 13)
	  		// для закладок - аналог левого клика
	  		if (!node.isFolder()) {
		  		showURL(node.data.url, !bg.GBE2.opt.reverseLeftClick, true);
		  		window.close();
	  		}
	  		else {
	  			// метки - только для отфильтрованных
	  			if ($("#filterTextbox").val() !== "") filteredLabelAction(node);
	  		}
	  },
	  // установка иконки по-умолчанию для закладок при невозможности загрузить заданную иконку
	  enhanceTitle: function(event, data) {
	  	// если включен показ иконок
	  	if (bg.GBE2.opt.showFavicons) {
	  		let node = data.node;
				let img = $(node.span).find("img.fancytree-icon");
		    if( !node.isFolder() ) { 
	    	  img.on("error", function() {
	    			$(this).attr("src", "../images/bkmrk.png")
	    		});
		    }
	  	}
	  },
	  // renderNode: function (event, data) {
	  // 	//console.log(data.node);
	  // 	// $(data.node).addEventListener('contextmenu', function(){
			// $(data.node).find("span.fancytree-title").contextmenu(function(){
			//   // Trigger popup menu on the first target element
			//   console.log("contextmenu" + data.node.data.url);
			//   // $(document).contextmenu("open", $(".hasmenu:first"), {foo: "bar"});
			// });
	  // },
	  // параметры расширения-фильтра
	  filter: {
			autoApply: true,   // Re-apply last filter if lazy data is loaded
			autoExpand: true, // Expand all branches that contain matches while filtered
			counter: false,     // Show a badge with number of matching child nodes near parent icons
			fuzzy: false,      // Match single characters in order, e.g. 'fb' will match 'FooBar'
			hideExpandedCounter: true,  // Hide counter badge if parent is expanded
			hideExpanders: false,       // Hide expanders if all child nodes are hidden by filter
			highlight: true,   // Highlight matches by wrapping inside <mark> tags
			leavesOnly: false, // Match end nodes only
			nodata: true,      // Display a 'no data' status node if result is empty
			mode: "hide"       // Grayout unmatched nodes (pass "hide" to remove unmatched node instead)
		},
		// параметры расширения-DnD
    dnd: {
      autoExpandMS: 400,
      focusOnClick: true,
      preventVoidMoves: true, // Prevent dropping nodes 'before self', etc.
      preventRecursiveMoves: true, // Prevent dropping nodes on own descendants
     	// начало перемещения
      dragStart: function(node, data) {
      	// запрет перемещения для элементов с установленным ignoreMe
      	// 10 последних закладок и т.д.
      	if (node.data.ignoreMe) return false;
      	// перемещаемый элемент
      	dragInfo.item = data.node;
      	let parent = data.node.getParent();
      	// источник перемещения (текущий родитель или null для верхнего уровня)
      	dragInfo.source = (parent.key == "root_1") ? null : parent;
        /** This function MUST be defined to enable dragging for the tree.
         *  Return false to cancel dragging of node.
         */
        return true;
      },
      dragEnter: function(node, data) {
      	// запрет дропа на метки с ignoreMe и закладки
        if (node.data.ignoreMe || !node.isFolder()) return false;
        // 
        let parent = data.node.getParent();
        if (parent.key !== "root_1" || (parent.key == data.otherNode.getParent().key))
        	return ["over"];
        /** data.otherNode may be null for non-fancytree droppables.
         *  Return false to disallow dropping on node. In this case
         *  dragOver and dragLeave are not called.
         *  Return 'over', 'before, or 'after' to force a hitMode.
         *  Return ['before', 'after'] to restrict available hitModes.
         *  Any other return value will calc the hitMode from the cursor position.
         */
        // Prevent dropping a parent below another parent (only sort
        // nodes under the same parent)
/*           if(node.parent !== data.otherNode.parent){
          return false;
        }
        // Don't allow dropping *over* a node (would create a child)
        return ["before", "after"];
*/				
				// return ["over"];
        return true;
      },
      dragDrop: function(node, data) {
        /** This function MUST be defined to enable dropping of items on
         *  the tree.
         */
        // console.log ("dragDrop "+ data.hitMode)
        // новое расположение элемента
        dragInfo.target = node;
        if ((data.hitMode == "before" || data.hitMode == "after") && node.getParent().key == "root_1")
          dragInfo.target = null;
        // console.log(dragInfo.item.title + "|" 
        // 	+ (dragInfo.source == null ? dragInfo.source : dragInfo.source.data.path) + "|" 
        // 	+ (dragInfo.target == null ? dragInfo.target : dragInfo.target.data.path));
        // если перемещаем метку
        if (dragInfo.item.isFolder()) {
        	let label = {name : "", oldName : dragInfo.item.data.path};
      		// новое значение метки
        	if (dragInfo.target == null)
        		// стала меткой верхнего уровня
        		label.name = dragInfo.item.title
        	else
        		// стала вложенной в другую метку
        		label.name = dragInfo.target.data.path + bg.GBE2.opt.nestedLabelSep + dragInfo.item.title;
        	// как при обычном изменении метки (в диалоге)
        	browser.runtime.sendMessage({
	      		"type": "editLabel",
	      		"data": label
      		}).then();
        // перемещали закладку 
        } else {
        	// перемещаемая закладка
        	let bkmk = Object.assign({oldUrl : ""}, bg.GBE2.getBookmark({ id : dragInfo.item.refKey}));
        	// формируем новое занчение меток
        	if (dragInfo.target == null) {
        		// верхний уровень - обнуляем
	        	bkmk.labels = [];
        	}
	        else {
	        	if (dragInfo.source == null){
	        		// перемещали с верхнего уровня - target-метка
	        		bkmk.labels = [dragInfo.target.data.path];
	        	}
	        	else {
	        		// перемещали из другой метки - меняем старую метку на новую
		        	let index = bkmk.labels.indexOf(dragInfo.source.data.path);
		        	if (index) {
		        	  	bkmk.labels[index] = dragInfo.target.data.path;
		        	  	bkmk.labels.sort(function (a, b) {
		        	  	  return a.localeCompare(b);
		        	  	});
		        	}
		        	else {
		        		bkmk.labels = [dragInfo.target.data.path];
		        	}
		        }
	      	}
        	//если в исходной метке была только эта закладка, метку надо удалить
        	//перемещаемая закладка
    			let mvNode = data.otherNode;
    			// исходный родитель
      		let oldParent = mvNode.getParent();
      		// флаг удаления исходной метки
    			let rmvOldParent = false;
    			// в родителе только один дочерний элемент - текущий
  				if (oldParent !== null && oldParent.getChildren().length == 1)
  				// if (oldParent !== null && oldParent.getChildren().filter(x => !x.isFolder()).length == 1)
  				{
  					rmvOldParent = true;
  				}
	        // сообщение в бэкграунд скрипт
        	browser.runtime.sendMessage({
	      		"type": "moveBookmark",
	      		"data": {
	      			"bkmk" :	bkmk,
	      			"oldParent" : rmvOldParent ? oldParent.data.path : null
	      		}
      		}).then((result) => {
      			// элементы (закладки и метки), вложенные в новую метку (или верхний уровень)
      			let children = null;
      			if (bkmk.labels.length == 0) {
      				let tree = $("#bkmk-tree").fancytree("getTree");
      				children = tree.rootNode.getChildren();
      			}
      			else {
      				children = node.getChildren();
      			}
    				let flag = 0;
    				let child = null;
    				// определяем позицию для вставки закладки
    				if (children.length>0) {
    					// сначала сравниваем с последним элементом
    					child = children[children.length-1];
    					// если заголовок/время (sortType) закладки больше/меньше (sortOrder) последней
    					// или последний элемент - метка
    					// вставляем после него
    					flag = bg.GBE2.opt.sortType == "timestamp" ? bg.GBE2.compareByDate(mvNode.data, child.data) : bg.GBE2.compareByName(mvNode, child);
    					if (flag == 1 || child.isFolder()) {
    						mvNode.moveTo(child, "after");
    						mvNode.scrollIntoView(false);
    					}
    					else {
    						// проверяем остальные элементы
		    				for (child of children) {
		    					// пропускаем метки
		    				  if (child.isFolder()) continue;
		    					flag = bg.GBE2.opt.sortType == "timestamp" ? bg.GBE2.compareByDate(mvNode.data, child.data) : bg.GBE2.compareByName(mvNode, child);
		    					if (flag == -1) {
		    						mvNode.moveTo(child, "before");
		    				    break;
		    					}
		    				}
		    			}
		    			if (rmvOldParent) {
	    					// удаляем старую метку из #bkmk-tree
	    					oldParent.remove();
	    				}
	    			}
      		});
	        
        }
      },
      // обнуляем dragInfo после перемещения
      dragStop: function(node, data) {
      	dragInfo = {item : null, source : null,	target : null};
    	},
    },
   //  activate: function(event, data) {
			// console.log("activate " + data.node);
   //  },
  }); // fancytree инициализация

  fTree = $("#bkmk-tree").fancytree("getTree");

  let hiddenPKey  = bg.GBE2.genereteLabelId(bg.GBE2.opt.hiddenLabelsTitle);

  // настройки плагина контекстного меню для дерева
  $("#bkmk-tree").contextmenu({
    delegate: "span.fancytree-title, img.fancytree-icon, span.fancytree-expander",
    addClass : "GBE-ui-contextmenu",
    autoFocus: true,
    autoTrigger : true,
    // hide : "fast",
    show : "fast",
    menu: [
    	// folder (label) menu
      {title: _getMsg("cntx_folder_menuEdit"), cmd: "menuEdit", uiIcon: "cntx-folder-menuEdit"},
      {title: _getMsg("cntx_folder_menuRemove"), cmd: "menuRemove", uiIcon: "cntx-folder-menuRemove"},
      {title: "----", cmd: "msepf"},
      {title: _getMsg("cntx_folder_menuOpenAll"), cmd: "menuOpenAll", uiIcon: "cntx-folder-menuOpenAll"},
      {title: "----", cmd: "msepf"},
      {title: _getMsg("cntx_folder_menuAddHere"), cmd: "menuAddHere", uiIcon: "cntx-folder-menuAddHere"},
      {title: _getMsg("cntx_folder_menuAddAllTabs"), cmd: "menuAddAllTabs", uiIcon: "cntx-folder-menuAddAllTabs"},
      {title: "----", cmd: "msepf"},
      {title: _getMsg("cntx_folder_menuHideFolder"), cmd: "menuHideFolder", uiIcon: "cntx-folder-menuHideFolder"},
      {title: _getMsg("cntx_folder_menuUnhideFolder"), cmd: "menuUnhideFolder", uiIcon: "cntx-folder-menuUnhideFolder"},
      {title: _getMsg("cntx_folder_menuUnhideAll"), cmd: "menuUnhideAll", uiIcon: "cntx-folder-menuUnhideAll"},
      {title: "----", cmd: "msepf"},
      {title: _getMsg("cntx_folder_menuExport"), cmd: "menuExport"},
      // bookmark menu
      {title: (bg.GBE2.opt.reverseLeftClick ? _getMsg("cntx_page_inNewTab") : _getMsg("cntx_page_go")), 
      	cmd: "page-go", uiIcon: "cntx-page-go"},
      {title: _getMsg("cntx_page_newWidow"), cmd: "page-newWidow"},
      {title: _getMsg("cntx_page_newPrivate"), cmd: "page-newPrivate"},
      {title: "----", cmd: "msepp"},
      {title: _getMsg("cntx_page_edit"), cmd: "page-edit", uiIcon: "cntx-page-edit"},
      {title: _getMsg("cntx_page_delete"), cmd: "page-delete", uiIcon: "cntx-page-delete"},
      {title: "----", cmd: "msepp"},
      {title: _getMsg("cntx_qrcode_icon"), cmd: "qrcode-icon", uiIcon: "cntx-qrcode-icon"},
      {title: "E-mail...", cmd: "bookmark-emai", uiIcon: "cntx-bookmark-emai"},
      {title: "Facebook...", cmd: "bookmark-fbshare", uiIcon: "cntx-bookmark-fbshare"},
      {title: "Twitter...", cmd: "bookmark-twshare", uiIcon: "cntx-bookmark-twshare"},
    ],
    beforeOpen: function(event, ui) {
      var node = $.ui.fancytree.getNode(ui.target);
      // $("#bkmk-tree").contextmenu("enableEntry", "paste", node.isFolder());
      // скрываем/отображаем элементы для меток/закладок при открытии
      if (node.isFolder()) {
      	if (node.title == bg.GBE2.m_RecentLabel || node.title == bg.GBE2.m_VisitedLabel) return false;
      	$("#bkmk-tree").contextmenu("showEntry", "menuEdit", true);
      	$("#bkmk-tree").contextmenu("showEntry", "menuRemove", true);
      	$("#bkmk-tree").contextmenu("showEntry", "menuOpenAll", true);
      	$("#bkmk-tree").contextmenu("showEntry", "menuAddHere", true);
      	$("#bkmk-tree").contextmenu("showEntry", "menuAddAllTabs", true);
      	$("#bkmk-tree").contextmenu("showEntry", "menuExport", true);
      	$("#bkmk-tree").contextmenu("showEntry", "msepf", true);

      	$("#bkmk-tree").contextmenu("showEntry", "menuHideFolder", false);
      	$("#bkmk-tree").contextmenu("showEntry", "menuUnhideFolder", false);
      	$("#bkmk-tree").contextmenu("showEntry", "menuUnhideAll", false);
      	
      	if (bg.GBE2.opt.enableLabelHiding) {
      		if (hiddenPKey == node.key)
	      		$("#bkmk-tree").contextmenu("showEntry", "menuUnhideAll", true);
					else if (node.data.hidden)      		
	      		$("#bkmk-tree").contextmenu("showEntry", "menuUnhideFolder", true);
	      	else
	      		$("#bkmk-tree").contextmenu("showEntry", "menuHideFolder", true);
      	}
      	//TODO: добавить скрытие/отображение для отдельных закладок

      	$("#bkmk-tree").contextmenu("showEntry", "page-go", false);
      	$("#bkmk-tree").contextmenu("showEntry", "page-newWidow", false);
      	$("#bkmk-tree").contextmenu("showEntry", "page-newPrivate", false);
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
      	$("#bkmk-tree").contextmenu("showEntry", "page-newWidow", true);
      	$("#bkmk-tree").contextmenu("showEntry", "page-newPrivate", true);
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

  // обработчик кликов по закладкам и меткам
	$("#bkmk-tree").on("click", function(event) {
		let node = $.ui.fancytree.getNode(event),
      // Only for click and dblclick events:
      // 'title' | 'prefix' | 'expander' | 'checkbox' | 'icon'
      targetType = $.ui.fancytree.getEventTargetType(event);
    if (targetType == "title" || targetType == "icon") {
    	if ($("#filterTextbox").val() !== "" && event.originalEvent.which == 1 && node.isFolder()) {
    		filteredLabelAction(node);
    		return true;
    	}
    	// левый клик по закладкам - открываем в новой вкладке (по-умолчанию), если reverseLeftClick = false
    	// which: left button - 1, middle button - 2
    	if (event.originalEvent.which == 1 && !node.isFolder())	{
    		showURL(node.data.url, !bg.GBE2.opt.reverseLeftClick, true);
    		// return false;
    		window.close();
    	}
    	// клик колесиком (средней кнопкой)
    	if (event.originalEvent.which == 2) {
    		if (node.isFolder())
    			// по метке - открываем вложенные закладки
    			labelMenuOpenAll({id: node.key, name: node.data.path});
  			else
  				// по закладке - открываем в той же вкладке (по-умолчанию), если reverseLeftClick = false
    			showURL(node.data.url, bg.GBE2.opt.reverseLeftClick);
    		window.close();
    	}
    }
  }
  );

	$(".filterHBox label").text(_getMsg("popup_filterLabel"));

	$("#editBkmkDlg").attr("title", _getMsg("editBkmkDlg_title"));
	$("label[for='editBkmkDlg-name']").text(_getMsg("editBkmkDlg_name"));
	$("label[for='editBkmkDlg-url']").text(_getMsg("editBkmkDlg_url"));
	$("label[for='editBkmkDlg-labels']").text(_getMsg("editBkmkDlg_labels"));
	$("label[for='editBkmkDlg-notes']").text(_getMsg("editBkmkDlg_notes"));
	
	//отключаем контекстное меню на кнопках дополнения
	$(".nav-bar li").on("contextmenu",function(){
   return false;
	}); 

	console.log("GBE2:popup.js");

	// при установленном признаке необходимости обновления списка закладок
	// когда меняются настроки дополнения
	if (bg.GBE2.m_needRefresh) {
		bg.GBE2.m_needRefresh = false;
		refresh();
	}

	// если m_dlgInfo.needOpen == true, то необходимо открыть диалог редактирования закладки
	// с параметрами из m_dlgInfo
	if (bg.GBE2.m_dlgInfo !== null && bg.GBE2.m_dlgInfo.needOpen && !bg.GBE2.m_needRefresh)
	{
		bg.GBE2.m_dlgInfo.needOpen = false;
		// setTimeout(() => {
		openBkmkDialog(
			{id: null, title: bg.GBE2.m_dlgInfo.title, url: bg.GBE2.m_dlgInfo.url, labels: "", notes: "", favIconUrl: bg.GBE2.m_dlgInfo.favIconUrl}
		);
		$("#editBkmkDlg").dialog('option', 'position', { my: "center", at: "center", of: "#wrapper" })
		// }, 100);
	}

	// назначем обработчики кнопок
	// зависящие от текущей вкладки - добавление/редактирование/удаление закладки
	if (aTab){
		aBkmk = bg.GBE2.getBookmark({ url : aTab.url});
		setClickHandlers (aBkmk);
	}

	// обновление списка закладок
	$(".hmenuRefresh a")
		.attr('title', _getMsg("popup_hmenuRefresh"))
		.click(function(event) { 
			refresh();	
	});
	// открытие настроек дополнения
	$(".hmenuOpt a")
		.attr('title', _getMsg("popup_hmenuOpt"))
		.click(function(event) {
			openOptionsPage();
	});
	// добавление в закладки открытых вкладок		
	$(".hmenuAddOpenTabs a")
		.attr('title', _getMsg("popup_hmenuAddOpenTabs"))
		.click(function(event) {
			//test1();
			openAddAllTabsDlg();
	});
	// открытие страницы Google Bookmarks
	$(".hmenuGBs a")
		.attr('title', _getMsg("popup_hmenuGBs"))
		.click(function(event) {
			showURL("https://www.google.com/bookmarks/");
			window.close();
	});

	// клик на QR-коде в диалоге - открываем его в новой вкладке 
	$("#qr_dialog_image").on("click", function () {
		showURL($(this).attr("src"));
		window.close();
	});

	// разрешение/запрет редактирования адреса закладки
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

	// сброс фильтра - по клику или нажанию Enter и пробела
	$("a.clrBtn").on("keypress click", (e) => {
		if (e.type = "click" && (e.which == 1 || e.which == 13 || e.which == 32)) {
			$("#filterTextbox").val('').focus();
			resetFilter();
    }
	});

	// фильтрация списка при наборе в #filterTextbox
	$("#filterTextbox").keyup(function(e){
		let n,
				tree = $.ui.fancytree.getTree(),
				match = $(this).val();
		// сбрасываем таймер при вводе очередного символа
		clearTimeout($.data(this, 'timer'));
		// если поле фильтра пустое (одни пробелы) или одна кавычка (") - сбрасываем фильтр
		// !!!!! ESCAPE - не работает - окно закрывается
		if(e && e.which === $.ui.keyCode.ESCAPE || $.trim(match) === "" || $.trim(match) === '"'){
			resetFilter();
			return false;
		}
		// показываем кнопку очистки фильтра
		$("a.clrBtn").css({display: 'inline'});
		// задержка срабатывания фильтра
		var wait = setTimeout(filter, bg.GBE2.opt.filterDelay);
		$(this).data('timer', wait);
		// функция фильтрации
		function filter() {
			// фильтруем
			n = tree.filterNodes(function(node) {
				// пропускаем метки с ignoreMe
				if( node.data.ignoreMe ) {
				    return "skip";  
				}
				// параметры фильтра: заголовок, заметки, адрес
				let bkmk = {
					title : node.title,
					notes : node.data.notes ? node.data.notes : "",
					url : node.data.url ? node.data.url : ""
				}
				// выделяем найденный текст
				let replacement = '<mark>$&</mark>';
				// проверяем текущее значение фильтра
				let check = bg.GBE2.checkBookmark(bkmk, match);
				// нашли
				if (check.isMatch) 
				{
					// для меток и закладок (при совпадении в заголовке) - выделяем найденный текст
					if (node.isFolder()) {
						node.titleWithHighlight = node.title.replace(check.search, replacement);
						return "branch";  // match the whole 'Foo' branch, if it's a folder
					}
					else {
						if (check.search !== "") 
							node.titleWithHighlight = node.title.replace(check.search, replacement);
						else
							// при совпадении в примечании или адресе - добавляем к заголовку соответствующую метку
							node.titleWithHighlight = (check.extra == null) ? node.title : `<mark class="${check.extra.class}">${check.extra.text}</mark>` + node.title;
					}						                 
				}
				return check.isMatch;
			});
		}
	}).focus();

	// при открытии окна устанавливаем фокус на поле фильтра
	setTimeout (() => {$("#filterTextbox").focus();}, 200);
	$("#bkmk-tree ul").attr("tabindex", "3");
}); // document ready

// сброс фильтра
function resetFilter(){
	$("a.clrBtn").css({display: 'none'})
	fTree.clearFilter();
}

// настройка элементов управления в диалоге редактирования закладки
function setBkmkControls (bkmk)
{
	$("#editBkmkDlg-name").val(bkmk.title);
	$("#editBkmkDlg-url").val(bkmk.url);
	$("#editBkmkDlg-labels").val(bkmk.labels);
	$("#editBkmkDlg-notes").val(bkmk.notes);
	$("#editBkmkDlg-id").val(bkmk.id);
	if (bkmk.labels.length > 0) {
		$("#editBkmkDlg-labels").val(bkmk.labels + ", ");
	}
	$("#editBkmkDlg-notes").val(bkmk.notes);

	if (bkmk.hasOwnProperty("favIconUrl") && bkmk.favIconUrl) {
		$("#editBkmkDlg-favIconUrl").val(bkmk.favIconUrl);
	}
	// при добавлении закладки
	if (bkmk.id == null) 	{
		$("#editBkmkDlg-enableUrlEdit").attr("disabled",true);
	}
	// при редактировании закладки
	else {
		$("#editBkmkDlg-oldUrl").val(bkmk.url);
		$("#editBkmkDlg-enableUrlEdit").prop("checked", false).attr("disabled",false);
		$("#editBkmkDlg-url").attr("readonly",true);
		// при отключенной опции enableNotes и не заполенном поле примечания
		if (!bg.GBE2.opt.enableNotes && bkmk.notes == "") {
			// делаем запрос 
			bg.GBE2.doRequestBookmarkNote(bkmk)
			.then(result => {
				$("#editBkmkDlg-notes").val(result);
			})
			.catch((error) => {
	    	_errorLog("popup:setBkmkControls", error);
 	 		});
		}
		// bkmk.url = "";
		// при пустом поле адреса - запрашиваем его
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

// добавление закладки в метку readLater - без показа диалога редактирования
function readLater (bkmk) {
	bkmk.labels = [bg.GBE2.opt.readLaterTitle];
	bkmk.oldUrl = "";
	browser.runtime.sendMessage({
		"type": "editBookmark",
		"data": bkmk
	}).then();
}

// открытие диалога редактирования закладки
function openBkmkDialog (bkmk)
{
	// инициализация
	if (editBkmkDlg == null)
	{
		editBkmkDlg = $("#editBkmkDlg");
		editBkmkDlg.dialog({
			dialogClass: "no-close",
      autoOpen: false,
      modal: true,
      draggable: false,
      resizable: false,
      position: { my: "center", at: "center", of: "#wrapper" },
      // closeOnEscape: false
      // minWidth: "480px",
      width: "500px",
      buttons: [
        {
          text: _getMsg("btn_Save"),
          click: function() {
          	// TODO: добавить проверки полей
          	let result = {
	          	id: $("#editBkmkDlg-id").val().trim(),
	          	oldUrl: $("#editBkmkDlg-oldUrl").val().trim(),
	          	title: $("#editBkmkDlg-name").val().trim(),
	          	url: $("#editBkmkDlg-url").val().trim(),
	          	labels: $("#editBkmkDlg-labels").val().trim(),
	          	notes: $("#editBkmkDlg-notes").val().trim(),
	          	favIconUrl: $("#editBkmkDlg-favIconUrl").val().trim(),
          	}
          	browser.runtime.sendMessage({
		      		"type": "editBookmark",
		      		"data": result
	      		}).then((result) => {
	      			setBkmkControls({id: null, title: "", url: "", labels: "", notes: "", favIconUrl: ""});
            	$(this).dialog("close");
	      		});
          }
        },
        {
          text: _getMsg("btn_Cancel"),
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
	  source: labelAutocompleteSource,
	  focus: function () {return false;},
	  select: labelAutocompleteSelect
	});

	editBkmkDlg.dialog("open");
}

function split(val) {
  return val.split(/,\s*/);
}

function extractLast(term) {
  return split(term).pop();
}

// формирует список значений для автокомплита поля метки
function labelAutocompleteSource (request, response) {
  let term = request.term;
  // substring of new string (only when a comma is in string)
  // if (term.indexOf(', ') > 0) {
  //     var index = term.lastIndexOf(', ');
  //     term = term.substring(index + 2);
  // }
  // получаем значение после последнего вхождения ,\s*
  // например: тест1, тест2, <значение>
  // let re1 = /(,\s*)((?!.*\1)|$)/g;
  // if (re1.test(term)) {
  //     let index = term.search(re1);
  //     term = term.replace(re1, ",").substring(index + 1);
  // }
  term = extractLast(term);
  // экранируем введенное значение
  let re = $.ui.autocomplete.escapeRegex(term);
  // ищем с начала метки или после разделителя вложенных меток
  let matcher = new RegExp("(^|"+ bg.GBE2.opt.nestedLabelSep + ")"+ re, 'i');
  // фильтруем массив меток m_labelsList
  let tLabelArray = $.grep(bg.GBE2.m_labelsList, function (item, index) {
      return matcher.test(item.title);
  });
  // формируем список для автокомплита
  let regex_validated_array = [];
	tLabelArray.forEach((element, index) => {
	  regex_validated_array.push(element.title);
	});
  // pass array `regex_validated_array ` to the response and 
  // `extractLast()` which takes care of the comma separation
  response($.ui.autocomplete.filter(regex_validated_array, term));
}

function labelAutocompleteSelect (event, ui)
{
  var TABKEY = 9;
	if (event.keyCode == TABKEY) { 
    event.preventDefault();
	}
  let terms = split(this.value);
  terms.pop();
  terms.push(ui.item.value);
  terms.push('');
  this.value = terms.join(', ');
  this.focus();
  return false;
}

// открывает диалог удаления закладки
function openDelBkmkDlg (aBkmk){
	// инициализация
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
	    title: 	_getMsg("delBkmkDlg_title"),
	    buttons: [
	      {
	        text: _getMsg("btn_Delete"),
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
	        text: _getMsg("btn_Cancel"),
	        click: function() {
	          $(this).dialog("close");
	        }
	      },
	    ]
		});
	}
	$("#delBkmkDlg label").html(_getMsg("delBkmkDlg_label", aBkmk.title));
	$("#delBkmkDlg-id").val(aBkmk.id);

	delBkmkDlg.dialog("open");
}

// открывает диалог редактирования метки
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
	    title: 	_getMsg("editLblDlg_title"),
      buttons: [
        {
          text: _getMsg("btn_Save"),
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
          text: _getMsg("btn_Cancel"),
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

// открывает диалог удаления метки
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
	    title: 	_getMsg("delLblkDlg_title"),
	    buttons: [
	      {
	        text: _getMsg("btn_Delete"),
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
	        text: _getMsg("btn_Cancel"),
	        click: function() {
	          $(this).dialog("close");
	        }
	      },
	    ]
		});
	}
	$("#delLblkDlg-lblChildren").text(_getMsg("delLblkDlg_lblChildren"));
	$("#delLblkDlg-lblInfo").html(_getMsg("delLblkDlg_lblInfo", aLbl.name));
	$("#delLblkDlg-name").val(aLbl.name);

	delLblkDlg.dialog("open");
}

// открывает диалог с QR-кодом для закладки
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

// открывает диалог подтверждения действия
// message - задает сообдение в диалоге
// callback - действие по кнопке подтверждения
function openConfirmDlg(message, callback){
	if (confirmDlg == null) {
		confirmDlg = $("#confirmDlg");
		confirmDlg.dialog({
			dialogClass: "no-close",
	    autoOpen: false,
	    modal: true,
	    draggable: false,
	    resizable: false,
	    width: 320,
	    position: { my: "center", at: "center", of: "#wrapper" },
	    title: 	_getMsg("confirmDlg_title"),
		});
	}
	confirmDlg.dialog("option", "buttons", 
	  [
      {
        text: _getMsg("btn_Confirm"),
        click: function() {
        	callback();
        }
      },
      {
        text: _getMsg("btn_Cancel"),
        click: function() {
          $(this).dialog("close");
        }
      },
	  ]
	);
	$("#confirmDlg-Info").html(message);

	confirmDlg.dialog("open");
}

// открывает диалог добавления всех открытых вкладок в закладки
function openAddAllTabsDlg(label="_OpenTabs") {
	if (addAllTabsDlg == null) {
		addAllTabsDlg = $("#addAllTabsDlg");
		addAllTabsDlg.dialog({
			dialogClass: "no-close",
	    autoOpen: false,
	    modal: true,
	    draggable: false,
	    resizable: false,
	    width: 500,
	    position: { my: "center", at: "center", of: "#wrapper" },
	    title: _getMsg("addAllTabsDlg_title"),
	    buttons: [
	      {
	        text: _getMsg("btn_Save"),
	        click: function() {
	        	// метка/и для добавляемых закладок
	        	let label = $("#addAllTabsDlg-label").val();
	        	// формируем массив с добавляемыми закладками
	        	let result = [];
	        	$("div.divTableCell  input:checked").each(function() {
	          	let item = {
		          	id: "",
		          	oldUrl: "",
		          	title: $(this).parent().parent().find("div:nth-child(2)").text(),
		          	url: $(this).parent().parent().find("div:nth-child(3)").text(),
		          	labels: label,
		          	notes: "",
		          	favIconUrl: $(this).parent().find("input.favIconUrl").val()
	          	}
	          	let bkmk = null;
	          	bkmk = bg.GBE2.getBookmark({ url : item.url})
	          	// для существующих заклдадок - просто добавляем новую метку
	        		if (bkmk !== null) {
	        			item.id = bkmk.id;
	        			item.title = bkmk.title;
	        			item.notes = bkmk.notes;
	        			if (bkmk.labels.length) {
	        				item.labels = bkmk.labels.slice();
	        				item.labels.push(label);
	        			}
	        		}
	        		result.push(item);
	        	});
	        	if (result.length) {
		        	browser.runtime.sendMessage({
				      		"type": "addAllTabs",
				      		"data": result
			      		}
		      		).then((result) => {
		          	$(this).dialog("close");
		      		});
	        	}
	        	else $(this).dialog("close");
	        }
	      },
	      {
	        text: _getMsg("btn_Cancel"),
	        click: function() {
	          $(this).dialog("close");
	        }
	      },
	    ],
	    beforeClose: function( event, ui ) {$("#wrapper").width("350px");}
		});
		$("#addAllTabsDlg-headCheckBox").on("change", function(e) {
			$("div.divTableCell  input").prop("checked", $(this).prop('checked'));
		});
		$("label[for=addAllTabsDlg-label]").text(_getMsg("addAllTabsDlg_label"));
		$(".addAllTabsDlg_tblHeadTitle").text(_getMsg("addAllTabsDlg_tblHeadTitle"));
		$(".addAllTabsDlg_tblHeadUrl").text(_getMsg("addAllTabsDlg_tblHeadUrl"));
	}
	$("#wrapper").width("500px");

	$("#addAllTabsDlg-label").val(label);
	$('#addAllTabsDlg-label').autocomplete({
	  minLength: 1,
	  delay: 50,
	  source: labelAutocompleteSource,
	  focus: function () {return false;},
	  select: labelAutocompleteSelect
	});
	// получаем все вкладки в текущем окне
	browser.tabs.query({currentWindow: true}).then((tabs) => {
		let tBody = $(".divTableBody");
		tBody.empty();
		// заполняем таблицу со списком вкладок
		tabs.forEach((tab) => {
			// TODO: снять галки у уже добавленных в закладки
			let tRow = '<div class="divTableRow">' +
				'<div class="divTableCell"><input type="checkbox" id="addAllTabsDlg-row' + tab.id +'">' +
				'<input type="hidden" class="favIconUrl" value="' + (tab.favIconUrl ? tab.favIconUrl : "") + '"></div>' + 
				'<div class="divTableCell">' + tab.title +'</div>' +
				'<div class="divTableCell">' + tab.url +'</div>' + 
				'</div>';
			$(tRow).appendTo(tBody);
		});

		addAllTabsDlg.dialog("open");
	})
}

// обработка пунктов "поделиться" (фэйсбук, твиттер, почта) в контекстном меню закладки
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
		if (link.length > 0) showURL(link);
		window.close();
	}
}

// открытие всех закладок в метке
function labelMenuOpenAll(lbl){
	bg.GBE2.m_bookmarkList.forEach((bkmk) => {
		if (bkmk.labels.length && bkmk.labels.indexOf(lbl.name) >=0){
			showURL(bkmk.url, true, false);
		}
	});
}

// контекстное меню метки - добавить закладку здесь
function labelMenuAddHere(lbl) {
	// получаем информацию о текущей вкладке
	browser.tabs.query({active: true, currentWindow: true})
		.then((tabs) => {
			let tab = tabs[0];
			let bkmk = bg.GBE2.getBookmark({ url : tab.url});
			// если закладки с таким адресом нет - добавляем
			if (bkmk == null) 
				openBkmkDialog ({id: null, title: aTab.title, url: aTab.url, labels: lbl.name, notes: "", favIconUrl: aTab.favIconUrl});
			else {
				// иначе - добавляем метку к существующей закладке
				let tbkmk = {
					id: bkmk.id, title: bkmk.title, url: bkmk.url, 
					labels: (bkmk.labels.length>0 ? (bkmk.labels+","+lbl.name):lbl.name), 
					notes: bkmk.notes
				};
				openBkmkDialog (tbkmk);
			}
		});
}

// контекстное меню метки - скрытие метки
function folderMenuHideFolder(lbl) {
	let msg = _getMsg("confirmDlg_HideFolder_msg", lbl.name);
	let hideFolder = () => {
		let result = {
    	oldName: lbl.name,
    	name: bg.GBE2.opt.hiddenLabelsTitle + bg.GBE2.opt.nestedLabelSep + lbl.name
  	}
  	browser.runtime.sendMessage({
  		"type": "editLabel",
  		"data": result
		}).then(() => {
    	$("#confirmDlg").dialog("close");
		});
	};
	openConfirmDlg(msg, hideFolder);
}

// контекстное меню скрытой метки - убрать метку из скрытых
function folderMenuUnhideFolder (lbl) {
	let msg = _getMsg("confirmDlg_UnhideFolder_msg", lbl.name);
	let re = new RegExp ("^" + bg.GBE2.opt.hiddenLabelsTitle + bg.GBE2.opt.nestedLabelSep, "i");
	if (lbl.name.search(re) == 0) {
		let UnhideFolder = () => {
			let result = {
	    	oldName: lbl.name,
	    	name: lbl.name.replace(re, '')
	  	}
	  	browser.runtime.sendMessage({
	  		"type": "editLabel",
	  		"data": result
			}).then(() => {
	    	$("#confirmDlg").dialog("close");
			});
		};
		openConfirmDlg(msg, UnhideFolder);
	}
}

// контекстное меню скрытых меток - убрать все метки из скрытых
function folderMenuUnhideAll (lbl) {
	let msg = _getMsg("confirmDlg_UnhideAll_msg");
	if (lbl.name == bg.GBE2.opt.hiddenLabelsTitle) {
		let UnhideAll = () => {
			let result = {
	    	oldName: bg.GBE2.opt.hiddenLabelsTitle,
	    	name: ''
	  	}
	  	browser.runtime.sendMessage({
	  		"type": "editLabel",
	  		"data": result
			}).then(() => {
	    	$("#confirmDlg").dialog("close");
			});
		};
		openConfirmDlg(msg, UnhideAll);
	}
}

// контекстное меню метки - экспорт в HTML
// ограничения - пока только в папку Загрузки
function folderMenuExport(lbl) {
	if (bg.GBE2.m_treeSource && bg.GBE2.m_treeSource.length)
	{
		let tree = bg.GBE2.m_treeSource;
		let enableNotes = bg.GBE2.opt.enableNotes;
		let exportLabel = bg.GBE2.searchLabelByPath(tree, lbl.name);
		if (exportLabel.hasOwnProperty("key")) {
			var html = "<!DOCTYPE NETSCAPE-Bookmark-file-1>\n";
			html += "<META HTTP-EQUIV='Content-Type' CONTENT=text/html; charset=UTF-8'>\n";
			html += "<TITLE>Bookmarks</TITLE>\n";
			html += "<H1>Bookmarks</H1>\n";
			html += "<DL><p>\n";

			let export_folder = function(node)
			{
				html += "<DT><H3>" + node.path + "</H3>\n";
				html += "<DL><p>\n";
				if (node.children.length) {
					for (let i = 0; i < node.children.length; i++)
					{
						if (node.children[i].hasOwnProperty("folder"))
						{
							export_folder(node.children[i]);
						}
						else
						{
							let bkmk = bg.GBE2.getBookmark({id: node.children[i].refKey});
							html += "\t<DT><A HREF=" + '"' + bkmk.url + ' "ADD_DATE="' 
								+ (enableNotes ? Date.parse(bkmk.timestamp)/1000 : bkmk.timestamp) 
								+ '">' + bkmk.title 
								+ "</A>\n";
							if (bkmk.notes.length)
								html += "\t<DD>" + bkmk.notes + "\n";
						}
				}
				}
				html += "</DL><p>\n";
			};
			export_folder(exportLabel);

			var blobUrl = URL.createObjectURL(new Blob([html], {type: 'text/plain;charset=utf-8'}));
		  // var downloadUrl = "http://10.115.161.12/mediawiki/index.php/%D0%97%D0%B0%D0%B3%D0%BB%D0%B0%D0%B2%D0%BD%D0%B0%D1%8F_%D1%81%D1%82%D1%80%D0%B0%D0%BD%D0%B8%D1%86%D0%B0";
		  var downloading = browser.downloads.download({
		    url : blobUrl,
		    //saveAs: true,
		    filename : encodeURI('bookmarks_' + lbl.id) + '.html',
		    conflictAction : 'overwrite'
		  });
		  downloading.then().catch((e) => {_errorLog("folderMenuExport",e)});

		}
	}
}

// обработчик кликов для пунктов контекстного меню дерева закладок
function handleContextMenuClick(event, ui) {
  var node = $.ui.fancytree.getNode(ui.target);
  console.log("select " + ui.cmd + " on " + node);
  let bkmk = null;
  let lbl = null;
  switch (ui.cmd) {
  	// для закладок
  	case "page-go":
  			if (node.data.url.length) {
  				showURL(node.data.url, bg.GBE2.opt.reverseLeftClick, true);
  				window.close();
  			}
  		break;
  	case "page-edit":
  		bkmk = bg.GBE2.getBookmark({id: node.refKey});
  		openBkmkDialog(bkmk);
  		break;
  	case "page-delete":
  		bkmk = bg.GBE2.getBookmark({id: node.refKey});
  		openDelBkmkDlg(bkmk);
  		break;
  	case "page-newWidow":
  		if (node.data.url.length) showURLinNewWindow(node.data.url);
  		break;
  	case "page-newPrivate":
  		if (node.data.url.length) showURLinNewWindow(node.data.url, true);
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
  	// для меток
  	case "menuEdit":
  		lbl = {id: node.key, name: node.data.path};
  		openEditLblDlg(lbl);
  		break;
  	case "menuRemove":
  		lbl = {id: node.key, name: node.data.path};
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
  	case "menuUnhideAll":
  		lbl = {id: node.key, name: node.data.path};
  		folderMenuUnhideAll(lbl);
  		break;
  	case "menuUnhideFolder":
  		lbl = {id: node.key, name: node.data.path};
  		folderMenuUnhideFolder(lbl);
  		break;
  	case "menuHideFolder":
  		lbl = {id: node.key, name: node.data.path};
  		folderMenuHideFolder(lbl);
  		break;
  	case "menuExport":
  		lbl = {id: node.key, name: node.data.path, title: node.title};
  		folderMenuExport(lbl);
  		break;
  	case "menuAddAllTabs":
  		lbl = {id: node.key, name: node.data.path, title: node.title};
  		openAddAllTabsDlg(lbl.name);
  		break;
  }
}

// слушает сообщения от background.js
function bgListener(message)
{
	switch (message.type){
		// нужно начать обновление списка закладок
		case "needRefresh":
			refresh();
			break;
		case "refreshError" :
			$(".info-box").css({display: 'none'});
			$(".info-box label").text("");
			$(".error-box label").text(message.text);
			$(".error-box").css({display: 'block'});
			setTimeout(() => {
				$(".error-box").css({display: 'none'});
				$("#bkmk-tree").fancytree("enable").show();
			}, 2000);


			break;
		// список закладок обновлен
		case "refreshed":
			aBkmk = bg.GBE2.getBookmark({ url : aTab.url});
			setClickHandlers (aBkmk);
			$.ui.fancytree.getTree("#bkmk-tree").reload(
	          bg.GBE2.m_treeSource
	        ).done(function(){
	          _consoleLog("popup:reloaded");
	        });
	    $("#bkmk-tree").fancytree("enable").show();
	    $(".info-box").css({display: 'none'});
	    break;
	  // открыть диалог создания закладки (вызывается через контекстное меню ссылки или страницы)
		case "CntxOpenBkmkDialog":
			openBkmkDialog({id: null, title: message.title, url: message.url, labels: "", notes: "", favIconUrl: message.favIconUrl});
			break;
	}
}

// начало обновление списка закладок (посылка сообщения в background.js)
function refresh() {
  _consoleLog("popup:refresh");
  $(".info-box").css({display: 'block'});
  // TODO сообщение при ошибке обновления
  $(".info-box label").text(_getMsg("notify_loadingBkmrks"));
  $("#bkmk-tree").fancytree("disable").hide();
  chrome.runtime.sendMessage({
      type: "refresh",
      tab: aTab
    }
  );
  $("#filterTextbox").val("");
  resetFilter();
}

// открывает окно настроек дополенения
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