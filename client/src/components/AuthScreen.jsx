import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * AuthScreen Component
 * 
 * Provides Japanese Cyberpunk styled authentication for MindMesh.
 * Features:
 * - Seamless switching between Login and Registration
 * - Input validation & error messaging
 * - One-click demo architect account filler for evaluators
 */
export default function AuthScreen() {
  const { login, register, authError, clearError } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [clientError, setClientError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const switchMode = (newMode) => {
    setMode(newMode);
    setClientError('');
    clearError();
  };

  const handleFillDemo = () => {
    setEmail('architect@mindmesh.io');
    setPassword('Password123!');
    setClientError('');
    clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setClientError('');

    if (!email.trim()) {
      setClientError('Please enter your email address.');
      return;
    }

    if (!password) {
      setClientError('Please enter your password.');
      return;
    }

    if (mode === 'register') {
      if (!username.trim() || username.trim().length < 2) {
        setClientError('Username must be at least 2 characters long.');
        return;
      }

      if (password.length < 6) {
        setClientError('Password must be at least 6 characters long.');
        return;
      }

      if (password !== confirmPassword) {
        setClientError('Passwords do not match.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), username.trim(), password);
      }
    } catch {
      // Error is caught and set in AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeError = clientError || authError;

  return (
    <div className="auth-screen-container">
      <div className="auth-card">
        {/* Brand Header */}
        <div className="auth-brand">
          <span className="auth-sakura-icon">🌸</span>
          <h1 className="auth-title">MindMesh</h1>
          <span className="auth-sub">マインドメッシュ • NEURAL IDENTITY</span>
        </div>

        <p className="auth-tagline">
          Interactive Knowledge Management & Visualization Platform
        </p>

        {/* Tab Switcher */}
        <div className="auth-tab-bar">
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => switchMode('login')}
          >
            ⚡ Login
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => switchMode('register')}
          >
            🌸 Register
          </button>
        </div>

        {/* Error Banner */}
        {activeError && (
          <div className="modal-error-banner" role="alert">
            ⚠️ {activeError}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'register' && (
            <div className="form-group">
              <label htmlFor="reg-username" className="form-label">
                Architect Call-Sign (Username) <span className="required-star">*</span>
              </label>
              <input
                id="reg-username"
                type="text"
                className="form-input"
                placeholder="e.g., NeoArchitect"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (clientError) setClientError('');
                }}
                disabled={isSubmitting}
                autoFocus
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="auth-email" className="form-label">
              Neural Network Email <span className="required-star">*</span>
            </label>
            <input
              id="auth-email"
              type="email"
              className="form-input"
              placeholder="architect@mindmesh.io"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (clientError) setClientError('');
              }}
              disabled={isSubmitting}
              autoFocus={mode === 'login'}
            />
          </div>

          <div className="form-group">
            <label htmlFor="auth-password" className="form-label">
              Synaptic Passcode <span className="required-star">*</span>
            </label>
            <input
              id="auth-password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (clientError) setClientError('');
              }}
              disabled={isSubmitting}
            />
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label htmlFor="auth-confirm-password" className="form-label">
                Confirm Passcode <span className="required-star">*</span>
              </label>
              <input
                id="auth-confirm-password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (clientError) setClientError('');
                }}
                disabled={isSubmitting}
              />
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary auth-submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? '⚡ Establishing Synapse...'
              : mode === 'login'
              ? '⚡ Enter Knowledge Mesh'
              : '🌸 Initialize Neural Identity'}
          </button>
        </form>

        {/* Demo Account Helper */}
        {mode === 'login' && (
          <div className="auth-demo-box">
            <span className="auth-demo-label">Testing as Demo Architect?</span>
            <button
              type="button"
              className="btn btn-secondary auth-demo-btn"
              onClick={handleFillDemo}
            >
              🌸 Fill Default Demo Credentials
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
