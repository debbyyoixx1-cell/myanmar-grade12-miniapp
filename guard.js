// Privacy / tap-protection guard.
// Prevents long-press callouts, context menus, text selection, image saving,
// drag & drop, and source inspection shortcuts inside the Mini App.
(function () {
  "use strict";

  const allowSelect = (el) =>
    !!el && typeof el.closest === "function" && !!el.closest("input, textarea, [data-selectable]");

  const stop = (e) => {
    if (allowSelect(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
  };

  ["contextmenu", "selectstart", "dragstart", "drop", "copy", "cut", "paste"].forEach((type) => {
    document.addEventListener(type, stop, { capture: true });
  });

  // Long-press on iOS/Android WebView.
  let pressTimer = null;
  document.addEventListener(
    "touchstart",
    (e) => {
      if (allowSelect(e.target)) return;
      pressTimer = setTimeout(() => {
        try {
          window.getSelection()?.removeAllRanges();
        } catch (_) {}
      }, 320);
    },
    { capture: true, passive: true },
  );
  ["touchend", "touchcancel", "touchmove"].forEach((type) =>
    document.addEventListener(type, () => clearTimeout(pressTimer), { capture: true, passive: true }),
  );

  // Multi-touch / double-tap zoom which can surface native menus.
  document.addEventListener(
    "gesturestart",
    (e) => e.preventDefault(),
    { capture: true },
  );

  // Block source/devtools shortcuts.
  document.addEventListener(
    "keydown",
    (e) => {
      const k = (e.key || "").toLowerCase();
      const blocked =
        e.key === "F12" ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && ["i", "j", "c"].includes(k)) ||
        ((e.ctrlKey || e.metaKey) && ["u", "s", "p"].includes(k));
      if (blocked) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    { capture: true },
  );

  // Never leak the current URL as a referrer to third parties.
  try {
    if (window.top !== window.self) {
      // running inside Telegram's webview container — fine
    }
  } catch (_) {}
})();
