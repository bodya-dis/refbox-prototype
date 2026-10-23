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

// ---- activity log: the last 20 events, shown at the bottom of the Refbox sidebar ----
async function log(ok, site, text) {
  const {activity = []} = await chrome.storage.local.get('activity');
  activity.unshift({at: Date.now(), ok, site, text});
  await chrome.storage.local.set({activity: activity.slice(0, 20)});
}
chrome.runtime.onMessage.addListener(msg => { if (msg && msg.type === 'log') log(msg.ok, msg.site, msg.text); });

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
async function store(blob, rec, heading) {
  const id = 'c' + Date.now() + Math.random().toString(36).slice(2, 6);
  await put({id, blob, savedAt: Date.now(), ...rec});
  await chrome.storage.local.set({lastCapture: id});
  const {unseen = 0} = await chrome.storage.session.get('unseen');
  await chrome.storage.session.set({unseen: unseen + 1});
  chrome.action.setBadgeBackgroundColor({color: '#B84A6C'});
  chrome.action.setBadgeText({text: String(unseen + 1)});
  chrome.notifications.create(id, {type: 'basic', iconUrl: 'icons/128.png', title: heading || 'Saved to Refbox', message: `From ${rec.site}`, priority: 0});
  log(true, rec.site, rec.kind === 'screenshot' ? 'Screenshot saved' : 'Image saved');
}
async function capture(url, page, title) {
  const blob = await fetchImage(url);
  await store(blob, {url, page: page || '', site: siteOf(page, url), name: title || nameFrom(url)});
}

// ---- screenshots: Option+Shift+S or right-click → Save screenshot to Refbox ----
// Sites opened from Awwwards remember the Awwwards case they came from.
async function awwardsCase(url) {
  const {awwContext = {}} = await chrome.storage.session.get('awwContext');
  const c = awwContext[host(url).replace(/^www\./, '')];
  return c && Date.now() - c.at < 60 * 60e3 ? c.case : '';
}
// Runs inside the page: a crosshair like ⇧⌘4. Drag = area, Enter or a plain click = whole screen, Esc = cancel.
function selectArea() {
  return new Promise(resolve => {
    const all = () => ({x: 0, y: 0, w: innerWidth, h: innerHeight, vw: innerWidth});
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:2147483647;cursor:crosshair;background:rgba(0,0,0,.25)';
    const box = document.createElement('div');
    box.style.cssText = 'position:fixed;display:none;pointer-events:none;border:1.5px solid #fff;box-shadow:0 0 0 9999px rgba(0,0,0,.35)';
    const tip = document.createElement('div');
    tip.textContent = 'Drag to select · Enter: whole screen · Esc: cancel';
    tip.style.cssText = 'position:fixed;top:12px;left:50%;transform:translateX(-50%);background:#1c1c21;color:#f2f2f5;font:13px system-ui,sans-serif;padding:6px 12px;border-radius:8px;pointer-events:none';
    ov.append(box, tip); document.documentElement.append(ov);
    let sx = 0, sy = 0, drag = false;
    const finish = r => { ov.remove(); removeEventListener('keydown', key, true); requestAnimationFrame(() => requestAnimationFrame(() => resolve(r))); };
    const key = e => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); finish(null); }
      if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); finish(all()); }
    };
    const rect = e => {
      const x = Math.min(sx, e.clientX), y = Math.min(sy, e.clientY), w = Math.abs(e.clientX - sx), h = Math.abs(e.clientY - sy);
      Object.assign(box.style, {left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px'});
      return {x, y, w, h, vw: innerWidth};
    };
    addEventListener('keydown', key, true);
    ov.addEventListener('mousedown', e => { e.preventDefault(); sx = e.clientX; sy = e.clientY; drag = true; ov.style.background = 'transparent'; tip.style.display = 'none'; box.style.display = 'block'; rect(e); });
    ov.addEventListener('mousemove', e => { if (drag) rect(e); });
    ov.addEventListener('mouseup', e => { if (!drag) return; drag = false; const r = rect(e); finish(r.w < 8 || r.h < 8 ? all() : r); });
  });
}
async function cropTo(blob, r) {
  const bmp = await createImageBitmap(blob), s = bmp.width / r.vw;
  const w = Math.round(r.w * s), h = Math.round(r.h * s);
  const c = new OffscreenCanvas(w, h);
  c.getContext('2d').drawImage(bmp, Math.round(r.x * s), Math.round(r.y * s), w, h, 0, 0, w, h);
  return c.convertToBlob({type: 'image/png'});
}
async function screenshot(tab) {
  if (!tab || !/^https?:/.test(tab.url || '')) {
    return chrome.notifications.create({type: 'basic', iconUrl: 'icons/128.png', title: 'Refbox', message: 'Screenshots work on regular web pages only.'});
  }
  let area;
  try { const [res] = await chrome.scripting.executeScript({target: {tabId: tab.id}, func: selectArea}); area = res && res.result; if (area === null) return; }
  catch (e) { area = undefined; log(false, host(tab.url), 'Could not show the crosshair here, saved the whole screen: ' + e.message); }
  try {
    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {format: 'png'});
    let blob = await (await fetch(dataUrl)).blob();
    if (area && !(area.x === 0 && area.y === 0 && area.w === area.vw)) blob = await cropTo(blob, area);
    const caseUrl = await awwardsCase(tab.url);
    const site = caseUrl ? 'awwwards.com' : SOURCE_HOSTS.test(host(tab.url)) ? siteOf(tab.url) : host(tab.url).replace(/^www\./, '');
    await store(blob, {url: '', page: tab.url, site, caseUrl, name: tab.title || host(tab.url), kind: 'screenshot'}, caseUrl ? 'Awwwards screenshot saved' : 'Screenshot saved to Refbox');
  } catch (e) {
    log(false, host(tab.url), 'Screenshot failed: ' + e.message);
    chrome.notifications.create({type: 'basic', iconUrl: 'icons/128.png', title: 'Refbox could not take the screenshot', message: 'Click the page once, then press Option+Shift+S again.'});
  }
}
chrome.commands.onCommand.addListener((cmd, tab) => { if (cmd === 'screenshot') screenshot(tab); });
chrome.runtime.onMessage.addListener(async msg => {
  if (!msg || msg.type !== 'aww-click') return;
  const {awwContext = {}} = await chrome.storage.session.get('awwContext');
  awwContext[msg.host] = {case: msg.case, at: Date.now()};
  await chrome.storage.session.set({awwContext});
});
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

// The site's own Save / Collect buttons (from content.js)
const recent = new Map();   // url -> time, so a double click saves once
chrome.runtime.onMessage.addListener(msg => {
  if (!msg || msg.type !== 'capture') return;
  (async () => {
    if (!(await enabled())) return;
    const now = Date.now();
    if (now - (recent.get(msg.url) || 0) < 15000) return;
    recent.set(msg.url, now);
    try { await capture(msg.url, msg.page, msg.title); }
    catch (e) { log(false, siteOf(msg.page, msg.url), 'Could not download the image: ' + e.message); chrome.notifications.create({type: 'basic', iconUrl: 'icons/128.png', title: 'Refbox could not save this image', message: 'Try right-click → Save to Refbox.'}); }
  })();
});

// ---- links and link folders ----
async function folders() { const {linkFolders} = await chrome.storage.local.get('linkFolders'); return Array.isArray(linkFolders) && linkFolders.length ? linkFolders : ['Favorites']; }
async function saveLink(url, title, folder) {
  const {links = []} = await chrome.storage.local.get('links');
  const old = links.find(l => l.url === url);
  if (old) old.folder = folder;
  else links.unshift({id: 'l' + Date.now(), name: (title || host(url)).slice(0, 120), url, folder, from: siteOf(url)});
  await chrome.storage.local.set({links});
  chrome.notifications.create({type: 'basic', iconUrl: 'icons/128.png', title: `Saved to ${folder}`, message: title || url});
}

// Right-click menus: "Save to Refbox" on images, "Save link to Refbox ▸ folder" on links and pages
async function buildMenus() {
  await chrome.contextMenus.removeAll();
  chrome.contextMenus.create({id: 'save-image', title: 'Save to Refbox', contexts: ['image']});
  chrome.contextMenus.create({id: 'screenshot', title: 'Save screenshot to Refbox  (⌥⇧S)', contexts: ['page']});
  chrome.contextMenus.create({id: 'link-root', title: 'Save link to Refbox', contexts: ['link', 'page']});
  for (const f of await folders()) chrome.contextMenus.create({id: 'folder:' + f, parentId: 'link-root', title: f, contexts: ['link', 'page']});
  chrome.contextMenus.create({id: 'sep', parentId: 'link-root', type: 'separator', contexts: ['link', 'page']});
  chrome.contextMenus.create({id: 'new-folder', parentId: 'link-root', title: 'New folder…', contexts: ['link', 'page']});
}
chrome.runtime.onInstalled.addListener(buildMenus);
chrome.runtime.onStartup.addListener(buildMenus);
chrome.storage.onChanged.addListener(ch => { if (ch.linkFolders) buildMenus(); });

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'save-image') {
    if (!/^https?:/.test(info.srcUrl || '')) return chrome.notifications.create({type: 'basic', iconUrl: 'icons/128.png', title: 'Refbox', message: 'This image cannot be saved from here. Try opening it in its own tab first.'});
    capture(info.srcUrl, info.pageUrl, tab && tab.title).catch(() => chrome.notifications.create({type: 'basic', iconUrl: 'icons/128.png', title: 'Refbox could not save this image', message: 'The site did not allow the download.'}));
  }
  if (info.menuItemId === 'screenshot') return screenshot(tab);
  const id = String(info.menuItemId);
  if (id.startsWith('folder:')) {
    const url = info.linkUrl || info.pageUrl;
    saveLink(url, info.linkUrl ? (info.selectionText || host(url)) : tab && tab.title, id.slice(7));
  }
  if (id === 'new-folder') {
    await chrome.storage.session.set({pendingLink: {url: info.linkUrl || info.pageUrl, title: info.linkUrl ? host(info.linkUrl) : tab && tab.title}});
    openApp('links');
  }
});
chrome.runtime.onMessage.addListener(msg => { if (msg && msg.type === 'save-link') saveLink(msg.url, msg.title, msg.folder); });

// Toolbar icon opens the library (reusing an open tab)
async function openApp(view) {
  const base = chrome.runtime.getURL('app.html'), url = typeof view === 'string' ? base + '#' + view : base;
  const [t] = await chrome.tabs.query({url: base + '*'});
  if (t) { await chrome.tabs.update(t.id, {active: true, url}); await chrome.windows.update(t.windowId, {focused: true}); }
  else await chrome.tabs.create({url});
  await chrome.storage.session.set({unseen: 0}); chrome.action.setBadgeText({text: ''});
}
chrome.action.onClicked.addListener(() => openApp());
chrome.notifications.onClicked.addListener(() => openApp());
