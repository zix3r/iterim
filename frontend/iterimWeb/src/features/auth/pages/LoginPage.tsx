import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { useFormValidation } from '@/hooks/useFormValidation';
import { email, required } from '@/lib/validation';
import { useAuth } from '@/features/auth/context/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from;
  // If redirected from a protected page, go to dashboard after login
  // If accessed directly, go to root
  const destination = from ? '/dashboard' : '/';

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { values, errors, setFieldValue, validateForm } = useFormValidation(
    {
      email: '',
      password: '',
    },
    {
      email: [email('Email')],
      password: [required('Password')],
    },
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await login(values.email.trim(), values.password);
      navigate(destination, { replace: true });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Brand */}
        <div className="auth-brand">
          <h1 className="auth-title">iterim</h1>
        </div>

        <h2 className="auth-heading">Welcome back</h2>
        <p className="auth-subheading">Sign in to continue to your workspace</p>

        {error && (
          <div className="auth-error" role="alert">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="field-group">
            <label className="field-label" htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              className={`field-input ${errors.email ? 'field-input-error' : ''}`}
              value={values.email}
              onChange={(e) => setFieldValue('email', e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <span id="email-error" className="field-error">{errors.email}</span>
            )}
          </div>

          <div className="field-group">
            <div className="field-label-row">
              <label className="field-label" htmlFor="password">Password</label>
            </div>
            <div className="field-password-wrap">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className={`field-input ${errors.password ? 'field-input-error' : ''}`}
                value={values.password}
                onChange={(e) => setFieldValue('password', e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
              />
              <button
                type="button"
                className="field-eye"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <span id="password-error" className="field-error">{errors.password}</span>
            )}
          </div>

          <button type="submit" className="auth-btn" disabled={isSubmitting}>
            {isSubmitting ? <span className="btn-spinner" /> : 'Sign in'}
          </button>
        </form>

        <p className="auth-footer-text">
          Don't have an account?{' '}
          <Link to="/register" className="auth-link">Create one</Link>
        </p>
      </div>

      <style>{authStyles}</style>
    </div>
  );
}

const authStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

  .auth-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #ffffff;
    background-image:
      radial-gradient(ellipse 80% 50% at 20% 10%, rgba(24,24,27,0.05) 0%, transparent 60%),
      radial-gradient(ellipse 60% 40% at 80% 90%, rgba(24,24,27,0.03) 0%, transparent 50%);
    font-family: 'Sora', sans-serif;
    padding: 1.5rem;
  }

  .auth-card {
    width: 100%;
    max-width: 420px;
    background: rgba(255,255,255,0.8);
    border: 1px solid rgba(0,0,0,0.08);
    border-radius: 20px;
    padding: 2.5rem;
    backdrop-filter: blur(20px);
    box-shadow: 0 0 0 1px rgba(0,0,0,0.05), 0 32px 64px rgba(0,0,0,0.1);
    animation: cardIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes cardIn {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .auth-brand {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin-bottom: 2rem;
  }

  .auth-title {
    font-family: 'JetBrains Mono', monospace;
    font-size: 1.1rem;
    font-weight: 500;
    color: #000000;
    letter-spacing: 0.05em;
    margin: 0;
  }

  .auth-heading {
    font-size: 1.6rem;
    font-weight: 600;
    color: #000000;
    margin: 0 0 0.4rem;
    letter-spacing: -0.02em;
  }

  .auth-subheading {
    font-size: 0.875rem;
    color: #52525b;
    margin: 0 0 1.75rem;
  }

  .auth-error {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(239,68,68,0.08);
    border: 1px solid rgba(239,68,68,0.2);
    color: #f87171;
    border-radius: 10px;
    padding: 0.75rem 1rem;
    font-size: 0.85rem;
    margin-bottom: 1.25rem;
  }

  .auth-form {
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
  }

  .field-group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .field-label-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .field-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: #71717a;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  .field-input {
    background: rgba(0,0,0,0.03);
    border: 1px solid rgba(0,0,0,0.1);
    border-radius: 10px;
    padding: 0.7rem 0.9rem;
    color: #000000;
    font-family: 'Sora', sans-serif;
    font-size: 0.9rem;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    width: 100%;
    box-sizing: border-box;
  }

  .field-input::placeholder { color: #71717a; }

  .field-input:focus {
    border-color: rgba(24,24,27,1);
    box-shadow: 0 0 0 3px rgba(24,24,27,0.12);
  }

  .field-input-error {
    border-color: rgba(239,68,68,0.5) !important;
  }

  .field-input-error:focus {
    border-color: rgba(239,68,68,0.5) !important;
    box-shadow: 0 0 0 3px rgba(239,68,68,0.12) !important;
  }

  .field-error {
    color: #f87171;
    font-size: 0.75rem;
    margin-top: 0.25rem;
    display: block;
  }

  .field-password-wrap {
    position: relative;
  }

  .field-password-wrap .field-input {
    padding-right: 2.75rem;
  }

  .field-eye {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    color: #71717a;
    padding: 0;
    display: flex;
    align-items: center;
    transition: color 0.2s;
  }

  .field-eye:hover { color: #18181b; }

  .auth-btn {
    margin-top: 0.5rem;
    background: #000000;
    color: white;
    border: none;
    border-radius: 10px;
    padding: 0.8rem;
    font-family: 'Sora', sans-serif;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.1s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    height: 44px;
  }

  .auth-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
  .auth-btn:active:not(:disabled) { transform: translateY(0); }
  .auth-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .btn-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .auth-footer-text {
    margin-top: 1.5rem;
    text-align: center;
    font-size: 0.85rem;
    color: #52525b;
  }

  .auth-link {
    color: #18181b;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.2s;
  }

  .auth-link:hover { color: #27272a; text-decoration: underline; }
`;
