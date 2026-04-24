import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { useFormValidation } from '@/hooks/useFormValidation';
import { email, minLength, required } from '@/lib/validation';
import { useAuth } from '@/features/auth/context/AuthContext';

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

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [pwdFocused, setPwdFocused] = useState(false);

  const { values, errors, setFieldValue, setErrors, validateForm } = useFormValidation(
    {
      name: '',
      email: '',
      password: '',
      confirm: '',
    },
    {
      name: [required('Name'), minLength('Name', 2)],
      email: [email('Email')],
      password: [required('Password')],
      confirm: [required('Confirm password')],
    },
  );

  const reqs = {
    length: values.password.length >= 8,
    upper: /[A-Z]/.test(values.password),
    lower: /[a-z]/.test(values.password),
    number: /\d/.test(values.password),
  };

  const pwdValid = Object.values(reqs).every(Boolean);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    const hasBasicErrors = !validateForm();

    const customErrors: Partial<Record<'name' | 'email' | 'password' | 'confirm', string>> = {};

    if (values.password && !pwdValid) {
      customErrors.password = 'Password does not meet requirements';
    }

    if (values.confirm && values.password !== values.confirm) {
      customErrors.confirm = 'Passwords do not match';
    }

    if (hasBasicErrors || Object.keys(customErrors).length > 0) {
      if (Object.keys(customErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...customErrors }));
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const trimmedEmail = values.email.trim();
      await register(values.name.trim(), trimmedEmail, values.password);
      navigate('/check-email', { replace: true, state: { email: trimmedEmail } });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <h1 className="auth-title">iterim</h1>
        </div>

        <h2 className="auth-heading">Create account</h2>
        <p className="auth-subheading">Join iterim and start collaborating</p>

        {error && (
          <div className="auth-error" role="alert">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="field-group">
            <label className="field-label" htmlFor="name">Full name</label>
            <input id="name" type="text" className={`field-input ${errors.name ? 'field-input-error' : ''}`} value={values.name}
              onChange={(e) => setFieldValue('name', e.target.value)} placeholder="John Smith"
              autoComplete="name" required 
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'name-error' : undefined} />
            {errors.name && (
              <span id="name-error" className="field-error">{errors.name}</span>
            )}
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="email">Email address</label>
            <input id="email" type="email" className={`field-input ${errors.email ? 'field-input-error' : ''}`} value={values.email}
              onChange={(e) => setFieldValue('email', e.target.value)} placeholder="you@example.com"
              autoComplete="email" required 
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined} />
            {errors.email && (
              <span id="email-error" className="field-error">{errors.email}</span>
            )}
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="password">Password</label>
            <div className="field-password-wrap">
              <input id="password" type={showPassword ? 'text' : 'password'} className={`field-input ${errors.password ? 'field-input-error' : ''}`}
                value={values.password}
                onChange={(e) => setFieldValue('password', e.target.value)}
                placeholder="••••••••" autoComplete="new-password"
                onFocus={() => setPwdFocused(true)} required 
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined} />
              <button type="button" className="field-eye" onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide' : 'Show'}>
                {showPassword
                  ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
            {errors.password && (
              <span id="password-error" className="field-error">{errors.password}</span>
            )}

            {(pwdFocused || values.password.length > 0) && (
              <div className="pwd-reqs">
                <PasswordReq met={reqs.length} label="8+ characters" />
                <PasswordReq met={reqs.upper}  label="Uppercase letter" />
                <PasswordReq met={reqs.lower}  label="Lowercase letter" />
                <PasswordReq met={reqs.number} label="Number" />
              </div>
            )}
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="confirm">Confirm password</label>
            <div className="field-password-wrap">
              <input id="confirm" type={showPassword ? 'text' : 'password'} className={`field-input ${errors.confirm ? 'field-input-error' : ''}`}
                value={values.confirm}
                onChange={(e) => setFieldValue('confirm', e.target.value)}
                placeholder="••••••••" autoComplete="new-password" required 
                aria-invalid={!!errors.confirm}
                aria-describedby={errors.confirm ? 'confirm-error' : undefined} />
              {values.confirm.length > 0 && !errors.confirm && (
                <span className={`field-match-icon ${values.confirm === values.password ? 'ok' : 'bad'}`}>
                  {values.confirm === values.password
                    ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16"><polyline points="20 6 9 17 4 12"/></svg>
                    : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  }
                </span>
              )}
            </div>
            {errors.confirm && (
              <span id="confirm-error" className="field-error">{errors.confirm}</span>
            )}
          </div>

          <button type="submit" className="auth-btn" disabled={isSubmitting}>
            {isSubmitting ? <span className="btn-spinner" /> : 'Create account'}
          </button>
        </form>

        <p className="auth-footer-text">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </div>

      <style>{registerStyles}</style>
    </div>
  );
}

const registerStyles = `
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

  @keyframes cardIn { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }

  .auth-brand { display:flex; align-items:center; gap:0.6rem; margin-bottom:2rem; }
  .auth-title { font-family:'JetBrains Mono',monospace; font-size:1.1rem; font-weight:500; color:#000000; letter-spacing:0.05em; margin:0; }
  .auth-heading { font-size:1.6rem; font-weight:600; color:#000000; margin:0 0 0.4rem; letter-spacing:-0.02em; }
  .auth-subheading { font-size:0.875rem; color:#6b6b8a; margin:0 0 1.75rem; }

  .auth-error { display:flex; align-items:center; gap:0.5rem; background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.2); color:#f87171; border-radius:10px; padding:0.75rem 1rem; font-size:0.85rem; margin-bottom:1.25rem; }

  .auth-form { display:flex; flex-direction:column; gap:1rem; }
  .field-group { display:flex; flex-direction:column; gap:0.4rem; }
  .field-label { font-size:0.8rem; font-weight:600; color:#71717a; letter-spacing:0.02em; text-transform:uppercase; }

  .field-input { background:rgba(0,0,0,0.03); border:1px solid rgba(0,0,0,0.1); border-radius:10px; padding:0.7rem 0.9rem; color:#000000; font-family:'Sora',sans-serif; font-size:0.9rem; outline:none; transition:border-color 0.2s,box-shadow 0.2s; width:100%; box-sizing:border-box; }
  .field-input::placeholder { color:#71717a; }

  .field-input:-webkit-autofill,
  .field-input:-webkit-autofill:hover,
  .field-input:-webkit-autofill:focus {
    -webkit-text-fill-color: #000000;
    -webkit-box-shadow: 0 0 0 1000px rgba(0,0,0,0.03) inset;
    box-shadow: 0 0 0 1000px rgba(0,0,0,0.03) inset;
    caret-color: #000000;
    transition: background-color 9999s ease-out 0s;
  }

  .field-input:-moz-autofill {
    box-shadow: 0 0 0 1000px rgba(0,0,0,0.03) inset;
    color: #000000;
  }

  .field-input:focus { border-color:rgba(24,24,27,1); box-shadow:0 0 0 3px rgba(24,24,27,0.1); }

  .field-input-error { border-color:rgba(239,68,68,0.5) !important; }
  .field-input-error:focus { border-color:rgba(239,68,68,0.5) !important; box-shadow:0 0 0 3px rgba(239,68,68,0.12) !important; }
  .field-error { color:#f87171; font-size:0.75rem; margin-top:0.25rem; display:block; }

  .field-password-wrap { position:relative; }
  .field-password-wrap .field-input { padding-right:2.75rem; }
  .field-eye { position:absolute; right:0.75rem; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:#71717a; padding:0; display:flex; align-items:center; transition:color 0.2s; }
  .field-eye:hover { color:#18181b; }

  .field-match-icon { position:absolute; right:0.75rem; top:50%; transform:translateY(-50%); display:flex; align-items:center; pointer-events:none; }
  .field-match-icon.ok { color:#10b981; }
  .field-match-icon.bad { color:#f87171; }

  .pwd-reqs { display:flex; flex-wrap:wrap; gap:0.4rem 0.75rem; margin-top:0.5rem; }
  .pwd-req { display:flex; align-items:center; gap:0.3rem; font-size:0.75rem; color:#71717a; transition:color 0.2s; }
  .pwd-req.met { color:#10b981; }

  .auth-btn { margin-top:0.5rem; background:#18181b; color:white; border:none; border-radius:10px; padding:0.8rem; font-family:'Sora',sans-serif; font-size:0.9rem; font-weight:500; cursor:pointer; transition:opacity 0.2s,transform 0.1s; display:flex; align-items:center; justify-content:center; height:44px; }
  .auth-btn:hover:not(:disabled) { opacity:0.9; transform:translateY(-1px); }
  .auth-btn:active:not(:disabled) { transform:translateY(0); }
  .auth-btn:disabled { opacity:0.5; cursor:not-allowed; }

  .btn-spinner { width:16px; height:16px; border:2px solid rgba(255,255,255,0.3); border-top-color:white; border-radius:50%; animation:spin 0.7s linear infinite; }
  @keyframes spin { to { transform:rotate(360deg); } }

  .auth-footer-text { margin-top:1.5rem; text-align:center; font-size:0.85rem; color:#52525b; }
  .auth-link { color:#18181b; text-decoration:none; font-weight:600; transition:color 0.2s; }
  .auth-link:hover { color:#27272a; text-decoration:underline; }
`;
