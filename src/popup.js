/* src/popup.js
 * Originally created 3/10/2017 by DaAwesomeP
 * This is the popup script file
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

import * as common from './common'

async function start () {
  const currentWindow = await browser.windows.getCurrent({
    populate: false,
    windowTypes: ['normal']
  })

  const statData = await common.queryBadgeData(currentWindow.id)

  document.getElementById('currentWindow').textContent = statData[common.STAT_CURRENT_WINDOW_TABS_COUNT]
  document.getElementById('allTabs').textContent = statData[common.STAT_ALL_TAB_COUNT]
  document.getElementById('allWindows').textContent = statData[common.STAT_WINDOW_COUNT]
  document.getElementById('currentWindowGroups').textContent = statData[common.STAT_CURRENT_WINDOW_GROUPS_COUNT]
  document.getElementById('allGroups').textContent = statData[common.STAT_ALL_GROUP_COUNT]
  document.getElementById('allTagGroup').textContent = statData[common.STAT_ALL_TAB_GROUP_COUNT]
  document.getElementById('currentTagGroup').textContent = statData[common.STAT_CURRENT_TAB_GROUP_COUNT]
  document.getElementById('allUnloaded').textContent = statData[common.STAT_ALL_UNLOADED_TAB_COUNT]
  document.getElementById('currentWindowUnloaded').textContent = statData[common.STAT_CURRENT_UNLOADED_TAB_COUNT]

  const settings = await browser.storage.local.get()
  if (!settings.countUnloadedTab) {
    const elements = document.getElementsByClassName('unloadedRow')
    for (const element of elements) {
      element.classList.add('hide')
    }
  }

  if (!settings.countGroup) {
    const elements = document.getElementsByClassName('groupTabRow')
    for (const element of elements) {
      element.classList.add('hide')
    }
  }
}

if (typeof browser === 'undefined') {
  const script = document.createElement('script')
  script.addEventListener('load', () => {
    start()
  })
  script.src = '../node_modules/webextension-polyfill/dist/browser-polyfill.js'
  script.async = false
  document.head.appendChild(script)
} else {
  start()
}
