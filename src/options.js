/* src/options.js
 * Originally created 3/11/2017 by DaAwesomeP
 * This is the options page script file
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
/* global Option:readonly */
import { COUNT_TAB_CURRENT_WINDOW, COUNT_TAB_ALL_WINDOWS, COUNT_TAB_CURRENT_WINDOW_OVER_ALL_WINDOWS, COUNT_WINDOW, COUNT_NONE } from './common.js'

let domReady = false
let browserReady = false
let restored = false

async function checkBadgeColorManualSetting () {
  const autoSelect = document.querySelector('#badgeTextColorAuto').checked
  document.querySelector('#badgeTextColor').disabled = autoSelect
}

async function saveOptions () {
  checkBadgeColorManualSetting()
  const settings = await browser.storage.local.get()
  for (const setting in settings) {
    if (setting !== 'version') {
      const el = document.querySelector(`#${setting}`)
      if (el.getAttribute('type') === 'checkbox') settings[setting] = el.checked
      else settings[setting] = el.value
      const optionType = el.getAttribute('optionType')
      if (optionType === 'number' && typeof settings[setting] !== 'number') settings[setting] = parseInt(settings[setting])
      else if (optionType === 'string' && typeof settings[setting] !== 'string') settings[setting] = settings[setting].toString()
      else if (optionType === 'boolean' && typeof settings[setting] !== 'boolean') settings[setting] = (settings[setting].toLowerCase() === 'true')
    }
  }
  browser.storage.local.set(settings)
  await browser.runtime.sendMessage({ updateSettings: true })
}

async function restoreOptions () {
  restored = true
  const settings = await browser.storage.local.get()
  for (const setting in settings) {
    if (setting !== 'version') {
      const el = document.querySelector(`#${setting}`)
      if (el.getAttribute('type') === 'checkbox') el.checked = settings[setting]
      else el.value = settings[setting]
      // el.parentElement.parentElement.style.display = 'block'
    }
  }
  checkBadgeColorManualSetting()
}

function start () {
  browserReady = true
  if (domReady && !restored) {
    initApp()
    restoreOptions()
  }
  for (const el of document.querySelectorAll('input, select')) {
    el.addEventListener('change', saveOptions)
  }
}

function initApp () {
  const counterOptions = [
    { text: 'Number of Tabs in Current Window', value: COUNT_TAB_CURRENT_WINDOW },
    { text: 'Total Number of Tabs of All Windows', value: COUNT_TAB_ALL_WINDOWS },
    { text: 'Both Number of Tabs in Current Window/Total Number of Tabs of All Windows', value: COUNT_TAB_CURRENT_WINDOW_OVER_ALL_WINDOWS },
    { text: 'Total Number of Windows', value: COUNT_WINDOW },
    { text: 'None (disables the counter and hover text; click the icon to see the count)', value: COUNT_NONE }
  ]

  const counterSelect = document.getElementById('counter')
  counterOptions.forEach(option => {
    counterSelect.add(new Option(option.text, option.value, false, option.value === '0'))
  })
}

document.addEventListener('DOMContentLoaded', () => {
  domReady = true
  if (browserReady && !restored) {
    initApp()
    restoreOptions()
  }
})

if (typeof browser === 'undefined') {
  const script = document.createElement('script')
  script.addEventListener('load', () => {
    start()
  })
  script.src = '../node_modules/webextension-polyfill/dist/browser-polyfill.js'
  script.async = false
  document.head.appendChild(script)
} else start()
