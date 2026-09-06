export type EditableElement = HTMLInputElement | HTMLTextAreaElement;

function isEditableElement(el: Element | null): el is EditableElement {
    return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA");
}

/** Retorna `el` tipado como campo editável, ou `null` se não for um input/textarea. */
export function asEditableElement(el: Element | null): EditableElement | null {
    return isEditableElement(el) ? el : null;
}

/**
 * Texto selecionado no elemento editável informado (se houver), ou a seleção de texto da página
 * como um todo. Recebe o elemento explicitamente (em vez de reler `document.activeElement`)
 * porque, no momento em que uma ação do menu de contexto executa, o foco real já pode ter saído
 * do campo original — ele foi pro próprio botão do menu que acabou de ser clicado.
 */
export function getSelectionText(editableTarget: EditableElement | null): string {
    if (editableTarget && editableTarget.selectionStart != null && editableTarget.selectionEnd != null && editableTarget.selectionStart !== editableTarget.selectionEnd) {
        return editableTarget.value.substring(editableTarget.selectionStart, editableTarget.selectionEnd);
    }
    return window.getSelection()?.toString() ?? "";
}

/**
 * Setar `.value` direto no DOM não atualiza o estado de um input controlado pelo React — ele só
 * reage a eventos reais. Este é o truque padrão pra contornar isso: usa o setter nativo do
 * protótipo (que o React não sobrescreveu) e dispara um evento `input` de verdade.
 */
function setNativeValue(element: EditableElement, value: string): void {
    const prototype = element instanceof HTMLTextAreaElement ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
    setter?.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
}

/** Insere `text` na posição do cursor de `element`. */
export function pasteIntoElement(element: EditableElement, text: string): void {
    element.focus();
    const start = element.selectionStart ?? element.value.length;
    const end = element.selectionEnd ?? element.value.length;
    const newValue = element.value.slice(0, start) + text + element.value.slice(end);
    setNativeValue(element, newValue);

    const caret = start + text.length;
    requestAnimationFrame(() => element.setSelectionRange(caret, caret));
}

/** Remove o texto selecionado de `element` e devolve o que foi removido (pra copiar). */
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
