"use strict";
var _getMsg = browser.i18n.getMessage;

function _consoleLog (s) {
	var str = "GBE2:";
	for (var i = 0; i < arguments.length; i++)
	{
		str += arguments[i] + " ";
	}
	console.log (str);
}

function _errorLog (f, e) {
	console.log ("GBE2:" + f + " : " + e.message);
	console.log ("GBE2:" + f + " : " + '(line = ' + e.lineNumber + ", col = " + e.columnNumber + ", file = " +  e.fileName + ")");
}

function _escape(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

function Options () {
	// включить 10 последний закладок
	this.enable10recentBookmark = true;
	// включить 10 самых посещаемых закладок
	this.enable10visitedBookmark = false; //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	// включить добавление метки к закладкам без метки
	this.enableLabelUnlabeled = false;
	// режим без примечаний - формат получения закладок-  rss or xml
	this.enableNotes =  false;
	// метка для скрытых закладок
	this.hiddenLabelsTitle = "_hidden_";
	// добавляемая метка к закладкам без метки
	this.labelUnlabeledName = "Unlabeled";
	// отображать скрытые закладки
	this.showHiddenLabels = false;
	// тайм-аут ответа сервера при получении закладок и сигнатуры
	this.timeout = 10000;
	// разделитель вложенных меток
  this.nestedLabelSep = '/';
  // направление сортировки
  this.sortOrder = "asc";
	// тип сортировки 
  this.sortType = "name";
  // Открывать закладки в той же вкладке
  this.reverseLeftClick = false;
  // флаг показа иконок для закладок
  this.showFavicons = true;
  // показывать примечания во всплывающей подсказке
  this.showTagsInTooltip = true;
  // включить фильтр по URL
  this.enableFilterByUrl = false;
  // включить фильтр по примечаниям
  this.enableFilterByNotes = true;
  // задержка фильтра (мс)
  this.filterDelay = 200;
  // включить скрытие меток
  this.enableLabelHiding = true;
  // показывать скрытые метки
  this.showHiddenLabels = false;
  // название для скрытых меток
  this.hiddenLabelsTitle = "_hidden_";
  // название для ReadLater метки
  this.readLaterTitle = "Read Later";
  // флаг автоподстановки меток для новых закладок
  this.suggestLabel = false;
  // флаг загрузки закладок при старте
  this.loadOnStart = true;
  this.favIcons = {};
}

Options.prototype.read = function() {
	return browser.storage.local.get(["settings", "favIcons"]).then((res) => {
		console.log("options:read");
		// console.log(res);
		if (res.hasOwnProperty('settings')) {
		let r = res["settings"];
			// console.log(r);
			this.nestedLabelSep = (r.hasOwnProperty('nestedLabelSep') && r.nestedLabelSep.length == 1) ? r.nestedLabelSep : '/';
			this.enableNotes = (r.hasOwnProperty('enableNotes')) ? r.enableNotes : false;
			this.enable10recentBookmark = (r.hasOwnProperty('enable10recentBookmark')) ? r.enable10recentBookmark : true;
			this.enable10visitedBookmark = (r.hasOwnProperty('enable10visitedBookmark')) ? r.enable10visitedBookmark : false;
			this.enableLabelUnlabeled = (r.hasOwnProperty('enableLabelUnlabeled')) ? r.enableLabelUnlabeled : false;
			this.hiddenLabelsTitle = (r.hasOwnProperty('hiddenLabelsTitle')) ? r.hiddenLabelsTitle : "_hidden_";
			this.labelUnlabeledName = (r.hasOwnProperty('labelUnlabeledName')) ? r.labelUnlabeledName : "Unlabeled";
			this.showHiddenLabels = (r.hasOwnProperty('showHiddenLabels')) ? r.showHiddenLabels : false;
			this.timeout = (r.hasOwnProperty('timeout')) ? r.timeout : 10000;
			this.sortOrder = (r.hasOwnProperty('sortOrder')) ? r.sortOrder : "asc";
			this.sortType = (r.hasOwnProperty('sortType')) ? r.sortType : "name";
			this.reverseLeftClick = (r.hasOwnProperty('reverseLeftClick')) ? r.reverseLeftClick : false;
			this.showFavicons = (r.hasOwnProperty('showFavicons')) ? r.showFavicons : true;
			this.showTagsInTooltip = (r.hasOwnProperty('showTagsInTooltip')) ? r.showTagsInTooltip : true;
			this.enableFilterByUrl = (r.hasOwnProperty('enableFilterByUrl')) ? r.enableFilterByUrl : false;
			this.enableFilterByNotes = (r.hasOwnProperty('enableFilterByNotes')) ? r.enableFilterByNotes : true;
			this.filterDelay = (r.hasOwnProperty('filterDelay')) ? r.filterDelay : 200;
			this.enableLabelHiding = (r.hasOwnProperty('enableLabelHiding')) ? r.enableLabelHiding : true;
			this.showHiddenLabels = (r.hasOwnProperty('showHiddenLabels')) ? r.showHiddenLabels : false;
			this.hiddenLabelsTitle = (r.hasOwnProperty('hiddenLabelsTitle')) ? r.hiddenLabelsTitle : "_hidden_";
			this.readLaterTitle = (r.hasOwnProperty('readLaterTitle')) ? r.readLaterTitle : "Read Later";
			this.timeout = (r.hasOwnProperty('timeout')) ? r.timeout : 10000;
			this.suggestLabel = (r.hasOwnProperty('suggestLabel')) ? r.suggestLabel : false;
			this.loadOnStart = (r.hasOwnProperty('loadOnStart')) ? r.loadOnStart : true;
			
			this.favIcons = (res.hasOwnProperty('favIcons')) ? res.favIcons : {};
		}
		console.log(this);
		return this;
	});
}


Options.prototype.write = function() {
	// browser.storage.local.clear().then();
	let temp = {settings : {}};
	for (var name in this) {
	  if (this.hasOwnProperty(name)) 
	  {
	    if (name !== "favIcons")
	  			temp.settings[name] = this[name];
	  }
	}
	console.log("write");
	console.log(temp);
 	return browser.storage.local.set(temp).then(null, (e) => {_errorLog("Options", e)});
	// let temp = {settings : {}, favIcons : {}};
	// for (var name in this) {
	//   if (this.hasOwnProperty(name)) 
	//   {
	//     if (name == "favIcons" && (opt == "favicons" || opt == "all") )
	//     	temp[name] = this[name];
	//    	else
	//    		if (opt =="settings" || opt == "all")
	//   			temp.settings[name] = this[name];
	//     // console.log('f.js write  (' + name + '). Value: ' + this[name]);
	//   }
	// }
	// console.log(temp);
 // 	return browser.storage.local.set(temp).then(null, (e) => {_errorLog("Options", e)});
}

Options.prototype.writeFavIcons = function() {
	// browser.storage.local.clear().then();
	let temp = {favIcons : this.favIcons};
	console.log("writeFavIcons");
	console.log(temp);
 	return browser.storage.local.set(temp).then(null, (e) => {_errorLog("Options", e)});
}