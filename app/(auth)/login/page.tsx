'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loginAction } from '@/actions/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await loginAction(email, password);

      if (result.success) {
        router.push('/dashboard');
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#000',
      color: '#fff',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Background Effects */}
      <div style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0
      }}>
        <div style={{
          position: 'absolute',
          top: '20%',
          right: '10%',
          width: '24rem',
          height: '24rem',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '9999px',
          filter: 'blur(80px)'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '20%',
          left: '10%',
          width: '24rem',
          height: '24rem',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '9999px',
          filter: 'blur(80px)'
        }} />
      </div>

      {/* Login Card */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        width: '100%',
        maxWidth: '28rem',
        margin: '0 1.5rem'
      }}>
        {/* Logo/Brand */}
        <div style={{
          textAlign: 'center',
          marginBottom: '3rem'
        }}>
          <Link 
            href="/"
            style={{
              fontSize: '2rem',
              fontWeight: 900,
              letterSpacing: '-0.05em',
              textDecoration: 'none',
              color: '#fff',
              transition: 'color 0.3s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#fff'}
          >
            HACKOVERFLOW
          </Link>
          <div style={{
            fontSize: '0.875rem',
            fontFamily: 'monospace',
            color: 'rgba(255, 255, 255, 0.4)',
            marginTop: '0.5rem'
          }}>
            ADMIN PORTAL
          </div>
        </div>

        {/* Login Form */}
        <div style={{
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '2.5rem',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(10px)'
        }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 900,
            marginBottom: '0.5rem',
            letterSpacing: '-0.05em'
          }}>
            WELCOME BACK
          </h1>
          <p style={{
            fontSize: '0.875rem',
            fontFamily: 'monospace',
            color: 'rgba(255, 255, 255, 0.6)',
            marginBottom: '2rem'
          }}>
            Login to access your dashboard
          </p>

          <form onSubmit={handleSubmit} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}>
            {/* Email Input */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: '0.5rem',
                letterSpacing: '0.1em'
              }}>
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                style={{
                  width: '100%',
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  padding: '0.875rem 1rem',
                  color: '#fff',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  transition: 'border-color 0.3s',
                  outline: 'none'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
              />
            </div>

            {/* Password Input */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: '0.5rem',
                letterSpacing: '0.1em'
              }}>
                PASSWORD
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  padding: '0.875rem 1rem',
                  color: '#fff',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  transition: 'border-color 0.3s',
                  outline: 'none'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                padding: '0.875rem',
                border: '1px solid rgba(255, 100, 100, 0.5)',
                backgroundColor: 'rgba(255, 100, 100, 0.1)',
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                color: '#ff6b6b'
              }}>
                ⚠ {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '1rem',
                backgroundColor: loading ? 'rgba(255, 255, 255, 0.5)' : '#fff',
                color: '#000',
                border: 'none',
                fontWeight: 900,
                fontSize: '0.875rem',
                letterSpacing: '0.1em',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s',
                opacity: loading ? 0.7 : 1
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = '#fff';
              }}
            >
              {loading ? 'LOGGING IN...' : 'LOGIN'}
            </button>
          </form>
        </div>

        {/* Back to Home */}
        <div style={{
          marginTop: '2rem',
          textAlign: 'center'
        }}>
          <Link
            href="/"
            style={{
              fontSize: '0.875rem',
              fontFamily: 'monospace',
              color: 'rgba(255, 255, 255, 0.4)',
              textDecoration: 'none',
              transition: 'color 0.3s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)'}
          >
            ← BACK TO HOME
          </Link>
        </div>
      </div>
    </div>
  );
}