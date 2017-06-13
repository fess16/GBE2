// получаем ссылку на background страницу
browser.runtime.onMessage.addListener(notify);
var getting = browser.runtime.getBackgroundPage();
var bg;
getting.then((page) => {bg = page}, (error) => {_errorLog ("Popup-getBackgroundPage", error)});

$(document).ready(function(){
		$(function(){
      // Create the tree inside the <div id="tree"> element.
      $("#GBE-bkm-tree").fancytree({
      	source: bg.GBE2.m_treeSource
      });
    });


	console.log("I am popup.js");
	$(".GBE-tb-hmenuRefresh a").click(function(event) {
		refresh();
	});
	$(".GBE-tb-hmenuAdd a").click(function(event) {
		test1();
	});



});


function notify(message)
{
	if (message.type == "refreshed")
	{
		console.log (JSON.stringify(message));

		$.ui.fancytree.getTree("#GBE-bkm-tree").reload(
          // message.text
          bg.GBE2.m_treeSource
        ).done(function(){
          console.log ("reloaded");
        });
    $("#GBE-bkm-tree").fancytree("enable");

	}
}

function refresh() {
  console.log("refresh");
  $("#GBE-bkm-tree").fancytree("disable");
  chrome.runtime.sendMessage({
      type: "refresh"
    }//,
    // function(response) {
    //   document.getElementById("div").textContent = response.msg;
    // }
    );
}

function test1() {
  console.log("test1");
  chrome.runtime.sendMessage({
      type: "test1"
    },
    function(response) {
    	if (response) document.getElementById("div").textContent = response.msg;
    });
}



var tSourse = [
	{"title": "Node 1", "key": "Node 1", "folder": true, "children" : []}, 
	{"title": "Folder 2", "key":"Folder 2", "folder": true, "children": [ 
		{"title": "Node 2.1", "key": "Node 2.1"},
		{"title": "Node 2.2", "key": "Node 2.2_1", refKey: "Node 2.2"} ]
	},
	{"title": "Folder 3", "key":"Folder 3", "folder": true, "children": [ 
		{"title": "Node 3.1", "key": "Node 3.1"},
		{"title": "Node 2.2", "key": "Node 2.2_2", refKey: "Node 2.2"} ]
	}
]

  
// 
/*var q = [
{"title":"test","key":2087933171,"folder":true,"children":[],"path":"test"},
{"title":"test21","key":3779995472,"folder":true,"children":[],"path":"test21"},
{"title":"Work","key":2088063268,"folder":true,"children":[],"path":"Work"},
{"title":"Графика","key":3874890736,"folder":true,"children":[
        {"title":"все о inkscape","key":1666563759,"folder":true,"children":[],"path":"Графика/все о inkscape"}
    ] ,"path":"Графика"}
];
*/

