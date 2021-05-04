const tabContainer = document.querySelector(".tab-container");

/**
 * Gets domain from url
 * @param  {String} url     Tab url
 * @return {String} domain  Tab domain
 */
function getDomainFromUrl(url) {
  var a = document.createElement("a");
  a.setAttribute("href", url);
  return a.hostname;
}

/**
 * Creates table row html
 * @param  {Object} tab       Instance of a tab
 * @return {String} tabHtml   Html tab
 */
function getTabTemplate(tab) {
  if (tab.title === "Extensions") tab.icon = "icons/extension.png";
  else if (tab.url.indexOf("chrome://") > -1) tab.icon = "icons/new-tab.png";

  let tabHtml = `<tr class="tab-row" data-windowid=${tab.windowId} data-tabid="${tab.tabId}" data-inFocus="false">
                    <td class="icon-td">
                        <img class="icon" src="${tab.icon}"/>
                    </td>
                    <td id="title-container" class="col2" colspan="2">
                        <span class="tab-data">${tab.title}</span>
                        <span class="tab-data url">${getDomainFromUrl(
                          tab.url
                        )}</span>
                    </td>
                    <td class="btn-close-td hidden">
                        <img class="btn-close hidden" src="icons/close.png"/>
                    </td>
                </tr>`;
  return tabHtml;
}

/**
 * Highlights the current tab (blue)
 */
function highlightCurrentTab() {
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    const tabId = tabs[0].id;
    const tabRow = document.querySelector(`.tab-row[data-tabid="${tabId}"]`);
    tabRow.style.backgroundColor = "#8AB4F8";
    tabRow.querySelector(".url").style.color = "#000000";
    tabRow.dataset.inFocus = "true";
  });
}

/**
 * Highlights tabrow on mouseover (green)
 */
function rowMouseOver() {
  tabContainer.addEventListener("mouseover", function (e) {
    const tabRow = e.target.closest("tr");
    tabRow.querySelector(".btn-close-td").classList.remove("hidden");
    tabRow.querySelector(".btn-close").classList.remove("hidden");
    tabRow.querySelector("#title-container").setAttribute("colspan", "1");
    tabRow.querySelector(".url").style.color = "#000000";
    tabRow.querySelectorAll(".tab-data").forEach(function (span) {
      span.style.width = "228px";
    });
  });
}

/**
 * Unhighlight tabrow on mouseout
 */
function rowMouseOut() {
  tabContainer.addEventListener("mouseout", function (e) {
    const tabRow = e.target.closest("tr");
    tabRow.querySelector(".btn-close-td").classList.add("hidden");
    tabRow.querySelector(".btn-close").classList.add("hidden");
    tabRow.querySelector("#title-container").setAttribute("colspan", "2");
    tabRow.querySelectorAll(".tab-data").forEach(function (span) {
      span.style.width = "264px";
    });

    if (tabRow.dataset.inFocus) return;
    tabRow.querySelector(".url").style.color = "#9b9b97";
  });
}

/**
 * Puts chrome tab in focus
 * @param  {Number} tabId   Tab Id
 */
function focusTab(tabId) {
  chrome.tabs.update(tabId, { active: true, highlighted: true });
}

/**
 * Changes chrome window
 * @param  {Number} windowId   Window Id
 * @param  {Number} tabId      Tab Id
 */
function changeWindow(windowId, tabId) {
  chrome.windows.update(windowId, { focused: true });
  focusTab(tabId);
}

/**
 * Updates and puts tab in focus
 * @param  {Number} windowId    Window Id
 * @param  {Number} tabId       Tab Id
 */
function updateTab(windowId, tabId) {
  chrome.windows.getCurrent({ populate: true }, function (window) {
    if (windowId != window.id) {
      changeWindow(windowId, tabId);
    } else {
      focusTab(tabId);
    }
  });
}

/**
 * Selects tab on click
 */
function selectTab() {
  tabContainer.addEventListener("click", function (e) {
    if (
      e.target.classList.contains("btn-close") ||
      e.target.classList.contains("btn-close-td")
    )
      return;
    let tr = e.target.closest("tr");
    let tabWindowId = parseInt(tr.dataset.windowid);
    let tabTabId = parseInt(tr.dataset.tabid);
    updateTab(tabWindowId, tabTabId);
  });
}

/**
 * CLoses chrome tab
 * @param  {Number} tabId   Tab Id
 */
function closeTab(tabId) {
  chrome.tabs.remove(tabId);
}

/**
 * Closes chrome tab on close button click
 */
function closeBtnClicked() {
  document.querySelectorAll(".btn-close").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      let tr = e.target.closest("tr");
      tr.remove();
      closeTab(parseInt(tr.dataset.tabid));
    });
  });
}

/**
 * Gets all tabs in window object
 * @param  {Object} windows   Windows objects
 * @return {Array} allTabs    Array of tab objects
 */
function getAllTabs(windows) {
  const allTabs = [];
  for (let i in windows) {
    let windowId = windows[i].id;
    let windowTabs = windows[i].tabs;
    for (let j = 0; j < windowTabs.length; j++) {
      allTabs.unshift(
        new Tab(
          windowId,
          windowTabs[j].id,
          windowTabs[j].title,
          windowTabs[j].url,
          windowTabs[j].favIconUrl
        )
      );
    }
  }
  return allTabs;
}

/**
 * Gets all open tabs
 * @param  {Object} windows   Windows object
 */
function getAllOpenTabs(windows) {
  const allTabs = getAllTabs(windows);
  allTabs.forEach(function (tab) {
    tabContainer.insertAdjacentHTML("afterbegin", getTabTemplate(tab));
  });
}

/**
 * Initailize tab master
 * @param  {Object} windows   Windows object
 */
function init(windows) {
  getAllOpenTabs(windows);
  highlightCurrentTab();
  selectTab();
  closeBtnClicked();
  rowMouseOver();
  rowMouseOut();
}

/**
 * Invokes tab master
 */
function invokeTabSwitcher() {
  chrome.windows.getAll({ populate: true }, init);
}
