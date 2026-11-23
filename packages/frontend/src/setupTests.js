import '@testing-library/jest-dom/vitest';

// jsdom no implementa <dialog>.showModal() ni .close(). ConfirmDialog los usa, así que se
// agregan versiones mínimas que solo prenden o apagan el atributo `open`.
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close() {
    this.open = false;
    this.dispatchEvent(new Event('close'));
  };
}
