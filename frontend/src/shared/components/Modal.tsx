import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(event) => {
        if (event.target === overlayRef.current) onClose();
      }}
    >
      <div
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
    </div>
  );
}
