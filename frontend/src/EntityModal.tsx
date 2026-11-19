import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AppIcon } from './AppIcon';

/**
 * Global modal layer. Rendering within animated page cards made fixed dialogs
 * relative to a transformed/scrolling ancestor (page-enter transform), so a
 * clicked Add button could mount a dialog that was clipped out of view.
 * A body portal escapes BOTH tenant workspace and Platform scroll containers.
 */
export function EntityModal({ title, subtitle, children, onClose, busy = false, error }: {
  title: string; subtitle?: string; children: ReactNode; onClose: () => void; busy?: boolean; error?: string;
}) {
  const dialogRef = useRef<HTMLElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const subtitleId = useId();
  const closeRef = useRef(onClose);
  const busyRef = useRef(busy);
  closeRef.current = onClose;
  busyRef.current = busy;

  useEffect(() => {
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    const focusables = () => Array.from(dialog?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    ) ?? []).filter(node => node.getClientRects().length > 0 && node.tabIndex >= 0);

    // Focus the first form control or the close button.
    (dialog?.querySelector<HTMLElement>('input:not([disabled]), select:not([disabled]), textarea:not([disabled])')
      ?? focusables()[0] ?? dialog)?.focus();

    // Stop wheel/keyboard focus from escaping into the underlying workspace.
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (!busyRef.current) {
          event.preventDefault();
          event.stopPropagation();
          closeRef.current();
        }
        return;
      }
      if (event.key !== 'Tab') return;
      const nodes = focusables();
      if (!nodes.length) {
        event.preventDefault();
        dialog?.focus();
        return;
      }
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialog?.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog?.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown, true);
    document.body.classList.add('entity-dialog-active');
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.body.classList.remove('entity-dialog-active');
      previousFocus.current?.focus();
    };
  }, []);

  return createPortal(
    <div className="entity-modal-backdrop" onMouseDown={event => {
      if (!busy && event.target === event.currentTarget) onClose();
    }}>
      <section ref={dialogRef} role="dialog" aria-modal="true"
        aria-labelledby={titleId} aria-describedby={subtitle ? subtitleId : undefined}
        tabIndex={-1} className="entity-modal">
        <header className="entity-modal-header">
          <div><span className="small-overline">AH POS / RECORD ENTRY</span><h2 id={titleId}>{title}</h2>
            {subtitle && <p id={subtitleId}>{subtitle}</p>}</div>
          <button type="button" className="entity-modal-close" onClick={onClose} disabled={busy}
            aria-label="Close dialog"><AppIcon name="logout" size={17}/></button>
        </header>
        <div className="entity-modal-body">{error && <p className="inline-alert" role="alert">{error}</p>}{children}</div>
      </section>
    </div>,
    document.body,
  );
}

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return <div className="table-skeleton" role="status" aria-label="Loading records">
    {Array.from({ length: rows }, (_, row) => <div key={row} className="skeleton-row">
      {Array.from({ length: cols }, (_, col) => <span key={col} className="skeleton-cell"
        style={{width: col === 1 ? '25%' : col === 0 ? '12%' : '15%'}}/>)}
    </div>)}
  </div>;
}
