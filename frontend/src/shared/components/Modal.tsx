import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface ModalProps {
  titleId: string;
  title: string;
  onClose: () => void;
  children: ReactNode;
  contentClassName?: string;
  headerClassName?: string;
  titleClassName?: string;
  closeButtonClassName?: string;
  closeLabel?: string;
}

// Minimal accessible dialog: traps Escape-to-close and closes on overlay click.
export function Modal({
  titleId,
  title,
  onClose,
  children,
  contentClassName,
  headerClassName,
  titleClassName,
  closeButtonClassName,
  closeLabel = 'Close',
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    // Restore focus to whatever triggered the modal once it unmounts.
    const triggerElement = document.activeElement as HTMLElement | null;
    const content = contentRef.current;
    const firstFocusable = content?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    (firstFocusable ?? closeButtonRef.current)?.focus();

    const handleTabTrap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !content) return;
      const focusable = Array.from(content.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleTabTrap);

    return () => {
      document.removeEventListener('keydown', handleTabTrap);
      triggerElement?.focus();
    };
  }, []);

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === overlayRef.current) onClose();
      }}
    >
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={
          contentClassName ??
          'max-h-[90vh] w-full max-w-lg overflow-auto rounded bg-white p-4 shadow-lg'
        }
      >
        <div className={headerClassName ?? 'mb-3 flex items-center justify-between'}>
          <h2 id={titleId} className={titleClassName ?? 'text-lg font-bold capitalize'}>
            {title}
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className={closeButtonClassName ?? 'rounded p-1 text-gray-500 hover:bg-gray-100'}
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}


