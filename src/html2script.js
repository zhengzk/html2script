/**
 * Created by zhengzk on 2015/11/18.
 */
'use strict';

var fs = require('fs'),
    htmlparser = require("htmlparser2"),
    //json = require('./json'),
    utils = require('./utils');

var tags = "a abbr address area article aside audio b base bdi bdo big blockquote body br button canvas caption cite code col colgroup data datalist dd del details dfn dialog div dl dt em embed fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hr html i iframe img input ins kbd keygen label legend li link main map mark menu menuitem meta meter nav noscript object ol optgroup option output p param pre progress q rp rt ruby s samp script section select small source span strong style sub summary sup table tbody td textarea tfoot th thead time title tr track u ul var video wbr circle defs ellipse g line linearGradient mask path pattern polygon polyline radialGradient rect stop svg text tspan".split(" ");


/**
 * parse html and return script string.
 *
 * @example
 *
 * ```javascript
 * var html2script = require('html2script');
 *
 * html2script.fromString('<div class="main" node-type="root" onclick="alert(\'click\');"><h1>Hello World</h1></div>', {
 *   name:'hello',
 *   factory:'createEle',
 *   callback: 'callback'
 * });
 * =>
 *
 *  var hello = function(data){
 *      var div_0 = createEle('div',{
 *          class:'main'
 *      });
 *
 *      div_0.bind('click',function(e){
 *          alert('click');
 *      });
 *
 *      var h1_0= createEle('h1',{
 *          text:'Hello World'
 *      });
 *      div_0.append(h1_0);
 *      callback({'root':[div_0]});
 *  }
 * ```
 */
function trim(text) {
    var reg = /(^\s*)|(\s*$)/g;
    return text == null ?
        '' :
        ( text + '' ).replace(reg, '');
}

function toJSON(object){
    var arr = [];
    for(var o in object){
        arr.push("\""+o+"\":\""+object[o]+"\"");
    }
    return "{"+arr.join(",")+"}";
}

var ScriptParser = function(data,options){
    if(!options.file){
        throw new Error("not file");
    }
    this.options = this.processOptions(options);
    this.output = this.getViewFunStr(data);
    //console.log('ScriptParser',this,typeof this);
};

ScriptParser.prototype = {
    getObjectName:function(file){
        //var pre = file.base.replace(process.cwd(),'');//相对路径
        //if(this.options.base){
        //    var _base = this.options.base.replace(/\//g,'\\');
        //    pre = pre.replace(_base,'');
        //}
        //pre = pre.replace('\\','').replace(/\\/g,'.');

        var nameArr = file.relative.replace(/.html/,'').split('\\');
        if(nameArr.length > 0){
            var last = '';
            var _Arr = nameArr[nameArr.length-1].split('-');
            for(var i = 0, l = _Arr.length ; i < l ; i ++){
                last += utils.upperCase(_Arr[i]);
            }
            nameArr[nameArr.length-1] = last;
            return nameArr.join('.');
            //return pre + nameArr.concat('.');
        }
        return "";

    },
    parseObjectName:function(name){
        var nameArr = name.split('_');
        if(nameArr.length > 0){
            var last = '';
            var _Arr = nameArr[nameArr.length-1].split('-');
            for(var i = 0, l = _Arr.length ; i < l ; i ++){
                last += utils.upperCase(_Arr[i]);
            }
            nameArr[nameArr.length-1] = last;
            return nameArr.join('.');
        }
        return "";
    },
    getViewFunStr:function(data){
        var base =  this.options.utils;
        var _varName = this.getObjectName(this.options.file);
        var str = base + '.routes("' + _varName + '",true);\n';

        var translate = this.options.translate;
        if(translate){
            str += _varName +' = '+translate.factory+'({\n';
            str += 'init:function(options){\n';
            str += '    this.options = options || {};\n';
            str += '    this.fragment = this._createView(options);\n';
            str += '},\n';
            str += '_createView:function(options){\n';
        }else{
            str += _varName +' = function(options){\n';
        }
        data = data || [];

        if(data.length > 0 ) {
            //str += 'this.eles = [];';
            str += 'var frag = document.createDocumentFragment();';
            str += 'frag.append = frag.appendChild;';
            str += this.getDataStr(data,'frag');
            str += "return frag;\n";
        }

        if(translate){
            str += '    }\n';
            str += '});\n';
        }else{
            str += '};\n';
        }
        return str;
    },
    getDataStr:function(data,root,varName) {
        var str = "";
        for (var i = 0, len = data.length; i < len; i++) {
            var d = data[i];
            switch (d.type) {
                case 'directive':
                    str += this.getDirectiveStr(d,root,root + "_" + i);
                    break;
                case 'tag':
                    str += this.getTagStr(d,root,root + "_" + i);
                    break;
                case 'text':
                    if(trim(d.data)){
                        str += varName ? varName : root + '.html("' + this.parseText(d.data) + '");';
                        //console.log( varName ? varName : root + '.html(\"' + this.parseText(d.data) + '\");');
                        console.log('1',str);
                    }

                    break;
            }
        }
        return str;
    },
    parseText:function(str){
        str = str.replace("\"","\\\"");
        //str = str.replace(/{{[^({{||}})]{0,}}}/g,function(text,inx){
        str = str.replace(/{{[\W\d\S\s]{0,}}}/g,function(text,inx){
            var st = text.indexOf('{{');
            var et = text.indexOf('}}');
            return '"+ '+text.substring(st + 2, et) +'+ "';
            //var str = text.substring(0, st);
            //var etr = text.substring(et + 2);
            //return ( str ? " + '" + str + "'" : "" ) + "'+"+text.substring(st + 2, et) +"+'" + (etr ? " + '" + etr + "'" : "");
        });
        console.log('2',str);
        return str;
    },
    getDirectiveStr:function(data,parent,varName){
        //{"name": "!doctype", "data": "!DOCTYPE html", "type": "directive"}
        return '';
    },
    /**
     * 将一个html tag 转换 为js
     * @param data
     * @param parent
     * @returns {string}
     */
    getTagStr:function(data,parent,varName){
    //{"type": "tag", "name": "body", "attribs": {},"children": []}
        var base =  this.options.utils;
        var str = '';
        var attribs = data.attribs;
        var attrs = {};
        var events = {};
        var endStr = "";
        for(var key in attribs){
            if(key == 'id'){
                endStr += 'this["'+attribs[key]+'"] = ' + varName + ';\n';
                continue;
            }
            if(key.indexOf('on') == 0 ){
                events[key] = attribs[key];
            }else{
                attrs[key] = (this.parseText(attribs[key]));
            }
        }
        //console.log(attrs);
        var isDOM = tags.indexOf(data.name)>=0;
        if(isDOM){
            str += 'var ' + varName + ' = ' + base + '.create("' + data.name + '",'+ toJSON(attrs) +');';
            str += this.getTagEventsStr(varName,events);
            if(data.children){
                str += this.getDataStr(data.children,varName);
            }
        }else{//组件
            var options = {
                attrs:attrs,
                events:events
            };
            str += 'var ' + varName + ' = new ' + this.parseObjectName(data.name) + "(" + toJSON(options) + ");";
            var translate = this.options.translate;
            if(translate) {

                if(parent != 'frag') {
                    str += parent + '.append(' + varName + '.fragment);';
                }else{
                    str += parent + '.appendChild(' + varName + '.fragment);';
                }
                return str + endStr;
            }
        }

        if(parent != 'frag') {
            str += parent + '.append(' + varName + ');';
        }else{
            str += parent + '.appendChild(' + varName + '[0]);';
        }
        return str + endStr;

    },
    getTagEventsStr:function(varName,events){
        var str = '';
        //fn.call(this[i], i, this[i]);
        for(var key in events){
            var _event = key.replace('on','');
            var _fun = events[key];
            if(_fun.indexOf('function') < 0){
                _fun = 'function(e){'+_fun+'}';
            }
            str += varName + '.bind("' + _event + '",' + _fun + ');';
        }
        return str;
    },
    /**
     * processOptions
     * @param options
     */
    processOptions:function (options) {
        var ret = utils.merge({},options);
        if(options.translate){
            ret.translate = utils.merge({
                "factory":"vvp.CoreObject.extend",
                "utils":"base",
                "base":"base.view"
            },options.translate);
        }
        return ret;
    }
};


exports.compile = function(str, options) {
    //var parser = new htmlparser.Parser({}, {decodeEntities: true});
    var handler = new htmlparser.DomHandler(),
        parser = new htmlparser.Parser(handler);
    parser.write(str);
    parser.done();
    var ret = new ScriptParser(handler.dom,options);
    return ret.output;
};


/**
* @param {String} path
* @param {Object=} options
* @returns {String}
*/
exports.compileFile = function(path, options) {
    return module.exports.compile(fs.readFileSync(path, 'utf8'),options);
}
