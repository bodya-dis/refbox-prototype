// Refbox: when you press a site's own Save / Collect button, the image you saved also goes to Refbox.
(() => {
  const SAVE = /^(save|save to board|save pin|collect|add to collection|сохранить|зберегти|в коллекцию|до колекції)$/i;
  const TEST_ID = /save|collect/i;

  const label = b => (b.getAttribute('aria-label') || b.title || (b.innerText || '').split('\n')[0] || '').trim()
    || ((b.querySelector('svg[aria-label]') || {}).getAttribute?.('aria-label') || '').trim();

  function saveButton(target) {
    const b = target.closest('button, [role="button"], a');
    if (!b) return null;
    return SAVE.test(label(b)) || TEST_ID.test(b.getAttribute('data-test-id') || '') ? b : null;
  }

  const area = im => { const r = im.getBoundingClientRect(); return r.width * r.height; };
  const visible = im => { const r = im.getBoundingClientRect(); return r.width >= 150 && r.height >= 150 && r.bottom > 0 && r.top < innerHeight; };
  const largest = list => list.filter(visible).sort((x, y) => area(y) - area(x))[0];

  // the image that belongs to this button: nearest card or post first, then the biggest image on screen
  function imageFor(button) {
    let node = button.parentElement;
    for (let i = 0; i < 10 && node; i++, node = node.parentElement) {
      const im = largest([...node.querySelectorAll('img')]);
      if (im) return im;
    }
    return largest([...document.images]);
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

  document.addEventListener('click', e => {
    const b = saveButton(e.target);
    if (!b) return;
    const im = imageFor(b);
    if (!im) return;
    const url = bestSrc(im);
    if (!/^https?:/.test(url)) return;
    chrome.runtime.sendMessage({type: 'capture', url, page: location.href, title: document.title});
  }, true);
})();
