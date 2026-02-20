import lodash from 'lodash'

export const COUNT_TAB_CURRENT_WINDOW = 0
export const COUNT_TAB_ALL_WINDOWS = 1
export const COUNT_TAB_CURRENT_WINDOW_OVER_ALL_WINDOWS = 2
export const COUNT_WINDOW = 4
export const COUNT_NONE = 3
export const COUNT_ALL_GROUPS = 5
export const COUNT_CURRENT_WINDOW_GROUPS = 6

export const STAT_WINDOW_COUNT = 'all_windows'
export const STAT_ALL_TAB_COUNT = 'all_tabs'
export const STAT_CURRENT_WINDOW_TABS_COUNT = 'current_window_tabs'
export const STAT_CURRENT_WINDOW_GROUPS_COUNT = 'current_window_groups'
export const STAT_ALL_GROUP_COUNT = 'all_groups'
export const STAT_ALL_UNLOADED_COUNT = 'all_unloaded'
export const STAT_CURRENT_UNLOADED_COUNT = 'current_window_unloaded'

export function getBaseQuery () {
  return {
    allTabsQuery: {},
    currentWindowQuery: {}
  }
}

export function getSkipPinnedTabQuery (skipPinnedTabPreference) {
  if (skipPinnedTabPreference) {
    return {
      allTabsQuery: {
        pinned: false
      },
      currentWindowQuery: {
        pinned: false
      }
    }
  }
}

export function getSkipHiddenTabQuery (skipHiddenTabPreference) {
  if (skipHiddenTabPreference) {
    return {
      allTabsQuery: {
        hidden: false
      },
      currentWindowQuery: {
        hidden: false
      }
    }
  }
}

function formatQueryUnloadedTab () {
  return {
    allTabsQuery: {
      discarded: true
    },
    currentWindowQuery: {
      discarded: true
    }
  }
}

export async function queryBadgeData (windowId) {
  const settings = await browser.storage.local.get()

  const queryObject = lodash.merge(getBaseQuery(), getSkipPinnedTabQuery(settings.skipPinnedTab), getSkipHiddenTabQuery(settings.skipHiddenTab))

  const allWindowsObj = await browser.windows.getAll({
    populate: false,
    windowTypes: ['normal']
  })
  const allTabObj = await browser.tabs.query(queryObject.allTabsQuery)
  const currentWindowTab = await browser.tabs.query(lodash.merge(queryObject.currentWindowQuery, { windowId }))
  const currentWindowGroupCount = await browser.tabGroups.query({ windowId })
  const allGroupObj = await browser.tabGroups.query({})

  let allUnloadedTabCount = 0
  let unloadedCurrentWindowTabCount = 0
  if (settings.skipUnloadedTab) {
    allUnloadedTabCount = (await browser.tabs.query(formatQueryUnloadedTab().allTabsQuery)).length
    unloadedCurrentWindowTabCount = (await browser.tabs.query(lodash.merge(formatQueryUnloadedTab().currentWindowQuery, { windowId }))).length
  }

  return {
    [STAT_CURRENT_WINDOW_TABS_COUNT]: (currentWindowTab.length - unloadedCurrentWindowTabCount).toString(),
    [STAT_WINDOW_COUNT]: allWindowsObj.length.toString(),
    [STAT_ALL_TAB_COUNT]: (allTabObj.length - allUnloadedTabCount).toString(),
    [STAT_CURRENT_WINDOW_GROUPS_COUNT]: currentWindowGroupCount.length.toString(),
    [STAT_ALL_GROUP_COUNT]: allGroupObj.length.toString(),
    [STAT_CURRENT_UNLOADED_COUNT]: unloadedCurrentWindowTabCount.toString(),
    [STAT_ALL_UNLOADED_COUNT]: allUnloadedTabCount.toString()
  }
}

export const updateAllWindowBadge = async function updateAllWindowBadge () {
  const allWindows = await browser.windows.getAll({
    populate: false,
    windowTypes: ['normal']
  })

  for (const windowObj of allWindows) {
    await updateWindowBadge(windowObj.id)
  }
}

const updateWindowBadge = async function updateWindowBadge (windowId) {
  // Get settings
  const settings = await browser.storage.local.get()
  // Get tab counter setting
  const counterPreference = settings.counter || COUNT_TAB_CURRENT_WINDOW
  // Stop tab badge update if badge disabled
  if (counterPreference === COUNT_NONE) return
  const statData = await queryBadgeData(windowId)

  let text = statData[STAT_CURRENT_WINDOW_TABS_COUNT]
  switch (counterPreference) {
    case COUNT_TAB_CURRENT_WINDOW:
      text = statData[STAT_CURRENT_WINDOW_TABS_COUNT]
      break
    case COUNT_TAB_ALL_WINDOWS:
      text = statData[STAT_ALL_TAB_COUNT]
      break
    case COUNT_TAB_CURRENT_WINDOW_OVER_ALL_WINDOWS:
      text = `${statData[STAT_CURRENT_WINDOW_TABS_COUNT]}/${statData[STAT_ALL_TAB_COUNT]}`
      break
    case COUNT_WINDOW:
      text = statData[STAT_WINDOW_COUNT] // Badge shows total of all windows
      break
    case COUNT_ALL_GROUPS:
      text = statData[STAT_ALL_GROUP_COUNT]
      break
    case COUNT_CURRENT_WINDOW_GROUPS:
      text = statData[STAT_CURRENT_WINDOW_GROUPS_COUNT]
      break
  }

  //   Update the badge
  browser.action.setBadgeText({
    text,
    windowId
  })

  //  Update the tooltip
  browser.action.setTitle({
    title: `Tab Counter\nTabs in this window:  ${statData[STAT_CURRENT_WINDOW_TABS_COUNT]}\nTabs in all windows: ${statData[STAT_ALL_TAB_COUNT]}\nNumber of windows: ${statData[STAT_WINDOW_COUNT]}`,
    windowId
  })
}
