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