// Refbox: when you press a site's own Save / Collect button, the image you saved also goes to Refbox.
(() => {
  const SAVE = /^(save|save to board|save pin|collect|add to collection|сохранить|зберегти|в коллекцию|до колекції)$/i;
  const TEST_ID = /save|collect/i;

  const label = b => (b.getAttribute('aria-label') || b.title || (b.innerText || '').split('\n')[0] || '').trim()
    || ((b.querySelector('svg[aria-label]') || {}).getAttribute?.('aria-label') || '').trim();

  // Walk up from what was clicked: the Save button is often a plain div inside the pin's link,
  // so check each level's own label instead of stopping at the first button or link.
  function saveButton(target) {
    let el = target instanceof Element ? target : target.parentElement;
    for (let i = 0; el && i < 6; i++, el = el.parentElement) {
      const own = (el.getAttribute('aria-label') || el.title || '').trim();
      const text = (el.innerText || '').trim();
      if (SAVE.test(own) || (text.length <= 30 && SAVE.test(text)) || TEST_ID.test(el.getAttribute('data-test-id') || '')) return el;
      if (el.matches('button, [role="button"]') && SAVE.test(label(el))) return el;
    }
    return null;
  }

  const area = im => { const r = im.getBoundingClientRect(); return r.width * r.height; };
  const visible = im => { const r = im.getBoundingClientRect(); return r.width >= 150 && r.height >= 150 && r.bottom > 0 && r.top < innerHeight; };
  const largest = list => list.filter(visible).sort((x, y) => area(y) - area(x))[0];

  // the media that belongs to this button: a video wins over an image in the same card or post
  const vids = node => [...node.querySelectorAll('video')].filter(visible).sort((x, y) => area(y) - area(x));
  function mediaFor(button) {
    let node = button.parentElement;
    for (let i = 0; i < 10 && node; i++, node = node.parentElement) {
      const v = vids(node)[0]; if (v) return {video: v};
      const im = largest([...node.querySelectorAll('img')]); if (im) return {img: im};
    }
    const v = vids(document)[0]; if (v) return {video: v};
    const im = largest([...document.images]); return im ? {img: im} : null;
  }
  const abs = u => { try { return new URL(u, location.href).href; } catch (e) { return u || ''; } };
  function videoSrc(v) {
    const s = v.currentSrc || v.src || ((v.querySelector('source[src]') || {}).src) || '';
    return abs(s);
  }

  function bestSrc(im) {
    const set = (im.getAttribute('srcset') || '').split(',').map(s => s.trim().split(/\s+/)).filter(p => p[0]);
    const pick = set.sort((a, b) => parseFloat(b[1] || 0) - parseFloat(a[1] || 0))[0];
    const url = pick ? pick[0] : (im.currentSrc || im.src);
    try { return new URL(url, location.href).href; } catch (e) { return url; }
  }

  // ---- "Save link to…" after you copy a link ----
  let box = null, timer = null;
  async function offerLink(url) {
    const {linkFolders = ['Favorites']} = await chrome.storage.local.get('linkFolders');
    if (box) box.remove();
    box = document.createElement('div');
    const root = box.attachShadow({mode: 'closed'});
    root.innerHTML = `<style>
      .b{position:fixed;right:16px;bottom:16px;z-index:2147483647;background:#1c1c21;color:#f2f2f5;border:1px solid #2e2e37;border-radius:12px;padding:12px;width:300px;font:13px/1.4 system-ui,sans-serif;box-shadow:0 12px 40px rgba(0,0,0,.45);display:flex;flex-direction:column;gap:8px}
      .t{font-weight:600}.u{color:#a0a0ac;font:12px ui-monospace,monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .r{display:flex;gap:6px}select{flex:1;min-width:0;height:30px;border-radius:7px;border:1px solid #2e2e37;background:#25252c;color:inherit;padding:0 6px}
      button{height:30px;border-radius:7px;border:0;padding:0 12px;font:inherit;cursor:pointer}.s{background:#d4386c;color:#fff;font-weight:600}.x{background:#25252c;color:#a0a0ac}</style>
      <div class="b" role="dialog" aria-label="Save link to Refbox"><span class="t">Save link to Refbox?</span><span class="u"></span>
      <div class="r"><select aria-label="Folder"></select><button class="s">Save</button><button class="x" aria-label="Close">×</button></div></div>`;
    root.querySelector('.u').textContent = url;
    const sel = root.querySelector('select');
    for (const f of linkFolders) sel.append(new Option(f, f));
    root.querySelector('.s').onclick = () => { chrome.runtime.sendMessage({type: 'save-link', url, title: document.title, folder: sel.value}); box.remove(); box = null; };
    root.querySelector('.x').onclick = () => { box.remove(); box = null; };
    box.addEventListener('mouseenter', () => clearTimeout(timer));
    document.documentElement.append(box);
    clearTimeout(timer); timer = setTimeout(() => { if (box) { box.remove(); box = null; } }, 8000);
  }
  document.addEventListener('copy', () => {
    const text = String(getSelection() || '').trim();
    if (/^https?:\/\/\S+$/.test(text)) offerLink(text);
  });
  window.addEventListener('message', e => {
    if (e.source === window && e.data && typeof e.data.refboxCopiedLink === 'string') offerLink(e.data.refboxCopiedLink);
  });

  // On Awwwards: remember which site you open, so its screenshots count as Awwwards screenshots
  if (/(^|\.)awwwards\.com$/.test(location.hostname)) {
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href]');
      if (!a) return;
      try {
        const h = new URL(a.href, location.href).hostname.replace(/^www\./, '');
        if (h && !/awwwards\.com$/.test(h)) chrome.runtime.sendMessage({type: 'aww-click', host: h, case: location.href});
      } catch (err) {}
    }, true);
  }

  document.addEventListener('click', e => {
    const b = saveButton(e.target);
    if (!b) return;
    const m = mediaFor(b);
    if (!m) return chrome.runtime.sendMessage({type: 'log', ok: false, site: location.hostname, text: 'Save pressed, but no image or video was found next to it'});
    if (m.video && window.__refboxVideo) return window.__refboxVideo.save(m.video);   // video.js: file or recording
    if (m.video) {
      const src = videoSrc(m.video), poster = m.video.poster ? abs(m.video.poster) : (largest([...(m.video.closest('article, [data-test-id]') || document).querySelectorAll('img')]) || {}).src;
      return chrome.runtime.sendMessage({type: 'capture', url: /^https?:/.test(src) ? src : (poster || ''), poster, page: location.href, title: document.title});
    }
    const im = m.img;
    const url = bestSrc(im);
    if (!/^https?:/.test(url)) return chrome.runtime.sendMessage({type: 'log', ok: false, site: location.hostname, text: 'This image cannot be downloaded directly (it is not a regular web address)'});
    chrome.runtime.sendMessage({type: 'capture', url, page: location.href, title: document.title});
  }, true);
})();
