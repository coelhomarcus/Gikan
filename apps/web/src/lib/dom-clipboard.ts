export type EditableElement = HTMLInputElement | HTMLTextAreaElement;

function isEditableElement(el: Element | null): el is EditableElement {
    return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA");
}

/** Returns `el` typed as an editable field, or `null` if it is not an input/textarea. */
export function asEditableElement(el: Element | null): EditableElement | null {
    return isEditableElement(el) ? el : null;
}

/**
 * Text selected in the provided editable element, if any, or the page's text selection as a whole.
 * The element is received explicitly instead of rereading `document.activeElement` because the
 * real focus may have left the original field when a context-menu action runs — it moved to the
 * menu button that was just clicked.
 */
export function getSelectionText(editableTarget: EditableElement | null): string {
    if (
        editableTarget &&
        editableTarget.selectionStart != null &&
        editableTarget.selectionEnd != null &&
        editableTarget.selectionStart !== editableTarget.selectionEnd
    ) {
        return editableTarget.value.substring(editableTarget.selectionStart, editableTarget.selectionEnd);
    }
    return window.getSelection()?.toString() ?? "";
}

/**
 * Setting `.value` directly in the DOM does not update a React-controlled input — it only reacts
 * to real events. This standard workaround uses the native prototype setter (which React has not
 * overwritten) and dispatches a real `input` event.
 */
function setNativeValue(element: EditableElement, value: string): void {
    const prototype = element instanceof HTMLTextAreaElement ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
    setter?.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
}

/** Inserts `text` at the cursor position in `element`. */
export function pasteIntoElement(element: EditableElement, text: string): void {
    element.focus();
    const start = element.selectionStart ?? element.value.length;
    const end = element.selectionEnd ?? element.value.length;
    const newValue = element.value.slice(0, start) + text + element.value.slice(end);
    setNativeValue(element, newValue);

    const caret = start + text.length;
    requestAnimationFrame(() => element.setSelectionRange(caret, caret));
}

/** Removes the selected text from `element` and returns what was removed (for copying). */
export function cutFromElement(element: EditableElement): string | null {
    if (element.selectionStart == null || element.selectionEnd == null) return null;

    const { selectionStart: start, selectionEnd: end } = element;
    if (start === end) return null;

    const cutText = element.value.substring(start, end);
    element.focus();
    setNativeValue(element, element.value.slice(0, start) + element.value.slice(end));
    requestAnimationFrame(() => element.setSelectionRange(start, start));

    return cutText;
}
