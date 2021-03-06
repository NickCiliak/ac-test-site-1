const { src, dest, parallel, watch, series } = require('gulp');
const del = require('del');

// Load environment variables from .env file. Access using `process.env.VARIABLE_NAME`
require('dotenv').config();

// Html related
var replace = require('gulp-replace');

// Sass related
const sourcemaps = require('gulp-sourcemaps');
const sass = require('gulp-sass');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');

// Js related
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const babel = require('gulp-babel');

// Browsersync related
const browserSync = require('browser-sync');
const server = browserSync.create();

/**
 * File source and destination locations
 */
const paths = {
    html: {
        src: 'src/*.html',
        dest: 'dist/'
    },
    css: {
        src: 'src/scss/*.scss',
        dest: 'dist/css/'
    },
    js: {
        src: 'src/js/*.js',
        dest: 'dist/js/'
    }
};

/**
 * Delete the dist folder everytime we run Gulp
 */
const clean = () => del(['dist']);

/**
 * Copy main HTML file, update css/js query strings, replace template variables
 */
function buildHtml() {
    var cbString = new Date().getTime();

    // copy robots.txt to dist
    src('src/robots.txt').pipe(dest(paths.html.dest));

    return src([paths.html.src])
        .pipe(replace(/cache_bust=/g, function () {
            return "v=" + cbString;
        }))
        .pipe(replace(/MY_ACCOUNT_ID/g, function () {
            return process.env.MY_ACCOUNT_ID
        }))
        .pipe(replace(/MY_SITE_NAME/g, function () {
            return process.env.MY_SITE_NAME
        }))
        .pipe(replace(/DEPLOY_TIMESTAMP/g, function () {
            let now = new Date();
            return now
        }))
        .pipe(dest(paths.html.dest));
}

/**
 * Build css
 */
function buildCss() {
    return src('src/scss/index.scss')
        .pipe(sourcemaps.init())
        .pipe(sass())
        .pipe(postcss([autoprefixer(), cssnano()]))
        .pipe(sourcemaps.write('.'))
        .pipe(rename('index.min.css'))
        .pipe(dest('dist/css'));
}

/**
 * Build js
 */
function buildJs() {
    return src('src/js/index.js')
        .pipe(babel({
            presets: ['@babel/preset-env']
        }))
        .pipe(dest('dist/js'))
        .pipe(uglify())

        .pipe(rename('index.min.js'))
        .pipe(dest(paths.js.dest));
}

/**
 * Live reload the page
 */
function reload(done) {
    server.reload();
    done();
}

function serve(done) {
    server.init({
        server: {
            baseDir: './dist'
        }
    });
    done();
}

const filesToWatch = [
    paths.js.src,
    paths.css.src,
    paths.html.src
];

/**
 * Run these tasks when a watched file changes
 */
const watchTask = () => watch(filesToWatch, series(clean, parallel(buildJs, buildCss, buildHtml), reload));

exports.build = parallel(buildJs, buildCss, buildHtml); // Netlify should run this to build the site
exports.default = series(clean, parallel(buildJs, buildCss, buildHtml), serve, watchTask); // Run `gulp` for dev
