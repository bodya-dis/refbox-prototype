// Runs in the page itself: lets Refbox notice when a site's own "Copy link" button copies a link.
(() => {
  const clip = navigator.clipboard;
  if (!clip || !clip.writeText) return;
  const original = clip.writeText.bind(clip);
  clip.writeText = text => {
    try { if (/^https?:\/\/\S+$/.test(String(text).trim())) window.postMessage({refboxCopiedLink: String(text).trim()}, location.origin); } catch (e) {}
    return original(text);
  };
})();
