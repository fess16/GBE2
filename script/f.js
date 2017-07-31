function _consoleLog (s) {
	var str = "";
	for (var i = 0; i < arguments.length; i++)
	{
		str += arguments[i] + " ";
	}
	console.log (str);
}

function _errorLog (f, e) {
	console.log ("GBE-" + f + " : " + e.message);
	console.log ("GBE-" + f + " : " + '(line = ' + e.lineNumber + ", col = " + e.columnNumber + ", file = " +  e.fileName + ")");
}

function _escape(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

function Options () {
	// включить 10 последний закладок
	this.enable10recentBookmark = true;
	// включить 10 самых посещаемых закладок
	this.enable10visitedBookmark = false; //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	// включить добавление метки к закладкам без метки
	this.enableLabelUnlabeled =  false;
	// режим без примечаний - формат получения закладок-  rss or xml
	this.enableNotes =  false;
	// метка для скрытых закладок
	this.hiddenLabelsTitle =  "_hidden_";
	// добавляемая метка к закладкам без метки
	this.labelUnlabeledName =  "Unlabeled";
	// отображать скрытые закладки
	this.showHiddenLabels =  false;
	// тайм-аут ответа сервера при получении закладок и сигнатуры
	this.timeout =  10000;
	// разделитель вложенных меток
  this.nestedLabelSep =  '/';
  // направление сортировки
  this.sortOrder =  "asc";
	// тип сортировки 
  this.sortType =  "name";
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
}

Options.prototype.read = function() {
	return browser.storage.local.get().then((r) => {
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
		return this;
	});
}


Options.prototype.write = function() {
	let temp = {};
	for (var name in this) {
	  if (this.hasOwnProperty(name)) 
	  {
	    // console.log('f.js write  (' + name + '). Value: ' + this[name]);
	  	temp[name] = this[name];
	  }
	}
 	return browser.storage.local.set(temp).then(null, (e) => {_errorLog("Options", e)});
}