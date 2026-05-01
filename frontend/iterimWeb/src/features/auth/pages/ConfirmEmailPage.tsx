import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

type Status = 'loading' | 'success' | 'error' | 'missing';

export function ConfirmEmailPage() {
  const [searchParams] = useSearchParams();
  const { confirmEmail } = useAuth();
  const { t } = useLanguage();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<Status>(token ? 'loading' : 'missing');

  useEffect(() => {
    if (!token) {
      setStatus('missing');
      return;
    }

    let cancelled = false;

    confirmEmail(token)
      .then(() => {
        if (!cancelled) setStatus('success');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <h1 className="auth-title">iterim</h1>
        </div>

        {status === 'loading' && (
          <div className="confirm-state">
            <div className="confirm-spinner" />
            <h2 className="auth-heading">{t('auth.confirmingEmail')}</h2>
            <p className="auth-subheading">{t('auth.weWillRedirect')}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="confirm-state">
            <div className="confirm-icon confirm-icon-success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="32" height="32">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2 className="auth-heading">{t('auth.emailConfirmed')}</h2>
            <p className="auth-subheading">{t('auth.checkEmailSubtitle')}</p>
            <Link to="/login" className="auth-btn">
              {t('auth.signIn')}
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="confirm-state">
            <div className="confirm-icon confirm-icon-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="32" height="32">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </div>
            <h2 className="auth-heading">{t('auth.invalidResetLink')}</h2>
            <p className="auth-subheading">
              {t('auth.confirmFailed')}
            </p>
            <Link to="/login" className="auth-btn">
              {t('auth.backToSignIn')}
            </Link>
            <p className="auth-footer-text" style={{ marginTop: '1rem' }}>
              {t('auth.didntReceive')}
            </p>
          </div>
        )}

        {status === 'missing' && (
          <div className="confirm-state">
            <div className="confirm-icon confirm-icon-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <h2 className="auth-heading">{t('auth.resetTokenMissing')}</h2>
            <p className="auth-subheading">
              {t('auth.confirmFailed')}
            </p>
            <Link to="/login" className="auth-btn">
              {t('auth.backToSignIn')}
            </Link>
          </div>
        )}
      </div>

      <style>{confirmEmailStyles}</style>
    </div>
  );
}

const confirmEmailStyles = `
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

  .confirm-state {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0;
  }

  .confirm-spinner {
    width: 48px;
    height: 48px;
    border: 3px solid rgba(0,0,0,0.08);
    border-top-color: #18181b;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-bottom: 1.5rem;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .confirm-icon {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.5rem;
  }

  .confirm-icon-success {
    background: rgba(16,185,129,0.1);
    border: 1px solid rgba(16,185,129,0.25);
    color: #10b981;
  }

  .confirm-icon-error {
    background: rgba(239,68,68,0.08);
    border: 1px solid rgba(239,68,68,0.2);
    color: #f87171;
  }

  .auth-heading { font-size: 1.5rem; font-weight: 600; color: #000000; margin: 0 0 0.5rem; letter-spacing: -0.02em; }
  .auth-subheading { font-size: 0.875rem; color: #52525b; margin: 0 0 1.75rem; line-height: 1.6; }

  .auth-btn {
    background: #000000;
    color: white;
    border: none;
    border-radius: 10px;
    padding: 0.8rem 1.5rem;
    font-family: 'Sora', sans-serif;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.1s;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    height: 44px;
    text-decoration: none;
    width: 100%;
    box-sizing: border-box;
  }
  .auth-btn:hover { opacity: 0.9; transform: translateY(-1px); }

  .auth-footer-text { font-size: 0.8rem; color: #71717a; margin: 0; line-height: 1.5; }
`;
