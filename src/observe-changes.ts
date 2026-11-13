// Watch relevant DOM changes, batch updates into a frame, and return cleanup.
// Each feature supplies its own filter and update function.
export function observeChanges(
  doc: Document,
  affectsFeature: (record: MutationRecord) => boolean,
  update: () => void,
  options: MutationObserverInit = {
    childList: true,
    characterData: true,
    subtree: true,
  },
): () => void {
  const win = doc.defaultView;
  if (!win) return () => {};
  let frame: number | undefined;

  const observer = new win.MutationObserver((records) => {
    if (frame === undefined && records.some(affectsFeature)) {
      frame = win.requestAnimationFrame(() => {
        frame = undefined;
        update();
      });
    }
  });

  // Observe before the initial pass so changes made by update are also seen.
  observer.observe(doc.documentElement, options);
  update();

  return () => {
    observer.disconnect();
    if (frame !== undefined) win.cancelAnimationFrame(frame);
  };
}
