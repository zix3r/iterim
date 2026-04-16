import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useAuth } from '@/features/auth/context/AuthContext';

export function CheckEmailPage() {
  const location = useLocation();
  const email = (location.state as { email?: string })?.email ?? '';
  const { resendConfirmation } = useAuth();

  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function handleResend() {
    if (!email || resendStatus === 'sending') return;
    setResendStatus('sending');
    try {
      await resendConfirmation(email);
      setResendStatus('sent');
    } catch {
      setResendStatus('error');
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <h1 className="auth-title">iterim</h1>
        </div>

        {/* Email icon */}
        <div className="email-icon-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
        </div>

        <h2 className="auth-heading">Check your email</h2>
        <p className="auth-subheading">
          {email
            ? <>A confirmation link has been sent to <strong>{email}</strong>. Open it to activate your account.</>
            : 'A confirmation link has been sent. Open it to activate your account.'}
        </p>

        <div className="check-email-info">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          Can't find it? Check your spam or junk folder.
        </div>

        <div className="resend-section">
          <p className="resend-label">Didn't receive the email?</p>

          {resendStatus === 'idle' && (
            <button
              className={`auth-btn auth-btn-secondary ${!email ? 'disabled' : ''}`}
              onClick={handleResend}
              disabled={!email}
            >
              Resend confirmation email
            </button>
          )}

          {resendStatus === 'sending' && (
            <button className="auth-btn auth-btn-secondary" disabled>
              <span className="btn-spinner btn-spinner-dark" />
              Sending...
            </button>
          )}

          {resendStatus === 'sent' && (
            <div className="resend-success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Confirmation email resent!
            </div>
          )}

          {resendStatus === 'error' && (
            <div className="resend-error">
              Failed to send. Please try again later.
              <button className="resend-retry-btn" onClick={() => setResendStatus('idle')}>
                Try again
              </button>
            </div>
          )}
        </div>

        <p className="auth-footer-text">
          <Link to="/login" className="auth-link">← Back to sign in</Link>
        </p>
      </div>

      <style>{checkEmailStyles}</style>
    </div>
  );
}

const checkEmailStyles = `
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

  .auth-brand { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 1.5rem; }
  .auth-title { font-family: 'JetBrains Mono', monospace; font-size: 1.1rem; font-weight: 500; color: #000000; letter-spacing: 0.05em; margin: 0; }

  .email-icon-wrap {
    width: 72px;
    height: 72px;
    background: rgba(0,0,0,0.04);
    border: 1px solid rgba(0,0,0,0.08);
    border-radius: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.5rem;
    color: #18181b;
  }

  .auth-heading { font-size: 1.5rem; font-weight: 600; color: #000000; margin: 0 0 0.5rem; letter-spacing: -0.02em; }
  .auth-subheading { font-size: 0.875rem; color: #52525b; margin: 0 0 1.5rem; line-height: 1.6; }
  .auth-subheading strong { color: #18181b; font-weight: 600; }

  .check-email-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(0,0,0,0.03);
    border: 1px solid rgba(0,0,0,0.07);
    border-radius: 10px;
    padding: 0.7rem 0.9rem;
    font-size: 0.82rem;
    color: #52525b;
    margin-bottom: 1.75rem;
  }

  .resend-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .resend-label { font-size: 0.82rem; color: #71717a; margin: 0; }

  .auth-btn {
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

  .auth-btn-secondary {
    background: transparent;
    color: #18181b;
    border: 1px solid rgba(0,0,0,0.15);
  }
  .auth-btn-secondary:hover:not(:disabled) { background: rgba(0,0,0,0.04); transform: translateY(-1px); }

  .btn-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  .btn-spinner-dark {
    border: 2px solid rgba(0,0,0,0.15);
    border-top-color: #18181b;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .resend-success {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.85rem;
    color: #065f46;
    background: rgba(16,185,129,0.08);
    border: 1px solid rgba(16,185,129,0.2);
    border-radius: 10px;
    padding: 0.65rem 0.9rem;
  }

  .resend-error {
    font-size: 0.82rem;
    color: #b91c1c;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .resend-retry-btn {
    background: none;
    border: none;
    color: #18181b;
    font-family: 'Sora', sans-serif;
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    text-decoration: underline;
    padding: 0;
    text-align: left;
  }

  .auth-footer-text { margin-top: 2rem; text-align: center; font-size: 0.85rem; color: #52525b; }
  .auth-link { color: #18181b; text-decoration: none; font-weight: 500; transition: color 0.2s; }
  .auth-link:hover { color: #27272a; text-decoration: underline; }
`;
