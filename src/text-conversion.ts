import { Converter } from "opencc-js/t2cn";

// Create once, then reuse the returned function for each selected element.
// The converter and cache survive between calls to convertElementText.
export function createTextConverter(doc: Document): (element: Element) => void {
  const win = doc.defaultView;
  if (!win) return () => {};

  const convert = Converter({ from: "t", to: "cn" });
  // Weak keys let Spotify's discarded nodes be garbage-collected.
  const lastText = new WeakMap<Text, string>();

  return function convertElementText(element: Element): void {
    const walker = doc.createTreeWalker(element, win.NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const text = node as Text;
      if (lastText.get(text) === text.data) continue;

      const converted = convert(text.data);
      // Change only text, preserving links, handlers, and nested markup.
      if (converted !== text.data) text.data = converted;
      lastText.set(text, converted);
    }
  };
}
