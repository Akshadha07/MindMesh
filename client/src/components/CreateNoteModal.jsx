import { useState } from 'react';

/**
 * CreateNoteModal Component
 * 
 * Demonstrates:
 * 1. Controlled Form Inputs: Each input's value is bound to local React `useState`.
 * 2. Async Submission: Communicates with the Express backend via `onAddNote` prop.
 * 3. Loading & Error Feedback: Displays in-progress indicator and validation/API errors.
 */
export default function CreateNoteModal({ isOpen, onClose, onAddNote }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Artificial Intelligence');
  const [tagsInput, setTagsInput] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

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

    // Process comma-separated tags into a clean array of strings
    const processedTags = tagsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    const notePayload = {
      title: title.trim(),
      description: description.trim(),
      category: category.trim() || 'General',
      tags: processedTags.length > 0 ? processedTags : ['General'],
    };

    setIsSubmitting(true);
    setValidationError('');

    try {
      await onAddNote(notePayload);

      // Reset form and close
      setTitle('');
      setDescription('');
      setTagsInput('');
      setValidationError('');
      onClose();
    } catch (err) {
      setValidationError(err.message || 'Failed to create note in database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-cherry-blossom">🌸</span>
            <h2 className="modal-title">Create Knowledge Node</h2>
          </div>
          <button 
            type="button" 
            className="modal-close-btn" 
            onClick={onClose}
            aria-label="Close modal"
            disabled={isSubmitting}
          >
            ✕
          </button>
        </div>

        {/* Database Status indicator */}
        <div className="modal-state-notice">
          <span className="notice-icon">⚡</span>
          <span>
            <strong>MongoDB Atlas Active:</strong> This note will be persisted directly to your MongoDB database via <code>POST /api/notes</code>.
          </span>
        </div>

        {validationError && (
          <div className="modal-error-banner">
            ⚠️ {validationError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="note-title" className="form-label">
              Title <span className="required-star">*</span>
            </label>
            <input
              id="note-title"
              type="text"
              className="form-input"
              placeholder="e.g., Quantum Entanglement Graphs"
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
            <label htmlFor="note-category" className="form-label">
              Topic / Category
            </label>
            <select
              id="note-category"
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
            <label htmlFor="note-description" className="form-label">
              Description & Insights <span className="required-star">*</span>
            </label>
            <textarea
              id="note-description"
              className="form-textarea"
              rows={4}
              placeholder="Synthesize the core ideas, relations, or research findings..."
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (validationError) setValidationError('');
              }}
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="note-tags" className="form-label">
              Tags <span className="form-hint">(comma-separated)</span>
            </label>
            <input
              id="note-tags"
              type="text"
              className="form-input"
              placeholder="AI, Graph, Neural, Cyberpunk"
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
              {isSubmitting ? '⚡ Adding to Mesh...' : '⚡ Add to Knowledge Mesh'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
