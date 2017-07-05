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

  // разделитель меток при сортировке
  'm_labelSep'	: "{!|!}",
  opt : new Options(),
	
	// тайм-аут ответа сервера при получении закладок и сигнатуры
	'p_timeout' : 10000,
	// режим без примечаний - формат получения закладок: rss or xml
	'p_enableNotes' : true,

	// включить добавление метки к закладкам без метки
	'p_enableLabelUnlabeled' : false,
	// добавляемая метка
	'p_labelUnlabeledName' : "Unlabeled",
	'p_enable10recentBookmark' :true,
	'p_enable10visitedBookmark' :true,
	'm_recent10bkmrk' : [],
	'p_hiddenLabelsTitle' : "_hidden_",
	'p_showHiddenLabels' : false,

	 // тип сортировки 
  'p_sortType' : "name",
  // направление сортировки
  'p_sortOrder' : "asc",

   // список всех меток (папок)
  'm_labelsArr' : null,

  /* ------Свойства------*/
  // разделитель вложенных меток
  'p_nestedLabelSep' : '/',
  'm_dlgInfo' : null,

		/**
	 * функция сравнения закладок и меток по имени
	 * @return {int} результат сравнения
	 */
	compareByName : function (a, b) {
		if (a instanceof Array && b instanceof Array) 
		{
			if (GBE2.p_sortOrder == "asc") 
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
			if (GBE2.p_sortOrder == "asc") 
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
			if (this.p_sortOrder == "asc") 
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
			if (this.p_sortOrder == "asc") 
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
		var found = false;
		// поле поиска
		let key = Object.keys(keyvalue)[0];
		// ищем на текущем уровне
		let elem = array.filter(x => (x.hasOwnProperty("folder") && x[key] === keyvalue[key]));
		if (elem.length)
		{
			// нашли - возвращаем
			return elem[0];
		}
		else
		{
			// не нашли - просматриваем вложенные метки
			// отбираем метки
			let folders = array.filter(x => (x.hasOwnProperty("folder")));
			for (let i = folders.length - 1; i >= 0; i--)
	  	{
	  		let item = folders[i];
	  		// если у метки есть вложенные - ищем среди них
	  		if (item.children.length)
	  		{
	  			found = this.searchLabel(item["children"], keyvalue);
	  			if (found)
	  			  return found;
	  		}
	  	}
		}

	},

	isBookmarked : function (tUrl) {
		if (this.m_bookmarkList.length)
			return (this.m_bookmarkList.some( item => item.url == tUrl));
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
	appendBkmkToBkmksList : (parent, bkmk, parentKey) => {
			let item = {
				"title" : bkmk.title, 
				"key" : (bkmk.id + "|" + parentKey), 
				"refKey": bkmk.id, 
				"url": bkmk.url,
				"icon": "../images/bkmrk.png"
			};
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
			let allLabelsStr, i, j;
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
				// this._M.refreshInProgress = false;
				// console.log ("GBE:doProcessBookmarks", "Bookmarks (in server response) are empty!");
			 // 	reject(new Error("Network Error 2"));	
			 // 	return false;
			 	let reason = new Error("There are any bookmarks in server response!");
			 	_errorLog("doProcessBookmarks", reason);
			 	return Promise.resolve({ type: "refreshed", count : 0, data : [] });
			}
	// return new Promise((resolve, reject) => {

			// временная строка для группировки и сортировки меток
			allLabelsStr = this.m_labelSep;
			let lbs = [];
			var self = this;

			for (i = 0; i < labelsLength; i++) 
			{
			  // название метки
			  let labelVal = $(labels[i]).text();
			  // если такой метки во временной строке еще нет - добавляем ее (с разделителем)
			  if (allLabelsStr.indexOf(this.m_labelSep + labelVal + this.m_labelSep) === -1)
			  {
			  	allLabelsStr += (labelVal + this.m_labelSep);
			  	lbs.push({"title" : labelVal, "timestamp" : null, "id" : this.genereteLabelId(labelVal)});
			  }
			}

			// добавляем labelUnlabeledName метку в массив меток
			if (this.p_enableLabelUnlabeled)
			{
				lbs.push({
					"title" : this.p_labelUnlabeledName, 
					"timestamp" : null, 
					"id" : this.genereteLabelId(this.p_labelUnlabeledName)});
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
					bookmark.find(bkmkFN[oType].label).each(function() {
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
						let lbl = lbs.filter(function(val, i, ar){ return ar[i].title == self.p_labelUnlabeledName});
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
			if (this.p_enable10recentBookmark)
			{
				let sliceLength = (this.m_bookmarkList.length < 10 ? this.m_bookmarkList.length : 10);
				this.m_recent10bkmrk = this.m_bookmarkList.slice(0,sliceLength);
			}

			// сортируем массив закладок
			this.m_bookmarkList.sort((this.p_sortType == "timestamp")? this.compareByDate : this.compareByName);	

			// сортируем массив меток
			lbs.sort((this.p_sortType == "timestamp") ? this.compareByDate : this.compareByName);	
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
					let arr_nested_label = lbs[i].title.split(this.p_nestedLabelSep);
					// let key = "";
					
					// первый уровень
					let fullName = arr_nested_label[0];
					let tempKey = this.genereteLabelId(fullName);
					if (!$.grep(treeSource, function(e) {
								return (e.key == tempKey);
							}).length)
					{
						treeSource.push({
							"title" 		: fullName,
							"key" 			: tempKey,
							"folder"		: true,
							"children"	: [],
							"path"			: fullName,
							"icon"			: "../images/folder_blue.png"
						});
					}
					for (j = 1; j < arr_nested_label.length; j++)
					{
						let parentContainer = this.searchLabel(treeSource, {key : tempKey});
						fullName += this.p_nestedLabelSep + arr_nested_label[j];
						tempKey = this.genereteLabelId(fullName);
						if (!$.grep(treeSource, function(e) {return (e.key == tempKey);}).length)
						{
							parentContainer.children.push({
								"title" 		: arr_nested_label[j],
								"key" 			: tempKey,
								"folder"		: true,
								"children"	: [],
								"path"			: fullName,
								"icon"			: "../images/folder_blue.png"
 							});
						}
					}


					// // только одна метка - вложенных нет
					// if (arr_nested_label.length == 1)
					// {
					// 	key = this.genereteLabelId(arr_nested_label[0]);
					// 	// ищем ее - добавляем, если такой еще не было
					// 	if (!$.grep(treeSource, function(e) {
					// 			return (e.key == key);
					// 		}).length)
					// 	{
					// 		treeSource.push({
					// 			"title" 		: arr_nested_label[0],
					// 			"key" 			: key,
					// 			"folder"		: true,
					// 			"children"	: [],
					// 			"path"			: arr_nested_label[0]
 				// 			});
					// 	}
					// }
					// else
					// {
					// 	// есть вложенные метки
					// 	// первый уровень
					// 	let fullName = arr_nested_label[0];
					// 	let tempKey = this.genereteLabelId(fullName);
					// 	let tempMenu = $.grep(treeSource, function(e) {
					// 			return (e.key == tempKey);
					// 	});
					// 	if (tempMenu.length == 0)
					// 	{
					// 		treeSource.push({
					// 			"title" 		: fullName,
					// 			"key" 			: tempKey,
					// 			"folder"		: true,
					// 			"children"	: [],
					// 			"path"			: fullName
 				// 			});
					// 	}
					// 	for (j = 1; j < arr_nested_label.length; j++)
					// 	{
					// 		let parentContainer = this.searchLabel(treeSource, {key : tempKey});
					// 		fullName += this.p_nestedLabelSep + arr_nested_label[j];
					// 		tempKey = this.genereteLabelId(fullName);
					// 		if (!$.grep(treeSource, function(e) {return (e.key == tempKey);}).length)
					// 		{
					// 			parentContainer.children.push({
					// 				"title" 		: arr_nested_label[j],
					// 				"key" 			: tempKey,
					// 				"folder"		: true,
					// 				"children"	: [],
					// 				"path"			: fullName
	 			// 				});
					// 		}
					// 	}
					// }
				}
			}


			  // начало цепочки
			let chain = Promise.resolve();
		
			let visitsArray = [];
    	// в цикле добавляем задачи в цепочку
    	this.m_bookmarkList.forEach((bkmk) => {
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
    	    			parentContainer = this.searchLabel(treeSource, {key : pKey});
    	    			this.appendBkmkToBkmksList(parentContainer.children, bkmk, pKey);
    	    		});
    	    	}
    	    	else
    	    	{
    	    		// нет - добавляем в верхний уровень
    	    		pKey = "";
    	    		parentContainer = treeSource;
    	    		// если включено p_enableLabelUnlabeled - в метку p_labelUnlabeledName
    	    		if (this.p_enableLabelUnlabeled)
    	    		{
    	    			pKey = this.genereteLabelId(this.p_labelUnlabeledName);
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
    		if (this.p_enableLabelUnlabeled)
    		{
    			this._M.m_labelsArr = this.m_labelsArr.filter((val, i, ar) => { return val != this.p_labelUnlabeledName});
    		}

    		// вставляем 10 последних добавленных закладок 
				if (this.p_enable10recentBookmark && this.m_recent10bkmrk.length)
				{
					let pKey = this.genereteLabelId("fessGBE.VisitedLabel");
					let resentLabel = {
						"title" 		: "fessGBE.resentLabel",
						"key" 			: pKey,
						"folder"		: true,
						"children"	: [],
						"path"			: "fessGBE.resentLabel",
						"icon"			: "../images/folder_blue.png"
					};
					for (let i = 0; i < this.m_recent10bkmrk.length; i++)
					{
						this.appendBkmkToBkmksList(resentLabel.children, this.m_recent10bkmrk[i], pKey);
					}
					treeSource.unshift(resentLabel);
				}

    		// вставляем 10 самых популярных закладок 
    		if (this.p_enable10visitedBookmark && visitsArray.length)
    		{
    			visitsArray.sort((a,b) => { a.visits < b.visits ? 1 : -1; });
    			let pKey = this.genereteLabelId("fessGBE.VisitedLabel");
    			let visitsLabel = {
						"title" 		: "fessGBE.VisitedLabel",
						"key" 			: pKey,
						"folder"		: true,
						"children"	: [],
						"path"			: "fessGBE.VisitedLabel",
						"icon"			: "../images/folder_blue.png"
					};
					let visitsCount = (visitsArray.length < 10 ? visitsArray.length : 10);
					for (let i = 0; i < visitsCount; i++)
					{
						let bkmk = this.m_bookmarkList.filter( val => {return val.id ==  visitsArray[i].bkmsrkId})[0];
						this.appendBkmkToBkmksList(visitsLabel.children, bkmk, pKey);
					}
					treeSource.unshift(visitsLabel); 
    		}
    		visitsArray = [];

    		if (!this.p_showHiddenLabels)
    		{
    			let hiddenLabel = this.searchLabel(treeSource, {key : this.genereteLabelId(this.p_hiddenLabelsTitle)});
    			if (hiddenLabel instanceof Object)
    			{
    				hiddenLabel.hidden = "true";
    			}
    		}
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
		return $.ajax({
			url: this.m_baseUrl + "lookup",
			type: 'GET',
			data: {
				output : (this.opt.enableNotes ? "rss" : "xml"),
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
				// console.log("doChangeBookmark:m_signature");
				if (this.m_signature) 
					{return this.m_signature;}
				else
					{return this.doRequestSignature();}
			})
			.catch((e) => {
				_errorLog("doChangeBookmark", e);
				// _consoleLog ("GBE2:doChangeBookmark", "Obtain signature - error!");
				throw new Error("doChangeBookmark : Obtain signature - error!");
			})
			.then(() => {
				// console.log("doChangeBookmark:ajax");
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
			    	if (bkmk.oldURL !== "" && bkmk.oldUrl !== bkmk.url) {
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

	// let data = 	"?zx="+((new Date()).getTime()) + "&dlq=" + params.id + "&sig=" + (params.sig ? params.sig : this.m_signature);
	// 	request.open("GET", this.baseUrl2 + data, true);
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

	setBrowserActionIcon : function (tUrl) {
		if (this.isBookmarked(tUrl)) {
			browser.browserAction.setIcon({
				path: { 18: "./images/Star_full.png", 32: "./images/Star_full32.png" }
			});
		}
		else
		{
			browser.browserAction.setIcon({ 
				path: { 18: "./images/Star_empty.png", 32: "./images/Star_empty32.png" }
			});
		}
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
    	let title = (mId == "contextMenuAddBookmark") ? tab.title : null;
    	// адрес закладки
    	let url = (mId == "contextMenuAddBookmark") ? tab.url : info.linkUrl;
      // console.log(JSON.stringify(info));
      // console.log(JSON.stringify(tab));
    //   {"id":6,"index":2,"windowId":3,"url":"file:///D:/my_exepr/fancytree/fancytree-master/demo/index.html#sample-source.html","title":"Fancytree - Example Browser"}
      // setTimeout(() => {
      // let popups = browser.extension.getViews({type: "popup"});
      // if (popups.length)
      // {
      // 	console.log("popup is open")
    		// let chain = Promise.resolve();
    		// для страниц название уже заполнено
    		Promise.resolve().then(() => {
    			if (title !== null) { 
    				return title}
    			else {
    				// для ссылок - запрашиваем у content.js
    				return browser.tabs.sendMessage(
    		      tab.id,
    		      {type: "GetLinkTitle"}
    		    ).then(response => {
    		      return response.linkTitle;
    		    }).catch(() => {
    		    	return url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/')[0]
    		    });
    			}
    		}
    		).then((result) => {
	      	// отправляем в popup сообщение о необходимости открыть диалог редактирования закладки 
	      	browser.runtime.sendMessage({
	      		"type": "CntxOpenBkmkDialog",
	      		"title": result,
	      		"url": url
	      	}).catch((e) => {
	      		// при неудаче (popup уще не открылся) - заполняем m_dlgInfo (будет прочитан при открыии popup)
	      		GBE2.m_dlgInfo = {
		      		"needOpen" : true,
		      		"title": result,
		      		"url": url
		      	}
	      	});
	      });

     //  }
     //  else
     //  {
     //  	GBE2.m_dlgInfo = {
     //  		needOpen : true,
     //  		title: ((mId == "contextMenuAddBookmark") ? tab.title : info.linkUrl ),
     //  		url: ((mId == "contextMenuAddBookmark") ? tab.url : info.linkUrl )
     //  	}
     //  	console.log("popup is still closed");
     // 	}
     // }, 500);

    break;
      // console.log(JSON.stringify(info));
      // //"menuItemId":"contextMenuAddLinkToBookmark","linkUrl":"http://start.nefteproduct.su/#"
      // console.log(JSON.stringify(tab));
      // break;
    // case "remove-me":
    //   var removing = browser.contextMenus.remove(info.menuItemId);
    //   removing.then(onRemoved, onError);
    //   break;
  }
});


// при изменении параметров дополнения - перечитываем их
browser.storage.onChanged.addListener((changes) => {
	// console.log(JSON.stringify(changes));
	GBE2.opt.read().then();
});

// при изменении адреса вкладки - меняем значок на панели,
// если такой адрес есть в закладках
function handleTabUrlUpdated(tabId, changeInfo, tabInfo) {
  if (changeInfo.url) {
    GBE2.setBrowserActionIcon(changeInfo.url);
  }
}
browser.tabs.onUpdated.addListener(handleTabUrlUpdated);

// при активации вкладки - меняем значок на панели,
// если такой адрес есть в закладках
function handleTabActivated(activeInfo) {
  browser.tabs.get(activeInfo.tabId).then((tabInfo) => {
  	GBE2.setBrowserActionIcon(tabInfo.url);
  });
}
browser.tabs.onActivated.addListener(handleTabActivated);


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
	     			GBE2.setBrowserActionIcon(request.tab.url);
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
	    	GBE2.doChangeBookmark(request.data)
	    		.then(() => {
	    			browser.runtime.sendMessage({type: "needRefresh"});
	    			// console.log("background:editBookmark");
	    		})
	    		.catch((e) => {
	    			_errorLog("background:editBookmark",e);
	    		});
	    	break;
	    }
	    case "deleteBookmark":
	    	GBE2.doDeleteBookmark(request.data)
	    		.then(() => {
	    			browser.runtime.sendMessage({type: "needRefresh"});
	    			// console.log("background:deleteBookmark");
	    		})
	    		.catch((e) => {
	    			_errorLog("background:deleteBookmark",e);
	    		});
	    	break;
	    case "test1" :
	    {
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



