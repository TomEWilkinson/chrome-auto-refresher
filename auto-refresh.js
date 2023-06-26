const getActiveTabs = async () => await chrome.tabs.query({ currentWindow: true, active: true });

const delay = ms => new Promise(res => setTimeout(res, ms));

let searchResult = false;
let currentActiveTabs = [];
let textToCheck = '';

const checkForTextChange = async () => {
  const resultOfSearch = await chrome.scripting.executeScript({
    target: { tabId: currentActiveTabs[0].id },
    func: searchForString,
    args: [textToCheck],
  });
  
  searchResult = resultOfSearch[0].result;
  
  if(searchResult === -1) {
    console.log('exited due to string no longer on page');
    return;
  }

  reloadPage();
}

const checkForUrlChange = async (requestDetails) => {
  if(currentActiveTabs[0].url !== requestDetails[0]) {
    reloadPage();
    console.log('url has not changed match');
  }
}

const searchForString = (textToCheck) => {
  console.log(textToCheck);
  const source = document.getElementsByTagName('html')[0].innerHTML;
  return source.search(textToCheck);
}

const reloadPage = async () => {
  await chrome.tabs.update(currentActiveTabs[0].id, {url: currentActiveTabs[0].url});
  console.log("page has been reloaded");
  delay(5);
}

const runAutoRefresh = async () => {
  const urlChange = document.getElementById("url-change");
  
  const textChange = document.getElementById("text-change");
  textToCheck = document.getElementById("text-to-check").value;

  if(textChange.checked && textToCheck) {
    await chrome.webNavigation.onCompleted.addListener(checkForTextChange);
  }

  if(urlChange.checked) {
    await chrome.webNavigation.onCompleted.addListener(checkForUrlChange);
  }

  await reloadPage();
}

(async function main() {
  await chrome.webNavigation.onCompleted.removeListener(checkForTextChange);
  await chrome.webNavigation.onCompleted.removeListener(checkForUrlChange);

  const startBtn = document.getElementById("start");
  startBtn.addEventListener("click", () => runAutoRefresh());
  currentActiveTabs = await getActiveTabs();
})();