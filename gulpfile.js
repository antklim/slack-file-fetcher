const gulp = require('gulp')
const yarn = require('gulp-yarn')
const del = require('del')
const zip = require('gulp-zip')
const runSequence = require('run-sequence')
const {name} = require('./package')

gulp.task('clean', (cb) => {
  del('./build').then((paths) => cb(), cb)
})

gulp.task('src', () => {
  return gulp.src(['./*.js', '!./gulpfile.js', '!./*_test.js'])
    .pipe(gulp.dest('build'))
})

gulp.task('deps', () => {
  return gulp.src(['./package.json', './yarn.lock'])
    .pipe(gulp.dest('build'))
    .pipe(yarn({production: true}))
})

gulp.task('zip', () => {
  return gulp.src(['./build/**/*', './build/*.js'])
    .pipe(zip(`${name}.zip`))
    .pipe(gulp.dest('./build'))
})

gulp.task('default', (cb) => runSequence('clean', 'src', 'deps', 'zip', cb))
