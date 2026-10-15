const liveRegion = document.querySelector<HTMLElement>('[role="status"]');
const dismissMessage = document.querySelector<HTMLButtonElement>('.notification-close');
const wrapControl = document.querySelector<HTMLElement>('.wrap-control');
const wrapInput = document.querySelector<HTMLInputElement>('#wrap-lines');
let announcementTimer: ReturnType<typeof setTimeout> | undefined;
let lastCopyButton: HTMLButtonElement | undefined;

function announce(message: string): void {
  if (!liveRegion) return;
  clearTimeout(announcementTimer);
  liveRegion.textContent = '';
  announcementTimer = setTimeout(() => {
    liveRegion.textContent = message;
    if (dismissMessage) dismissMessage.hidden = false;
  }, 30);
}

dismissMessage?.addEventListener('click', () => {
  clearTimeout(announcementTimer);
  if (liveRegion) liveRegion.textContent = '';
  dismissMessage.hidden = true;
  lastCopyButton?.focus({ preventScroll: true });
});

if (wrapInput && wrapControl) {
  wrapControl.hidden = false;
  wrapInput.addEventListener('change', () => {
    document.documentElement.classList.toggle('unwrapped', !wrapInput.checked);
  });
}

document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((button) => {
  button.hidden = false;
  button.addEventListener('click', async () => {
    lastCopyButton = button;
    const output = document.getElementById(button.dataset.copy ?? '');
    const text = output?.textContent;
    if (text === undefined || text === null) return;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text);
      announce(`${button.getAttribute('aria-label')?.replace(/^Copy /, '')} copied.`);
    } catch {
      // Native text selection can discard a final newline. Downloads preserve every byte.
      button.closest('section')?.querySelector<HTMLAnchorElement>('.output-meta a')?.focus({ preventScroll: true });
      announce('Clipboard unavailable. Use Download output to save the exact text.');
    } finally {
      button.disabled = false;
      button.removeAttribute('aria-busy');
    }
  });
});
