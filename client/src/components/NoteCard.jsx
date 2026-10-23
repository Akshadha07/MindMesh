/**
 * NoteCard Component
 * 
 * Demonstrates:
 * 1. Props: Receives note attributes and action callbacks (`onEdit`, `onDelete`).
 * 2. Event Handling: Triggers edit modal and deletion confirmation without altering layout.
 * 3. Japanese Cyberpunk Aesthetic: Sleek dark background, neon-pink glow border on hover,
 *    lavender tag highlights, and discreet action controls.
 */
export default function NoteCard({
  id,
  title,
  description,
  tags = [],
  category,
  updatedAt,
  onEdit,
  onDelete
}) {
  return (
    <article className="note-card">
      <div className="note-card-header">
        <span className="note-category">
          <span className="sakura-petal">🌸</span> {category || 'Knowledge Node'}
        </span>

        <div className="note-card-actions">
          {updatedAt && <span className="note-timestamp">{updatedAt}</span>}
          {onEdit && (
            <button
              type="button"
              className="card-action-btn edit-btn"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              title="Edit Knowledge Node"
              aria-label={`Edit ${title}`}
            >
              ✏️
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              className="card-action-btn delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              title="Delete Knowledge Node"
              aria-label={`Delete ${title}`}
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      <h3 className="note-title">{title}</h3>
      <p className="note-description">{description}</p>

      <div className="note-tags">
        {tags.map((tag, index) => (
          <span key={`${tag}-${index}`} className="note-tag">
            #{tag}
          </span>
        ))}
      </div>
    </article>
  );
}
