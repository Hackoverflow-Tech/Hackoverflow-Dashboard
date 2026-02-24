'use client';
import Link from 'next/link';
export default function HomePage() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#000',
      color: '#fff',
      position: 'relative',
      overflow: 'hidden'
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
          top: '5rem',
          left: '5rem',
          width: '30rem',
          height: '30rem',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '9999px',
          filter: 'blur(100px)'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '5rem',
          right: '5rem',
          width: '30rem',
          height: '30rem',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '9999px',
          filter: 'blur(100px)'
        }} />
      </div>
      {/* Navigation */}
      <nav style={{
        position: 'relative',
        zIndex: 10,
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{
          maxWidth: '80rem',
          margin: '0 auto',
          padding: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: 900,
            letterSpacing: '-0.05em'
          }}>
            HACKOVERFLOW <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>ADMIN</span>
          </div>
          <Link 
            href="/login"
            style={{
              padding: '0.75rem 1.5rem',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backgroundColor: 'transparent',
              color: '#fff',
              textDecoration: 'none',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              letterSpacing: '0.1em',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            LOGIN
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        position: 'relative',
        zIndex: 10,
        maxWidth: '80rem',
        margin: '0 auto',
        padding: '8rem 1.5rem 6rem'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            fontSize: 'clamp(4rem, 15vw, 12rem)',
            fontWeight: 900,
            lineHeight: 0.9,
            letterSpacing: '-0.05em',
            marginBottom: '2rem'
          }}>
            HACK
            <br />
            <span style={{
              background: 'linear-gradient(to right, #fff, rgba(255, 255, 255, 0.3))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
             OVERFLOW
            </span>
          </h1>
          <p style={{
            fontSize: '1.25rem',
            color: 'rgba(255, 255, 255, 0.6)',
            maxWidth: '42rem',
            margin: '0 auto 3rem',
            fontFamily: 'monospace',
            lineHeight: 1.6
          }}>
            Unified admin dashboard for management.
            <br />
            Built for Hackoverflow 4.0
          </p>
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <Link
              href="/login"
              style={{
                padding: '1rem 2.5rem',
                backgroundColor: '#fff',
                color: '#000',
                fontWeight: 900,
                fontSize: '1.125rem',
                textDecoration: 'none',
                transition: 'all 0.3s',
                letterSpacing: '-0.02em'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
            >
              GET STARTED
            </Link>
            <a
              href="https://github.com/Niravcanvas/Hackoverflow-Dashboard.git"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '1rem 2.5rem',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backgroundColor: 'transparent',
                color: '#fff',
                fontSize: '1.125rem',
                fontFamily: 'monospace',
                cursor: 'pointer',
                transition: 'all 0.3s',
                fontWeight: 'normal',
                textDecoration: 'none',
                display: 'inline-block'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              GITHUB REPO
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        position: 'relative',
        zIndex: 10,
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '3rem 0'
      }}>
        <div style={{
          maxWidth: '80rem',
          margin: '0 auto',
          padding: '0 1.5rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '2rem'
          }}>
            <div>
              <div style={{
                fontSize: '0.875rem',
                color: 'rgba(255, 255, 255, 0.4)',
                fontFamily: 'monospace'
              }}>
                © 2026 Made by NI
              </div>
            </div>
            <div style={{
              display: 'flex',
              gap: '2rem',
              fontSize: '0.875rem',
              fontFamily: 'monospace'
            }}>
              <a 
                href="https://www.instagram.com/hackoverflow4.0"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: 'rgba(255, 255, 255, 0.5)',
                  textDecoration: 'none',
                  transition: 'color 0.3s',
                  letterSpacing: '0.05em'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'}
              >
                INSTAGRAM
              </a>
              <a 
                href="https://hackoverflow4.tech"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: 'rgba(255, 255, 255, 0.5)',
                  textDecoration: 'none',
                  transition: 'color 0.3s',
                  letterSpacing: '0.05em'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'}
              >
                WEBSITE
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}