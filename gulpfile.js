/**
 * Created by zhengzk on 2015/11/18.
 */

'use strict';

var gulp = require('gulp'),
    rename = require('gulp-rename'),//重命名
    uglify = require('gulp-uglify'),//压缩
    concat = require('gulp-concat'), //合并
    StreamQueue = require('streamqueue'), //合并流等操作
    htmlmin = require('gulp-htmlmin');

var build = require('./tools/build');
var components = require('./components.json');

gulp.task('main', function () {
    //components.base = "test/src/templates/html/";
    var streamQueue = new StreamQueue({
        objectMode: true
    });
    //add client js lib
    streamQueue.queue(
        gulp.src('lib/**/*.js')
    );
    //parse html to script
    streamQueue.queue(
        gulp.src('demo/html/**/*.html')
            .pipe(htmlmin({collapseWhitespace: true}))
            .pipe(build.compile(components))
            .pipe(uglify({
                compress:{},
                output:{
                    beautify:true
                }
            }))
            .pipe(rename({
                extname:'.js'
            }))
            .pipe(gulp.dest('dest/_temp_/'))
    );
    //concat & dest
    return streamQueue.done()
        .pipe(concat('main.js'))
        .pipe(build.addNote({
            name:'main',
            version:"0.0.1"
        }))
        .pipe(gulp.dest('dest'))
        .pipe(uglify({
            preserveComments: 'some'
        }))
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest('dest'))
});

gulp.task('watch', function () {
    //gulp.watch('main', ['clean']);
});

gulp.task('default', ['main']);

