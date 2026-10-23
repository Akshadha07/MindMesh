import { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { API_BASE_URL } from './config';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import KnowledgeGraph from './components/KnowledgeGraph';
import AuthScreen from './components/AuthScreen';
import CreateNoteModal from './components/CreateNoteModal';
import EditNoteModal from './components/EditNoteModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import './App.css';

/**
 * Inner Application Component
 * Mounted inside AuthProvider to access user session and authentication actions.
 */
function MindMeshApp() {
  const { user, loading: authLoading, logout } = useAuth();

  // State: Notes list fetched from the authenticated user's MongoDB collection
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Search input state for filtering notes
  const [searchQuery, setSearchQuery] = useState('');

  // Active navigation tab ('dashboard' | 'notes' | 'graph' | 'settings')
  const [activeTab, setActiveTab] = useState('dashboard');

  // Modal visibility & selection states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [deletingNote, setDeletingNote] = useState(null);

  // Transient feedback toast notification state
  const [notification, setNotification] = useState(null);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  /**
   * READ: Fetch all notes belonging to the authenticated user
   */
  const fetchNotes = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/notes`, {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error(`Server returned HTTP status ${response.status}`);
      }

      const data = await response.json();
      setNotes(data);
    } catch (err) {
      console.error('[API Fetch Error]:', err.message);
      setError(err.message || 'Failed to connect to MindMesh backend API');
    } finally {
      setIsLoading(false);
    }
  }, [user, logout]);

  // Load notes whenever authenticated user changes or logs in
  useEffect(() => {
    if (user) {
      fetchNotes();
    } else {
      setNotes([]);
    }
  }, [user, fetchNotes]);

  /**
   * CREATE: POST /api/notes
   */
  const handleCreateNote = async (newNotePayload) => {
    const response = await fetch(`${API_BASE_URL}/api/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(newNotePayload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to create note (${response.status})`);
    }

    const createdNote = await response.json();
    setNotes((prevNotes) => [createdNote, ...prevNotes]);
    showNotification('success', `Created "${createdNote.title}" in MongoDB`);
    return createdNote;
  };

  /**
   * UPDATE: PATCH /api/notes/:id
   */
  const handleUpdateNote = async (noteId, updatePayload) => {
    const response = await fetch(`${API_BASE_URL}/api/notes/${noteId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(updatePayload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to update note (${response.status})`);
    }

    const updatedNote = await response.json();
    setNotes((prevNotes) =>
      prevNotes.map((note) =>
        note.id === noteId || note._id === noteId ? updatedNote : note
      )
    );
    showNotification('success', `Updated "${updatedNote.title}" in MongoDB`);
    return updatedNote;
  };

  /**
   * DELETE: DELETE /api/notes/:id
   */
  const handleDeleteNote = async (noteId, noteTitle) => {
    const response = await fetch(`${API_BASE_URL}/api/notes/${noteId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to delete note (${response.status})`);
    }

    setNotes((prevNotes) =>
      prevNotes.filter((note) => note.id !== noteId && note._id !== noteId)
    );
    showNotification('success', `Deleted "${noteTitle || 'note'}" from MongoDB`);
  };

  // 1. Initial Session Restoration Loading Screen
  if (authLoading) {
    return (
      <div className="auth-loading-container">
        <span className="loading-spinner">🌸</span>
        <h2 className="loading-title">Synchronizing Neural Session...</h2>
        <p className="loading-subtitle">
          Connecting to MindMesh API at <code>{API_BASE_URL}</code>
        </p>
      </div>
    );
  }

  // 2. Unauthenticated Screen
  if (!user) {
    return <AuthScreen />;
  }

  // 3. Authenticated Application Layout
  return (
    <div className="app-layout">
      {/* Transient Action Feedback Toast */}
      {notification && (
        <div className={`feedback-toast toast-${notification.type}`} role="status">
          <span className="toast-icon">
            {notification.type === 'success' ? '🌸' : '⚠️'}
          </span>
          <span className="toast-message">{notification.message}</span>
        </div>
      )}

      {/* Reusable Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        user={user}
        onLogout={logout}
      />

      {/* Main Content Area */}
      <div className="app-main-content">
        {(activeTab === 'dashboard' || activeTab === 'notes') && (
          <Dashboard
            notes={notes}
            isLoading={isLoading}
            error={error}
            onRetry={fetchNotes}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            onToggleMobileMenu={() => setIsMobileSidebarOpen((prev) => !prev)}
            onEditNote={(note) => setEditingNote(note)}
            onDeleteNote={(note) => setDeletingNote(note)}
          />
        )}

        {/* Phase 6: Live Interactive Knowledge Graph */}
        {activeTab === 'graph' && (
          <KnowledgeGraph
            notes={notes}
            isLoading={isLoading}
            error={error}
            onRetry={fetchNotes}
            onEditNote={(note) => setEditingNote(note)}
          />
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="tab-placeholder-view">
            <span className="placeholder-badge">⚙️ ARCHITECT CONFIGURATION</span>
            <h2 className="placeholder-title">Neural Mesh Preferences</h2>
            <div className="settings-card">
              <div className="settings-item">
                <span className="settings-label">Architect Call-Sign:</span>
                <span className="settings-val text-neon-pink">{user.username}</span>
              </div>
              <div className="settings-item">
                <span className="settings-label">Authenticated Email:</span>
                <span className="settings-val">{user.email}</span>
              </div>
              <div className="settings-item">
                <span className="settings-label">Security Protocol:</span>
                <span className="settings-val text-cyan">HTTP-Only JWT Cookie (7-Day Session)</span>
              </div>
              <div className="settings-item">
                <span className="settings-label">Knowledge Cloud:</span>
                <span className="settings-val text-lavender">MongoDB Atlas Clustered Mongoose</span>
              </div>
            </div>
            <div style={{ marginTop: '20px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={logout}
              >
                🚪 Terminate Session (Logout)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 1. Create Note Modal */}
      <CreateNoteModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onAddNote={handleCreateNote}
      />

      {/* 2. Edit Note Modal */}
      <EditNoteModal
        isOpen={Boolean(editingNote)}
        note={editingNote}
        onClose={() => setEditingNote(null)}
        onUpdateNote={handleUpdateNote}
      />

      {/* 3. Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingNote)}
        note={deletingNote}
        onClose={() => setDeletingNote(null)}
        onConfirmDelete={handleDeleteNote}
      />
    </div>
  );
}

/**
 * Root Application Wrapper
 */
export default function App() {
  return (
    <AuthProvider>
      <MindMeshApp />
    </AuthProvider>
  );
}
