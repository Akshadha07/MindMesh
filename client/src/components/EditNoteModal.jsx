import { useState, useEffect } from 'react';

/**
 * EditNoteModal Component
 * 
 * Demonstrates:
 * 1. Pre-populated Form Inputs: Synchronizes local state with the `note` prop being edited.
 * 2. PATCH Integration: Submits partial updates to MongoDB via `onUpdateNote`.
 * 3. Loading & Feedback: Shows in-progress button state and validation errors.
 */
export default function EditNoteModal({ isOpen, note, onClose, onUpdateNote }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Artificial Intelligence');
  const [tagsInput, setTagsInput] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state whenever the selected note changes
  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setDescription(note.description || '');
      setCategory(note.category || 'General');
      setTagsInput(Array.isArray(note.tags) ? note.tags.join(', ') : '');
      setValidationError('');
    }
  }, [note]);

  if (!isOpen || !note) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setValidationError('Please enter a note title.');
      return;
    }

    if (!description.trim()) {
      setValidationError('Please enter a note description.');
      return;
    }

    const processedTags = tagsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    const updatePayload = {
      title: title.trim(),
      description: description.trim(),
      category: category.trim() || 'General',
      tags: processedTags.length > 0 ? processedTags : ['General'],
    };

    setIsSubmitting(true);
    setValidationError('');

    try {
      await onUpdateNote(note.id || note._id, updatePayload);
      onClose();
    } catch (err) {
      setValidationError(err.message || 'Failed to update note in database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-cherry-blossom">✏️</span>
            <h2 className="modal-title">Edit Knowledge Node</h2>
          </div>
          <button 
            type="button" 
            className="modal-close-btn" 
            onClick={onClose}
            aria-label="Close edit modal"
            disabled={isSubmitting}
          >
            ✕
          </button>
        </div>

        <div className="modal-state-notice">
          <span className="notice-icon">⚡</span>
          <span>
            <strong>MongoDB Sync:</strong> Changes will be updated live in MongoDB via <code>PATCH /api/notes/:id</code>.
          </span>
        </div>

        {validationError && (
          <div className="modal-error-banner">
            ⚠️ {validationError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="edit-note-title" className="form-label">
              Title <span className="required-star">*</span>
            </label>
            <input
              id="edit-note-title"
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (validationError) setValidationError('');
              }}
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-note-category" className="form-label">
              Topic / Category
            </label>
            <select
              id="edit-note-category"
              className="form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isSubmitting}
            >
              <option value="Artificial Intelligence">Artificial Intelligence</option>
              <option value="UI/UX Design">UI/UX Design</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Frontend Engineering">Frontend Engineering</option>
              <option value="System Design">System Design</option>
              <option value="Personal Knowledge">Personal Knowledge</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="edit-note-description" className="form-label">
              Description & Insights <span className="required-star">*</span>
            </label>
            <textarea
              id="edit-note-description"
              className="form-textarea"
              rows={4}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (validationError) setValidationError('');
              }}
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-note-tags" className="form-label">
              Tags <span className="form-hint">(comma-separated)</span>
            </label>
            <input
              id="edit-note-tags"
              type="text"
              className="form-input"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? '⚡ Saving Changes...' : '⚡ Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
