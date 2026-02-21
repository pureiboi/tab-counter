/* gulpfile.js
 * Originally created 3/11/2017 by DaAwesomeP
 * This is the main build/task file of the extension
 * https://github.com/DaAwesomeP/tab-counter
 *
 * Copyright 2017-present DaAwesomeP
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import gulp from 'gulp'
import gulpESLintNew from 'gulp-eslint-new'
import path from 'path'
import { fileURLToPath } from 'url'
import gulpDebug from 'gulp-debug'
import { PassThrough } from 'stream'
import lec from 'gulp-line-ending-corrector'
import { deleteAsync as del } from 'del'
import bro from 'gulp-bro'
import babelify from 'babelify'
import sourcemaps from 'gulp-sourcemaps'
import rename from 'gulp-rename'
import zip from 'gulp-zip'

const gulpFile = path.basename(fileURLToPath(import.meta.url))
const isVerbose = process.argv.includes('--debug')
const debug = (title) => isVerbose ? gulpDebug({ title }) : new PassThrough({ objectMode: true })
const baseFiles = ['src/**/*.js', gulpFile]
const zipOutput = 'build/output'

export function lint () {
  return gulp.src(baseFiles)
    .pipe(debug('linting processing:'))
    .pipe(gulpESLintNew())
    .pipe(gulpESLintNew.format())
    .pipe(gulpESLintNew.failAfterError())
}

export function lintFix () {
  return gulp.src(baseFiles)
    .pipe(debug('lintFix processing:'))
    .pipe(gulpESLintNew({ fix: true }))
    .pipe(gulpESLintNew.fix())
}

export function checkSafe () {
  return gulp.src(baseFiles)
    .pipe(gulpESLintNew())
    .pipe(gulpESLintNew.format())
}

export function checkLineEnding () {
  return gulp.src('src/**/*.js')
    .pipe(lec({ verbose: true }))
    .pipe(gulp.dest('src'))
}

export function clean () {
  return del(['dist/*', 'build/*']).then((files) => {
    console.log(`cleaned: ${files.length}`)
  })
}

export function compile (cb) {
  gulp.parallel(
    function compileJs () {
      return gulp.src('src/**/*.js')
        .pipe(debug('compile js processing:'))
        .pipe(sourcemaps.init())
        .pipe(bro({
          transform: [babelify.configure()]
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist'))
    }, function copyStaticPage () {
      return gulp.src(['src/**/*', '!src/**/*.js'])
        .pipe(debug('compile static processing:'))
        .pipe(gulp.dest('dist'))
    })(cb)
}

export function pack (cb) {
  gulp.parallel(
    function packFirefox () {
      return gulp.src([
        'manifest.firefox.json',
        'LICENSE',
        'dist/**/*',
        '!dist/**/*.map', 'node_modules/underscore/**/*', 'node_modules/lodash/**/*',
        'icons/**/clear-*.png', 'icons/**/*.min.svg'], { base: '.' })
        .pipe(rename(path => {
          if (path.basename === 'manifest.firefox') {
            path.basename = 'manifest'
          }
        }))
        .pipe(zip('tab-counter.firefox.zip'))
        .pipe(gulp.dest(zipOutput))
    },
    function packOpera () {
      return gulp.src(['dist/**/*.js', 'dist/**/*.html', 'node_modules/webextension-polyfill/dist/browser-polyfill.js', 'node_modules/underscore/underscore.js', 'icons/**/*.png', 'icons/**/*.min.svg', 'manifest.opera.json', 'LICENSE'], { base: '.' })
        .pipe(rename(path => {
          if (path.basename === 'manifest.opera') {
            path.basename = 'manifest'
          }
        }))
        .pipe(zip('tab-counter.opera.zip'))
        .pipe(gulp.dest(zipOutput))
    }
  )(cb)
}

export function watch (cb) {
  return gulp.series(checkSafe, compile,
    function monitor () {
      return gulp.watch(['src/**/*', 'node_modules/webextension-polyfill/**/*', 'node_modules/underscore/**/*', 'icons/**/*', 'manifest.json', 'package.json'], gulp.parallel('checkSafe', 'compile'))
    })(cb)
}

export const dist = gulp.series(clean, checkLineEnding, lint, compile)
export const build = gulp.series(dist, pack)
export default build
