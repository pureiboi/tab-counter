import lodash from 'lodash'

export const COUNT_TAB_CURRENT_WINDOW = 0
export const COUNT_TAB_ALL_WINDOWS = 1
export const COUNT_TAB_CURRENT_WINDOW_OVER_ALL_WINDOWS = 2
export const COUNT_WINDOW = 4
export const COUNT_NONE = 3

export const STAT_WINDOW_COUNT = 'all_windows'
export const STAT_ALL_TAB_COUNT = 'all_tabs'
export const STAT_CURRENT_WINDOW_TABS_COUNT = 'current_window_tabs'

export function getBaseQuery () {
  return {
    'allTabsQuery': {},
    'currentWindowQuery': {}
  }
}

export function getSkipPinnedTabQuery (skipPinnedTabPreference) {
  if (skipPinnedTabPreference) {
    return {
      'allTabsQuery': {
        'pinned': false
      },
      'currentWindowQuery': {
        'pinned': false
      }
    }
  }
}

export function getSkipHiddenTabQuery (skipHiddenTabPreference) {
  if (skipHiddenTabPreference) {
    return {
      'allTabsQuery': {
        'hidden': false
      },
      'currentWindowQuery': {
        'hidden': false
      }
    }
  }
}

export async function queryBadgeData (windowId) {
  let settings = await browser.storage.local.get()

  let queryObject = lodash.merge(getBaseQuery(), getSkipPinnedTabQuery(settings.skipPinnedTab), getSkipHiddenTabQuery(settings.skipHiddenTab))

  let allWindowsObj = await browser.windows.getAll({
    populate: false,
    windowTypes: ['normal']
  })
  let allTabObj = await browser.tabs.query(queryObject.allTabsQuery)
  let currentWindowTab = await browser.tabs.query(lodash.merge(queryObject.currentWindowQuery, { windowId: windowId }))

  return {
    [STAT_CURRENT_WINDOW_TABS_COUNT]: currentWindowTab.length.toString(),
    [STAT_WINDOW_COUNT]: allWindowsObj.length.toString(),
    [STAT_ALL_TAB_COUNT]: allTabObj.length.toString()
  }
}

export const updateAllWindowBadge = async function updateAllWindowBadge () {
  let allWindows = await browser.windows.getAll({
    populate: false,
    windowTypes: ['normal']
  })

  for (const windowObj of allWindows) {
    await updateWindowBadge(windowObj.id)
  }
}

const updateWindowBadge = async function updateWindowBadge (windowId) {
  // Get settings
  let settings = await browser.storage.local.get()
  // Get tab counter setting
  let counterPreference = settings.counter || COUNT_TAB_CURRENT_WINDOW
  // Stop tab badge update if badge disabled
  if (counterPreference === COUNT_NONE) return
  let statData = await queryBadgeData(windowId)

  let text = statData[STAT_CURRENT_WINDOW_TABS_COUNT]
  if (counterPreference === COUNT_TAB_CURRENT_WINDOW) {
    // Badge shows current window
    text = statData[STAT_CURRENT_WINDOW_TABS_COUNT]
  } else if (counterPreference === COUNT_TAB_ALL_WINDOWS) {
    // Badge shows total of all windows
    text = statData[STAT_ALL_TAB_COUNT]
  } else if (counterPreference === COUNT_TAB_CURRENT_WINDOW_OVER_ALL_WINDOWS) {
    // Badge shows both (Firefox limits to about 4 characters based on width)
    text = `${statData[STAT_CURRENT_WINDOW_TABS_COUNT]}/${statData[STAT_ALL_TAB_COUNT]}`
  } else if (counterPreference === COUNT_WINDOW) text = statData[STAT_WINDOW_COUNT] // Badge shows total of all windows

  //   Update the badge
  browser.action.setBadgeText({
    text: text,
    windowId: windowId
  })

  //  Update the tooltip
  browser.action.setTitle({
    title: `Tab Counter\nTabs in this window:  ${statData[STAT_CURRENT_WINDOW_TABS_COUNT]}\nTabs in all windows: ${statData[STAT_ALL_TAB_COUNT]}\nNumber of windows: ${statData[STAT_WINDOW_COUNT]}`,
    windowId: windowId
  })
}
