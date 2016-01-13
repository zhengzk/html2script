/**
 * Created by zhengzk on 2016/1/13.
 */
var hasOwnProp = Object.prototype.hasOwnProperty;

exports.upperCase = function(str){
    return str.replace(/(\w)/,function(v){
        return v.toUpperCase()
    });
};

exports.merge = function(first, second) {
    if (!second) {
        return first;
    }
    for (var key in second) {
        if (hasOwnProp.call(second, key)) {
            first[key] = second[key];
        }
    }
    return first;
};