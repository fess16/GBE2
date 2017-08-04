$(document).ready(function()
{
	restoreOptions();
	setTexts();
	$("#tabs").tabs();
	$("form").submit(saveOptions);

	$("#enableLabelUnlabeled").change(function(event) {
    $("#labelUnlabeledName").attr('disabled', !$(this).prop('checked'));
	});

	$("#enableLabelHiding").change(function(event) {
    $("#showHiddenLabels").attr('disabled', !$(this).prop('checked'));
    $("#hiddenLabelsTitle").attr('disabled', !$(this).prop('checked'));
	});

});


function setTexts()
{
	$(":submit").text(_getMsg("options_saveBtn"));
	$("#fsShow legend").text(_getMsg("options_fildsetShowLegend"));

	$("a[href='#mainPanel']").text(_getMsg("options_mainPanel"));
	$("a[href='#advPanel']").text(_getMsg("options_advPanel"));
	$("a[href='#iconsPanel']").text(_getMsg("options_iconsPanel"));

	$("label[for=nestedLabelSep]").text(_getMsg("options_nestedLabelSep"));
	$("label[for=enableNotes]").text(_getMsg("options_enableNotes"));
	$("label[for=enableLabelUnlabeled]").text(_getMsg("options_enableLabelUnlabeled"));
	$("label[for=reverseLeftClick]").text(_getMsg("options_reverseLeftClick"));
	$("label[for=showFavicons]").text(_getMsg("options_showFavicons"));
	$("label[for=enable10recentBookmark]").text(_getMsg("options_enable10recentBookmark"));
	$("label[for=enable10visitedBookmark]").text(_getMsg("options_enable10visitedBookmark"));
	$("label[for=showTagsInTooltip]").text(_getMsg("options_showTagsInTooltip"));
	$("label[for=enableFilterByUrl]").text(_getMsg("options_enableFilterByUrl"));
	$("label[for=enableFilterByNotes]").text(_getMsg("options_enableFilterByNotes"));
	$("label[for=filterDelay]").text(_getMsg("options_filterDelay"));
	
	$("label[for=enableLabelHiding]").text(_getMsg("options_enableLabelHiding"));
	$("label[for=showHiddenLabels]").text(_getMsg("options_showHiddenLabels"));
	$("label[for=hiddenLabelsTitle]").text(_getMsg("options_hiddenLabelsTitle"));

	$("#fsFilter legend").text(_getMsg("options_fsFilter_legend"));
	$("#fsLabelHiding legend").text(_getMsg("options_fsLabelHiding_legend"));

	$("label[for=sortType]").text(_getMsg("options_sortType"));
	$('#sortType option[value="name"]').text(_getMsg("options_sortType_name"));
	$('#sortType option[value="timestamp"]').text(_getMsg("options_sortType_timestamp"));
	$('#sortOrder option[value="asc"]').text(_getMsg("options_sortOrder_asc"));
	$('#sortOrder option[value="desc"]').text(_getMsg("options_sortOrder_desc"));
	//options_sortType
// options_sortType_name
// options_sortType_timestamp
// options_sortOrder_asc
// options_sortOrder_desc
}

var opt  = new Options();

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
  });
}

function saveOptions(e) 
{
	e.preventDefault();
	opt.nestedLabelSep = ($("#nestedLabelSep").val().length == 1) ? $("#nestedLabelSep").val() : "/";
	opt.enableNotes = $("#enableNotes").prop("checked");
	opt.enableLabelUnlabeled = $("#enableLabelUnlabeled").prop("checked");
	opt.labelUnlabeledName = ($("#labelUnlabeledName").val().length == 1) ? $("#labelUnlabeledName").val() : "Unlabeled";
	opt.reverseLeftClick = $("#reverseLeftClick").prop("checked");
	opt.showFavicons = $("#showFavicons").prop("checked");
	opt.sortType = $("#sortType").val();
	opt.sortOrder = $("#sortOrder").val();
	opt.enable10recentBookmark = $("#enable10recentBookmark").prop("checked");
	opt.enable10visitedBookmark = $("#enable10visitedBookmark").prop("checked");
	opt.showTagsInTooltip = $("#showTagsInTooltip").prop("checked");
	opt.enableFilterByUrl = $("#enableFilterByUrl").prop("checked");
	opt.enableFilterByNotes = $("#enableFilterByNotes").prop("checked");
	//TODO проверка ввода
	opt.filterDelay = $("#filterDelay").val();
	opt.enableLabelHiding = $("#enableLabelHiding").prop("checked");
	opt.showHiddenLabels = $("#showHiddenLabels").prop("checked");
	//TODO проверка ввода
	opt.hiddenLabelsTitle = $("#hiddenLabelsTitle").val();
	opt.write().then();
}

