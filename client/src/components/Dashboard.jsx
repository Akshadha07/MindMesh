import { useMemo } from 'react';
import NoteCard from './NoteCard';

/**
 * Dashboard Component
 * 
 * Demonstrates:
 * 1. Note Card Actions: Passes edit and delete handlers to each `<NoteCard />`.
 * 2. Reactive Search: Keeps live instant filtering by title, description, tags, and category.
 * 3. Dynamic Telemetry: Summarizes total notes, active topics, and database synchronization.
 */
export default function Dashboard({
  notes = [],
  isLoading = false,
  error = null,
  onRetry,
  searchQuery,
  onSearchChange,
  onOpenCreateModal,
  onToggleMobileMenu,
  onEditNote,
  onDeleteNote,
}) {
  // Compute unique topics/categories across fetched notes
  const uniqueTopicsCount = useMemo(() => {
    const topics = new Set(notes.map((n) => n.category).filter(Boolean));
    return topics.size;
  }, [notes]);

  // Search Filtering: Filters notes by matching searchQuery against title, description, tags, category
  const filteredNotes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return notes;

    return notes.filter((note) => {
      const matchTitle = note.title ? note.title.toLowerCase().includes(query) : false;
      const matchDesc = note.description ? note.description.toLowerCase().includes(query) : false;
      const matchTags = Array.isArray(note.tags)
        ? note.tags.some((tag) => tag.toLowerCase().includes(query))
        : false;
      const matchCategory = note.category ? note.category.toLowerCase().includes(query) : false;
      return matchTitle || matchDesc || matchTags || matchCategory;
    });
  }, [notes, searchQuery]);

  return (
    <div className="dashboard-container">
      {/* Top Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={onToggleMobileMenu}
            aria-label="Open navigation sidebar"
          >
            ☰
          </button>
          <div className="header-brand">
            <span className="header-brand-sakura">🌸</span>
            <span className="header-brand-name">MindMesh</span>
          </div>
        </div>

        {/* Search bar */}
        <div className="header-search-wrap">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="header-search-input"
            placeholder="Search concepts, tags, or insights..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Action Button */}
        <div className="header-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={onOpenCreateModal}
          >
            <span className="btn-icon">+</span>
            <span>Create Note</span>
          </button>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="dashboard-main">
        {/* Welcome Banner */}
        <section className="welcome-section">
          <div className="welcome-text">
            <div className="welcome-badge">
              <span className="sakura-pulse">🌸</span>
              <span>NEURAL SYNAPSE HUB</span>
            </div>
            <h1 className="welcome-title">
              Welcome back, <span className="text-neon-pink">Architect</span>
            </h1>
            <p className="welcome-subtitle">
              Capture, organize, and synthesize interconnected ideas in your futuristic personal knowledge mesh.
            </p>
          </div>
        </section>

        {/* Summary Metrics Section (Reflects live API state) */}
        <section className="summary-cards-grid">
          <div className="summary-card">
            <div className="summary-card-header">
              <span className="summary-label">Total Notes</span>
              <span className="summary-icon">📝</span>
            </div>
            <div className="summary-value">
              {isLoading ? '...' : notes.length}
            </div>
            <div className="summary-subtext">
              {isLoading ? (
                <span>Loading from MongoDB...</span>
              ) : (
                <>
                  <span className="text-neon-pink">●</span> {filteredNotes.length} currently visible
                </>
              )}
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-card-header">
              <span className="summary-label">Knowledge Topics</span>
              <span className="summary-icon">🏷️</span>
            </div>
            <div className="summary-value">
              {isLoading ? '...' : uniqueTopicsCount}
            </div>
            <div className="summary-subtext">
              {isLoading ? (
                <span>Aggregating...</span>
              ) : (
                <>
                  <span className="text-lavender">●</span> Across active domains
                </>
              )}
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-card-header">
              <span className="summary-label">Database Status</span>
              <span className="summary-icon">⚡</span>
            </div>
            <div className="summary-value summary-value-sm">
              {isLoading ? 'Connecting...' : error ? 'Offline' : 'Atlas Synced'}
            </div>
            <div className="summary-subtext">
              {isLoading ? (
                <span className="text-lavender">● Handshake in progress</span>
              ) : error ? (
                <span className="text-neon-pink">● Connection error</span>
              ) : (
                <span className="text-cyan">● MongoDB Atlas connected</span>
              )}
            </div>
          </div>
        </section>

        {/* Notes Grid Section */}
        <section className="notes-section">
          <div className="notes-section-header">
            <div>
              <h2 className="section-title">
                Knowledge Nodes <span className="sakura-dot">🌸</span>
              </h2>
              <p className="section-subtitle">
                {isLoading
                  ? 'Connecting to backend neural nodes...'
                  : error
                  ? 'Failed to load knowledge nodes from API'
                  : searchQuery
                  ? `Found ${filteredNotes.length} matching result${filteredNotes.length === 1 ? '' : 's'} for "${searchQuery}"`
                  : `Showing ${notes.length} knowledge nodes loaded from MongoDB Atlas`}
              </p>
            </div>
          </div>

          {/* 1. Loading State */}
          {isLoading && (
            <div className="loading-state-container">
              <span className="loading-spinner">🌸</span>
              <h3 className="loading-title">Synchronizing Neural Mesh...</h3>
              <p className="loading-subtitle">
                Requesting notes from <code>http://localhost:5000/api/notes</code>
              </p>
            </div>
          )}

          {/* 2. Error State */}
          {!isLoading && error && (
            <div className="error-state-container">
              <div className="error-icon">⚠️</div>
              <h3 className="error-title">Unable to Connect to Backend API</h3>
              <p className="error-message">{error}</p>
              <p className="error-tip">
                Ensure your Express backend server is running on port 5000.
                <br />
                Run <code>cd server; npm run dev</code> in a terminal.
              </p>
              {onRetry && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={onRetry}
                >
                  ⚡ Retry Connection
                </button>
              )}
            </div>
          )}

          {/* 3. Success State: Notes Cards Grid */}
          {!isLoading && !error && filteredNotes.length > 0 && (
            <div className="notes-grid">
              {filteredNotes.map((note) => (
                <NoteCard
                  key={note.id || note._id}
                  id={note.id || note._id}
                  title={note.title}
                  description={note.description}
                  tags={note.tags}
                  category={note.category}
                  updatedAt={note.updatedAt ? new Date(note.updatedAt).toLocaleDateString() : 'Synced from API'}
                  onEdit={() => onEditNote && onEditNote(note)}
                  onDelete={() => onDeleteNote && onDeleteNote(note)}
                />
              ))}
            </div>
          )}

          {/* 4. Empty State: No results match search query */}
          {!isLoading && !error && filteredNotes.length === 0 && (
            <div className="notes-empty-state">
              <div className="empty-icon">🌸</div>
              <h3 className="empty-title">No matching knowledge nodes found</h3>
              <p className="empty-description">
                {searchQuery ? (
                  <>No notes match your search query "<strong>{searchQuery}</strong>". Try a different keyword.</>
                ) : (
                  <>No knowledge notes found on the server. Click "+ Create Note" above to add one!</>
                )}
              </p>
              {searchQuery && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => onSearchChange('')}
                >
                  Clear Search Filter
                </button>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
