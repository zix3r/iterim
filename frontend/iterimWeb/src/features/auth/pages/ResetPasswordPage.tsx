import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

function PasswordReq({ met, label }: { met: boolean; label: string }) {
  return (
    <span className={`pwd-req ${met ? 'met' : ''}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12">
        {met
          ? <polyline points="20 6 9 17 4 12" />
          : <line x1="18" y1="6" x2="6" y2="18" />}
      </svg>
      {label}
    </span>
  );
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pwdFocused, setPwdFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirm?: string }>({});
  const [serverError, setServerError] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'token-error'>('idle');

  const reqs = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /\d/.test(password),
  };
  const pwdValid = Object.values(reqs).every(Boolean);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError('');

    const errors: typeof fieldErrors = {};

    if (!password) {
      errors.password = 'Password is required';
    } else if (!pwdValid) {
      errors.password = 'Password does not meet requirements';
    }

    if (!confirm) {
      errors.confirm = 'Please confirm your password';
    } else if (password !== confirm) {
      errors.confirm = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    if (!token) {
      setStatus('token-error');
      return;
    }

    setStatus('submitting');
    try {
      await resetPassword(token, password);
      setStatus('success');
      // Redirect to login after short delay with success state
      setTimeout(() => {
        navigate('/login', { replace: true, state: { passwordReset: true } });
      }, 2000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to reset password.';
      // Check if it's a token-related error
      if (msg.toLowerCase().includes('expir') || msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('not found')) {
        setStatus('token-error');
      } else {
        setServerError(msg);
        setStatus('idle');
      }
    }
  }

  // Token missing or invalid
  if (!token || status === 'token-error') {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-brand">
            <h1 className="auth-title">iterim</h1>
          </div>
          <div className="confirm-icon confirm-icon-error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="28" height="28">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </div>
          <h2 className="auth-heading">{t('auth.invalidResetLink')}</h2>
          <p className="auth-subheading">
            {t('auth.resetTokenInvalid')}
          </p>
          <Link to="/forgot-password" className="auth-btn">
            {t('auth.sendResetLink')}
          </Link>
          <p className="auth-footer-text" style={{ marginTop: '1rem' }}>
            <Link to="/login" className="auth-link">← {t('auth.backToSignIn')}</Link>
          </p>
        </div>
        <style>{resetStyles}</style>
      </div>
    );
  }

  // Success state
  if (status === 'success') {
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
          <h2 className="auth-heading">{t('auth.passwordResetSuccess')}</h2>
          <p className="auth-subheading">
            {t('auth.weWillRedirect')}
          </p>
          <div className="redirect-indicator">
            <span className="btn-spinner btn-spinner-dark" />
            {t('auth.weWillRedirect')}
          </div>
        </div>
        <style>{resetStyles}</style>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <h1 className="auth-title">iterim</h1>
        </div>

        <h2 className="auth-heading">{t('auth.resetTitle')}</h2>
        <p className="auth-subheading">{t('auth.resetSubtitle')}</p>

        {serverError && (
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
            <label className="field-label" htmlFor="password">{t('profile.newPassword')}</label>
            <div className="field-password-wrap">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className={`field-input ${fieldErrors.password ? 'field-input-error' : ''}`}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: undefined });
                }}
                onFocus={() => setPwdFocused(true)}
                placeholder="••••••••"
                autoComplete="new-password"
                required
                aria-invalid={!!fieldErrors.password}
                aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                autoFocus
              />
              <button
                type="button"
                className="field-eye"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
              >
                {showPassword
                  ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
            {fieldErrors.password && (
              <span id="password-error" className="field-error">{fieldErrors.password}</span>
            )}
            {(pwdFocused || password.length > 0) && (
              <div className="pwd-reqs">
                <PasswordReq met={reqs.length} label={t('auth.pwdReqLength')} />
                <PasswordReq met={reqs.upper}  label={t('auth.pwdReqUpper')} />
                <PasswordReq met={reqs.lower}  label={t('auth.pwdReqLower')} />
                <PasswordReq met={reqs.number} label={t('auth.pwdReqNumber')} />
              </div>
            )}
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="confirm">{t('auth.confirmPassword')}</label>
            <div className="field-password-wrap">
              <input
                id="confirm"
                type={showPassword ? 'text' : 'password'}
                className={`field-input ${fieldErrors.confirm ? 'field-input-error' : ''}`}
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  if (fieldErrors.confirm) setFieldErrors({ ...fieldErrors, confirm: undefined });
                }}
                placeholder="••••••••"
                autoComplete="new-password"
                required
                aria-invalid={!!fieldErrors.confirm}
                aria-describedby={fieldErrors.confirm ? 'confirm-error' : undefined}
              />
              {confirm.length > 0 && !fieldErrors.confirm && (
                <span className={`field-match-icon ${confirm === password ? 'ok' : 'bad'}`}>
                  {confirm === password
                    ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16"><polyline points="20 6 9 17 4 12"/></svg>
                    : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  }
                </span>
              )}
            </div>
            {fieldErrors.confirm && (
              <span id="confirm-error" className="field-error">{fieldErrors.confirm}</span>
            )}
          </div>

          <button type="submit" className="auth-btn" disabled={status === 'submitting'}>
            {status === 'submitting' ? <span className="btn-spinner" /> : t('auth.changePassword')}
          </button>
        </form>

        <p className="auth-footer-text">
          <Link to="/login" className="auth-link">← {t('auth.backToSignIn')}</Link>
        </p>
      </div>

      <style>{resetStyles}</style>
    </div>
  );
}

const resetStyles = `
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
  .confirm-icon-error { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); color: #f87171; }

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

  .auth-form { display: flex; flex-direction: column; gap: 1rem; }
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
  .field-input:focus { border-color: rgba(24,24,27,1); box-shadow: 0 0 0 3px rgba(24,24,27,0.1); }
  .field-input-error { border-color: rgba(239,68,68,0.5) !important; }
  .field-input-error:focus { border-color: rgba(239,68,68,0.5) !important; box-shadow: 0 0 0 3px rgba(239,68,68,0.12) !important; }
  .field-error { color: #f87171; font-size: 0.75rem; margin-top: 0.25rem; display: block; }

  .field-password-wrap { position: relative; }
  .field-password-wrap .field-input { padding-right: 2.75rem; }
  .field-eye { position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #71717a; padding: 0; display: flex; align-items: center; transition: color 0.2s; }
  .field-eye:hover { color: #18181b; }

  .field-match-icon { position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); display: flex; align-items: center; pointer-events: none; }
  .field-match-icon.ok { color: #10b981; }
  .field-match-icon.bad { color: #f87171; }

  .pwd-reqs { display: flex; flex-wrap: wrap; gap: 0.4rem 0.75rem; margin-top: 0.5rem; }
  .pwd-req { display: flex; align-items: center; gap: 0.3rem; font-size: 0.75rem; color: #71717a; transition: color 0.2s; }
  .pwd-req.met { color: #10b981; }

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
    text-decoration: none;
    box-sizing: border-box;
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
  .btn-spinner-dark {
    border: 2px solid rgba(0,0,0,0.12);
    border-top-color: #18181b;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .redirect-indicator {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 0.85rem;
    color: #52525b;
    margin-bottom: 1rem;
  }

  .auth-footer-text { margin-top: 1.75rem; text-align: center; font-size: 0.85rem; color: #52525b; }
  .auth-link { color: #18181b; text-decoration: none; font-weight: 500; transition: color 0.2s; }
  .auth-link:hover { color: #27272a; text-decoration: underline; }
`;
