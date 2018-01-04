$(document).ready(function()
{
	restoreOptions();
	setTexts();
	$("#tabs").tabs();
	$("#save").on("click", saveOptions);

	$("#enableLabelUnlabeled").change(function(event) {
    $("#labelUnlabeledName").attr('disabled', !$(this).prop('checked'));
	});

	$("#enableLabelHiding").change(function(event) {
    $("#showHiddenLabels").attr('disabled', !$(this).prop('checked'));
    $("#hiddenLabelsTitle").attr('disabled', !$(this).prop('checked'));
	});

	$("#showFavicons").change(function(event) {
    $("#clrFavIcons").attr('disabled', !$(this).prop('checked'));
    $("#reloadFavIcons").attr('disabled', !$(this).prop('checked'));
	});

	$("#clrFavIcons").on("click", function() {
		opt.favIcons = {};
		console.log("clrFavIcons:writeFavIcons");
		opt.writeFavIcons().then();
		return false;
	});
	$("#reloadFavIcons").on("click", function() {
		chrome.runtime.sendMessage({
		    type: "reloadFavIcons"
		  }
		);
		return false;
	});
	$("#fontSize, #fontFamily").on("change", function () {
		let fontFamily = $("#fontFamily").val().trim();
		let fontSize = Math.min(Math.max(parseInt($("#fontSize").val()), 9), 17);
		$("#fontSize").val(fontSize);
		$("#fontExample").css({'font-size' : fontSize + "px", 'font-family' : fontFamily});
	});
	$("#reset").on("click", function() {
		let opt = new Options();
		console.log("saveOptions:write");
		opt.write().then();
		restoreOptions();
	})

});

// задает подписи элементов управления формы настроек
function setTexts()
{
	$("#save").text(_getMsg("options_saveBtn"));
	$("#buttons span").hide().text(_getMsg("options_msgSaved"));
	$("#fsShow legend").text(_getMsg("options_fildsetShowLegend"));
	$("#fsFavIcons legend").text(_getMsg("options_fildsetFavicons"));
	$("label[for=showFavicons]").text(_getMsg("options_showFavicons"));
	$("label[for=clrFavIcons]").text(_getMsg("options_lbl_clrFavIcons"));
	$("label[for=reloadFavIcons]").text(_getMsg("options_lbl_reloadFavIcons"));
	$("#clrFavIcons").text(_getMsg("options_btn_clrFavIcons"));
	$("#reloadFavIcons").text(_getMsg("options_btn_reloadFavIcons"));
	$("#fontExample").text(_getMsg("options_fontExample"));
	$("#reset").text(_getMsg("options_btn_reset"));
	$("#formTitle").text(_getMsg("options_formTitle"));

	$("a[href='#mainPanel']").text(_getMsg("options_mainPanel"));
	$("a[href='#advPanel']").text(_getMsg("options_advPanel"));
	$("a[href='#iconsPanel']").text(_getMsg("options_iconsPanel"));

	$("label[for=nestedLabelSep]").text(_getMsg("options_nestedLabelSep"));
	$("label[for=enableNotes]").text(_getMsg("options_enableNotes"));
	$("label[for=enableLabelUnlabeled]").text(_getMsg("options_enableLabelUnlabeled"));
	$("label[for=reverseLeftClick]").text(_getMsg("options_reverseLeftClick"));
	$("label[for=enable10recentBookmark]").text(_getMsg("options_enable10recentBookmark"));
	$("label[for=enable10visitedBookmark]").text(_getMsg("options_enable10visitedBookmark"));
	$("label[for=showTagsInTooltip]").text(_getMsg("options_showTagsInTooltip"));
	$("label[for=enableFilterByUrl]").text(_getMsg("options_enableFilterByUrl"));
	$("label[for=enableFilterByNotes]").text(_getMsg("options_enableFilterByNotes"));
	$("label[for=filterDelay]").text(_getMsg("options_filterDelay"));
	$("label[for=timeout]").text(_getMsg("options_timeout"));
	$("label[for=enablePageAction]").text(_getMsg("options_enablePageAction"));
	$("label[for=enableLableFilter]").text(_getMsg("options_enableLableFilter"));
	$("label[for=enableTreePersisitData]").text(_getMsg("options_enableTreePersisitData"));
	
	$("label[for=enableLabelHiding]").text(_getMsg("options_enableLabelHiding"));
	$("label[for=showHiddenLabels]").text(_getMsg("options_showHiddenLabels"));
	$("label[for=hiddenLabelsTitle]").text(_getMsg("options_hiddenLabelsTitle"));
	$("label[for=readLaterTitle]").text(_getMsg("options_readLaterTitle"));
	$("label[for=suggestLabel]").text(_getMsg("options_suggestLabel"));
	$("label[for=loadOnStart]").text(_getMsg("options_loadOnStart"));
	$("label[for=fontSize]").text(_getMsg("options_fontSize"));
	$("label[for=fontFamily]").text(_getMsg("options_fontFamily"));
	
	$("label[for=options_OpenContextIn_popup]").text(_getMsg("options_lblOpenContextIn_popup"));
	$("label[for=options_OpenContextIn_sidebar]").text(_getMsg("options_lblOpenContextIn_sidebar"));
	$("#options_fsOpenContextIn_legend legend").text(_getMsg("options_fsOpenContextIn_legend"));

	$("#fsFilter legend").text(_getMsg("options_fsFilter_legend"));
	$("#fsLabelHiding legend").text(_getMsg("options_fsLabelHiding_legend"));
	$("#fsBrowseActionIcons legend").text(_getMsg("options_fsBrowseActionIcons_legend"));
	$("#fsFontSettings legend").text(_getMsg("options_fsFontSettings_legend"));

	$("label[for=sortType]").text(_getMsg("options_sortType"));
	$('#sortType option[value="name"]').text(_getMsg("options_sortType_name"));
	$('#sortType option[value="timestamp"]').text(_getMsg("options_sortType_timestamp"));
	$('#sortOrder option[value="asc"]').text(_getMsg("options_sortOrder_asc"));
	$('#sortOrder option[value="desc"]').text(_getMsg("options_sortOrder_desc"));
}

var opt  = new Options();

// читает настройки и заполняет в соответствии с ними поля формы 
function restoreOptions() 
{
  opt.read().then((r) => {
  	$("#nestedLabelSep").val(r.nestedLabelSep);
  	$("#enableNotes").prop("checked", r.enableNotes);
  	$("#enableLabelUnlabeled").prop("checked", r.enableLabelUnlabeled);
  	$("#labelUnlabeledName").val(r.labelUnlabeledName).attr('disabled', !$("#enableLabelUnlabeled").prop("checked"));
  	$("#reverseLeftClick").prop("checked", r.reverseLeftClick);
  	$("#showFavicons").prop("checked", r.showFavicons);
  	$("#sortType").val(r.sortType);
  	$("#sortOrder").val(r.sortOrder);
  	$("#enable10recentBookmark").prop("checked", r.enable10recentBookmark);
  	$("#enable10visitedBookmark").prop("checked", r.enable10visitedBookmark);
  	$("#showTagsInTooltip").prop("checked", r.showTagsInTooltip);
  	$("#enableFilterByUrl").prop("checked", r.enableFilterByUrl);
  	$("#enableFilterByNotes").prop("checked", r.enableFilterByNotes);
  	$("#filterDelay").val(r.filterDelay);
  	$("#enableLabelHiding").prop("checked", r.enableLabelHiding);
  	$("#showHiddenLabels").prop("checked", r.showHiddenLabels);
  	$("#hiddenLabelsTitle").val(r.hiddenLabelsTitle);
  	$("#readLaterTitle").val(r.readLaterTitle);
  	$("#timeout").val(r.timeout);
  	$("#suggestLabel").prop("checked", r.suggestLabel);
  	$("#loadOnStart").prop("checked", r.loadOnStart);
  	$("#fontSize").val(r.fontSize);
  	$("#fontFamily").val(r.fontFamily);
  	$("#enablePageAction").prop("checked", r.enablePageAction);
  	$("#enableLableFilter").prop("checked", r.enableLableFilter);
  	$("#enableTreePersisitData").prop("checked", r.enableTreePersisitData);

  	$("#clrFavIcons").attr('disabled', !r.showFavicons);
  	$("#reloadFavIcons").attr('disabled', !r.showFavicons);

  	if (r.ThemeIcon == "light")
  		$("#iconLight").prop("checked", true);
  	else
  		$("#iconDark").prop("checked", true);

  	if (r.openContextIn == _OPEN_IN_POPUP)
  		$("#options_OpenContextIn_popup").prop("checked", true);
  	else
  		$("#options_OpenContextIn_sidebar").prop("checked", true);

  });
}

// сохранение настроек
function saveOptions(e) 
{
	e.preventDefault();
	let nestedLabelSep = $("#nestedLabelSep").val().trim();
	if (nestedLabelSep.length !== 1) {
		$("#nestedLabelSep").val(opt.nestedLabelSep);
		nestedLabelSep = opt.nestedLabelSep;
	}
	opt.nestedLabelSep = nestedLabelSep;
	opt.enableNotes = $("#enableNotes").prop("checked");
	opt.enableLabelUnlabeled = $("#enableLabelUnlabeled").prop("checked");
	let labelUnlabeledName = $("#labelUnlabeledName").val().trim();
	if (labelUnlabeledName.length == 0) {
		$("#labelUnlabeledName").val(opt.labelUnlabeledName);
		labelUnlabeledName = opt.labelUnlabeledName;
	}
	opt.labelUnlabeledName = labelUnlabeledName;
	opt.reverseLeftClick = $("#reverseLeftClick").prop("checked");
	opt.showFavicons = $("#showFavicons").prop("checked");
	opt.sortType = $("#sortType").val();
	opt.sortOrder = $("#sortOrder").val();
	opt.enable10recentBookmark = $("#enable10recentBookmark").prop("checked");
	opt.enable10visitedBookmark = $("#enable10visitedBookmark").prop("checked");
	opt.showTagsInTooltip = $("#showTagsInTooltip").prop("checked");
	opt.enableFilterByUrl = $("#enableFilterByUrl").prop("checked");
	opt.enableFilterByNotes = $("#enableFilterByNotes").prop("checked");
	let filterDelay = $("#filterDelay").val();
	if (!/^[0-9]+$/.test(filterDelay)) {
		alert("Filter delay must be a number");
		$("#filterDelay").val(opt.filterDelay).focus();
		return false;
	}
	opt.filterDelay = filterDelay;
	opt.enableLabelHiding = $("#enableLabelHiding").prop("checked");
	opt.showHiddenLabels = $("#showHiddenLabels").prop("checked");

	let hiddenLabelsTitle = $("#hiddenLabelsTitle").val().trim();
	if (hiddenLabelsTitle.length == 0) {
		$("#hiddenLabelsTitle").val(opt.hiddenLabelsTitle);
		hiddenLabelsTitle = opt.hiddenLabelsTitle;
	}
	opt.hiddenLabelsTitle = hiddenLabelsTitle;

	let readLaterTitle = $("#readLaterTitle").val().trim();
	if (readLaterTitle.length == 0) {
		$("#readLaterTitle").val(opt.readLaterTitle);
		readLaterTitle = opt.readLaterTitle;
	}
	opt.readLaterTitle = readLaterTitle;

	let timeout = $("#timeout").val();
	if (!/^[0-9]+$/.test(timeout)) {
		alert("Timeout must be a number");
		$("#timeout").val(opt.timeout).focus();
		return false;
	}
	opt.timeout = timeout;

	let fontFamily = $("#fontFamily").val().trim();
	if (fontFamily.length == 0) {
		$("#fontFamily").val(opt.fontFamily);
		fontFamily = opt.fontFamily;
	}
	opt.fontFamily = fontFamily;

	let fontSize = Math.min(Math.max(parseInt($("#fontSize").val()), 9), 17);
	if (!/^[0-9]+$/.test(fontSize)) {
		alert("Filter delay must be a number");
		//var number = Math.min(Math.max(parseInt(number), 1), 20);
		$("#fontSize").val(opt.fontSize).focus();
		return false;
	}
	opt.fontSize = fontSize;
	
	opt.enableTreePersisitData = $("#enableTreePersisitData").prop("checked");
	if (!opt.enableTreePersisitData) _clearTreePersistData();

	opt.suggestLabel = $("#suggestLabel").prop("checked");
	opt.loadOnStart = $("#loadOnStart").prop("checked");
	opt.enablePageAction = $("#enablePageAction").prop("checked");
	opt.enableLableFilter = $("#enableLableFilter").prop("checked");
	
	opt.ThemeIcon = $("#iconLight").prop("checked") ? "light" : "dark";

	opt.openContextIn = $("#options_OpenContextIn_popup").prop("checked") ? _OPEN_IN_POPUP : _OPEN_IN_SIDEBAR;

	// console.log("saveOptions:write");
	opt.write().then();
	$("#buttons span").css("display", "block");
	setTimeout(() => {$("#buttons span").hide()}, 1000);

}

// отображение процесса перезагрузки иконок
// browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
//   switch (request.type) {
//   	case "startReloadFavicons":
//       $("#reloadFavIcons").text("0/" + request.bkmkCount);
//       break;
//     case "tickReloadFavicons":
//       $("#reloadFavIcons").text(request.counter + "/" + request.bkmkCount);
//       break;
//     case "stopReloadFavicons":
//       $("#reloadFavIcons").text(_getMsg("options_btn_reloadFavIcons"));
//   }
// })