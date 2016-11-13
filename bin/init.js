var inquirer = require('inquirer');
var path = require('path');
var fs = require('fs');
var stringify = require("json-stable-stringify")

var init = function() {
    var answerHash = [];
    return {
        start: function(){
            inquirer.prompt([{
                type: 'input',
                name: 'entry',
                message: 'Enter entry point file path',
                default: 'index.js',
                validate: function(answer) {
                    var exists = false;
                    try {
                        exists = fs.statSync(path.resolve(__dirname, answer)).isFile()
                    }
                    catch(err) {exists = "Please enter a valid entry point file"}
                    return exists;
                }
            }, {
                type: 'input',
                name: 'outputpath',
                message: 'Enter output file path',
                default: './dist/bundle.js',
            }]).then(function(answers){
                writeConfig(answers);
            })
            return true;
        }
    }
};

function writeConfig(answers){
    var config = {};
    if(answers.entry){
        config.entry = answers.entry;
    }
    if(answers.outputpath){
        config.output = {
            filename: answers.outputpath
        }
    }
    var webpackconfig = stringify(config, {space:2});
    console.log(webpackconfig);
    fs.writeFileSync(__dirname + 'webpack.config.js', webpackconfig, 'utf8')
}
module.exports = init();
