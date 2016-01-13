/**
 * Created by zhengzk on 2015/11/18.
 */
'use strict';
var html2script = require('../src/html2script'),
    through2 = require('through2'),

    utils = require('../src/utils'),
    pkg = require("../package.json");

/**
 * 添加版本信息等
 **/
function addNote(data,options) {
    options = options || {};
    //var timeStr = getCurrentTime();
    var timeStr = ( new Date() ).toISOString().replace( /:\d+\.\d+Z$/, "Z" );
    var name = options.name || pkg.name;
    var version = options.version || pkg.version;

    return '/*!' + name + ' <' + version + '@' + timeStr + '> */\n'
        +'(function(jQuery,undefined){\n'
        + data
        +'}(jQuery));';
}

/**
 * 转换stream
 * @param modifier
 * @returns {*}
 */
function modify(modifier) {
    return through2.obj(function (file, encoding, cb) {
        var content = modifier(String(file.contents),file);
        file.contents = new Buffer(content);
        //this.push(file);
        cb(null, file);
        return content;
    });
}


//编译html模板
exports.compile = function(options){
    return modify(function(data,file){
        return html2script.compile(data,utils.merge({
            file:{
                relative:file.relative,
                base:file.base
            }
        },options));
    });
};

exports.addNote = function(options){
    return modify(function(data,file){
        return addNote(data,options);
    });
};