"use strict";
const _getMsg = browser.i18n.getMessage;



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

function _isSpecialUrl (url) {
	let SearchString = new RegExp("^chrome:|^javascript:|^data:|^about:|^file:.*" );
	return SearchString.test(url);
}

const _TREE_PERSIST_DATA = {
	EXPANDED  : "expanded",
	ACTIVE 		: "active", 
	delim 		: '|',
	prefix 		: "fTree-"
};

const _LIGHT = "light", _DARK = "dark";
const _ICONS = {};
_ICONS[_LIGHT] = 	{	empty : { 18: "./images/Star_empty.png", 32 : "./images/Star_empty32.png"},
										full 	: { 18: "./images/Star_full.png", 32 : "./images/Star_full32.png"}
									};
_ICONS[_DARK] = 	{	empty : { 18: "./images/Star_empty1.png", 32 : "./images/Star_empty132.png"},
										full 	: { 18: "./images/Star_full1.png", 32 : "./images/Star_full132.png"}
									};	
const _OPEN_IN_POPUP = true, _OPEN_IN_SIDEBAR = false;

// читаем сохраненные данные дерева закладок (активная метка, раскрытые метки)
function _getTreePersistData () {
	const local = window.localStorage,
				opt = _TREE_PERSIST_DATA;
	var res = {}; 
	res[opt.ACTIVE] = local.getItem(opt.prefix + opt.ACTIVE) || null;
	res[opt.EXPANDED] = (local.getItem(opt.prefix + opt.EXPANDED) || "").split(opt.delim);
	return res;
}

function _clearTreePersistData () {
	const local = window.localStorage,
				opt = _TREE_PERSIST_DATA;
	local.setItem(opt.prefix + opt.ACTIVE, null);
	local.setItem(opt.prefix + opt.EXPANDED, "");
}

/**
 * запись сохраненных данные дерева закладок
 *
 * @param      {string}   key         код закладки или null
 * @param      {boolean}  appendFlag  флаг добавления/записи
 * @param      {<type>}   type        тип сохраняемых данных
 */
function _appendPersist (key, appendFlag = true, type = _TREE_PERSIST_DATA.EXPANDED) {
	const local = window.localStorage,
				opt = _TREE_PERSIST_DATA;
	// активная метка - просто перезаписываем
	if (type === opt.ACTIVE && appendFlag) {
		// console.log(key);
		local.setItem(opt.prefix + type, key);
	}
	// раскрытые метки
	else if (key) {
		// читаем текущее сохраненное значение
		// ищем переданное	
		let data = _getTreePersistData()[type],
				idx = data.indexOf(key);
		// если уже есть - удаляем в любом случае
		if (idx >= 0) data.splice(idx, 1);
		// при включенном флаге записи - добавляем в конец массива
		if (appendFlag) data.push("" + key);
		local.setItem(opt.prefix + type, data.join(opt.delim));
	}
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
  // светлая или темная тема для иконок на панели
  this.ThemeIcon = "light";
  // настройки шрифта
  this.fontFamily = 'Tahoma, "Ubuntu", "Geneva CY", sans-serif';
  this.fontSize = 11;
  // включить popup action
  this.enablePageAction = true;
  // возможность искать по значению метки с помощью - label:xxxxx или label:"Programming/google bookmark" 
	// допускается только одна такая конструкция в строке поиска,
	// если их будет несколько - игнорируются все 
  this.enableLableFilter = true;
	// включить сохранение состояния дерева закладок
	this.enableTreePersisitData = true;
	// где открывать форму из контекстного меню страницы/ссылки
	this.openContextIn = _OPEN_IN_POPUP;
	// возможность искать закладки с несколькими метками
	// [bookmark keywords] lbls:[label keywords]
	// например: 333 lbls:london,2017; 
	// lbls:read later, 2018
	this.enableMultipleLabelFilter = true;
  // иконки закладок
  this.favIcons = {};
}

Options.prototype.read = function() {
	return browser.storage.local.get(["settings", "favIcons"]).then((res) => {
		if (res.hasOwnProperty('settings')) {
		let r = res["settings"];
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
			this.ThemeIcon = (r.hasOwnProperty('ThemeIcon')) ? r.ThemeIcon : "light";
			this.fontFamily = (r.hasOwnProperty('fontFamily')) ? r.fontFamily : 'Tahoma, "Ubuntu", "Geneva CY", sans-serif';
			this.fontSize = (r.hasOwnProperty('fontSize')) ? r.fontSize : 11;
			this.enablePageAction = (r.hasOwnProperty('enablePageAction')) ? r.enablePageAction : true;
			this.enableLableFilter = (r.hasOwnProperty('enableLableFilter')) ? r.enableLableFilter : true;
			this.enableTreePersisitData = (r.hasOwnProperty('enableTreePersisitData')) ? r.enableTreePersisitData : true;
			this.openContextIn = (r.hasOwnProperty('openContextIn')) ? r.openContextIn : _OPEN_IN_POPUP;
			this.enableMultipleLabelFilter = (r.hasOwnProperty('enableMultipleLabelFilter')) ? r.enableMultipleLabelFilter : true;
			
			this.favIcons = (res.hasOwnProperty('favIcons')) ? res.favIcons : {};
		}
		return this;
	});
}


Options.prototype.write = function() {
	let temp = {settings : {}};
	for (var name in this) {
	  if (this.hasOwnProperty(name)) 
	  {
	    if (name !== "favIcons")
	  			temp.settings[name] = this[name];
	  }
	}
 	return browser.storage.local.set(temp).then(null, (e) => {_errorLog("Options", e)});
}

Options.prototype.writeFavIcons = function() {
	let temp = {favIcons : this.favIcons};
 	return browser.storage.local.set(temp).then(null, (e) => {_errorLog("Options", e)});
}