//-- Dependencies
const gulp = require('gulp'),
    sass = require('gulp-sass'),
    clean = require('gulp-clean'),
    autoprefixer = require('gulp-autoprefixer'),
    rename = require('gulp-rename'),
    changed = require('gulp-changed'),
    htmlReplace = require('gulp-html-replace'),
    imagemin = require('gulp-imagemin'),
    imageminMozjpeg = require('imagemin-mozjpeg'),
    webp = require('gulp-webp'),
    sequence = require('gulp-sequence'),
    mustache = require("gulp-mustache"),
    replace = require('gulp-replace'),
    shell = require('gulp-shell'),
    connect = require('gulp-connect-php'),
    fs = require('fs'),
    browserSync = require('browser-sync').create();


//-- Constantes
const flag = 'story-cuba';
const storyTitle = 'La Révolution cubaine';
const absoluteURL = 'https://ina.pflry.eu/' + flag + '/';

//-- Path
const path = {
    medias : './medias-src/',
    src :   './src/',
    dev :   './build/' + flag + '/',
    prod : './export/' + flag + '/',
    icons : 'assets/icons/',
    images : 'assets/images/',
    videos : 'assets/videos/',
    audios : 'assets/audios/',
    jsons : './src/json/',
    partials : './src/partials/',
    templates : './src/templates/',
    scss : './src/sass/'
};



//-- MEDIAS
//-------------
// la tâche image doit toujours être passée en premier

//-- Images

// optimize jpg
gulp.task('images:jpg', () => {
    gulp.src(path.medias + 'images/*.jpg')
        .pipe(changed(path.medias + 'images/' + path.src + path.images))
        .pipe(imagemin([imageminMozjpeg({
            quality: 60
        })]))
        .pipe(gulp.dest(path.src + path.images));
});


//-- Audios

// normalize + convert to mp3/ogg + create file subtitles.vtt
gulp.task('audios', shell.task(['FOR %A IN ("medias-src/audios/*.wav") DO bash create-audios.sh medias-src/audios/%A src/assets/audios/%~NA']));

// copy posters
gulp.task('posters:copy', shell.task(['FOR %A IN ("medias-src/audios/*.wav") DO COPY /B /Y %CD%\\src\\assets\\images\\%~NA.jpg %CD%\\src\\assets\\audios\\%~NA\\poster.jpg']));

// audio together
gulp.task('audios:convert', sequence('audios', 'posters:copy'));


//-- Videos

// normalize + convert to mp4/webm
// + create poster + create file subtitles.vtt
gulp.task('videos:convert', shell.task(['FOR %A IN ("medias-src/videos/*.avi") DO bash create-videos.sh medias-src/videos/%A src/assets/videos/%~NA']));



//-- DEV
//-------------

//-- Create mustache partials from jsons task
gulp.task('partials:clean', () => {
    return gulp.src(path.partials, {
            read: false
        })
        .pipe(clean());
});

function createPartials(dir) {
    fs.readdir(dir, (err, files) => {
        if (err) {
            return console.error(err);
        }
        files.forEach(function (file) {
            file = file.split('.').slice(0, -1).join('.');
            gulp.src(path.templates + '*.mustache')
                .pipe(mustache(path.jsons + file + '.json', {}, {}))
                .pipe(rename(file + '.mustache'))
                .pipe(gulp.dest(path.partials));
        });
    });
};

gulp.task('partials', () => {
    createPartials(path.jsons);
});

//-- Generate index.html in build task
// Add css
// Add calls to partials
let buffer = new Buffer('');

function generateIndex(dir) {
    fs.readdir(dir, function (err, files) {
        if (err) {
            return console.error(err);
        }
        files.forEach(function (file) {
            file = file.split('.').slice(0, -1).join('.');
            buffer += '{{> ../../partials/' + file + ' }}\n\n\t\t\t'
        });
        // return console.log(buffer);
        gulp.src(path.templates + 'page/tpl-index.mustache')
            .pipe(htmlReplace({
                cssInline: {
                    src: gulp.src(path.scss + 'styles.scss')
                        .pipe(sass({
                            outputStyle: 'compressed'
                        }).on('error', sass.logError))
                        .pipe(autoprefixer({
                            browsers: ['last 2 versions']
                        })),
                    tpl: '<style amp-custom>%s</style>'
                },
                blocks: {
                    src: buffer,
                    tpl: '%s'
                }
            }))
            .pipe(mustache({
                title: storyTitle,
                publisher: "Institut national de l&#39;audiovisuel"
            }))
            .pipe(rename('index.html'))
            .pipe(gulp.dest(path.dev));
    });
};

gulp.task('index', () => {
    generateIndex(path.partials);
});

//-- copy function
function kopy(valsrc, valdest) {
    gulp.src(valsrc)
        .pipe(changed(valdest))
        .pipe(gulp.dest(valdest))
};

//-- bookend:copy task
gulp.task('bookend:copy', () => {
    kopy(path.src + 'bookend.json', path.dev);
});

//-- favicon:copy task
gulp.task('favicon:copy', () => {
    kopy('favicon.ico', path.dev);
});

//-- icons:copy task
gulp.task('icons:copy', () => {
    kopy(path.src + path.icons + '*.*', path.dev + path.icons);
});

//-- videos:copy task
gulp.task('videos:copy', () => {
    kopy(path.src + path.videos + '/**/*.*', path.dev + path.videos);
});

//-- audios:copy task
gulp.task('audios:copy', () => {
    kopy(path.src + path.audios + '/**/*.*', path.dev + path.audios);
});

//-- images:copy

// contert jpg to webp + copy
gulp.task('webp:copy', () => {
    gulp.src(path.src + path.images + '*.jpg')
        .pipe(webp({
            quality: 60,
            preset: 'photo',
            method: 6
        }))
        .pipe(gulp.dest(path.dev + path.images));
})

gulp.task('jpg:copy', () => {
    kopy(path.src + path.images + '*.jpg', path.dev + path.images);
});

// together images
gulp.task('images:copy', sequence('jpg:copy', 'webp:copy'));


//-- Clean task dev (delete build folder)
gulp.task('dev:clean', function () {
    return gulp.src('./build/', {
            read: false
        })
        .pipe(clean());
});

//-- ConnectPHP + BrowserSync task
gulp.task('serve', () => {
    connect.server({}, function () {
        browserSync.init({
            proxy: 'http://127.0.0.1:8000/build/' + flag + '/' + 'index.html'
        });
    });

    gulp.watch(path.dev + 'index.html').on('change', browserSync.reload);
});

gulp.task('serve:static', () => {
    browserSync.init({
        server: {
            baseDir: path.dev
        }
    });

    gulp.watch(path.dev + 'index.html').on('change', browserSync.reload);
});


//-- PRODUCTION
//-------------

//-- URL remplace relative par absolute URL's
gulp.task('urls', function () {
    gulp.src([path.dev + 'index.html'])
        .pipe(replace(/assets/g, '' + absoluteURL + 'assets'))
        .pipe(replace('src="bookend.json"', 'src="' + absoluteURL + 'bookend.json"'))
        .pipe(gulp.dest(path.prod));
});

//-- Copy assets prod
gulp.task('prod:copy', () => {
    kopy(path.dev + 'bookend.json', path.prod);
    kopy(path.dev + 'favicon.ico', path.prod);
    kopy(path.dev + 'sw.js', path.prod);
    kopy(path.dev + 'assets/**/*.*', path.prod + 'assets/');
});

//-- Clean folder (delete export folder)
gulp.task('prod:clean', function () {
    return gulp.src('./export/', {
        read: false
    })
        .pipe(clean());
});



/**
 * CLEAN TASK
 */
gulp.task('clean', ['dev:clean', 'prod:clean']);

/**
 * COPY TASK
 */
gulp.task('dev:copy', ['images:copy', 'icons:copy', 'videos:copy', 'audios:copy', 'bookend:copy', 'favicon:copy']);

/**
 * DEV TASK
 */
gulp.task('dev', function (callback) {
    sequence('dev:clean', 'dev:copy', 'partials', 'index')(callback)
});

/**
 * PROD TASK
 */
gulp.task('prod', function (callback) {
    sequence('prod:clean', 'prod:copy', 'urls')(callback)
});

/**
 * LIGHT TASK
 */
gulp.task('light', function (callback) {
    sequence('partials', 'index')(callback)
});

/**
 * DEFAULT
 */
gulp.task('default', ['serve']);