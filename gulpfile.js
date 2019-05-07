const { dest, lastRun, parallel, series, src, watch} = require('gulp');

const autoprefixer = require('gulp-autoprefixer');
const browsersync = require('browser-sync').create();
const data = require('gulp-data');
const del = require("del");
const imagemin = require('gulp-imagemin');
const imageminMozjpeg = require('imagemin-mozjpeg');
const nunjucksRender = require('gulp-nunjucks-render');
const rename = require('gulp-rename');
const replace = require('gulp-replace');
const sass = require('gulp-sass');
const webp = require('gulp-webp');
const yaml = require('gulp-yaml');

//-- Constantes
const folder = 'story-brexit';
const absoluteUrl = 'https://ina.pflry.eu/' + folder + '/';

//-- Path
const path = {
  src : 'src/',
  dev : 'dev/' + folder + '/',
  prod: 'export/' + folder + '/'
};


//-- DEV
//-------------

//-- SCSS
function css() {
  return src(path.src + 'sass/styles.scss', { since: lastRun(css) })
    .pipe(sass({
      outputStyle: 'compressed'
    }).on('error', sass.logError))
    .pipe(autoprefixer({
      browsers: ['last 2 versions']
    }))
    .pipe(rename('amp-styles.njk'))
    .pipe(dest(path.src + 'templates/partials/'));
}
exports.css = css;

//-- YAML
function yml_content() {
  return src(path.src + 'content.yml', { since: lastRun(yml_content) })
    .pipe(yaml({ space: 2 }))
    .pipe(dest(path.src + 'json/'));
}

function yml_bookend() {
  return src(path.src + 'bookend.yml', { since: lastRun(yml_bookend) })
    .pipe(yaml({ space: 2 }))
    .pipe(dest(path.dev));
}

const yml = parallel(
  yml_content,
  yml_bookend  
);
exports.yml = yml;

//-- Nunjucks
function njk() {
  return src(path.src + 'templates/pages/*.njk', { since: lastRun(njk) })
    .pipe(data(function () {
      return require('./' + path.src + 'json/content.json')
    }))
    .pipe(nunjucksRender({
      path: [path.src + 'templates']
    }))
    .pipe(dest(path.dev));
}
exports.njk = njk;

//-- Webp
function image_webp() {
  return src(path.src + 'assets/images/*.jpg', { since: lastRun(image_webp) })
    .pipe(webp({
      quality: 60,
      preset: 'photo',
      method: 6
    }))
    .pipe(dest(path.dev + 'assets/images/'))
}

//-- Jpeg
function image_jpg() {
  return src(path.src + 'assets/images/*.jpg', { since: lastRun(image_jpg) })  
    .pipe(imagemin([imageminMozjpeg({
      quality: 60
    })]))
    .pipe(dest(path.dev + 'assets/images/'));
}

function poster_jpg() {
  return src(path.src + 'assets/poster/*.jpg', { since: lastRun(poster_jpg) })
    .pipe(imagemin([imageminMozjpeg({
      quality: 60
    })]))
    .pipe(dest(path.dev + 'assets/poster/'))
}

//-- Copy
function file_copy() {
  return src(['favicon.ico'], { since: lastRun(file_copy) })
    .pipe(dest(path.dev))
}

function icon_copy() {
  return src(path.src + 'assets/icons/*.*', { since: lastRun(icon_copy) })
    .pipe(dest(path.dev + 'assets/icons/'))
}

function video_copy() {
  return src(path.src + 'assets/videos/**/*.*', { since: lastRun(video_copy) })
    .pipe(dest(path.dev + 'assets/videos/'))
}

function logo_copy() {
  return src(path.src + 'assets/logo/*.*', { since: lastRun(logo_copy) })
    .pipe(dest(path.dev + 'assets/logo/'))
}

//-- BrowserSync
function reload(done) {
  browsersync.reload();
  done();
}

function serve(done) {
  browsersync.init({
    server: {
      baseDir: path.dev
    }
  });
  watch(path.src + '*.yml', series(yml, njk));
  watch(path.src + 'sass/**/*.scss', series(css, njk));
  watch(path.src + 'templates/**/*.njk', series(njk));
  done();
}


//-- PROD
//-------------

//-- URLs
function  prod_url() {
  return src(path.dev + '/index.html', { since: lastRun(prod_url) })
    .pipe(replace(/assets/g, '' + absoluteUrl + 'assets'))
    .pipe(replace('src="bookend.json"', 'src="' + absoluteUrl + 'bookend.json"'))
    .pipe(dest(path.prod));
}

//-- Copy
function prod_asset() {
  return src(path.dev + 'assets/**/*.*', { since: lastRun(prod_asset) })
    .pipe(dest(path.prod + '/assets/'))
}

function prod_file() {
  return src([
    path.dev + 'bookend.json',
    path.dev + 'favicon.ico'
  ], { since: lastRun(prod_file) })
  .pipe(dest(path.prod))
}

/**
 * DEV TASKS
 */

//-- Copy task
const copy = parallel(
  file_copy,
  icon_copy,
  video_copy,
  logo_copy,
  series(
    image_jpg,
    image_webp,
    poster_jpg
  )
);
exports.copy = copy;

//-- Compile, generate and copy task
exports.dev = series(
  css,
  yml,
  njk,
  copy,
  reload
);

//-- Compile and generate task
exports.devlight = series(
  css,
  yml,
  njk,
  reload
);

//-- Default
exports.default = serve;

/**
 * PROD TASKS
 */
exports.prod = series(
  prod_url,
  prod_asset,
  prod_file
);

/**
 * CLEAN TASKS
 */

//-- Dev
function clean_dev() {
  return del([path.dev]);
}
exports.clean_dev = clean_dev;

//-- Prod
function clean_prod() {
  return del([path.prod]);
}
exports.clean_prod = clean_prod;

//-- All
exports.clean = parallel(
  clean_dev,
  clean_prod
);

