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
import fs from 'fs'
import mergeStream from 'merge-stream'
import mergeJson from 'gulp-merge-json'
import sortJsonM from 'gulp-json-sort'
import formatJson from 'gulp-json-format'

const sortJson = sortJsonM.default
const gulpFile = path.basename(fileURLToPath(import.meta.url))
const isVerbose = process.argv.includes('--debug')
const debug = (title) => isVerbose ? gulpDebug({ title }) : new PassThrough({ objectMode: true })
const manifestEntry = fs.readdirSync('./manifest').filter(entry => /^manifest\..+\.json$/.test(entry))

const fileSets = {
  src: ['src/**/*.js'],
  icons: ['icons/**/*'],
  assets: ['src/**/*', '!src/**/*.js'],
  toolScrips: [gulpFile, 'scripts/**/*.js'],
  nodeModules: ['node_modules/webextension-polyfill/**/*'],
  manifest: ['./manifest/manifest.*.json'],
  package: ['package.json'],
  output: {
    root: 'build',
    zip: 'build/output',
    generated: 'build/generated_code',
    generatedManifest: 'build/generated_manifest',
    dist: 'build/dist'
  },
  get lintingSet () {
    return [].concat(fileSets.src, fileSets.manifest, fileSets.toolScrips)
  },
  get watchSet () {
    return [].concat(fileSets.assets, fileSets.src, fileSets.toolScrips, fileSets.package, fileSets.nodeModules, fileSets.icons, fileSets.manifest)
  }
}

export function lint () {
  return gulp.src(fileSets.lintingSet)
    .pipe(debug('linting processing:'))
    .pipe(gulpESLintNew())
    .pipe(gulpESLintNew.format())
    .pipe(gulpESLintNew.failAfterError())
}

export function fixBaseManifest () {
  return gulp.src('./manifest/*.json')
    .pipe(debug('fixBaseManifest:'))
    .pipe(sortJson())
    .pipe(formatJson(2))
    .pipe(gulp.dest('./manifest'))
}

export function lintCodeFix () {
  return gulp.src(fileSets.lintingSet)
    .pipe(debug('lintFix processing:'))
    .pipe(gulpESLintNew({ fix: true }))
    .pipe(gulpESLintNew.fix())
}

function lintSafe () {
  return gulp.src(fileSets.lintingSet)
    .pipe(gulpESLintNew())
    .pipe(gulpESLintNew.format())
}

export function checkLineEnding () {
  return gulp.src('src/**/*.js')
    .pipe(lec())
    .pipe(gulp.dest('src'))
}

export function clean () {
  return del([`${fileSets.output.root}/*`])
}

function compileCode () {
  return gulp.src(fileSets.src)
    .pipe(debug('compileCode:'))
    .pipe(sourcemaps.init())
    .pipe(bro({
      transform: [babelify.configure()]
    }))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(fileSets.output.generated))
}

function copyStaticAsset (cb) {
  return gulp.parallel(function copyAssets () {
    return gulp.src(fileSets.assets)
      .pipe(debug('copyAssets:'))
      .pipe(gulp.dest(fileSets.output.generated))
  }, function copyIcons () {
    const browserNames = manifestEntry.map(entry => entry.split('.')[1])
    const tasks = browserNames.map(browserName => gulp.src(fileSets.icons, {
      base: '.',
      encoding: false
    })
      .pipe(debug(`copyIcons (${browserName}): `))
      .pipe(gulp.dest(`${fileSets.output.dist}/${browserName}`)))
    return mergeStream(...tasks)
  }, function copyDep () {
    const browserNames = manifestEntry.map(entry => entry.split('.')[1])
    const tasks = browserNames.map(browserName => gulp.src(fileSets.nodeModules, { base: '.' })
      .pipe(debug(`copyDep (${browserName}): `))
      .pipe(gulp.dest(`${fileSets.output.dist}/${browserName}`)))
    return mergeStream(...tasks)
  })(cb)
}

function generateManifest () {
  const baseManifest = JSON.parse(fs.readFileSync('./manifest/base.manifest.json', 'utf8'))
  const tasks = manifestEntry
    .map(file => {
      return gulp.src(`./manifest/${file}`)
        .pipe(mergeJson({
          fileName: file,
          startObj: baseManifest,
          jsonSpace: ' '
        }))
        .pipe(sortJson())
        .pipe(formatJson(2))
        .pipe(gulp.dest(fileSets.output.generatedManifest))
    })

  return mergeStream(...tasks)
}

function distManifestFile () {
  return gulp.src(`${fileSets.output.generatedManifest}/*`)
    .pipe(debug('distManifestFile: '))
    .pipe(rename(path => {
      const [, browserName] = path.basename.split('.')
      path.dirname = browserName
      path.basename = 'manifest'
    }))
    .pipe(gulp.dest(fileSets.output.dist))
}

function distSourceFiles () {
  const browserNames = manifestEntry.map(entry => entry.split('.')[1])
  const tasks = browserNames.map(browserName => gulp.src([`${fileSets.output.generated}/**/*`, `!${fileSets.output.generated}/**/*.map`])
    .pipe(debug(`distSourceFiles (${browserName}): `))
    .pipe(gulp.dest(`${fileSets.output.dist}/${browserName}`)))
  return mergeStream(...tasks)
}

export function createArtifact () {
  const browserNames = manifestEntry.map(entry => entry.split('.')[1])
  const tasks = browserNames.map(browser => {
    return gulp.src(`${fileSets.output.dist}/${browser}/**/*`, { base: `${fileSets.output.dist}/${browser}` })
      .pipe(debug(`createArtifact (${browser}): `))
      .pipe(zip(`tab-counter.${browser}.zip`))
      .pipe(gulp.dest(fileSets.output.zip))
  })
  return mergeStream(...tasks)
}

export function monitor () {
  gulp.watch(fileSets.watchSet, gulp.series(gulp.parallel(lintSafe, compile), distCode))
}

export const compile = gulp.parallel(compileCode, copyStaticAsset)
export const generateCode = gulp.series(clean, checkLineEnding, lint, compile)
export const distCode = gulp.parallel(gulp.series(generateManifest, distManifestFile), distSourceFiles)
export const artifact = gulp.series(distCode, createArtifact)
export const build = gulp.series(generateCode, artifact)
export const lintFix = gulp.parallel(fixBaseManifest, lintCodeFix)
export const watch = gulp.series(lintSafe, compile, distCode, monitor)
export default build
