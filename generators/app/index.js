var yeoman = require('yeoman-generator');
var mkdirp = require('mkdirp');
var path = require('path');
var colors = require('colors');
var yosay = require('yosay');

module.exports = yeoman.Base.extend({
  constructor: function () {
    yeoman.Base.apply(this, arguments);
    //this.argument('appname', {type:String, required:true});
    //this.log(this.appname);

    this.option('wtf');
    this.log(this.options.wtf);

  },
    method1: function () {
    console.log('method 1 just ran');
  },
  method2: function () {
    console.log('method 2 just ran');
  },
  method3: function(){
    console.log('running this.config.save()...');
    this.config.save();
  },
  _privateMethod: function(){
    console.log('private!');
  },
  initializing   : {
    method4: function(){console.log('initializing  ')},
  },
  _prompting: function () {
    var questions = 
    [
      {
        type    : 'input',
        name    : 'name',
        message : 'Your project name',
        default : this.appname // Default to current folder name
      }, {
        type    : 'confirm',
        name    : 'cool',
        message : 'Would you like to enable the Cool feature?'
      },
      {
        type    : 'input',
        name    : 'username',
        message : 'What\'s your Github username',
        store   : true
      }
    ]
    return this.prompt(questions).then(function (answers) {
      this.log('app name', answers.name);
      this.log('cool feature', answers.cool);
    }.bind(this));
  },
  configuring   : {
    method4: function(){console.log('configuring  '); this.method1()},
    copyFiles: function(){
      this.copy('gulp-default.js','App/default.js');
      this.copy('gulp-full.js','App/gulp-full.js');
      this.directory('App','App');
      this.directory('.vscode','.vscode');
    },
    addGulpTasks: function(){
     //TODO:add more useful gulp tasks to the existing file
    }
  },
  default   : {
    method4: function(){console.log('default  ')},
  },
  writing   : {
    method4: function(){console.log('writing  ')},
  },
  conflicts   : {
    method4: function(){console.log('conflicts  ')},
  },
  install   : {
    method4: function(){console.log('install  ')},
  },
  end    : {
    method4: function(){console.log('end   ')},
  }
});