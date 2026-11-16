import { createTextConverter } from "./text-conversion.ts";
import { observeChanges } from "./observe-changes.ts";

interface ScopedConversionOptions {
  rootSelector: string;
  // Matches descendants inside each root, not the root itself.
  textSelector: string;
  // Omit to watch only added/removed nodes and text changes.
  attributeFilter?: string[];
}

export function startScopedConversion(
  doc: Document,
  { rootSelector, textSelector, attributeFilter }: ScopedConversionOptions,
): () => void {
  const win = doc.defaultView;
  if (!win) return () => {};
  const convertElementText = createTextConverter(doc);

  function update() {
    for (const root of doc.querySelectorAll(rootSelector)) {
      for (const element of root.querySelectorAll(textSelector)) {
        convertElementText(element);
      }
    }
  }

  function affectsScope(record: MutationRecord): boolean {
    const element = record.target.nodeType === win!.Node.ELEMENT_NODE
      ? record.target as Element
      : record.target.parentElement;
    if (element?.closest(rootSelector)) return true;

    // A feature can appear later, either directly or inside a new container.
    return Array.from(record.addedNodes).some(node => {
      if (node.nodeType !== win!.Node.ELEMENT_NODE) return false;
      const added = node as Element;
      return added.matches(rootSelector) || !!added.querySelector(rootSelector);
    });
  }

  const options: MutationObserverInit = {
    childList: true,
    characterData: true,
    subtree: true,
  };
  if (attributeFilter !== undefined) {
    options.attributes = true;
    options.attributeFilter = attributeFilter;
  }
  return observeChanges(doc, affectsScope, update, options);
}
