$(document).ready(function()
{
	setTexts();
	restoreOptions();
	$("form").submit(saveOptions);

});


function setTexts()
{
	$(":submit").text(browser.i18n.getMessage("options_saveBtn"));
	$("label[for=nestedLabelSep]").text(browser.i18n.getMessage("options_nestedLabelSep"));
	$("label[for=enableNotes]").text(browser.i18n.getMessage("options_enableNotes"));
}

// var options1  = {};
var opt  = new Options();

function restoreOptions() 
{
  opt.read().then((r) => {
  	// console.log (JSON.stringify(r));
  	// console.log (JSON.stringify(opt));
  	$("#nestedLabelSep").val(r.nestedLabelSep);
  	$("#enableNotes").prop("checked", r.enableNotes);
  });
  // var item = browser.storage.local.get();
  // item.then((res) => {
  // 	console.log (JSON.stringify(res));
  // 	options1.nestedLabelSep = res.nestedLabelSep || '/';
  // 	$("#nestedLabelSep").val(options1.nestedLabelSep);

  // 	options1.enableNotes = res.enableNotes || false;
  // 	$("#enableNotes").prop("checked", options1.enableNotes);

  // });
}

function saveOptions(e) 
{
	e.preventDefault();
	// var checked = "checked", optSelected = "option:selected";
	// options1.enableNotes = $("#enableNotes").prop("checked");
	// options1.nestedLabelSep = ($("#nestedLabelSep").val().length == 1) ? $("#nestedLabelSep").val() : "/";
	// browser.storage.local.set(options1);
	opt.enableNotes = $("#enableNotes").prop("checked");
	opt.nestedLabelSep = ($("#nestedLabelSep").val().length == 1) ? $("#nestedLabelSep").val() : "/";
	opt.write().then();
}
