var gulp = require("gulp");
var prettify = require('gulp-jsbeautifier');

gulp.task('format-js', function() {
    // Format js in the js folder
    gulp.src('./js/*/*.js')
        .pipe(prettify({
            config: '',
            mode: 'VERIFY_AND_WRITE'
        }))
        .pipe(gulp.dest('./js'));

    // format js and json in root directory (including this script!)
    gulp.src('./*.js*')
        .pipe(prettify({
            config: '',
            mode: 'VERIFY_AND_WRITE'
        }))
        .pipe(gulp.dest('.'))
});

gulp.task('prettify-html', function() {
    gulp.src('./pages/*.html')
        .pipe(prettify({
            indentSize: 2
        }))
        .pipe(gulp.dest('./pages'));
});

gulp.task('prettify-css', function() {
    gulp.src('./style/*.css')
        .pipe(prettify({
            indentSize: 2
        }))
        .pipe(gulp.dest('./style'));
});

gulp.task("default", ["format-js", "prettify-html", "prettify-css"]);
