import { useState } from 'react';

/**
 * DeleteConfirmModal Component
 * 
 * Demonstrates:
 * 1. Safe Deletion Workflow: Prompts user before dispatching irreversible DELETE requests.
 * 2. Visual Context: Displays the specific note title being removed.
 * 3. Loading State: Disables buttons and shows in-progress feedback during server deletion.
 */
export default function DeleteConfirmModal({ isOpen, note, onClose, onConfirmDelete }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen || !note) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMessage('');
    try {
      await onConfirmDelete(note.id || note._id, note.title);
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to delete note from database.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content modal-content-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-cherry-blossom">⚠️</span>
            <h2 className="modal-title">Delete Knowledge Node</h2>
          </div>
          <button 
            type="button" 
            className="modal-close-btn" 
            onClick={onClose}
            aria-label="Close delete modal"
            disabled={isDeleting}
          >
            ✕
          </button>
        </div>

        <p className="delete-modal-text">
          Are you sure you want to remove <strong className="text-neon-pink">"{note.title}"</strong> from your knowledge mesh?
        </p>
        <p className="delete-modal-subtext">
          This action is permanent and will delete the document directly from your MongoDB Atlas database.
        </p>

        {errorMessage && (
          <div className="modal-error-banner">
            ⚠️ {errorMessage}
          </div>
        )}

        <div className="modal-actions">
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className="btn btn-danger"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? '🗑️ Deleting...' : '🗑️ Delete Permanently'}
          </button>
        </div>
      </div>
    </div>
  );
}
