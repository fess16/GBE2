function get(url) {  
  return new Promise(function(resolve, reject) {

    var req = new XMLHttpRequest();
    req.open('GET', url);
    req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    req.overrideMimeType('text/xml');
    req.onload = function() {
      if (req.status == 200 && req.responseXML) { 
          resolve(req.response); /* ПРОМИС ВЫПОЛНЕН */
      } else { 
          reject(Error(req.statusText)); /* ПРОМИС ОТКЛОНЁН */
      }
    };

    req.onerror = function() { reject(Error("Network Error")); };
    req.send();
  });
}

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

  'm_request' : null,
  // разделитель меток при сортировке
  'm_labelSep'	: "{!|!}",
	
	// тайм-оут ответа сервера при получении закладок и сигнатуры
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

	genereteLabelId : function(label) {
		 // console.log (label);
	  var hash = 5381, i = label.length
	  while(i)
	    hash = (hash * 33) ^ label.charCodeAt(--i)
	  return hash >>> 0;
	},

	// searchObject : function (array, keyvalue){
	// 	var found = false;
	// 	key = Object.keys(keyvalue)[0];
	//   for (let i = 0, len1 = array.length; i < len1; i++)
	//   {
	//     let object = array[i];
	//     if (object.hasOwnProperty(key))
	//     {
	//       if (object[key] == keyvalue[key])
	//       {
	//         // console.log("found prop: " + object["path"]);
	//         return object;
	//       }
	//       else
	//       {
	//         if (object['children'].length)
	//         {
	//           found = this.searchObject(object["children"], keyvalue);
	//           if (found)
	//             return found;
	//         }
	//       }
	//     }
	//   }
	// },

	searchObject : function (array, keyvalue){
		var found = false;
		key = Object.keys(keyvalue)[0];
		let elem = array.filter(x => (x.hasOwnProperty("folder") && x[key] === keyvalue[key]));
		if (elem.length)
		{
			return elem[0];
		}
		else
		{
			let folders = array.filter(x => (x.hasOwnProperty("folder")));
			for (let i = folders.length - 1; i >= 0; i--)
	  	{
	  		let item = folders[i];
	  		// console.log (item);
	  		if (item.children.length)
	  		// if (item.hasOwnProperty("folder") && item.children.length)
	  		{
	  			found = this.searchObject(item["children"], keyvalue);
	  			if (found)
	  			  return found;
	  		}
	  	}
		}

	},

	// function appendBkmk (parent, bkmk, parentKey)
	// {
	// 	let item = {"title" : bkmk.title, "key" : (bkmk.id + "|" + parentKey), "refKey": bkmk.id, "url": bkmk.url};
	// 	parent.push (item);
	// }

	appendBkmkToBkmkList : (parent, bkmk, parentKey) => {
			let item = {"title" : bkmk.title, "key" : (bkmk.id + "|" + parentKey), "refKey": bkmk.id, "url": bkmk.url};
			parent.push (item);
	},


	LoadBookmarkList : function()
	{
		var myHeaders = new Headers();
		myHeaders.append('Content-Type', 'application/x-www-form-urlencoded');
		myHeaders.append('Content-Type', 'text/xml;');
		myHeaders.append('Cache-Control', 'private, no-cache, no-cache="Set-Cookie", proxy-revalidate');

		var myInit = { method: 'GET',
               headers: myHeaders,
               mode : "same-origin",
               credentials : "same-origin",
               /*cache: 'no-cache'*/ };
 		var myUrl = "https://www.google.com/bookmarks/lookup?output=rss&num=10000";	
		var result = fetch(myUrl, myInit)
		result.then(
		  function(response){
		    return response.text()
		  })
		.then(
		  function (text) {
		    console.log(text);
		  })
		.catch(
		  function(error){
		    console.log("GBE2:LoadBookmarkList - Error!");
		 });

		console.log("GBE2:LoadBookmarkList");
	},

	load : function () 
	{
		var url = "https://www.google.com/bookmarks/lookup?output=rss&num=10000";
		get(url)  
		.then(function(response) {
		    console.log("GBE2:load - OK!");
		    console.log(response);
		})
		.catch(function(err) {
				console.log("GBE2:load - Error!", err);
		    console.log(err);
		})
	},

	doProcessBookmarks : function(responseXML) {
	// doProcessBookmarks : (responseXML) =>	{
		
		// try
		// {
			let allLabelsStr, i, j;
			let xml = $(responseXML);
			let bkmkFieldNames = { 
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

			let oType = this.p_enableNotes ? "rss" : "xml";
			
			// получаем все закладки из XML ответа сервера
	    let bookmarks = xml.find(bkmkFieldNames[oType].bkmk);
			console.log(bkmkFieldNames[oType].bkmk);
			console.log(bookmarks);
	    // получаем все метки из XML ответа сервера
	    let labels = xml.find(bkmkFieldNames[oType].label);
			let labelsLength = labels.length;
			let bookmarksLength = bookmarks.length;
		return new Promise((resolve, reject) => {
	    // если закладок и меток в ответе сервера нет - ничего не делаем
			if (!labelsLength && !bookmarksLength) 
			{
				// this._M.refreshInProgress = false;
				console.log ("GBE2:doProcessBookmarks", "Labels and bookmarks (in server response) are empty!");
			 	reject(new Error("Network Error 3"));	
			 	return false;
			}

			// если меток в ответе сервера нет - ничего не делаем
			if (!bookmarksLength) 
			{
				// this._M.refreshInProgress = false;
				console.log ("GBE:doProcessBookmarks", "Bookmarks (in server response) are empty!");
			 	reject(new Error("Network Error 2"));	
			 	return false;
			}

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
				lbs.push({"title" : this.p_labelUnlabeledName, "timestamp" : null, "id" : this.p_labelUnlabeledName});
			}

			// список закладок\
			this.m_bookmarkList = new Array(bookmarksLength);
			for (i = 0; i < bookmarksLength; i++) 
			{
				this.m_bookmarkList[i] = {};
				let bookmark_labels = [];
				try
				{
					var bookmark = $(bookmarks[i]);
					// read id field
					this.m_bookmarkList[i].id = bookmark.find(bkmkFieldNames[oType].id).text();
					// read title field
					this.m_bookmarkList[i].title = bookmark.find(bkmkFieldNames[oType].title).text();
					// read url field
					this.m_bookmarkList[i].url = bookmark.find(bkmkFieldNames[oType].url).text();
					// read timestamp field
					this.m_bookmarkList[i].timestamp = bookmark.find(bkmkFieldNames[oType].date).text();
					// read label field
					bookmark.find(bkmkFieldNames[oType].label).each(function() {
						bookmark_labels.push($(this).text());
					});
					if (this.m_bookmarkList[i].title == "" && this.m_bookmarkList[i].url !== "")
					{
						console.log ("GBE2:doProcessBookmarks", "Warning. Bookmark", this.m_bookmarkList[i].url, 
							" - has empty title. Title set to '", this.m_bookmarkList[i].url, "'!");
						this.m_bookmarkList[i].title = this.m_bookmarkList[i].url;
					}
				}
				catch(e1)
				{
					console.log ("GBE2:doProcessBookmarks", "Parse bookmark params - error. Last processing bookmark - " + 
						JSON.stringify(this.m_bookmarkList[i]));
					// this._M.refreshInProgress = false;
					throw e1;
				}

				this.m_bookmarkList[i].labels = bookmark_labels;
				// закладка с метками?
				if (bookmark_labels.length)
				{
					// сохраняем метки в массив
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
					if (this.p_enableNotes && bookmark.find(bkmkFieldNames[oType].notes).length)
					{
						this.m_bookmarkList[i].notes = bookmark.find(bkmkFieldNames[oType].notes).text();
					}
				}
				catch(e1)
				{
					console.log ("GBE2:doProcessBookmarks", "Obtain bookmark notes - error. Last processing bookmark - " + JSON.stringify(this.m_bookmarkList[i]) );
					// this._M.refreshInProgress = false;
					throw e1;
				}

				// console.log (JSON.stringify(this.m_bookmarkList[i]));
			}

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
			lbs.forEach(function(element, index) {
			  self.m_labelsArr.push(element.title);
			});
			//------------------------------------------

			let treeSource = [];
			if (lbs.length)
			{
				for (i = 0; i < lbs.length; i++)
				{
					if (lbs[i].title == "") continue;
					let arr_nested_label = lbs[i].title.split(this.p_nestedLabelSep);
					let key = "";
					if (arr_nested_label.length == 1)
					{
						key = this.genereteLabelId(arr_nested_label[0]);
						if (!$.grep(treeSource, function(e) {
								return (e.key == key);
							}).length)
						{
							treeSource.push({
								"title" 		: arr_nested_label[0],
								"key" 			: key,
								"folder"		: true,
								"children"	: [],
								"path"			: arr_nested_label[0]
 							});
 							// console.log ('1 - ' + arr_nested_label[0] + " " + key);
						}
					}
					else
					{
						let fullName = arr_nested_label[0];
						let tempKey = this.genereteLabelId(fullName);
						let tempMenu = $.grep(treeSource, function(e) {
								return (e.key == tempKey);
						});
						if (tempMenu.length == 0)
						{
							treeSource.push({
								"title" 		: fullName,
								"key" 			: tempKey,
								"folder"		: true,
								"children"	: [],
								"path"			: fullName
 							});
						}
						// console.log ('0 - ' + fullName + " " + tempKey);
						for (j = 1; j < arr_nested_label.length; j++)
						{
							// console.log ('00 - j' + fullName + this.p_nestedLabelSep + arr_nested_label[j] + " " + tempKey);
							let parentContainer = this.searchObject(treeSource, {key : tempKey});
							fullName += this.p_nestedLabelSep + arr_nested_label[j];
							tempKey = this.genereteLabelId(fullName);
							if (!$.grep(treeSource, function(e) {return (e.key == tempKey);}).length)
							{
								// console.log(JSON.stringify(parentContainer));
								parentContainer.children.push({
									"title" 		: arr_nested_label[j],
									"key" 			: tempKey,
									"folder"		: true,
									"children"	: [],
									"path"			: fullName
	 							});
							}
						}
					}
				}
			}

			  // начало цепочки
			let chain = Promise.resolve();
			// {"title":"все о inkscape","key":1666563759,"folder":true,"children":[],"path":"Графика/все о inkscape"}

			// function appendBkmk (parent, bkmk, parentKey)
			// {
			// 	let item = {"title" : bkmk.title, "key" : (bkmk.id + "|" + parentKey), "refKey": bkmk.id, "url": bkmk.url};
			// 	parent.push (item);
			// }
			
			let visitsArray = [];
    	// в цикле добавляем задачи в цепочку
    	this.m_bookmarkList.forEach((bkmk) => {
    	  chain = chain
    	  	// get bkmk's URL, if it is emply
    	    .then(() => {
    	    	if (bkmk.url.length)
    	    	{
    	    		return bkmk;
    	    	}
    	    	else
    	    	{
    	    		return this.doRequestBookmarkURL(bkmk)
    	    	}
    	    })
    	    .then((result) => {
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
    	    // get visit cout from history
    	    .then( (bkmk) => {
    	    	return browser.history.getVisits({
				      url: bkmk.url
				    });
    	    })
    	    .then ( (visits) => {
    	    	if (visits.length)
    	    	{
    	    		visitsArray.push({"bkmsrkId" : bkmk.id, "visits" : visits.length});
    	    	}
    	    	return bkmk;
    	    })
    	    .then ( (bkmk) => {
    	    	let parentContainer;
    	    	let pKey = "";
    	    	// если у закладки есть метки
    	    	if (bkmk.labels.length)
    	    	{
    	    		bkmk.labels.forEach( (label) => {
    	    			pKey = this.genereteLabelId(label);
    	    			// console.log (bkmk.title + " %%%% " + pKey);
    	    			parentContainer = this.searchObject(treeSource, {key : pKey});
    	    			this.appendBkmkToBkmkList(parentContainer.children, bkmk, pKey);
    	    		});
    	    	}
    	    	else
    	    	{
    	    		pKey = "";
    	    		parentContainer = treeSource;
    	    		if (this.p_enableLabelUnlabeled)
    	    		{
    	    			pKey = this.genereteLabelId(this.p_labelUnlabeledName);
    	    			parentContainer = this.searchObject(treeSource, {key : pKey}).children;
    	    		}
    	    		this.appendBkmkToBkmkList(parentContainer, bkmk, pKey)
    	    	}
    	    	// console.log (bkmk.title + " %%%% " + pKey);
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
    		// удаляем метку labelUnlabeledName из массива меток
    		if (this.p_enableLabelUnlabeled)
    		{
    			this._M.m_labelsArr = this.m_labelsArr.filter(function(val, i, ar){ return val != self.p_labelUnlabeledName});
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
						"path"			: "fessGBE.resentLabel"
					};
					for (let i = 0; i < this.m_recent10bkmrk.length; i++)
					{
						this.appendBkmkToBkmkList(resentLabel.children, this.m_recent10bkmrk[i], pKey);
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
						"path"			: "fessGBE.VisitedLabel"
					};
					let visitsCount = (visitsArray.length < 10 ? visitsArray.length : 10);
					for (let i = 0; i < visitsCount; i++)
					{
						// _consoleLog (JSON.stringify(visitsArray[i]));
						let bkmk = this.m_bookmarkList.filter( val => {return val.id ==  visitsArray[i].bkmsrkId})[0];
						this.appendBkmkToBkmkList(visitsLabel.children, bkmk, pKey);
					}
					treeSource.unshift(visitsLabel); 



    		}
    		visitsArray = [];

    		if (!this.p_showHiddenLabels)
    		{
    			let hiddenLabel = this.searchObject(treeSource, {key : this.genereteLabelId(this.p_hiddenLabelsTitle)});
    			if (hiddenLabel instanceof Object)
    			{
    				hiddenLabel.hidden = "true";
    			}


    		}


    	  // console.log(JSON.stringify(visitsArray));
				// получаем массив меток
				// console.log (JSON.stringify(treeSource));
				// console.log (JSON.stringify(this.m_bookmarkList));
				this.m_treeSource = treeSource;
				resolve({"type" : "refresh", "text" : treeSource});
				browser.runtime.sendMessage({"type" : "refresh", "text" : treeSource});
				treeSource = [];
    	  
    	});





		// }		
		// catch (e)
		// {
		// 	console.log ("GBE2:doProcessBookmarks", " " + e + '(line = ' + e.lineNumber + ", col = " + e.columnNumber + ", file = " +  e.fileName);
		// 	// this._M.refreshInProgress = false;	
		// 	reject(new Error("Network Error 1"));		
		// 	// return false;
		// }
		});
	},


	// doRequestBookmarks : function ()
	// {
	// 	if (this.m_request != null) 
	// 	{
	// 	    this.m_request.abort();
	// 	}
	// 	var self = this;
	// 	return this.m_request = $.ajax({
	// 		url: this.m_baseUrl + "lookup",
	// 		type: 'GET',
	// 		// dataType: 'xml',
	// 		data: {
	// 			output : (self.p_enableNotes ? "rss" : "xml"),
	// 			num : 10000
	// 		},
	// 		timeout : self.p_timeout
	// 	})
	// 	.done(function(response, status, xhr) {
	// 		var ct = xhr.getResponseHeader("content-type") || "";
	//     if (ct.indexOf('xml') > -1) {
	// 			_consoleLog("GBE2:doRequestBookmarks - OK!");
	// 			// return self.doProcessBookmarks(response);
	// 			return response;
	// 		}
	// 		else
	//     {
	//     	throw new Error("doRequestBookmarkURL. Answer is not XML.");
	//     }
	// 	})
	// 	.fail(function (jqXHR, textStatus)
	// 	{
	// 		console.log( "GBE2:doRequestBookmarks - Request failed: " + textStatus);
	// 	});
	// },

	doRequestBookmarks : function ()
	{
		// var self = this;
		return this.m_request = $.ajax({
			url: this.m_baseUrl + "lookup",
			type: 'GET',
			data: {
				output : (this.p_enableNotes ? "rss" : "xml"),
				num : 10000
			},
			timeout : this.p_timeout
		})
		.then(
			(response, status, xhr) =>	{
				var ct = xhr.getResponseHeader("content-type") || "";
		    if (ct.indexOf('xml') > -1) {
					_consoleLog("GBE2:doRequestBookmarks - OK!");
					// return self.doProcessBookmarks(response);
					return response;
				}
				else
		    {
		    	throw new Error("doRequestBookmarks. Answer is not XML.");
		    }
			},
			function (jqXHR, textStatus)
			{
				console.log (jqXHR);
				console.log( "GBE2:doRequestBookmarks - Request failed: " + textStatus);
			}
		);
	},

	doRequestSignature : function ()
	{
		// var self = this;
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
			// function (response, status, xhr)
			(response, status, xhr) =>	{
				_consoleLog("GBE2:doRequestSignature - OK!");
				var ct = xhr.getResponseHeader("content-type") || "";
		    if (ct.indexOf('xml') > -1) {
					this.m_signature = $(response).find('smh\\:signature').text();
					return this.m_signature;
				}
				else
		    {
		    	throw new Error("doRequestSignature. Answer is not XML.");
		    }
			},
			function (jqXHR, textStatus)
			{
				console.log (jqXHR);
				console.log( "GBE2:doRequestSignature - Request failed: " + textStatus);
			});
	},


	doRequestBookmarkURL : function (bkmk, index=0)
	// doRequestBookmarkURL : function (id, name, index)
	{
		let result = bkmk;
		//let self = this;
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
				_consoleLog("GBE2:doRequestBookmarkURL - OK!");
				var ct = xhr.getResponseHeader("content-type") || "";
		    if (ct.indexOf('xml') > -1) {
					let ids = $(response).find("id");
					let urls = $(response).find("url");
					//console.log(ids);
					if (ids.length && urls.length)
					{
						for (let i = 0; i < ids.length; i++)
						{
							if (result.id == $(ids[i]).text())
							{
								result.url = $(urls[i]).text();
								result.index = index;
								// if (this.m_bookmarkList) this.m_bookmarkList[index].url = urlReturn;
			        	return result;
			        	// return {"url": urlReturn, "id": id, "index" : index};
			        }
						}
						throw new Error("Bookmark <" +  bkmk.name + "> with id=" + bkmk.id + " was not found!");
					}
		    }
		    else
		    {
		    	throw new Error("doRequestBookmarkURL. Answer is not XML.");
		    }
			},
			function (jqXHR, textStatus)
			{
				console.log (jqXHR);
				console.log("GBE2:doRequestBookmarkURL", "Obtain bookmark URL (", bkmk.name, ") - error!");
				console.log("GBE2:doRequestBookmarkURL - Request failed: " + textStatus);
			}
		);
	},


	// doRequestSignature1 : function ()
	// {
	// 	return $.ajax({
	// 	  url: this.baseUrl + "find",
	// 	  method: "GET",
	// 	  data: { 
	// 	  	zx : (new Date()).getTime(),
	// 	  	output : "rss",
	// 	  	q : "qB89f6ZAUXXsfrwPdN4t"
	// 	  },
	// 	  dataType: "XML"
	// 	});
	// },


	// jQueryGetSignature1 : function ()
	// {
	// 	this.doRequestSignature1().then(function (a) {
 //    	console.log("jQueryGetSignature1"); //This is running before console.log(0);
 //    	console.log("a" + a);
 //  	});
	// },


// 	jQueryGetSignature : function ()
// 	{
// 		// var request = $.ajax({
// 		//   url: this.baseUrl + "find",
// 		//   method: "GET",
// 		//   data: { 
// 		//   	zx : (new Date()).getTime(),
// 		//   	output : "rss",
// 		//   	q : "qB89f6ZAUXXsfrwPdN4t"
// 		//   },
// 		//   dataType: "XML"
// 		// });
		 
// 		var request = this.doRequestSignature();
	 
// 		request.done(function(responseXML) {
// 			console.log("GBE2:jQueryLoad - OK!");
// 			this.m_signature = $(responseXML).find('smh\\:signature').text();
// 			console.log(this.m_signature);
// 		});

// 		request.fail(function( jqXHR, textStatus ) {
// 		  console.log( "Request failed: " + textStatus);
// 		});
// 	},

};

_consoleLog("I am background.js");

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request.greeting == "hello")
    {
     	//GBE2.LoadBookmarkList();
     	 // GBE2.load();
     	GBE2.doRequestSignature().then(function(sig)
   		{
   			_consoleLog ("111" + sig);	
   		})
   		.catch( (error) => {
	    	_errorLog("hello 1", error);
    	    	// console.log (error.fileName + ", line " + error.lineNumber + ", column " + error.columnNumber);
    	    	// console.log ("hello 1 Error:" + error.message);
    	 });
     	GBE2.doRequestBookmarks().then(
     		function (result) {
     			return GBE2.doProcessBookmarks (result);
     		}.bind(this.GBE2))
     	.then ((result) => {
     		console.log(JSON.stringify(result));
     	})
     	.catch ( function (error) {
  	    _errorLog("hello 2", error);
  	    	// console.log (error.fileName + ", line " + error.lineNumber + ", column " + error.columnNumber);
  	    	// console.log ("hello 2 Error:" + error.message);
    	 	}
     	);
   		// GBE2.doRequestBookmarkURL({id: "2014929379963161864", name: "МІНІСТЕРСТВО ЕНЕРГЕТИКИ..."},0).then(function(url)
   		// {
   		// 	console.log ( url);	
   		// });


      // sendResponse({
      //   msg: GBE2.m_signature
      // });
    }
    if (request.greeting == "test1")
    {
    	let bkmks = [
    		{"id" : "2014929379963161864", title : "МІНІСТЕРСТВО ЕНЕРГЕТИКИ...", url: ""},
    		{"id" : "6780747876076445387", title : "Google", url: ""},
    		{"id" : "2190118772553574361", title : "Fess Google Bookmark Extension :: Versions :: Дополнения Firefox", url: "https://addons.mozilla.org/ru/firefox/addon/fess-google-bookmark-extens/versions/"}
    	];
    	// promise = $.when();
    	// $.each(bkmks, function(index, bkmk){
    	//     promise = promise.then(function(){
    	//         return GBE2.doRequestBookmarkURL(bkmk,t++);
    	//     }).then(function(result){
    	//     		// GBE2.m_bookmarkList[result.index].url = result.url;
    	//         console.log ( result.id + " " + result.url);	
    	//     });
    	// });
    	// promise.then(function(){
    	//     console.log(JSON.stringify(GBE2.m_bookmarkList));
    	//     sendResponse({
    	//       msg: "OK"
    	//     });
    	// });

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

    }
 });
/*

function gotVisits(visits) {
  console.log("Visit count: " + visits.length);
  for (visit of visits) {
    console.log(visit.visitTime);
  }
}

function listVisits(historyItems) {
  if (historyItems.length) {
    console.log("URL " + historyItems[0].url);
    var gettingVisits = browser.history.getVisits({
      url: historyItems[0].url
    });
    gettingVisits.then(gotVisits);
  }
}
*/