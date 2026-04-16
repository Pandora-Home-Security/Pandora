import { useState } from 'react';
import './ConfirmModal.css';

type ConfirmModalProps = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
};

function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Potvrdi',
  cancelText = 'Odustani',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="confirm-backdrop" onClick={onCancel}>
      <div className="confirm-content" onClick={(e) => e.stopPropagation()}>
        {danger && (
          <div className="confirm-icon-wrap">
            <svg viewBox="0 0 20 20" fill="currentColor" className="confirm-icon">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </div>
        )}
        <h3 className="confirm-title">{title}</h3>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button
            type="button"
            className="confirm-btn confirm-btn-cancel"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`confirm-btn ${danger ? 'confirm-btn-danger' : 'confirm-btn-primary'}`}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Brisanje...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
