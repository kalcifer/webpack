var inquirer = require('inquirer');
var path = require('path');
var fs = require('fs');
var stringify = require("json-stable-stringify");
var webpackOptionsSchema = require("../schemas/webpackOptionsSchema.json");
var validateSchema = require("../lib/validateSchema");
var WebpackOptionsValidationError = require("../lib/WebpackOptionsValidationError");
var npmUtil = require('./npm-util');
var questions = require('../schemas/cliPromptQuestions.js');

var init = function() {
	var answerHash = [];
	return {
		start: function(){
			inquirer.prompt(questions).then(function(answers){
				// console.log('******* ANSWERS ********');
				// console.log(answers);
				// console.log('******* ANSWERS ********');
				var details = createConfig(answers);
				writeConfig(details.config, details.toImport, details.toCode);
				installModules(details.toInstall)
			})
			return true;
		}
	}
};

module.exports = init();

function getKey(config, key, initial) {
	if(!config[key]) {
		var val = {};
		if(key === 'module'){
			val = {loaders:[]};
		} else if(key === 'plugins'){
			val = [];
		} else {
			val = {};
		}
		config[key] = val;
	}
}

function createConfig(answers) {
	var config = {},
		toInstall = [],
        toCode = [],
		toImport = [];
	Object.keys(answers).forEach(function(answerKey){
		var answer = answers[answerKey];
		switch (answerKey) {
			case 'entry':
				config.entry = answer;
				break;
			case 'outputpath':
				config.output = {
					filename: answers.outputpath
				}
				break;
			case 'es6':
                if(answer){
                    getKey(config, 'module');
                    config.module.loaders.push({
                        test: "/\.js$/",
                        exclude: "/node_modules/",
                        loader: "babel-loader"
                    })
                    toInstall.push('babel-loader');
                    toInstall.push('babel-core');
                }
				break;
			case 'css':
                if(answer) {
                    getKey(config, 'module');
                    getKey(config, 'plugins');
                    var loaderConfig = {
                        test: "/\.css$/",
                        exclude: "/node_modules/"
                    }
                    if(!answers.extractCss) {
                        loaderConfig.loaders = ["style-loader", "css-loader"];
                        toInstall.push("style-loader");
                    } else {
                        var codeValue = "Extract.extract('isomorphic-style', 'css-loader')"
                        loaderConfig.loaders = codeValue;
                        toCode.push(codeValue);
                        toImport.push("var Extract = require('extract-text-webpack-plugin');");
                    }
                    config.module.loaders.push(loaderConfig);
                    toInstall.push('css-loader');
                }
                break;
			default:
				break;
		}
		
	})
	return {
		toInstall: toInstall,
		toImport: toImport,
        toCode: toCode,
		config: config
	}
}
function writeConfig(config, toImport, toCode){
	var configjson = stringify(config, {space:2});
	var webpackconfig = toImport.join('\n') + '\n' + 'module.exports = ' + configjson;
    toCode.forEach(function(code){
        // console.log(code);
        // console.log(webpackconfig.indexOf('"' + code + '"'))
        webpackconfig = webpackconfig.replace('"' + code + '"', code) ;
        
    })
	var webpackOptionsValidationErrors = validateSchema(webpackOptionsSchema, config);
	if(webpackOptionsValidationErrors.length) {
		throw new WebpackOptionsValidationError(webpackOptionsValidationErrors);
	} 
	if(!npmUtil.checkPackageJson()){
		throw new Error('Please run webpack init in the same directory as your package.json')
	}
	console.log(webpackconfig);
    console.log(process.cwd() + 'webpack.config.js')
	fs.writeFileSync(process.cwd() + '/webpack.config.js', webpackconfig, 'utf8');
    console.log('webpack.config.js CREATED');
}

function installModules(toInstall) {
	toInstall.forEach(function(moduleName) {
		if(!npmUtil.checkDeps([moduleName])[moduleName] && !npmUtil.checkDevDeps([moduleName])[moduleName]){
			console.log('Installing ' + moduleName)
			npmUtil.installSyncSaveDev(moduleName);
		}
	})
}

