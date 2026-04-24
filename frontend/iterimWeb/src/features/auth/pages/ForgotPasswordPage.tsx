import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { useAuth } from '@/features/auth/context/AuthContext';

export function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'sent' | 'error'>('idle');
  const [serverError, setServerError] = useState('');

  const validateEmail = (val: string) => {
    if (!val) return 'Email address is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val)) return 'Please enter a valid email address';
    return '';
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError('');

    const err = validateEmail(email);
    if (err) {
      setEmailError(err);
      return;
    }

    setStatus('submitting');
    try {
      await forgotPassword(email);
      setStatus('sent');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-brand">
            <h1 className="auth-title">iterim</h1>
          </div>

          <div className="confirm-icon confirm-icon-success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="28" height="28">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>

          <h2 className="auth-heading">Check your email</h2>
          <p className="auth-subheading">
            If that email address is registered, a password reset link has been sent to <strong>{email}</strong>.
          </p>
          <p className="auth-note">
            Can't find it? Check your spam or junk folder. The link expires after a limited time.
          </p>

          <p className="auth-footer-text">
            <Link to="/login" className="auth-link">← Back to sign in</Link>
          </p>
        </div>
        <style>{forgotStyles}</style>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <h1 className="auth-title">iterim</h1>
        </div>

        <h2 className="auth-heading">Forgot your password?</h2>
        <p className="auth-subheading">
          Enter your email address and we'll send you a password reset link.
        </p>

        {(status === 'error' && serverError) && (
          <div className="auth-error" role="alert">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="field-group">
            <label className="field-label" htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              className={`field-input ${emailError ? 'field-input-error' : ''}`}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError('');
              }}
              onBlur={() => {
                const err = validateEmail(email);
                setEmailError(err);
              }}
              placeholder="you@example.com"
              autoComplete="email"
              required
              aria-invalid={!!emailError}
              aria-describedby={emailError ? 'email-error' : undefined}
              autoFocus
            />
            {emailError && (
              <span id="email-error" className="field-error">{emailError}</span>
            )}
          </div>

          <button type="submit" className="auth-btn" disabled={status === 'submitting'}>
            {status === 'submitting' ? <span className="btn-spinner" /> : 'Send reset link'}
          </button>
        </form>

        <p className="auth-footer-text">
          <Link to="/login" className="auth-link">← Back to sign in</Link>
        </p>
      </div>

      <style>{forgotStyles}</style>
    </div>
  );
}

const forgotStyles = `
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

  @keyframes cardIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

  .auth-brand { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 2rem; }
  .auth-title { font-family: 'JetBrains Mono', monospace; font-size: 1.1rem; font-weight: 500; color: #000000; letter-spacing: 0.05em; margin: 0; }
  .auth-heading { font-size: 1.5rem; font-weight: 600; color: #000000; margin: 0 0 0.5rem; letter-spacing: -0.02em; }
  .auth-subheading { font-size: 0.875rem; color: #52525b; margin: 0 0 1.75rem; line-height: 1.6; }
  .auth-subheading strong { color: #18181b; font-weight: 600; }

  .confirm-icon {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.5rem;
  }
  .confirm-icon-success { background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.25); color: #10b981; }

  .auth-note {
    font-size: 0.8rem;
    color: #71717a;
    margin: 0 0 1.75rem;
    line-height: 1.5;
    padding: 0.65rem 0.9rem;
    background: rgba(0,0,0,0.03);
    border: 1px solid rgba(0,0,0,0.07);
    border-radius: 10px;
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

  .auth-form { display: flex; flex-direction: column; gap: 1.1rem; }
  .field-group { display: flex; flex-direction: column; gap: 0.4rem; }
  .field-label { font-size: 0.8rem; font-weight: 600; color: #71717a; letter-spacing: 0.02em; text-transform: uppercase; }

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
  .field-input:focus { border-color: rgba(24,24,27,1); box-shadow: 0 0 0 3px rgba(24,24,27,0.12); }
  .field-input:-webkit-autofill,
  .field-input:-webkit-autofill:hover,
  .field-input:-webkit-autofill:focus,
  .field-input:-webkit-autofill:active {
    -webkit-text-fill-color: #000000;
    -webkit-box-shadow: 0 0 0 1000px rgba(0,0,0,0.03) inset;
    box-shadow: 0 0 0 1000px rgba(0,0,0,0.03) inset;
    border: 1px solid rgba(0,0,0,0.1);
    transition: background-color 9999s ease-out 0s;
  }
  .field-input-error { border-color: rgba(239,68,68,0.5) !important; }
  .field-input-error:focus { border-color: rgba(239,68,68,0.5) !important; box-shadow: 0 0 0 3px rgba(239,68,68,0.12) !important; }
  .field-input-error:-webkit-autofill,
  .field-input-error:-webkit-autofill:hover,
  .field-input-error:-webkit-autofill:focus,
  .field-input-error:-webkit-autofill:active {
    border: 1px solid rgba(239,68,68,0.5) !important;
    -webkit-box-shadow: 0 0 0 1000px rgba(0,0,0,0.03) inset, 0 0 0 3px rgba(239,68,68,0.12);
    box-shadow: 0 0 0 1000px rgba(0,0,0,0.03) inset, 0 0 0 3px rgba(239,68,68,0.12);
  }
  .field-error { color: #f87171; font-size: 0.75rem; margin-top: 0.25rem; display: block; }

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
    width: 100%;
  }
  .auth-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
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

  .auth-footer-text { margin-top: 1.75rem; text-align: center; font-size: 0.85rem; color: #52525b; }
  .auth-link { color: #18181b; text-decoration: none; font-weight: 500; transition: color 0.2s; }
  .auth-link:hover { color: #27272a; text-decoration: underline; }
`;
