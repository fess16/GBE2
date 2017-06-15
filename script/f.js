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
	console.log ("GBE-" + f + " : " + '(line = ' + e.lineNumber + ", col = " + e.columnNumber + ", file = " +  e.fileName);
}

function Options () {
	// включить 10 последний закладок
	this.enable10recentBookmark = true;
	// включить 10 самых посещаемых закладок
	this.enable10visitedBookmark = false; //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	// включить добавление метки к закладкам без метки
	this.enableLabelUnlabeled =  false;
	// режим без примечаний - формат получения закладок-  rss or xml
	this.enableNotes =  true;
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
  // console.log ("f.js constructor " + JSON.stringify(this));
}

Options.prototype.read = function() {
	return browser.storage.local.get().then((r) => {
		this.nestedLabelSep = (r.hasOwnProperty('nestedLabelSep') && r.nestedLabelSep.length == 1) ? r.nestedLabelSep : '/';
		this.enableNotes = (r.hasOwnProperty('enableNotes')) ? r.enableNotes : false;
		this.enable10recentBookmark = (r.hasOwnProperty('enable10recentBookmark')) ? r.enable10recentBookmark : true;
		this.enable10visitedBookmark = (r.hasOwnProperty('enable10visitedBookmark')) ? r.enable10visitedBookmark : true;
		this.enableLabelUnlabeled = (r.hasOwnProperty('enableLabelUnlabeled')) ? r.enableLabelUnlabeled : false;
		this.hiddenLabelsTitle = (r.hasOwnProperty('hiddenLabelsTitle')) ? r.hiddenLabelsTitle : "_hidden_";
		this.labelUnlabeledName = (r.hasOwnProperty('labelUnlabeledName')) ? r.labelUnlabeledName : "Unlabeled";
		this.showHiddenLabels = (r.hasOwnProperty('showHiddenLabels')) ? r.showHiddenLabels : false;
		this.timeout = (r.hasOwnProperty('timeout')) ? r.timeout : 10000;
		this.sortOrder = (r.hasOwnProperty('sortOrder')) ? r.sortOrder : "asc";
		this.sortType = (r.hasOwnProperty('sortType')) ? r.sortType : "name";
		// console.log ("f.js read" + JSON.stringify(r));
		// console.log ("f.js read" + JSON.stringify(this));
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