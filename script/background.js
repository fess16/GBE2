"use strict";
var GBE2 = {
	"m_bookmarkList" : [],
	"m_treeSource" : [],
	"m_labelsList" : null,
	// адрес для получения списка закладок
	'm_baseUrl' : "https://www.google.com/bookmarks/",
	// адрес для работы с отдельными закладками
	'm_baseUrl2' : "https://www.google.com/bookmarks/mark",
	// список всех закладок (полученный с сервера) в формате XML
  'm_ganswer' : null,
  'm_signature' : null, 

  'm_RecentLabel' : _getMsg("popup_RecentLabel"),
  'm_VisitedLabel' : _getMsg("popup_VisitedLabel"),

  // разделитель меток при сортировке
  'm_labelSep'	: "{!|!}",
  opt : new Options(),
	
	// тайм-аут ответа сервера при получении закладок и сигнатуры
	// TODO: change to opt.timeout
	'p_timeout' : 10000,
	// режим без примечаний - формат получения закладок: rss or xml
	// 'p_enableNotes' : true,

	// включить добавление метки к закладкам без метки
	//'p_enableLabelUnlabeled' : false,
	// добавляемая метка
	//'p_labelUnlabeledName' : "Unlabeled",
	// 'p_enable10recentBookmark' :true,
	// 'p_enable10visitedBookmark' :true,
	'm_recent10bkmrk' : [],
	// 'p_hiddenLabelsTitle' : "_hidden_",
	// 'p_showHiddenLabels' : false,

	 // // тип сортировки 
  // 'p_sortType' : "name",
  // // направление сортировки
  // 'p_sortOrder' : "asc",

   // список всех меток (папок)
  'm_labelsArr' : null,

  /* ------Свойства------*/
  // разделитель вложенных меток
  //'p_nestedLabelSep' : '/',
  'm_dlgInfo' : null,

  'm_needRefresh' : false,

		/**
	 * функция сравнения закладок и меток по имени
	 * @return {int} результат сравнения
	 */
	compareByName : function (a, b) {
		if (a instanceof Array && b instanceof Array) 
		{
			if (GBE2.opt.sortOrder == "asc") 
			{
				return String(a[0]).toLowerCase() < String(b[0]).toLowerCase() ? -1 : 1;
			}
			else
			{
				return String(a[0]).toLowerCase() < String(b[0]).toLowerCase() ? 1 : -1;
			}
		}
		if (a instanceof Object && b instanceof Object) 
		{
			if (GBE2.opt.sortOrder == "asc") 
			{
				return String(a.title).toLowerCase() < String(b.title).toLowerCase() ? -1 : 1;
			}
			else
			{
				return String(a.title).toLowerCase() < String(b.title).toLowerCase() ? 1 : -1;
			}			
		}
	},

	/**
	 * функция сравнения закладок и меток по дате добавления
	 */
	compareByDate : function (a, b) {		
		if (a instanceof Array && b instanceof Array) 
		{
			if (GBE2.opt.sortOrder == "asc") 
			{
				return new Date(a[5]) < new Date(b[5]) ? -1 : 1;
			}
			else
			{
				return new Date(a[5]) < new Date(b[5]) ? 1 : -1;
			}
		}
		if (a instanceof Object && b instanceof Object) 
		{
			if (GBE2.opt.sortOrder == "asc") 
			{
				return new Date(a.timestamp) < new Date(b.timestamp) ? -1 : 1;
			}
			else
			{
				return new Date(a.timestamp) < new Date(b.timestamp) ? 1 : -1;
			}
		}
	},

	// генерирует код меток (папок)
	genereteLabelId : function(label) {
		 // console.log (label);
	  var hash = 5381, i = label.length
	  while(i)
	    hash = (hash * 33) ^ label.charCodeAt(--i)
	  return hash >>> 0;
	},

	/**
	 * поиск меток в многоуровневом массиве
	 *
	 * @param {array assoc.} array    - массив для поиска (m_treeSource)
	 * @param {object}       keyvalue - поле поиска и его значение ({key : key_value})
	 *
	 * @return {object} ссылка на найденную метку
	 */
	searchLabel : function (array, keyvalue){
		var found = [];
		// поле поиска
		let key = Object.keys(keyvalue)[0];
		// ищем на текущем уровне
		let elem = array.filter(x => (x.hasOwnProperty("folder") && x[key] === keyvalue[key]));
		if (elem.length)
		{
			//console.log("1.1 searchLabel " + elem[0]);
			// нашли - возвращаем
			return elem[0];
		}
		else
		{
			//console.log("1.2 searchLabel");
			// не нашли - просматриваем вложенные метки
			// отбираем метки
			let folders = array.filter(x => (x.hasOwnProperty("folder")));
			for (let i = folders.length - 1; i >= 0; i--)
	  	{
	  		let item = folders[i];
	  		// если у метки есть вложенные - ищем среди них
	  		if (item.children.length)
	  		{
	  			//console.log("2.2 searchLabel ");// + JSON.stringify(item));
	  			found = this.searchLabel(item["children"], keyvalue);
	  			if (found.hasOwnProperty("key"))
	  			  return found;
	  		}
	  	}
		}
		return found;
	},

	searchLabelByPath : function (array, path) {
		var found = [];
		let indexSep = path.indexOf(this.opt.nestedLabelSep);
		if (indexSep > 0) {
			let start = path.slice(0, indexSep);
			let end = path.slice(indexSep+1);
			let elem = array.filter(x => (x.hasOwnProperty("folder") && x["title"] === start));
			if (elem.length && elem[0].children.length) {
				found = this.searchLabelByPath(elem[0].children, end);
				if (found.hasOwnProperty("key"))
	  			  return found;
			}
		}
		else {
			let elem = array.filter(x => (x.hasOwnProperty("folder") && x["title"] === path));
			if (elem.length)
			{
				return elem[0];
			}
		}
		return found;
	},

	setTreeNodeField : function (array, keyvalue, fieldvalue) {
		let searchKey = Object.keys(keyvalue)[0];
		let field = Object.keys(fieldvalue)[0];
		// ищем на текущем уровне
		let elems = array.filter(x => (x[searchKey] === keyvalue[searchKey]));
		if (elems.length)
		{
			elems.forEach((elem) => {
				elem[field] = fieldvalue[field];
			});
		}
		else
		{
			//console.log("1.2 searchLabel");
			// не нашли - просматриваем вложенные метки
			// отбираем метки
			let folders = array.filter(x => (x.hasOwnProperty("folder")));
			for (let i = folders.length - 1; i >= 0; i--)
	  	{
	  		let item = folders[i];
	  		// если у метки есть вложенные - ищем среди них
	  		if (item.children.length)
	  		{
	  			this.setTreeNodeField(item["children"], keyvalue, fieldvalue);
	  		}
	  	}
		}
	},

	isBookmarked : function (tUrl) {
		if (this.m_bookmarkList.length)
			return (this.m_bookmarkList.some( item => item.url == tUrl));
		return false;
	},

	isHiddenLabel : function (path) {
		let re = new RegExp(this.opt.hiddenLabelsTitle + "$");
		if (path.search(re) !== -1 || path.indexOf(this.opt.hiddenLabelsTitle+this.opt.nestedLabelSep) == 0) return true;
		return false;
	},

	getBookmark : function (keyvalue) {
		if (this.m_bookmarkList.length){
			let key = Object.keys(keyvalue)[0];
			let bkmk = this.m_bookmarkList.filter( x => (x[key] === keyvalue[key]));
			if (bkmk.length) return bkmk[0];
		}
		return null;
	},

	/**
	 * Вставляет закладку в массив (m_treeSource)
	 *
	 * @param {Array}  parent    - Родительский элемент (метка, к которой добавляем закладку)
	 * @param {<type>} bkmk      - Добавляемая закладка
	 * @param {string} parentKey - Ключ родительской метки
	 *
	 */
	appendBkmkToBkmksList : function (parent, bkmk, parentKey)  {
			let item = {
				"title" : bkmk.title, 
				"key" : (bkmk.id + "|" + parentKey), 
				"refKey": bkmk.id, 
				"url": bkmk.url,
				"icon": "../images/bkmrk.png",
				"tooltip" : bkmk.title + "\n" + bkmk.url,
				"notes" : bkmk.notes,
				"hidden" : bkmk.hidden
			};
			if (this.opt.showFavicons && this.opt.favIcons.hasOwnProperty(bkmk.url)) 
	  			item.icon = this.opt.favIcons[bkmk.url];
			if (this.opt.enableNotes && bkmk.notes !== "")
			{
				item.tooltip += "\n" + _getMsg("editBkmkDlg_notes") + "\n" + bkmk.notes;
			}
			if (this.opt.showTagsInTooltip && bkmk.labels != "")
			{
				item.tooltip += "\n" + _getMsg("editBkmkDlg_labels") + "\n" + bkmk.labels;
			}
			// console.log(JSON.stringify(bkmk));
			parent.push (item);
	},

	/**
	 * обработка списка закладок (из ответа сервера)
	 *
	 * @param      {XMLDocument}   responseXML  ответ сервера в формате XML
	 * @return     {Promise}  { description_of_the_return_value }
	 */
	doProcessBookmarks : function(responseXML) {
		// try
		// {
			this.m_bookmarkList = [];
			this.m_treeSource = [];
			this.m_labelsList = [];
			let i, j;
			let bkmkFN = { 
				"rss" : {
					bkmk 		: "item",
					title 	: "title", 
			    id 			: "smh\\:bkmk_id",
			    url 		: "link",
			    date 		: "pubDate",
			    label 	: "smh\\:bkmk_label",
			    notes 	: "smh\\:bkmk_annotation",
			    sig 		: "smh\\:signature",
				},
			  "xml" : {
			  	bkmk 		: "bookmark",
					title 	: "title", 
			    id 			: "id",
			    url 		: "url",
			    date 		: "timestamp",
			    label 	: "label",
			    notes 	: "",
			    sig 		: "" 
				}
			};

			let oType = this.opt.enableNotes ? "rss" : "xml";
			// получаем все закладки из XML ответа сервера
	    let bookmarks = $(responseXML).find(bkmkFN[oType].bkmk);
	    // получаем все метки из XML ответа сервера
	    let labels = $(responseXML).find(bkmkFN[oType].label);
			let labelsLength = labels.length;
			let bookmarksLength = bookmarks.length;
	    // если закладок и меток в ответе сервера нет - ничего не делаем
			if (!labelsLength && !bookmarksLength) 
			{
				// this._M.refreshInProgress = false;
				let reason = new Error("There are any bookmarks and labels in server response!");
				_errorLog("doProcessBookmarks", reason);
				// throw reason;
				// reject(reason);
			 	// return false;
				//resolve({"type" : "refresh", "data" : this.m_treeSource});
				return Promise.resolve({ type: "refreshed", count : 0, data : [] });
			}

			// если закладок в ответе сервера нет - ничего не делаем
			if (!bookmarksLength) 
			{
				// console.log ("GBE:doProcessBookmarks", "Bookmarks (in server response) are empty!");
			 // 	reject(new Error("Network Error 2"));	
			 // 	return false;
			 	let reason = new Error("There are any bookmarks in server response!");
			 	_errorLog("doProcessBookmarks", reason);
			 	return Promise.resolve({ type: "refreshed", count : 0, data : [] });
			}
	// return new Promise((resolve, reject) => {

			let lbs = [];
			// сохраням уникальные метки
			for (let i=0, n=labels.length; i < n; i++) {
				// название метки
				let labelVal = $(labels[i]).text();
				// если такая метка уже есть - пропускаем
				if (lbs.find(x => x.title === labelVal)) continue;
				let flagHidden = false;
				if (this.opt.enableLabelHiding &&  this.isHiddenLabel(labelVal)) {
					flagHidden = true;
					if (!this.opt.showHiddenLabels) continue;
				}
				lbs.push({"title" : labelVal, "timestamp" : null, "id" : this.genereteLabelId(labelVal), "hidden" : flagHidden});
			}
			console.log(JSON.stringify(lbs));

			// добавляем labelUnlabeledName метку в массив меток
			if (this.opt.enableLabelUnlabeled)
			{
				lbs.push({
					"title" : this.opt.labelUnlabeledName, 
					"timestamp" : null, 
					"id" : this.genereteLabelId(this.opt.labelUnlabeledName),
					"hidden" : false
				});
			}

			// список закладок\
			this.m_bookmarkList = new Array(bookmarksLength);
			// for (i = 0; i < bookmarksLength; i++) 
			for (i = bookmarksLength - 1; i >= 0; i--) 
			{
				this.m_bookmarkList[i] = {};
				let bookmark_labels = [];
				try
				{
					var bookmark = $(bookmarks[i]);
					// read id field
					this.m_bookmarkList[i].id = bookmark.find(bkmkFN[oType].id).text() || "";
					// read title field
					this.m_bookmarkList[i].title = bookmark.find(bkmkFN[oType].title).text() || "";
					// read url field
					this.m_bookmarkList[i].url = bookmark.find(bkmkFN[oType].url).text() || "";
					// read timestamp field
					this.m_bookmarkList[i].timestamp = bookmark.find(bkmkFN[oType].date).text() || "";
					// read label field
					this.m_bookmarkList[i].hidden = false;
					let self = this;
					bookmark.find(bkmkFN[oType].label).each(function() {
						if (self.opt.enableLabelHiding && self.isHiddenLabel($(this).text())) {
							self.m_bookmarkList[i].hidden = true;
							if (!self.opt.showHiddenLabels) return true;
						}
						bookmark_labels.push($(this).text());
					});
					if (this.m_bookmarkList[i].title == "" && this.m_bookmarkList[i].url !== "")
					{
						_consoleLog ("GBE2:doProcessBookmarks", "Warning. Bookmark", this.m_bookmarkList[i].url, 
							" - has empty title. Title set to '", this.m_bookmarkList[i].url, "'!");
						this.m_bookmarkList[i].title = this.m_bookmarkList[i].url;
					}
				}
				catch(e1)
				{
					// _consoleLog ("GBE2:doProcessBookmarks", "Parse bookmark params - error. Last processing bookmark - " + 
					// 	JSON.stringify(this.m_bookmarkList[i]));
					// // this._M.refreshInProgress = false;
					// throw e1;
					console.log(e1);
					let reason = new Error("doProcessBookmarks - Parse bookmark params - error. Last processing bookmark - " + 
					 	JSON.stringify(this.m_bookmarkList[i]));
					return Promise.reject(reason);
				}

				this.m_bookmarkList[i].labels = bookmark_labels;
				// закладка с метками?
				if (bookmark_labels.length)
				{
					// заполняем timestamp в массиве меток
					for (j = 0; j < bookmark_labels.length; j++)
					{
						let lbl = lbs.filter(function(val, i, ar){ return ar[i].title == bookmark_labels[j]});
						if (lbl.length)
						{
							if (lbl[0].timestamp == null || lbl[0].timestamp < this.m_bookmarkList[i].timestamp)
							{
								lbl[0].timestamp = this.m_bookmarkList[i].timestamp;
							}
						}
					}
				}
				else
				{
					// определяем timestamp для закладок без метки
					if (this.enableLabelUnlabeled)
					{
						let lbl = lbs.filter(function(val, i, ar){ return ar[i].title == self.opt.labelUnlabeledName});
						if (lbl.length)
						{
							if (lbl[0].timestamp == null || lbl[0].timestamp < this.m_bookmarkList[i].timestamp)
							{
								lbl[0].timestamp = this.m_bookmarkList[i].timestamp;
							}
						}
					}
				}
				this.m_bookmarkList[i].notes = "";
				// закладка с примечанием?
				try 
				{
					if (this.opt.enableNotes && bookmark.find(bkmkFN[oType].notes).length)
					{
						this.m_bookmarkList[i].notes = bookmark.find(bkmkFN[oType].notes).text();
					}
				}
				catch(e1)
				{
					// console.log ("GBE2:doProcessBookmarks", "Obtain bookmark notes - error. Last processing bookmark - " + JSON.stringify(this.m_bookmarkList[i]) );
					// // this._M.refreshInProgress = false;
					// throw e1;
//!!!!!!!!!!! 	а может убрать? заметка не особо критична же? оставить только предупреждение
					let reason = new Error("doProcessBookmarks - Obtain bookmark notes - error. Last processing bookmark - " + JSON.stringify(this.m_bookmarkList[i]));
					return Promise.reject(reason);
				}
			} //end for

			// запоминаем 10 последних добавленных закладок
			// (они идут всегда первыми в ответе сервера)
			if (this.opt.enable10recentBookmark)
			{
				let sliceLength = (this.m_bookmarkList.length < 10 ? this.m_bookmarkList.length : 10);
				this.m_recent10bkmrk = this.m_bookmarkList.slice(0,sliceLength);
			}

			// console.log(this.opt.sortType);
			// console.log(this.opt.sortOrder);
			// сортируем массив закладок
			this.m_bookmarkList.sort((this.opt.sortType == "timestamp")? this.compareByDate : this.compareByName);	

			// сортируем массив меток
			lbs.sort((this.opt.sortType == "timestamp") ? this.compareByDate : this.compareByName);	
			// Возможно перенести ниже
			this.m_labelsList = lbs;

			//------------------------------------------
			// может убрать ?????
			this.m_labelsArr = [];
			lbs.forEach((element, index) => {
			  this.m_labelsArr.push(element.title);
			});
			//------------------------------------------

			// заполняем treeSource - данные для fancyTree
			let treeSource = [];
			if (lbs.length)
			{
				// проходим по меткам
				for (i = 0; i < lbs.length; i++)
				{
					// пропускаем пустые метки
					if (lbs[i].title == "") continue;
					// разбиваем на вложенные метки по разделителю
					let arr_nested_label = lbs[i].title.split(this.opt.nestedLabelSep);
					let flagHidden = lbs[i].hidden;
					// let key = "";
					
					// первый уровень
					let fullName = arr_nested_label[0];
					//console.log("1 " + fullName);
					let tempKey = this.genereteLabelId(fullName);
					if (!$.grep(treeSource, function(e) {
								return (e.key == tempKey);
							}).length){
								// let flagHidden = (this.opt.enableLabelHiding && this.isHiddenLabel(fullName));
								treeSource.push({
									"title" 		: fullName,
									"key" 			: tempKey,
									"folder"		: true,
									"children"	: [],
									"path"			: fullName,
									"hidden"		: flagHidden,
									"icon"			: flagHidden ? "../images/folder.png" : "../images/folder_blue.png"
								});
					}
					for (j = 1; j < arr_nested_label.length; j++)
					{
						let parentContainer = this.searchLabel(treeSource, {key : tempKey});
						// console.log(JSON.stringify(parentContainer));
						fullName += this.opt.nestedLabelSep + arr_nested_label[j];
						//console.log(j + " " + fullName);
						tempKey = this.genereteLabelId(fullName);
						// if (!$.grep(treeSource, function(e) {return (e.key == tempKey);}).length)
						//if (!$.grep(parentContainer, function(e) {return (e.key == tempKey);}).length)
						let notExist = true;
						if (parentContainer.children.length > 0) {
							let res = this.searchLabel(parentContainer.children, {key : tempKey});
							if (res.hasOwnProperty("key") )
								notExist = false;
							// console.log(res);
						}

						if (notExist)
						// if ( parentContainer.children //&& parentContainer.children.length > 0 
						// 	&& this.searchLabel(parentContainer.children, {key : tempKey}).length == 0)
						{
							//console.log("insert " + fullName);
							// let flagHidden = (this.opt.enableLabelHiding && this.isHiddenLabel(fullName));
							parentContainer.children.push({
								"title" 		: arr_nested_label[j],
								"key" 			: tempKey,
								"folder"		: true,
								"children"	: [],
								"path"			: fullName,
								"hidden"		: flagHidden,
								"icon"			: flagHidden ? "../images/folder.png" : "../images/folder_blue.png"
 							});
						}
					}
				}
			}

		  // начало цепочки
			let chain = Promise.resolve();
		
			let visitsArray = [];
    	// в цикле добавляем задачи в цепочку
    	this.m_bookmarkList.forEach((bkmk) => {
    		if (!this.opt.showHiddenLabels && bkmk.hidden) {
    			console.log(JSON.stringify(bkmk));
    			return;
    		}
    	  chain = chain
    	  	// получаем URL закладки, если поле пустое
    	    .then(() => {
    	    	if (bkmk.url.length)
    	    	{
    	    		return bkmk;
    	    	}
    	    	else
    	    	{
    	    		_consoleLog("Obtain url for bkmk: ", JSON.stringify(bkmk));
    	    		return this.doRequestBookmarkURL(bkmk);
    	    	}
    	    })
    	    // сохраняем его 
    	    .then((result) => {
  	      	if (result && result.url.length)
  	      	{
	    	    	bkmk.url = result.url;
	    	    	//console.log (JSON.stringify(bkmk));
	    	      return bkmk;
  	        }
  	        else
  	        {
  	        	throw new Error("URL for bookmark <" +  bkmk.title + "> was not found!");
  	        }
    	    })
    	    // получаем количество посещений данного URL из истории браузера
    	    .then( (bkmk) => {
    	    	return browser.history.getVisits({
				      url: bkmk.url
				    });
    	    })
    	    // если посещения были - сохранеем их
    	    .then ( (visits) => {
    	    	if (visits.length)
    	    	{
    	    		visitsArray.push({"bkmsrkId" : bkmk.id, "visits" : visits.length});
    	    	}
    	    	return bkmk;
    	    })
    	    // заносим закладку в treeSource
    	    .then ( (bkmk) => {
    	    	let parentContainer;
    	    	let pKey = "";
    	    	// если у закладки есть метки
    	    	if (bkmk.labels.length)
    	    	{
    	    		// добавляем ее в каждую из меток
    	    		bkmk.labels.forEach( (label) => {
    	    			pKey = this.genereteLabelId(label);
    	    			//console.log(label);
    	    			// parentContainer = this.searchLabel(treeSource, {key : pKey});
    	    			parentContainer = this.searchLabelByPath(treeSource, label);
    	    			this.appendBkmkToBkmksList(parentContainer.children, bkmk, pKey);
    	    		});
    	    	}
    	    	else
    	    	{
    	    		// нет - добавляем в верхний уровень
    	    		pKey = "";
    	    		parentContainer = treeSource;
    	    		// если включено p_enableLabelUnlabeled - в метку p_labelUnlabeledName
    	    		if (this.opt.enableLabelUnlabeled)
    	    		{
    	    			pKey = this.genereteLabelId(this.opt.labelUnlabeledName);
    	    			parentContainer = this.searchLabel(treeSource, {key : pKey}).children;
    	    		}
    	    		this.appendBkmkToBkmksList(parentContainer, bkmk, pKey)
    	    	}
    	    })
    	    .catch( (error) => {
    	    	_errorLog("doProcessBookmarks", error);
    	    	//console.log (error);
    	    	// console.log (error.fileName + ", line " + error.lineNumber + ", column " + error.columnNumber);
    	    	// console.log ("Error:" + error.message);
    	    })
    	    ;
    	});
    	
    	// в конце — выводим результаты
    	return chain.then(() => {
    		// удаляем метку labelUnlabeledName из массива меток
    		if (this.opt.enableLabelUnlabeled)
    		{
    			this.m_labelsArr = this.m_labelsArr.filter((val, i, ar) => { return val != this.opt.labelUnlabeledName});
    		}

    		// вставляем 10 последних добавленных закладок 
				if (this.opt.enable10recentBookmark && this.m_recent10bkmrk.length)
				{
					let pKey = this.genereteLabelId(this.m_RecentLabel);
					let resentLabel = {
						"title" 		: this.m_RecentLabel,
						"key" 			: pKey,
						"folder"		: true,
						"children"	: [],
						"path"			: this.m_RecentLabel,
						"icon"			: "../images/folder_blue.png",
						"ignoreMe"	: true
					};
					for (let i = 0; i < this.m_recent10bkmrk.length; i++)
					{
						let bkmk = this.m_recent10bkmrk[i];
						bkmk["ignoreMe"] = true;
						this.appendBkmkToBkmksList(resentLabel.children, bkmk, pKey);
					}
					treeSource.unshift(resentLabel);
				}

    		// вставляем 10 самых популярных закладок 
    		if (this.opt.enable10visitedBookmark && visitsArray.length)
    		{
    			visitsArray.sort((a,b) => { a.visits < b.visits ? 1 : -1; });
    			let pKey = this.genereteLabelId(this.m_VisitedLabel);
    			let visitsLabel = {
						"title" 		: this.m_VisitedLabel,
						"key" 			: pKey,
						"folder"		: true,
						"children"	: [],
						"path"			: this.m_VisitedLabel,
						"icon"			: "../images/folder_blue.png",
						"ignoreMe"	: true
					};
					let visitsCount = (visitsArray.length < 10 ? visitsArray.length : 10);
					for (let i = 0; i < visitsCount; i++)
					{
						let bkmk = this.m_bookmarkList.filter( val => {return val.id ==  visitsArray[i].bkmsrkId})[0];
						bkmk["ignoreMe"] = true;
						this.appendBkmkToBkmksList(visitsLabel.children, bkmk, pKey);
					}
					treeSource.unshift(visitsLabel); 
    		}
    		visitsArray = [];

    		// if (!this.opt.showHiddenLabels)
    		// {
    		// 	let hiddenLabel = this.searchLabel(treeSource, {key : this.genereteLabelId(this.opt.hiddenLabelsTitle)});
    		// 	if (hiddenLabel instanceof Object)
    		// 	{
    		// 		hiddenLabel.hidden = "true";
    		// 		//console.log("hidden");
    		// 	}
    		// }
    	  // console.log(JSON.stringify(this.m_labelsArr));
				// получаем массив меток
				// console.log (JSON.stringify(treeSource));
				//console.log (JSON.stringify(this.m_bookmarkList));
				//resolve({"type" : "refresh", "data" : treeSource});
				//browser.runtime.sendMessage({"type" : "refresh", "data" : treeSource});
				//treeSource = [];
    	  // return treeSource;
				this.m_treeSource = treeSource;
    	  return { type: "refreshed", count : bookmarksLength, data : treeSource };
    	});
		// }		
		// catch (e)
		// {
		// 	console.log ("GBE2:doProcessBookmarks", " " + e + '(line = ' + e.lineNumber + ", col = " + e.columnNumber + ", file = " +  e.fileName);
		// 	// this._M.refreshInProgress = false;	
		// 	reject(new Error("Network Error 1"));		
		// 	// return false;
		// }
	// });
	}, // doProcessBookmarks end

	/**
	 * Запрос списка закладок с сервера
	 */
	doRequestBookmarks : function ()
	{
		let debug = false;		
		//debug = true;
		let output = this.opt.enableNotes ? "rss" : "xml";
		return $.ajax({
			url: (debug ? ("lookupFess"+output+".xml") : (this.m_baseUrl + "lookup")),
			type: 'GET',
			data: {
				output : output,
				// output : (this.opt.enableNotes ? "rss" : "xml"),
				num : 10000
			},
			timeout : this.p_timeout
		})
		.then(
			(response, status, xhr) =>	{
				var ct = xhr.getResponseHeader("content-type") || "";
		    if (ct.indexOf('xml') > -1) {
					// _consoleLog("GBE2:doRequestBookmarks - OK!");
					return response;
				}
				else
		    {
		    	throw new Error("doRequestBookmarks : Answer of server is not XML.");
		    }
			},
			function (jqXHR, textStatus)
			{
				_consoleLog ("GBE2:doRequestBookmarks - Request failed: ", textStatus);
				_consoleLog (jqXHR.responseText);
			}
		);
	},

	/**
	 * Получает значение поля-сигнатуры с сервера (используется для редактирования закладок)
	 * запрос в формате rss, т.к. в xml этого поля нет
	 */
	doRequestSignature : function ()
	{
		return $.ajax({
		  url: this.m_baseUrl + "find",
		  method: "GET",
		  data: { 
		  	zx : (new Date()).getTime(),
		  	output : "rss",
		  	q : "qB89f6ZAUXXsfrwPdN4t"
		  },
		  timeout : this.p_timeout,
		  // dataType: "xml"
		}).then(
			(response, status, xhr) =>	{
				// _consoleLog("GBE2:doRequestSignature - OK!");
				var ct = xhr.getResponseHeader("content-type") || "";
		    if (ct.indexOf('xml') > -1) {
					this.m_signature = $(response).find('smh\\:signature').text();
					return this.m_signature;
				}
				else
		    {
		    	throw new Error("doRequestSignature : Answer of server is not XML.");
		    }
			},
			function (jqXHR, textStatus)
			{
				_consoleLog ("GBE2:doRequestSignature - Request failed: ", textStatus);
				_consoleLog (jqXHR.responseText);
			});
	},

	/**
	 * Получение url закладки
	 *
	 * @param {object} bkmk  - Закладка, для которой ищем url
	 * @param {number} index - Индекс закладки в массиве m_bookmarkList !!!! может убрать?
	 *
	 * @return {<type>} Закладка с заполненным полем url
	 */
	doRequestBookmarkURL : function (bkmk, index=0)
	{
		let result = bkmk;
		// запрашиваем все закладки с названием title
		return $.ajax({
		  url: this.m_baseUrl + "find",
		  method: "GET",
		  data: { 
		  	zx : (new Date()).getTime(),
		  	output : "xml",
		  	q : result.title
		  },
		  timeout : this.p_timeout,
		  // dataType: "xml" 
		}).then(
			function (response, status, xhr)
			{
				// _consoleLog("GBE2:doRequestBookmarkURL - OK!");
				var ct = xhr.getResponseHeader("content-type") || "";
		    if (ct.indexOf('xml') > -1) {
					let ids = $(response).find("id");
					let urls = $(response).find("url");
					// отбираем закладку с соответствующим id
					if (ids.length && urls.length)
					{
						for (let i = 0; i < ids.length; i++)
						{
							if (result.id == $(ids[i]).text())
							{
								result.url = $(urls[i]).text();
								// TODO !!!! Убрать?
								result.index = index;
			        	return result;
			        }
						}
						throw new Error("doRequestBookmarkURL : Bookmark <" +  bkmk.title + "> with id=" + bkmk.id + " was not found!");
					}
		    }
		    else
		    {
		    	throw new Error("doRequestBookmarkURL : Answer of server is not XML.");
		    }
			},
			function (jqXHR, textStatus)
			{
				_consoleLog ("GBE2:doRequestBookmarkURL", "Obtain bookmark URL (", bkmk.title, ") - error!");
				_consoleLog ("GBE2:doRequestBookmarkURL - Request failed: ", textStatus);
				_consoleLog (jqXHR.responseText);
			}
		);
	},

	doRequestBookmarkNote : function (bkmk)
	{
		return $.ajax({
			url: this.m_baseUrl + "find",
			method: "GET",
			data: { 
				zx : (new Date()).getTime(),
				output : "rss",
				q : bkmk.title
			},
			timeout : this.p_timeout
		})
		.then(
			function(response, status,xhr){
				var ct = xhr.getResponseHeader("content-type") || "";
				if (ct.indexOf('xml') > -1) {
					let bookmarks = $(response).find("item");
					if (bookmarks.length){
						for (let i = 0; i < bookmarks.length; i++)
						{
							let item = $(bookmarks[i]);
							if (bkmk.id == item.find("smh\\:bkmk_id").text()){
								let notes = item.find("smh\\:bkmk_annotation");
								if (notes.length)
								{
									bkmk.notes = notes.text();
									// console.log ("doRequestBookmarkNote " + bkmk.id);
									return notes.text();
								}
							}
								
						}
						return "";
					}
				}
				else
				{
					throw new Error("doRequestBookmarkNote : Answer of server is not XML.");
				}
			}
			,
			function (jqXHR, textStatus)
			{
				_consoleLog ("GBE2:doRequestBookmarkNote", "Obtain bookmark URL (", bkmk.title, ") - error!");
				_consoleLog ("GBE2:doRequestBookmarkNote - Request failed: ", textStatus);
				_consoleLog (jqXHR.responseText);
			}
		);
	},


	doChangeBookmark : function (bkmk)
	{
		let result = bkmk;
		return Promise.resolve()
			.then(() => {
				console.log("doChangeBookmark:m_signature");
				if (this.m_signature) 
					{return this.m_signature;}
				else
					{return this.doRequestSignature();}
			})
			.catch((e) => {
				_errorLog("doChangeBookmark", e);
				_consoleLog ("GBE2:doChangeBookmark", "Obtain signature - error!");
				throw new Error("doChangeBookmark : Obtain signature - error!");
			})
			.then(() => {
				console.log("doChangeBookmark:ajax"+this.m_baseUrl2,);
				console.log(bkmk);
				return $.ajax({
					url: this.m_baseUrl2,
					method: "GET",
					data: { 
						zx : (new Date()).getTime(),
						bkmk : bkmk.url,
						title : bkmk.title,
						labels : bkmk.labels,
						annotation : bkmk.notes,
						prev : "lookup",
						sig : this.m_signature,
						cd : "bkmk",
						q : "",
						start : 0
					},
					timeout : this.p_timeout,
				})
				.then( (response, status, xhr) => {
			    	if (bkmk.oldUrl.trim() !== "" && bkmk.oldUrl.trim() !== bkmk.url.trim()) {
			    		_consoleLog ("Changing bookmarks URL from ", bkmk.oldUrl, "to", bkmk.url);
			    		return this.doDeleteBookmark(bkmk);
			    	}
					},
					function (jqXHR, textStatus)
					{
						_consoleLog ("GBE2:doChangeBookmark", "Saving bookmark ", JSON.stringify(bkmk), " - error!");
						_consoleLog ("GBE2:doChangeBookmark - Request failed: ", textStatus);
						_consoleLog (jqXHR.responseText);
					}
				);
			});
	},

	doChangeLabel : function (lbl) {
		return Promise.resolve()
			.then(() => {
				if (this.m_signature) 
					{return this.m_signature;}
				else
					{return this.doRequestSignature();}
			})
			.catch((e) => {
				_errorLog("doChangeLabel", e);
				throw new Error("doChangeLabel : Obtain signature - error!");
			})
			.then(() => {
				// console.log("doChangeBookmark:ajax");
				// console.log(lbl.oldName + ", " + lbl.name);
				return $.ajax({
					url: this.m_baseUrl2,
					method: "GET",
					data: { 
						op : "modlabel",
						zx : ((new Date()).getTime() + Math.random() * (99) + 1),
						labels : lbl.oldName + "," + lbl.name,
						sig : this.m_signature
					},
					timeout : this.p_timeout,
				})
				.then( (response, status, xhr) => {
						 // console.log("doChangeLabel : Ok");
					},
					function (jqXHR, textStatus)
					{
						_consoleLog ("GBE2:doChangeLabel", "Changing label ", JSON.stringify(lbl), " - error!");
						_consoleLog ("GBE2:doChangeLabel - Request failed: ", textStatus);
						_consoleLog (jqXHR.responseText);
					}
				);
			});
	},

	doDeleteLabel : function (lbl) {
		return Promise.resolve()
			.then(() => {
				if (this.m_signature) 
					{return this.m_signature;}
				else
					{return this.doRequestSignature();}
			})
			.catch((e) => {
				_errorLog("doDeleteLabel", e);
				throw new Error("doDeleteLabel : Obtain signature - error!");
			})
			.then(() => {
				console.log("doDeleteLabel:ajax");
				console.log(lbl.name);
				return $.ajax({
					url: this.m_baseUrl2,
					method: "GET",
					data: { 
						op : "modlabel",
						zx : ((new Date()).getTime() + Math.random() * (99) + 1),
						labels : lbl.name,
						sig : this.m_signature
					},
					timeout : this.p_timeout,
				})
				.then( (response, status, xhr) => {
						console.log("doDeleteLabel : Ok");
					},
					function (jqXHR, textStatus)
					{
						_consoleLog ("GBE2:doDeleteLabel", "Deleting label ", JSON.stringify(lbl), " - error!");
						_consoleLog ("GBE2:doDeleteLabel - Request failed: ", textStatus);
						_consoleLog (jqXHR.responseText);
					}
				);
			});
	},

	doDeleteBookmark : function (bkmk)
	{
		let result = bkmk;
		return Promise.resolve()
			.then(() => {
				if (this.m_signature) 
					{return this.m_signature;}
				else
					{return this.doRequestSignature();}
			})
			.catch((e) => {
				_errorLog("doDeleteBookmark", e);
				// _consoleLog ("GBE2:doDeleteBookmark", "Obtain signature - error!");
				throw new Error("doDeleteBookmark : Obtain signature - error!");
			})
			.then(() => {
				// console.log("doDeleteBookmark:ajax");
				return $.ajax({
					url: this.m_baseUrl2,
					method: "GET",
					data: { 
						zx : (new Date()).getTime(),
						dlq : bkmk.id,
						sig : this.m_signature
					},
					timeout : this.p_timeout,
				})
				.then( (response, status, xhr) => {
			    	// console.log("doDeleteBookmark : Ok");
					},
					function (jqXHR, textStatus)
					{
						_consoleLog ("GBE2:doDeleteBookmark", "Deleting bookmark ", JSON.stringify(bkmk), " - error!");
						_consoleLog ("GBE2:doDeleteBookmark - Request failed: ", textStatus);
						_consoleLog (jqXHR.responseText);
					}
				);
			});
	},

	reloadBkmks :  function () {
		if (!this.m_signature)
		{
			this.doRequestSignature().catch((error) => {_errorLog("reloadBkmks", error);});
		}
		return this.doRequestBookmarks().then((result) => {return this.doProcessBookmarks(result);});
	},

	setBrowserActionIcon : function (tTab) {
		if (this.isBookmarked(tTab.url)) {
			browser.browserAction.setIcon({
				path: { 18: "./images/Star_full.png", 32: "./images/Star_full32.png" }
			});
			if (tTab.favIconUrl) this.setFavicon(tTab);
		}
		else
		{
			browser.browserAction.setIcon({ 
				path: { 18: "./images/Star_empty.png", 32: "./images/Star_empty32.png" }
			});
		}
	}, 

	setFavicon : function (tTab) {
		if (!this.opt.showFavicons) return;
		let flag = true;
		if (this.opt.favIcons && this.opt.favIcons[tTab.url]) 
			if (tTab.favIconUrl == null || this.opt.favIcons[tTab.url] == tTab.favIconUrl) 
				flag = false;
		if (flag) {
			// console.log(tTab.favIconUrl);
			this.opt.favIcons[tTab.url] = tTab.favIconUrl;
			console.log("setFavicon:writeFavIcons");
			this.opt.writeFavIcons().then();
			this.setTreeNodeField(this.m_treeSource, {url: tTab.url}, {icon: tTab.favIconUrl});
		}
	},

	/**
	 * проверяет закладку/метку на соответствие значению фильтра
	 *
	 * @param      {object}  bkmk    информация о закладке в виде bkmk = {	title, notes, url }
	 * @param      {string}  search  строка поиска
	 * 
	 * возвращает result = {
	 * 	isMatch: false,  - совпадает или нет
	 * 	search: "", - регулярка для выделения найденого в заголовке закладки
	 * 	extra: [] - добавляется в начало заголовка (для url и notes)
	 * }
	 */
	checkBookmark : function (bkmk, search) {
		let result = {isMatch: false, search: "", extra: null};
		let enableFilterByUrl = this.opt.enableFilterByUrl;
		let enableFilterByNotes = this.opt.enableFilterByNotes;

		// если в строке нечетное число кавычек, например
		// "
		// "значение
		// знач1 "знач2
		// "знач1" знач2 "знач3
		if (Math.abs((search.match(/"/g) || []).length % 2) == 1) {
			var pos = search.lastIndexOf('"');
			// удаляем последнюю кавычку
		  search = search.substring(0,pos) + "" + search.substring(pos+1)
			if (search.length == 0) {
				result.isMatch = true; 
				return result;
			}
		}

		// проверка на "значение поиска с пробелами"
		// учитывается только одно вхождение
		let result0 = /"(.*?\s.*?)"/i.exec(search);
		if (result0 && Array.isArray(result0) && result0.length == 2){
	    let search = _escape(result0[1]);
	    // search1 = escape(result0[1].replace(/"/g,""));
	    let tRe = new RegExp(search, "i");
	    if (tRe.test(bkmk.title)) {
	       result.isMatch = true; 
	       result.search = tRe;
	       return result;
	    }    
		}
		// делим значение поиска по пробелам
		var words = search.split(/\s+/);
		// формируем регулярки для поиска и выделения
		// если слов несколько - должны встречаться все слова
		var tSearch = "(?:";
		var tMark = "";
		words.forEach((elem) => {
	    if (elem.length == 0) return;
	    // вариант для слова в кавычках - ищем целое слово
	    if (/"\S*?"/ig.test(elem))
	    {
	      var elem = _escape(elem.replace(/"/g,""));
	      // tSearch += '(?=.*\\b(' + elem + ')(?=\\s|$|[,.:;]))';
	      tSearch += '(?=.*([^0-9a-zA-Zа-яёА-ЯЁ]|\\b)(' + elem + ')(?=\\s|$|[,.:;]))';
	      // tMark += '(?=([^0-9a-zA-Zа-яёА-ЯЁ]+|\\b)(' + elem + ')(?=\\s|$|[,.:;]))|';
	      tMark += '(?:([^0-9a-zA-Zа-яёА-ЯЁ]{0}|\\b)(' + elem + ')(?=\\s|$|[,.:;]))|';
	    }
	    // без кавычек - любое соответствие
	    else {
	      var elem = _escape(elem);
	      tSearch += '(?=.*(' + elem + '))';
	      tMark += '(' + elem + ')|';
	    }
		});
		tSearch += '.+)';
		tMark = tMark.substring(0, tMark.length - 1);
		var reSearch = new RegExp(tSearch, "ig");
		// console.log (reSearch);
		var reMark = new RegExp(tMark, "ig");
		// console.log (reMark);

		// поиск в заголовке закладки
		let match = reSearch.exec(bkmk.title);
		if (match) {
			result.isMatch = true; 
			result.search = reMark;
			return result;
		}

		result.search = "";
		// поиск в примечании
		if (enableFilterByNotes && bkmk.notes.length > 0) {
			match = (new RegExp(tSearch, "ig")).exec(bkmk.notes);
			if (match) {
				result.isMatch = true; 
				result.extra = {class : "markNote", text : "NOTE"};
				return result;
			}
		}
		// поиск в Url
		if (enableFilterByUrl && bkmk.url.length > 0) {
			match = (new RegExp(tSearch, "ig")).exec(bkmk.url);
			if (match) {
				result.isMatch = true; 
				result.extra = {class : "markUrl", text : "URL"};
				return result;
			}
		}
		return result;
	}


}; // GBE2 end



$(document).ready(function()
{
	_consoleLog("GBE2:background.js started");
	GBE2.opt.read()
		.then(function(){
			//return GBE2.reloadBkmks();
		})
		.catch ( (error) => {
    	_errorLog("background:ready", error);
	 	});
});

browser.contextMenus.create({
  id: "contextMenuAddBookmark",
  title: "Добавить страницу в Google Bookmarks",
  contexts: ["page"],
  command: "_execute_browser_action"
});

browser.contextMenus.create({
  id: "contextMenuAddLinkToBookmark",
  title: "Добавить ссылку в Google Bookmarks",
  contexts: ["link"],
  command: "_execute_browser_action"
});

browser.contextMenus.onClicked.addListener(function(info, tab) {
  let mId = info.menuItemId;
  switch (mId) {
  	// при клике на одном из пунктов контекстного меню (добавление страницы или ссылки в закладки)
    case "contextMenuAddBookmark":
    case "contextMenuAddLinkToBookmark":
    	// название закладки
    	let title = (mId == "contextMenuAddBookmark") ? tab.title : info.linkText;
    	// адрес закладки
    	let url = (mId == "contextMenuAddBookmark") ? tab.url : info.linkUrl;
    	let favIconUrl = (mId == "contextMenuAddBookmark" && tab.hasOwnProperty("favIconUrl")) ? tab.favIconUrl : null;

  		if (mId == "contextMenuAddLinkToBookmark" && !info.linkText || info.linkText == url) 
  			title = url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/')[0];
    	// отправляем в popup сообщение о необходимости открыть диалог редактирования закладки 
    	browser.runtime.sendMessage({
    		"type": "CntxOpenBkmkDialog",
    		"title": title,
    		"url": url,
    		"favIconUrl" : favIconUrl
    	}).catch((e) => {
    		// при неудаче (popup уще не открылся) - заполняем m_dlgInfo (будет прочитан при открыии popup)
    		GBE2.m_dlgInfo = {
      		"needOpen" : true,
      		"title": title,
      		"url": url,
      		"favIconUrl" : favIconUrl
      	}
    	});
  }
});


// при изменении параметров дополнения - перечитываем их
browser.storage.onChanged.addListener((changes) => {
	// console.log(JSON.stringify(changes));
	if (changes.hasOwnProperty("settings"))
		GBE2.opt.read().then(() => { GBE2.m_needRefresh = true;});
});

// при изменении адреса вкладки - меняем значок на панели,
// если такой адрес есть в закладках
function handleTabUrlUpdated(tabId, changeInfo, tabInfo) {
  if (changeInfo.url || changeInfo.favIconUrl) {
    GBE2.setBrowserActionIcon(tabInfo);
  }
}
browser.tabs.onUpdated.addListener(handleTabUrlUpdated);

// при активации вкладки - меняем значок на панели,
// если такой адрес есть в закладках
function handleTabActivated(activeInfo) {
  browser.tabs.get(activeInfo.tabId).then((tabInfo) => {
  	GBE2.setBrowserActionIcon(tabInfo);
  });
}
browser.tabs.onActivated.addListener(handleTabActivated);

// Provide help text to the user.
// browser.omnibox.setDefaultSuggestion({
//   description: `!Search in Google Bookmarks`
// });

// Update the suggestions whenever the input is changed.
browser.omnibox.onInputChanged.addListener((text, addSuggestions) => {
	let suggestions = [];
  let suggestionsOnEmptyResults = [{
    content: "!no bookmarks found",
    description: "!no bookmarks found"
	}];
	if (!GBE2.m_bookmarkList.length)
		addSuggestions(suggestionsOnEmptyResults);
	else {
		GBE2.m_bookmarkList.forEach(function (bkmk) {
			let check = GBE2.checkBookmark(bkmk, text);
			if (check.isMatch) {
				suggestions.push({
          content: bkmk.url,
          description:  (check.extra == null) ? bkmk.title : `[${check.extra.text}] ${bkmk.title}`,
				});
			}
		});
		// console.log(suggestions);
		addSuggestions(suggestions);
	}

});

// Open the page based on how the user clicks on a suggestion.
browser.omnibox.onInputEntered.addListener((text, disposition) => {
  let url = text;
  console.log(text);
  switch (disposition) {
    case "currentTab":
      browser.tabs.update({url});
      break;
    case "newForegroundTab":
      browser.tabs.create({url});
      break;
    case "newBackgroundTab":
      browser.tabs.create({url, active: false});
      break;
  }
});


chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    // console.log(JSON.stringify(request));
    // console.log(JSON.stringify(sender));
    switch (request.type)
    {
	    case "refresh" :
	    {
	    	// получаем список закладок
	    	GBE2.reloadBkmks()
	    		.then((result) => {
	    			// уведомляем popup
	     			browser.runtime.sendMessage(result);
	     			GBE2.setBrowserActionIcon(request.tab);
	     		})
	     		.catch ( (error) => {
	  	    	_errorLog("background:refresh", error);
	   	 		}
	     		);
		    break;
	    }
	    case "openBkmkDialog" :
	    {
	    	console.log("background.js " + JSON.stringify(sender.tab));
	    	break;
	    }
	    case "editBookmark" :
	    {
	    	// console.log("background.js " + JSON.stringify(request.data));
	    	// console.log("|"+request.data.oldUrl+"|");
	    	GBE2.doChangeBookmark(request.data)
	    		.then(() => {
	    			browser.runtime.sendMessage({type: "needRefresh"});
	    			if (GBE2.opt.showFavicons && request.favIconUrl) {
	    				console.log(request.favIconUrl);
	    				GBE2.opt.favIcons[request.url] = request.favIconUrl;
	    				GBE2.opt.writeFavIcons().then();
	    			}
	    			// console.log("background:editBookmark");
	    		})
	    		.catch((e) => {
	    			_errorLog("background:editBookmark", e);
	    		});
	    	break;
	    }
	    case "deleteBookmark":
	    	GBE2.doDeleteBookmark(request.data)
	    		.then(() => {
	    			browser.runtime.sendMessage({type: "needRefresh"});
	    			console.log("background:deleteBookmark");
	    			if (GBE2.opt.showFavicons && GBE2.opt.favIcons && GBE2.opt.favIcons[request.data.url]) {
	    				delete GBE2.opt.favIcons[request.data.url];
	    				GBE2.opt.writeFavIcons().then();
	    			}
	    		})
	    		.catch((e) => {
	    			_errorLog("background:deleteBookmark", e);
	    		});
	    	break;
	    case "editLabel": {
	    	let chain = Promise.resolve();
	    	GBE2.m_labelsArr.forEach(function(lbl) {
	    		if (lbl == request.data.oldName || lbl.indexOf(request.data.oldName+GBE2.opt.nestedLabelSep) == 0) {
	    			chain = chain.then(() => {
	    				let re = request.data.oldName;
	    				if (GBE2.opt.showHiddenLabels && request.data.oldName == GBE2.opt.hiddenLabelsTitle && lbl !== GBE2.opt.hiddenLabelsTitle)
	    						re += GBE2.opt.nestedLabelSep;
	    				return GBE2.doChangeLabel({
	    					oldName: lbl, name: lbl.replace(re, request.data.name)
	    				});
	    			});
	    		}
	    	});
	    	chain.then(() => {
	    			browser.runtime.sendMessage({type: "needRefresh"});
	    		})
	    		.catch((e) => {
	    			_errorLog("background:editLabel", e);
	    		});
	    	break;
	    }
	    case "deleteLabel": {
	    	if (!request.data.delChildren)
	    	{
	    		GBE2.doDeleteLabel(request.data)
	    			.then(() => {
	    				browser.runtime.sendMessage({type: "needRefresh"});
	    			})
	    			.catch((e) => {
	    				_errorLog("background:deleteLabel", e);
	    			});
	    	}
	    	else
	    	{
	    		let chain = Promise.resolve();
	    		GBE2.m_bookmarkList.forEach(function(bkmk) {
	    			if ((bkmk.labels.length) && (bkmk.labels.indexOf(request.data.name) >= 0)) {
	    				chain = chain.then(() => {
	    					// console.log(bkmk.title);
	    					return GBE2.doDeleteBookmark(bkmk);
	    				});
	    			}
	    		});
	    		chain.then(() => {
	    				browser.runtime.sendMessage({type: "needRefresh"});
	    			})
	    			.catch((e) => {
	    				_errorLog("background:editLabel", e);
	    			});		
	    	}
	    	break;
	    }
	    case "reloadFavIcons" : {
	    	if (GBE2.m_bookmarkList.length) {
	    		let counter = 0;
	    		let bkmkCount = GBE2.m_bookmarkList.length;
	    		browser.runtime.sendMessage({type: "startReloadFavicons", bkmkCount: bkmkCount});
	    		let chain = Promise.resolve();
	    		GBE2.opt.favIcons = {};
	    		GBE2.opt.showFavicons = true;
	    		let doRequestFavIcon = (url, favicon) => {
    				return	$.ajax({
    					url: "http://www.google.com/s2/favicons",
    					method: "GET",
							data: { domain_url : url }
    				})
    				.then( (response, status, xhr) => { 
    					GBE2.opt.favIcons[url] = favicon; 
    					GBE2.setTreeNodeField(GBE2.m_treeSource, {url: url}, {icon: favicon});
    					return Promise.resolve();
    				})
    				.catch(() => {return Promise.resolve()});
	    		}

	    		GBE2.m_bookmarkList.forEach(function(bkmk) {
	    			counter++;
	    			if (bkmk.url) {
	    				let favicon = "http://www.google.com/s2/favicons?domain_url=" + encodeURIComponent(bkmk.url);
	    				chain = chain.then(() => {
	    					browser.runtime.sendMessage({type: "tickReloadFavicons", counter: counter, bkmkCount: bkmkCount});
			    			return doRequestFavIcon(bkmk.url, favicon);
		    			})
						}
					});
	    		chain.then(() => {
	    				browser.runtime.sendMessage({type: "stopReloadFavicons"});
	    				console.log("reloadFavIcons:writeFavIcons")
	    				GBE2.opt.writeFavIcons().then();
	    		})
	    		.catch();
				}
      	break;
      }	 
      case "addAllTabs" : {
      	let chain = Promise.resolve();
      	request.data.forEach(function(bkmk) {
      			chain = chain.then(() => {
      				// console.log(bkmk.title);
      				return GBE2.doChangeBookmark(bkmk);
      			});
      			if (GBE2.opt.showFavicons && bkmk.url && bkmk.favIconUrl) 
      				GBE2.opt.favIcons[bkmk.url] = bkmk.favIconUrl;
      	});
      	chain.then(() => {
      			GBE2.opt.writeFavIcons().then();
      			browser.runtime.sendMessage({type: "needRefresh"});
      		})
      		.catch((e) => {
      			_errorLog("background:addAllTabs", e);
      		});		
      	break;
      }
      case "moveBookmark" : {
      	let tBkmk = request.data;
      	let chain = Promise.resolve()
      		.then(() => {
    	    	if (GBE2.opt.enableNotes && tBkmk.url == "") 
    	    	{
    	    		_consoleLog("Obtain url for bkmk: ", JSON.stringify(tBkmk));
    	    		return GBE2.doRequestBookmarkURL(tBkmk);
    	    	}
    	    	else return Promise.resolve(tBkmk);
    	    })
    	    // сохраняем его 
    	    .then((result) => {
  	      	if (result && result.url.length)
  	      	{
	    	    	tBkmk.url = result.url;
	    	    	console.log (JSON.stringify(tBkmk));
	    	    	if (!GBE2.opt.enableNotes && tBkmk.notes == "") {
	    	    		_consoleLog("Obtain notes for bkmk: ", JSON.stringify(tBkmk));
	    	      	return GBE2.doRequestBookmarkNote(tBkmk);
	    	    	}
	    	    	else return Promise.resolve(tBkmk);
  	        }
  	        else
  	        {
  	        	throw new Error("URL for bookmark <" +  tBkmk.title + "> was not found!");
  	        }
    	    })
    	    // получаем количество посещений данного URL из истории браузера
    	    .then( (result) => {
    	    	if (result.notes) tBkmk.notes = result.notes;
    	    	console.log (JSON.stringify(tBkmk));
    	    	return GBE2.doChangeBookmark(tBkmk);
    	    })
    	    .then( () => {
    	    	console.log("moveBookmark - changed");
    	    	let bkmk = GBE2.getBookmark({ id : tBkmk.id});
    	    	if (bkmk) {
    	    		bkmk.labels = tBkmk.labels;
    	    		GBE2.m_bookmarkList.sort((GBE2.opt.sortType == "timestamp")? GBE2.compareByDate : GBE2.compareByName);
    	    	}

    	    })
    	    .catch((e) => {
	    			_errorLog("background:moveBookmark", e);
	    		});
      	
      	break;
      }

	    case "test1" :
	    {
	    	// browser.tabs.create({active: false, url: "about:blank"});
	    	let bkmks = [
	    		{"id" : "2014929379963161864", title : "МІНІСТЕРСТВО ЕНЕРГЕТИКИ...", url: ""},
	    		{"id" : "6780747876076445387", title : "Google", url: ""},
	    		{"id" : "2190118772553574361", title : "Fess Google Bookmark Extension :: Versions :: Дополнения Firefox", url: "https://addons.mozilla.org/ru/firefox/addon/fess-google-bookmark-extens/versions/"}
	    	];
    	  // начало цепочки
	    	let chain = Promise.resolve();
	    	
	    	let visitsArray = [];
	    	
	    	// в цикле добавляем задачи в цепочку
	    	bkmks.forEach(function(bkmk) {
	    	  chain = chain
	    	    .then(() => {
	    	    	if (bkmk.url.length)
	    	    	{
	    	    		return bkmk;
	    	    	}
	    	    	else
	    	    	{
	    	    		return GBE2.doRequestBookmarkURL(bkmk)
	    	    	}
	    	    })
	    	    .then((result) => {
	    	    	// console.log ( result.id + " " + result.url);	
	    	    	if (result && result.url.length)
	    	    	{
	    	    		bkmk.url = result.url;
	    	      	// results.push(result.url);
	    	      	return bkmk;
	    	      }
	    	      else
	    	      {
	    	      	throw new Error("URL for bookmark <" +  bkmk.title + "> was not found!");
	    	      }
	    	    })
	    	    .then( (bkmk) => {
	    	    	return browser.history.getVisits({
					      url: bkmk.url
					    });
	    	    })
	    	    .then ( (visits) => {
	    	    	if (visits.length)
	    	    	{
	    	    		// console.log(bkmk.id + " Visit count: " + visits.length);
	    	    		visitsArray.push({"bkmsrkId" : bkmk.id, "visits" : visits.length});
	    	    	}
	    	    	return bkmk;
	    	    })
	    	    .catch( (error) => {
	    	    	//console.log (error);
	    	    	console.log (error.fileName + ", line " + error.lineNumber + ", column " + error.columnNumber);
	    	    	console.log ("Error:" + error.message);
	    	    })
	    	    ;
	    	});
	    	
	    	// в конце — выводим результаты
	    	chain.then(() => {
	    	  console.log(JSON.stringify(bkmks));
	    	  console.log(JSON.stringify(visitsArray));
	    	});
	    	break;
	    }
	    default: 
	    	console.log(JSON.stringify(request));
	    	browser.notifications.create({
	    	    "type": "basic",
	    	    "iconUrl": browser.extension.getURL("link.png"),
	    	    "title": "You clicked a link!",
	    	    "message": request.url
	    	  });
  	}
 });



