var yeoman = require('yeoman-generator');
var mkdirp = require('mkdirp');
var path = require('path');
var colors = require('colors');
var yosay = require('yosay');

module.exports = yeoman.Base.extend({
  constructor: function () {
    yeoman.Base.apply(this, arguments);

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

  },
  configuring   : {
    method4: function(){console.log('configuring  '); this.method1()}
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