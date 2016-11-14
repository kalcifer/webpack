var path = require('path');
var fs = require('fs');
module.exports = [{
	"type":"input",
	"name":"entry",
	"message":"Enter entry point file path",
	"default":"index.js",
	validate: function(answer) {
		var exists = false;
		try {
			exists = fs.statSync(path.resolve(process.cwd(), answer)).isFile()
		}
		catch(err) {exists = "Please enter a valid entry point file"}
		return exists;
	}
},{
	"type":"input",
	"name":"outputpath",
	"message":"Enter output file path",
	"default":"./dist/bundle.js"
},{
	"type":"confirm",
	"name":"es6",
	"message":"Do you want to use ES2015?",
	default: function() {return true}
},{
	"type":"confirm",
	"name":"css",
	"message":"Do you want to use CSS?",
	default: function(){return false}
},{
	"type":"confirm",
	"name":"extractCss",
	"message":"Do you want to extract the css to a separate file?",
	default: function() {return true},
	when: function(answers) {return answers.css}
}]
