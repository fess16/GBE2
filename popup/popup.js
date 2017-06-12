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
	// document.getElementById("btn").onclick = function(e){
	//   hello();
	// }
	$(".GBE-tb-hmenuRefresh a").click(function(event) {
		hello();
	});
	$(".GBE-tb-hmenuAdd a").click(function(event) {
		test1();
	});



});


function notify(message)
{
	if (message.type == "refresh")
	{
		console.log (JSON.stringify(message.text));

		$.ui.fancytree.getTree("#GBE-bkm-tree").reload(
          // message.text
          bg.GBE2.m_treeSource
        ).done(function(){
          console.log ("reloaded");
        });
    $("#GBE-bkm-tree").fancytree("enable");

	}
}

function hello() {
  console.log("hello");
  $("#GBE-bkm-tree").fancytree("disable");
  chrome.runtime.sendMessage({
      greeting: "hello"
    }//,
    // function(response) {
    //   document.getElementById("div").textContent = response.msg;
    // }
    );
}

function test1() {
  console.log("test1");
  chrome.runtime.sendMessage({
      greeting: "test1"
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

function searchObject(array, keyvalue){
	var found = false;
	key = Object.keys(keyvalue)[0];
  for (let i = 0, len1 = array.length; i < len1; i++)
  {
    let object = array[i];
    if (object.hasOwnProperty(key))
    {
      if (object[key] == keyvalue[key])
      {
        console.log("found prop: " + object["title"]);
        return object;
      }
      else
      {
        if (object['children'].length)
        {
          found = searchObject(object["children"], keyvalue);
          if (found)
            return found;
        }
      }
    }
  }
}

var found = searchObject(q,{"key" : 1666563759});
*/

