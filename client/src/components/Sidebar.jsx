/**
 * Sidebar Component
 * 
 * Demonstrates:
 * 1. Props: Receives active navigation tab, user session, and callbacks.
 * 2. User Identity: Displays authenticated architect call-sign and one-click session logout.
 * 3. Mobile Responsiveness: Sliding drawer behavior on smaller viewports.
 */
export default function Sidebar({
  activeTab,
  onSelectTab,
  isOpen,
  onClose,
  user,
  onLogout,
}) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '⚡', badge: null },
    { id: 'notes', label: 'My Notes', icon: '📝', badge: null },
    { id: 'graph', label: 'Knowledge Graph', icon: '🕸️', badge: 'Live' },
    { id: 'settings', label: 'Settings', icon: '⚙️', badge: null },
  ];

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={onClose} 
          aria-hidden="true" 
        />
      )}

      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-logo-container">
            <span className="brand-icon">🌸</span>
            <div className="brand-text">
              <span className="brand-name">MindMesh</span>
              <span className="brand-sub">マインドメッシュ</span>
            </div>
          </div>
          {/* Close button for mobile screens */}
          <button 
            type="button" 
            className="sidebar-close-btn" 
            onClick={onClose}
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        <div className="sidebar-section-label">NAVIGATION</div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  onSelectTab(item.id);
                  if (onClose) onClose();
                }}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {item.badge && (
                  <span className={`nav-badge ${item.id === 'graph' ? 'badge-live' : ''}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          {/* Authenticated Architect Profile */}
          {user && (
            <div className="sidebar-user-card">
              <div className="user-avatar-wrap">
                <span className="user-avatar-icon">🌸</span>
              </div>
              <div className="user-details">
                <span className="user-name">{user.username || 'Architect'}</span>
                <span className="user-email" title={user.email}>{user.email}</span>
              </div>
              <button
                type="button"
                className="user-logout-btn"
                onClick={onLogout}
                title="Disconnect Neural Session (Logout)"
                aria-label="Logout"
              >
                🚪
              </button>
            </div>
          )}

          <div className="system-pill">
            <span className="pulse-indicator"></span>
            <span className="system-pill-text">Synaptic Mesh: Online</span>
          </div>
          <p className="version-tag">MindMesh v1.0.0-PROD</p>
        </div>
      </aside>
    </>
  );
}
