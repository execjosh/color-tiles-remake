var gulp = require('gulp')

var coffee = require('gulp-coffee')
var replace = require('gulp-replace')
var concat = require('gulp-concat')
var uglify = require('gulp-uglify')
var minifyHtml = require('gulp-minify-html')
var sass = require('gulp-sass')
var minifyCss = require('gulp-minify-css')
var header = require('gulp-header')

var paths = {
  scripts: 'src/js/**/*.coffee'
, styles: 'src/scss/**/*.scss'
, html: 'src/html/**/*.html'
}

var pkg = require('./package.json')

var banner = ['/*!',
' * <%= pkg.name %> - <%= pkg.description %>',
' * @version v<%= pkg.version %>',
' * @date <%= (new Date()).toUTCString() %>',
' * @link <%= pkg.homepage %>',
' * @license <%= pkg.license %>',
' */',
''].join('\n')

gulp.task('scripts', function() {
  return gulp.src(paths.scripts)
    .pipe(coffee())
    .pipe(replace(/{{VERSION}}/g, pkg.version))
    .pipe(concat('color-tiles.js'))
    .pipe(header(banner, {pkg: pkg}))
    .pipe(gulp.dest('build/js'))
    .pipe(uglify({preserveComments:'some'}))
    .pipe(concat('color-tiles.min.js'))
    .pipe(gulp.dest('build/js'))
})

gulp.task('styles', function() {
  return gulp.src(paths.styles)
    .pipe(sass())
    .pipe(minifyCss())
    .pipe(concat('main.css'))
    .pipe(gulp.dest('build/css'))
})

gulp.task('html', function() {
  return gulp.src(paths.html)
    .pipe(minifyHtml())
    .pipe(gulp.dest('build'))
})

gulp.task('watch', function() {
  gulp.watch(paths.scripts, ['scripts'])
  gulp.watch(paths.styles, ['styles'])
  gulp.watch(paths.html, ['html'])
})

gulp.task('dev', ['default', 'watch'])
gulp.task('default', ['scripts', 'styles', 'html'])
