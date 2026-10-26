// Refbox: "Save to Refbox" on any video. A plain video file is downloaded as is;
// a streamed video (Pinterest, Instagram) is recorded from the page for one loop, up to 30 seconds.
(() => {
  if (window.__refboxVideo) return;
  const MAX_SECONDS = 30, MIN_SIZE = 120;
  const abs = u => { try { return new URL(u, location.href).href; } catch (e) { return u || ''; } };
  const srcOf = v => abs(v.currentSrc || v.src || ((v.querySelector('source[src]') || {}).src) || '');
  const send = msg => new Promise(res => { try { chrome.runtime.sendMessage(msg, r => res(r || {ok: false, error: chrome.runtime.lastError && chrome.runtime.lastError.message})); } catch (e) { res({ok: false, error: e.message}); } });

  // ---- one floating button, shown over the video under the pointer ----
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;z-index:2147483646;left:0;top:0;display:none';
  const root = host.attachShadow({mode: 'closed'});
  root.innerHTML = `<style>
    b{all:initial;display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 12px;border-radius:15px;background:rgba(17,17,20,.88);color:#f2f2f5;
      font:600 12.5px system-ui,-apple-system,sans-serif;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.35);white-space:nowrap}
    b:hover{background:#B84A6C} b.busy{cursor:default;background:#B84A6C} b.done{background:#1f7a46} b.fail{background:#9b2c2c}
    i{width:8px;height:8px;border-radius:50%;background:#fff;display:none} b.busy i{display:block;animation:p 1s infinite} @keyframes p{50%{opacity:.3}}
  </style><b role="button" tabindex="0"><i></i><span>Save to Refbox</span></b>`;
  const btn = root.querySelector('b'), label = root.querySelector('span');
  let target = null, busy = false;
  const put = v => { const r = v.getBoundingClientRect(); host.style.left = Math.max(8, r.left + 10) + 'px'; host.style.top = Math.max(8, r.top + 10) + 'px'; host.style.display = 'block'; };
  const state = (cls, text) => { btn.className = cls; label.textContent = text; };
  const reset = () => { busy = false; state('', 'Save to Refbox'); };
  document.documentElement.append(host);

  function videoAt(x, y) {
    for (const v of document.querySelectorAll('video')) {
      const r = v.getBoundingClientRect();
      if (r.width >= MIN_SIZE && r.height >= MIN_SIZE && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return v;
    }
    return null;
  }
  let last = 0;
  document.addEventListener('mousemove', e => {
    if (busy || Date.now() - last < 120) return;
    last = Date.now();
    if (e.composedPath().includes(host)) return;
    const v = videoAt(e.clientX, e.clientY);
    if (v) { target = v; put(v); } else { host.style.display = 'none'; target = null; }
  }, {passive: true});
  addEventListener('scroll', () => { if (!busy) host.style.display = 'none'; }, {passive: true, capture: true});
  const go = e => { e.preventDefault(); e.stopPropagation(); if (target && !busy) save(target); };
  btn.addEventListener('click', go);
  btn.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') go(e); });
  ['pointerdown', 'mousedown', 'mouseup'].forEach(t => host.addEventListener(t, e => e.stopPropagation()));

  // ---- recording a streamed video for one loop ----
  function record(v, progress) {
    return new Promise(async (resolve, reject) => {
      const wasPaused = v.paused;
      try {
        if (v.currentTime > 0.3 && isFinite(v.duration)) { v.currentTime = 0; await new Promise(ok => { v.addEventListener('seeked', ok, {once: true}); setTimeout(ok, 1500); }); }
        if (v.paused) { v.muted = true; await v.play(); }
      } catch (e) {}
      let stream;
      try {
        const cap = v.captureStream ? v.captureStream() : v.mozCaptureStream ? v.mozCaptureStream() : null;
        if (!cap) throw new Error('This browser cannot record videos');
        for (let k = 0; k < 20 && !cap.getVideoTracks().length; k++) await new Promise(ok => setTimeout(ok, 100));
        stream = new MediaStream(cap.getVideoTracks());
        if (!stream.getVideoTracks().length) throw new Error('The video has no picture to record');
      } catch (e) { return reject(e); }
      const type = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'].find(t => window.MediaRecorder && MediaRecorder.isTypeSupported(t));
      let rec;
      try { rec = new MediaRecorder(stream, {mimeType: type, videoBitsPerSecond: 4e6}); }
      catch (e) { return reject(e); }
      const chunks = [], limit = Math.min(isFinite(v.duration) && v.duration > 0 ? v.duration : 10, MAX_SECONDS);
      let lastT = v.currentTime, start = performance.now(), timer;
      const stop = () => { clearInterval(timer); v.removeEventListener('ended', stop); if (rec.state !== 'inactive') rec.stop(); };
      rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
      rec.onerror = e => { clearInterval(timer); reject(e.error || new Error('Recording failed')); };
      rec.onstop = () => { if (wasPaused) try { v.pause(); } catch (e) {} resolve({blob: new Blob(chunks, {type: (type || 'video/webm').split(';')[0]}), seconds: (performance.now() - start) / 1000}); };
      v.addEventListener('ended', stop);
      timer = setInterval(() => {
        const s = (performance.now() - start) / 1000;
        progress(Math.min(s, limit), limit);
        if (s > 0.6 && v.currentTime + 0.2 < lastT) return stop();   // looped back to the start: one full loop recorded
        lastT = v.currentTime;
        if (s >= limit + 0.2) stop();
      }, 100);
      rec.start(500);
    });
  }
  const toDataUrl = blob => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); r.readAsDataURL(blob); });

  async function save(v) {
    busy = true; target = v; put(v); state('busy', 'Saving…');
    const meta = {page: location.href, title: document.title};
    const src = srcOf(v);
    try {
      if (/^https?:/.test(src) && !/\.m3u8(\?|$)/i.test(src)) {
        const r = await send({type: 'video-file', url: src, ...meta});
        if (r.ok) { state('done', '✓ Saved to Refbox'); return setTimeout(() => { reset(); host.style.display = 'none'; }, 1800); }
      }
      const {blob, seconds} = await record(v, (s, total) => state('busy', `Recording ${Math.floor(s)} / ${Math.ceil(total)} s`));
      if (!blob.size) throw new Error('Nothing was recorded');
      state('busy', 'Saving…');
      const r = await send({type: 'video-data', dataUrl: await toDataUrl(blob), seconds, cut: isFinite(v.duration) && v.duration > MAX_SECONDS + 1, ...meta});
      if (!r.ok) throw new Error(r.error || 'Refbox did not answer');
      state('done', '✓ Saved to Refbox');
    } catch (e) {
      send({type: 'log', ok: false, site: location.hostname, text: 'Could not save the video: ' + (e && e.message || e) + '. Try ⌥⇧S for a screenshot'});
      state('fail', 'Could not save this video');
    }
    setTimeout(() => { reset(); host.style.display = 'none'; }, 2200);
  }

  // used by the ⌥⇧V shortcut and by the right-click menu: the biggest video on screen
  function saveLargest() {
    const vs = [...document.querySelectorAll('video')].map(v => [v, v.getBoundingClientRect()])
      .filter(([, r]) => r.width >= MIN_SIZE && r.height >= MIN_SIZE && r.bottom > 0 && r.top < innerHeight)
      .sort((a, b) => b[1].width * b[1].height - a[1].width * a[1].height);
    if (!vs.length) return send({type: 'log', ok: false, site: location.hostname, text: 'No video on screen to save'});
    if (!busy) save(vs[0][0]);
  }
  window.__refboxVideo = {save: v => { if (!busy) save(v); }, saveLargest};
})();
