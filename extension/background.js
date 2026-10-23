// Refbox for Chrome: catches images you save on inspiration sites and keeps them in the extension's own storage.

const SOURCE_HOSTS = /(^|\.)(awwwards\.com|pinterest\.[a-z.]+|pinimg\.com|dribbble\.com|instagram\.com|cdninstagram\.com|fbcdn\.net)$/i;
const IMAGE_HOSTS = /(^|\.)(pinimg\.com|cdn\.dribbble\.com|cdninstagram\.com|fbcdn\.net|assets\.awwwards\.com)$/i;
const IMAGE_EXT = /\.(png|jpe?g|webp|gif|avif)(\?|#|$)/i;
const bypass = new Set();   // URLs we hand back to Chrome after a failed capture

const host = u => { try { return new URL(u).hostname; } catch (e) { return ''; } };
function siteOf(...urls) {
  for (const u of urls) {
    const h = host(u);
    if (/awwwards/i.test(h)) return 'awwwards.com';
    if (/pinterest|pinimg/i.test(h)) return 'pinterest.com';
    if (/dribbble/i.test(h)) return 'dribbble.com';
    if (/instagram|cdninstagram|fbcdn/i.test(h)) return 'instagram.com';
  }
  return host(urls[0]) || 'unknown';
}
function nameFrom(url, fallback) {
  try { const p = decodeURIComponent(new URL(url).pathname.split('/').pop() || ''); return (p.replace(/\.[^.]+$/, '') || fallback || 'image').slice(0, 80); }
  catch (e) { return fallback || 'image'; }
}

// ---- storage (IndexedDB, shared with the Refbox page of this extension) ----
function db() {
  return new Promise((res, rej) => {
    const r = indexedDB.open('refbox', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('captures', {keyPath: 'id'});
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
}
async function put(rec) {
  const d = await db();
  return new Promise((res, rej) => { const tx = d.transaction('captures', 'readwrite'); tx.objectStore('captures').put(rec); tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
}

// ---- capture ----
async function fetchImage(url) {
  // Pinterest serves resized copies; ask for the original first.
  const tries = /pinimg\.com/.test(url) ? [url.replace(/\/\d+x(\d+)?\//, '/originals/'), url] : [url];
  for (const u of tries) {
    try { const r = await fetch(u, {credentials: 'include'}); if (r.ok) { const b = await r.blob(); if (b.type.startsWith('image/')) return b; } } catch (e) {}
  }
  throw new Error('Could not download the image');
}
async function capture(url, page, title) {
  const blob = await fetchImage(url);
  const id = 'c' + Date.now() + Math.random().toString(36).slice(2, 6);
  await put({id, blob, url, page: page || '', site: siteOf(page, url), name: title || nameFrom(url), savedAt: Date.now()});
  await chrome.storage.local.set({lastCapture: id});
  const {unseen = 0} = await chrome.storage.session.get('unseen');
  await chrome.storage.session.set({unseen: unseen + 1});
  chrome.action.setBadgeBackgroundColor({color: '#D4386C'});
  chrome.action.setBadgeText({text: String(unseen + 1)});
  chrome.notifications.create(id, {type: 'basic', iconUrl: 'icons/128.png', title: 'Saved to Refbox', message: `From ${siteOf(page, url)}`, priority: 0});
}
const enabled = async () => (await chrome.storage.local.get('enabled')).enabled !== false;

// Save image as… / download buttons on source sites
chrome.downloads.onCreated.addListener(async item => {
  const src = item.finalUrl || item.url, page = item.referrer || '';
  if (bypass.has(src)) { bypass.delete(src); return; }
  if (!(await enabled())) return;
  if (!SOURCE_HOSTS.test(host(page)) && !SOURCE_HOSTS.test(host(src))) return;
  const looksImage = (item.mime || '').startsWith('image/') || IMAGE_EXT.test(src) || IMAGE_HOSTS.test(host(src));
  if (!looksImage || !/^https?:/.test(src)) return;   // blob: and data: downloads go through as usual
  try { await chrome.downloads.cancel(item.id); await chrome.downloads.erase({id: item.id}); } catch (e) {}
  try { await capture(src, page); }
  catch (e) {
    bypass.add(src); chrome.downloads.download({url: src});   // give the download back to Chrome
    chrome.notifications.create({type: 'basic', iconUrl: 'icons/128.png', title: 'Refbox could not save this image', message: 'It was downloaded as usual instead.'});
  }
});

// Right-click menus
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({id: 'save-image', title: 'Save to Refbox', contexts: ['image']});
  chrome.contextMenus.create({id: 'save-link', title: 'Add this page to Refbox links', contexts: ['page']});
});
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'save-image') {
    if (!/^https?:/.test(info.srcUrl || '')) return chrome.notifications.create({type: 'basic', iconUrl: 'icons/128.png', title: 'Refbox', message: 'This image cannot be saved from here. Try opening it in its own tab first.'});
    capture(info.srcUrl, info.pageUrl, tab && tab.title).catch(() => chrome.notifications.create({type: 'basic', iconUrl: 'icons/128.png', title: 'Refbox could not save this image', message: 'The site did not allow the download.'}));
  }
  if (info.menuItemId === 'save-link' && tab) {
    const {links = []} = await chrome.storage.local.get('links');
    if (!links.some(l => l.url === tab.url)) links.unshift({id: 'l' + Date.now(), name: tab.title || host(tab.url), url: tab.url, from: siteOf(tab.url)});
    await chrome.storage.local.set({links});
  }
});

// Toolbar icon opens the library (reusing an open tab)
async function openApp() {
  const url = chrome.runtime.getURL('app.html');
  const [t] = await chrome.tabs.query({url});
  if (t) { await chrome.tabs.update(t.id, {active: true}); await chrome.windows.update(t.windowId, {focused: true}); }
  else await chrome.tabs.create({url});
  await chrome.storage.session.set({unseen: 0}); chrome.action.setBadgeText({text: ''});
}
chrome.action.onClicked.addListener(openApp);
chrome.notifications.onClicked.addListener(openApp);
