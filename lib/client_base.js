/**
 * 将转换后的js运行在浏览器端时需要的基础方法
 * require jquery or zepto
 * Created by zhengzk on 2015/11/19.
 */
var base = {
    /**
     * 根据path创建路径
     * @param path string
     * @returns {Object}
     */
    routes: function (path,flag) {
        var arr = path.split('.');
        var length = arr.length;
        if(flag==true) length--;
        if (length <= 0) return;

        var i = 1;
        var ns = arr[0];
        do {
            eval('if(typeof(' + ns + ') == "undefined") ' + ns + ' = new Object();');
            ns += '.' + arr[i++];
        } while (length >= i);
        return eval(ns);
    },
    /**
     * 创建一个DOM元素并转换为jQuery对象
     * @param tagName
     * @param attrs
     */
    create: function (tagName, attrs) {
        tagName = tagName || 'div';
        var ele = document.createElement(tagName);
        var ret = jQuery(ele);
        if (attrs) {
            ret.attr(attrs);
        }
        //ret.attr(attrs);
        return ret;
    }
};
