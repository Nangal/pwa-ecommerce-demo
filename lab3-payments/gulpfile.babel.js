/**
 *
 *  Web Starter Kit
 *  Copyright 2015 Google Inc. All rights reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License
 *
 */

// jshint esversion: 6
// jshint strict: global

'use strict';

// This gulpfile makes use of new JavaScript features.
// Babel handles this without us having to do anything. It just works.
// You can read more about the new JavaScript features here:
// https://babeljs.io/docs/learn-es2015/

import path from 'path';
import gulp from 'gulp';
import del from 'del';
import {Server} from 'karma';
import runSequence from 'run-sequence';
import browserify from 'browserify';
import babelify from 'babelify';
import source from 'vinyl-source-stream';
import browserSync from 'browser-sync';

// TODO PRC-4.1 - import the sw-precache plugin

import gulpLoadPlugins from 'gulp-load-plugins';
import pkg from './package.json';

const $ = gulpLoadPlugins();
const bs = browserSync.create();
const babelOptions = {
	presets: ['es2015']
};

// Optimize images
gulp.task('images', () => {
  gulp.src('app/images/**/*')
    .pipe($.imagemin({ // DEBUG removed $.cache( before imagemin
      progressive: true,
      interlaced: true
    }))
    .pipe(gulp.dest('dist/images'))
    .pipe($.size({title: 'images'}));

		gulp.src('../third_party/images/**/*')
			.pipe($.imagemin({ // DEBUG removed $.cache( before imagemin
				progressive: true,
				interlaced: true
			}))
			.pipe(gulp.dest('dist/images'))
			.pipe($.size({title: 'product images'}))
}

);

// Copy all files at the root level (app)
gulp.task('copy', () =>
  gulp.src([
    'app/*',
    '!app/*.html',
    'node_modules/apache-server-configs/dist/.htaccess'
  ], {
    dot: true
  }).pipe(gulp.dest('dist'))
    .pipe($.size({title: 'copy'}))
);

// Compile and automatically prefix stylesheets
gulp.task('styles', () => {
  const AUTOPREFIXER_BROWSERS = [
    'ie >= 10',
    'ie_mob >= 10',
    'ff >= 30',
    'chrome >= 34',
    'safari >= 7',
    'opera >= 23',
    'ios >= 7',
    'android >= 4.4',
    'bb >= 10'
  ];

  // For best performance, don't add Sass partials to `gulp.src`
  return gulp.src([
    'app/styles/**/*.scss',
    'app/styles/**/*.css'
  ])
    .pipe($.newer('.tmp/styles'))
    .pipe($.sourcemaps.init())
    .pipe($.sass({
      precision: 10
    }).on('error', $.sass.logError))
    .pipe($.autoprefixer(AUTOPREFIXER_BROWSERS))
    .pipe(gulp.dest('.tmp/styles'))
    // Concatenate and minify styles
    .pipe($.if('*.css', $.cssnano()))
    .pipe($.size({title: 'styles'}))
    .pipe($.sourcemaps.write('./'))
    .pipe(gulp.dest('dist/styles'));
});

gulp.task('scripts', () => {
  return browserify([
    './app/scripts/main.js'
  ], { debug: true, paths: ['app/scripts/modules/'] })
    .transform(babelify, { presets: ['es2015']  })
    .bundle()
    .pipe(source('main.min.js'))
    .on('error', err => { console.log('ERROR:', err.message); })
    .pipe(gulp.dest('dist/scripts/'));
});

// Scan your HTML for assets & optimize them
gulp.task('html', () => {
  return gulp.src('app/**/*.html')
    .pipe($.useref({
      searchPath: '{.tmp,app}',
      noAssets: true
    }))

    // Output files
    .pipe($.if('*.html', $.size({title: 'html', showFiles: true})))
    .pipe(gulp.dest('dist'));
});

// Clean output directory
gulp.task('clean', () => del(['.tmp', 'dist/*', '!dist/.git'], {dot: true}));

// Run unit tests
gulp.task('test', (done) => {
  new Server({
    configFile: __dirname + '/test-all.conf.js',
    singleRun: true
  }, done).start();
});

// Build and serve the output from the dist build
gulp.task('serve', ['default'], () =>
  bs.init({
    notify: false,
    logPrefix: 'WSK',
    // Allow scroll syncing across breakpoints
    scrollElementMapping: ['main', '.mdl-layout'],
    // Run as an https by uncommenting 'https: true'
    // Note: this uses an unsigned certificate which on first access
    //       will present a certificate warning in the browser.
    // https: true,
    server: 'dist',
    port: 3001,
		// Implement a simple server running at /checkout.
		// This logs the form data and returns a dummy payment response.
  })
);

// Build production files, the default task
gulp.task('default', ['clean'], cb =>
  runSequence(
    'styles',
    ['html', 'scripts', 'images', 'copy'],
    // ['lint', 'html', 'scripts', 'images', 'copy'],

		// TODO PRC-4.3 - add the generate-service-worker task to the runSequence

    cb
  )
);

// TODO PRC-3 - Copy over the sw-toolbox scripts to the dist directory

// See http://www.html5rocks.com/en/tutorials/service-worker/introduction/ for
// an in-depth explanation of what service workers are and why you should care.
// Generate a service worker file that will provide offline functionality for
// local resources. This should only be done for the 'dist' directory, to allow
// live reload to work as expected when serving from the 'app' directory.

// TODO PRC-4.2 - write the sw-precache gulp task

// Load custom tasks from the `tasks` directory
// Run: `npm install --save-dev require-dir` from the command-line
// try { require('require-dir')('tasks'); } catch (err) { console.error(err); }
