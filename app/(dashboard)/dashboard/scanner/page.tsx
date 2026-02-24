'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import { getParticipants } from '@/actions/participants';
import { DBParticipant } from '@/types';

type ScanStatus = 'idle' | 'scanning' | 'found' | 'not_found' | 'error';

const QR_BASE_URL = 'https://checkin.hackoverflow4.tech/checkin/';

// Smaller decode canvas = faster jsQR (only used as fallback)
const DECODE_W = 300;
const DECODE_H = 300;

// jsQR fallback throttle — BarcodeDetector runs every frame, no throttle needed
const JSQR_INTERVAL_MS = 50; // ~20fps

// Check for native BarcodeDetector support once
const hasBarcodeDetector =
  typeof window !== 'undefined' &&
  'BarcodeDetector' in window &&
  // @ts-ignore
  typeof BarcodeDetector !== 'undefined';

function extractParticipantId(rawValue: string): string {
  const trimmed = rawValue.trim();
  return trimmed.startsWith(QR_BASE_URL)
    ? trimmed.replace(QR_BASE_URL, '').split('/')[0]
    : trimmed;
}

export default function ScannerPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const decodeCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastScanTime = useRef<number>(0);
  const lastRawRef = useRef<string>('');
  const isScanning = useRef(false);
  // @ts-ignore — BarcodeDetector may not be in TS lib yet
  const detectorRef = useRef<any>(null);

  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
  const [foundParticipant, setFoundParticipant] = useState<DBParticipant | null>(null);
  const [allParticipants, setAllParticipants] = useState<DBParticipant[]>([]);
  const [cameraError, setCameraError] = useState('');
  const [scanCount, setScanCount] = useState(0);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [loadingParticipants, setLoadingParticipants] = useState(true);

  // Load participants
  useEffect(() => {
    getParticipants()
      .then(data => setAllParticipants(data))
      .catch(err => console.error('Failed to load participants:', err))
      .finally(() => setLoadingParticipants(false));
  }, []);

  // Init BarcodeDetector once
  useEffect(() => {
    if (hasBarcodeDetector) {
      try {
        // @ts-ignore
        detectorRef.current = new BarcodeDetector({ formats: ['qr_code'] });
      } catch {
        // ignore — will fall back to jsQR
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    isScanning.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    rafRef.current = null;
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCameraActive(false);
    setScanStatus('idle');
  }, []);

  const handleQRCode = useCallback((rawValue: string) => {
    if (rawValue === lastRawRef.current) return;
    lastRawRef.current = rawValue;
    setScanCount(c => c + 1);

    const participantId = extractParticipantId(rawValue);
    const match = allParticipants.find(p => p.participantId === participantId);

    if (match) {
      setScanStatus('found');
      setFoundParticipant(match);
      isScanning.current = false;
      setTimeout(() => { isScanning.current = true; }, 2000);
    } else {
      setScanStatus('not_found');
      setFoundParticipant(null);
      isScanning.current = false;
      setTimeout(() => { isScanning.current = true; lastRawRef.current = ''; }, 1200);
    }
  }, [allParticipants]);

  // ── BarcodeDetector path (async, hardware-accelerated, every frame) ──────────
  const tickNative = useCallback(() => {
    if (!isScanning.current) {
      rafRef.current = requestAnimationFrame(tickNative);
      return;
    }

    const video = videoRef.current;
    const detector = detectorRef.current;
    if (!video || !detector || video.readyState < 2 || video.videoWidth === 0) {
      rafRef.current = requestAnimationFrame(tickNative);
      return;
    }

    // Fire-and-forget: detect runs async, RAF continues immediately
    detector.detect(video).then((codes: any[]) => {
      if (codes.length > 0 && isScanning.current) {
        handleQRCode(codes[0].rawValue);
      }
    }).catch(() => {}); // silently ignore transient errors

    rafRef.current = requestAnimationFrame(tickNative);
  }, [handleQRCode]);

  // ── jsQR fallback path (canvas + CPU decode, throttled) ─────────────────────
  const tickJSQR = useCallback((timestamp: number) => {
    if (!isScanning.current) {
      rafRef.current = requestAnimationFrame(tickJSQR);
      return;
    }

    const video = videoRef.current;
    const canvas = decodeCanvasRef.current;
    if (!video || !canvas || video.readyState < 2 || video.videoWidth === 0) {
      rafRef.current = requestAnimationFrame(tickJSQR);
      return;
    }

    if (timestamp - lastScanTime.current < JSQR_INTERVAL_MS) {
      rafRef.current = requestAnimationFrame(tickJSQR);
      return;
    }
    lastScanTime.current = timestamp;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const cropSize = Math.min(vw, vh) * 0.85;
    const sx = (vw - cropSize) / 2;
    const sy = (vh - cropSize) / 2;

    canvas.width = DECODE_W;
    canvas.height = DECODE_H;
    ctx.drawImage(video, sx, sy, cropSize, cropSize, 0, 0, DECODE_W, DECODE_H);

    const imageData = ctx.getImageData(0, 0, DECODE_W, DECODE_H);
    const code = jsQR(imageData.data, DECODE_W, DECODE_H, {
      // dontInvert is ~2x faster than attemptBoth — covers 99% of printed QR codes
      inversionAttempts: 'dontInvert',
    });

    if (code?.data) handleQRCode(code.data);

    rafRef.current = requestAnimationFrame(tickJSQR);
  }, [handleQRCode]);

  const startCamera = useCallback(async () => {
    setCameraError('');
    setFoundParticipant(null);
    lastRawRef.current = '';
    setScanStatus('scanning');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30, min: 15 },
        },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);
        isScanning.current = true;

        // Use native BarcodeDetector if available, otherwise jsQR
        if (detectorRef.current) {
          rafRef.current = requestAnimationFrame(tickNative);
        } else {
          rafRef.current = requestAnimationFrame(tickJSQR);
        }
      }
    } catch (err: any) {
      setCameraError(
        err.name === 'NotAllowedError' ? 'Camera permission denied. Please allow camera access and try again.' :
        err.name === 'NotFoundError' ? 'No camera found on this device.' :
        `Camera error: ${err.message}`
      );
      setScanStatus('error');
    }
  }, [tickNative, tickJSQR]);

  const handleReset = useCallback(() => {
    lastRawRef.current = '';
    setFoundParticipant(null);
    if (isCameraActive) {
      setScanStatus('scanning');
      isScanning.current = true;
    } else {
      setScanStatus('idle');
    }
  }, [isCameraActive]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const mono: React.CSSProperties = { fontFamily: 'monospace' };
  const dim: React.CSSProperties = { color: 'rgba(255,255,255,0.5)' };
  const card = (extra?: React.CSSProperties): React.CSSProperties => ({
    border: '1px solid rgba(255,255,255,0.1)',
    padding: '1.5rem',
    ...extra,
  });

  return (
    <>
      <style>{`
        .sc-page { padding: 3rem; }
        .sc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; align-items: start; }
        @media (max-width: 900px) {
          .sc-page { padding: 1.25rem; padding-top: calc(60px + 1.25rem); }
          .sc-grid { grid-template-columns: 1fr; }
        }
        .sc-viewfinder {
          position: relative; background: #000;
          aspect-ratio: 1/1; overflow: hidden;
          display: flex; align-items: center; justify-content: center;
        }
        @keyframes found-pulse {
          0%,100% { border-color: rgba(74,222,128,0.5); }
          50% { border-color: rgba(74,222,128,1); box-shadow: 0 0 24px rgba(74,222,128,0.15); }
        }
        .sc-found { animation: found-pulse 1.2s infinite; }
        .sc-btn-ghost {
          background: transparent; border: 1px solid rgba(255,255,255,0.2); color: #fff;
          font-family: monospace; font-size: 0.875rem; cursor: pointer;
          padding: 0.875rem 1.25rem; letter-spacing: 0.05em; transition: background 0.2s;
        }
        .sc-btn-ghost:hover { background: rgba(255,255,255,0.06); }
        .sc-btn-danger {
          background: rgba(248,113,113,0.15); border: 1px solid rgba(248,113,113,0.4);
          color: #f87171; font-family: monospace; font-size: 0.875rem;
          cursor: pointer; padding: 0.875rem 1.25rem;
          letter-spacing: 0.05em; transition: background 0.2s; flex: 1;
        }
        .sc-btn-danger:hover { background: rgba(248,113,113,0.25); }
      `}</style>

      <div className="sc-page">
        <div style={{ marginBottom: '3rem' }}>
          <h1 style={{ fontSize: 'clamp(2.5rem,6vw,4rem)', fontWeight: 900, letterSpacing: '-0.05em', marginBottom: '0.5rem' }}>
            QR SCANNER
          </h1>
          <p style={{ ...mono, ...dim, fontSize: '1rem' }}>
            Scan a participant badge to retrieve their full details
            {detectorRef.current && (
              <span style={{ color: 'rgba(74,222,128,0.7)', marginLeft: '0.75rem' }}>
                ● native decoder active
              </span>
            )}
          </p>
        </div>

        <div className="sc-grid">
          {/* Left: camera */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            <div
              style={card({
                borderColor:
                  scanStatus === 'found' ? 'rgba(74,222,128,0.5)' :
                  scanStatus === 'not_found' ? 'rgba(248,113,113,0.5)' :
                  'rgba(255,255,255,0.1)',
                transition: 'border-color 0.3s, box-shadow 0.3s',
                padding: '1.25rem',
              })}
              className={scanStatus === 'found' ? 'sc-found' : ''}
            >
              <div style={{ ...mono, ...dim, fontSize: '0.7rem', letterSpacing: '0.12em', marginBottom: '1rem' }}>
                CAMERA VIEWFINDER
              </div>

              <div className="sc-viewfinder" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                <video
                  ref={videoRef} muted playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: isCameraActive ? 'block' : 'none' }}
                />

                {!isCameraActive && (
                  <div style={{ textAlign: 'center', ...mono, color: 'rgba(255,255,255,0.25)' }}>
                    <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"
                      style={{ display: 'block', margin: '0 auto 1rem', opacity: 0.35 }}>
                      <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
                      <rect x="7" y="7" width="3" height="3" />
                      <rect x="14" y="7" width="3" height="3" />
                      <rect x="7" y="14" width="3" height="3" />
                      <path d="M14 14h3v3h-3z" />
                    </svg>
                    <div style={{ fontSize: '0.875rem' }}>Camera inactive</div>
                    <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.5 }}>Press START SCANNING below</div>
                  </div>
                )}

                {scanStatus === 'found' && (
                  <div style={{
                    position: 'absolute', inset: 0, background: 'rgba(74,222,128,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20, pointerEvents: 'none',
                  }}>
                    <div style={{ background: 'rgba(0,0,0,0.55)', borderRadius: '50%', padding: '12px', display: 'flex' }}>
                      <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" /><polyline points="7 12 10 15 17 9" />
                      </svg>
                    </div>
                  </div>
                )}

                {scanStatus === 'not_found' && (
                  <div style={{
                    position: 'absolute', inset: 0, background: 'rgba(248,113,113,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20, pointerEvents: 'none',
                  }}>
                    <div style={{ background: 'rgba(0,0,0,0.55)', borderRadius: '50%', padding: '12px', display: 'flex' }}>
                      <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="8" y1="8" x2="16" y2="16" /><line x1="16" y1="8" x2="8" y2="16" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>

              {/* Hidden decode canvas — only used by jsQR fallback */}
              <canvas ref={decodeCanvasRef} width={DECODE_W} height={DECODE_H} style={{ display: 'none' }} />
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {!isCameraActive ? (
                <button
                  onClick={startCamera}
                  disabled={loadingParticipants}
                  style={{
                    flex: 1, padding: '0.875rem',
                    background: '#fff', border: 'none', color: '#000',
                    fontFamily: 'monospace', fontSize: '0.875rem', fontWeight: 'bold',
                    cursor: loadingParticipants ? 'not-allowed' : 'pointer',
                    letterSpacing: '0.05em', opacity: loadingParticipants ? 0.5 : 1,
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={e => { if (!loadingParticipants) e.currentTarget.style.opacity = '0.85'; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = loadingParticipants ? '0.5' : '1'; }}
                >
                  {loadingParticipants ? '↻ LOADING DB...' : '▶ START SCANNING'}
                </button>
              ) : (
                <>
                  <button className="sc-btn-danger" onClick={stopCamera}>■ STOP</button>
                  <button className="sc-btn-ghost" onClick={handleReset}>↺ NEXT SCAN</button>
                </>
              )}
            </div>

            {cameraError && (
              <div style={{
                border: '1px solid rgba(248,113,113,0.35)', background: 'rgba(248,113,113,0.07)',
                padding: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'start',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}>
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <div style={{ ...mono, fontSize: '0.85rem', color: '#f87171' }}>{cameraError}</div>
              </div>
            )}

            {/* Status bar */}
            <div style={card({ display: 'flex', gap: '2rem', padding: '1rem 1.25rem' })}>
              {[
                {
                  label: 'STATUS',
                  value: scanStatus === 'idle' ? '● IDLE'
                    : scanStatus === 'scanning' ? '● SCANNING'
                    : scanStatus === 'found' ? '● FOUND'
                    : scanStatus === 'not_found' ? '● NOT FOUND'
                    : '● ERROR',
                  color: scanStatus === 'found' ? '#4ade80'
                    : scanStatus === 'not_found' || scanStatus === 'error' ? '#f87171'
                    : scanStatus === 'scanning' ? '#facc15'
                    : 'rgba(255,255,255,0.5)',
                },
                { label: 'SCANS', value: String(scanCount), color: '#fff' },
                { label: 'DB SIZE', value: String(allParticipants.length), color: '#fff' },
                {
                  label: 'DECODER',
                  value: detectorRef.current ? 'NATIVE' : 'JSQR',
                  color: detectorRef.current ? '#4ade80' : 'rgba(255,255,255,0.5)',
                },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <div style={{ ...mono, fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', marginBottom: '0.3rem' }}>{label}</div>
                  <div style={{ ...mono, fontSize: '0.875rem', fontWeight: 'bold', color }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: result */}
          <div>
            {foundParticipant
              ? <ParticipantCard participant={foundParticipant} onClose={handleReset} />
              : <EmptyState scanStatus={scanStatus} />
            }
          </div>
        </div>
      </div>
    </>
  );
}

function EmptyState({ scanStatus }: { scanStatus: ScanStatus }) {
  const mono: React.CSSProperties = { fontFamily: 'monospace' };
  const isNotFound = scanStatus === 'not_found';
  return (
    <div style={{
      border: `1px solid ${isNotFound ? 'rgba(248,113,113,0.35)' : 'rgba(255,255,255,0.1)'}`,
      background: isNotFound ? 'rgba(248,113,113,0.05)' : 'transparent',
      padding: '3rem 1.5rem', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center',
      minHeight: '300px', gap: '0.75rem',
    }}>
      {isNotFound ? (
        <>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="1.5" style={{ opacity: 0.7 }}>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
          <div style={{ ...mono, color: '#f87171', fontSize: '0.95rem', fontWeight: 'bold' }}>QR NOT RECOGNIZED</div>
          <div style={{ ...mono, fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', maxWidth: '240px', lineHeight: '1.5' }}>
            The scanned code doesn't match any participant in the database
          </div>
        </>
      ) : (
        <>
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ opacity: 0.18 }}>
            <rect x="5" y="5" width="5" height="5" /><rect x="14" y="5" width="5" height="5" />
            <rect x="5" y="14" width="5" height="5" />
            <path d="M14 14h.01M18 14h.01M14 18h.01M18 18h.01M16 16h.01" strokeWidth="2.5" />
          </svg>
          <div style={{ ...mono, fontSize: '0.875rem', color: 'rgba(255,255,255,0.25)' }}>Participant info appears here</div>
          <div style={{ ...mono, fontSize: '0.75rem', color: 'rgba(255,255,255,0.15)' }}>Hold the badge QR inside the dashed box</div>
        </>
      )}
    </div>
  );
}

function ParticipantCard({ participant: p, onClose }: { participant: DBParticipant; onClose: () => void }) {
  const mono: React.CSSProperties = { fontFamily: 'monospace' };

  const Field = ({ label, value }: { label: string; value?: string | null }) => {
    if (!value) return null;
    return (
      <div>
        <div style={{ ...mono, fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', marginBottom: '0.25rem' }}>{label}</div>
        <div style={{ ...mono, fontSize: '0.875rem', color: '#fff', wordBreak: 'break-word' }}>{value}</div>
      </div>
    );
  };

  const CheckRow = ({ label, status, time }: { label: string; status?: boolean; time?: Date | string }) => (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '0.6rem 0.875rem',
      border: `1px solid ${status ? 'rgba(74,222,128,0.25)' : 'rgba(255,255,255,0.08)'}`,
      background: status ? 'rgba(74,222,128,0.06)' : 'transparent',
    }}>
      <span style={{ ...mono, fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        {time && <span style={{ ...mono, fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)' }}>{new Date(time).toLocaleTimeString()}</span>}
        <span style={{ ...mono, fontSize: '0.8rem', fontWeight: 'bold', color: status ? '#4ade80' : '#f87171' }}>
          {status ? '✓ YES' : '✗ NO'}
        </span>
      </div>
    </div>
  );

  return (
    <div style={{
      border: '1px solid rgba(74,222,128,0.4)', background: 'rgba(74,222,128,0.03)',
      padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <div>
          <div style={{ ...mono, fontSize: '0.65rem', color: 'rgba(74,222,128,0.8)', letterSpacing: '0.15em', marginBottom: '0.5rem' }}>
            ● PARTICIPANT FOUND
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1 }}>{p.name}</div>
          <div style={{ ...mono, fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.375rem' }}>
            ID: {p.participantId}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.6)', width: '32px', height: '32px',
            cursor: 'pointer', ...mono, fontSize: '1.1rem', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
        >×</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem 1.5rem' }}>
        <Field label="EMAIL" value={p.email} />
        <Field label="PHONE" value={p.phone} />
        <Field label="TEAM" value={p.teamName} />
        <Field label="ROLE" value={p.role} />
        <Field label="INSTITUTE" value={p.institute} />
        <Field label="LAB ALLOTTED" value={p.labAllotted} />
        {p.wifiCredentials?.ssid && <Field label="WiFi SSID" value={p.wifiCredentials.ssid} />}
        {p.wifiCredentials?.password && <Field label="WiFi PASSWORD" value={p.wifiCredentials.password} />}
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.25rem' }}>
        <div style={{ ...mono, fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', marginBottom: '0.75rem' }}>
          CHECK-IN STATUS
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <CheckRow label="COLLEGE CHECK-IN" status={p.collegeCheckIn?.status} time={p.collegeCheckIn?.time} />
          <CheckRow label="LAB CHECK-IN" status={p.labCheckIn?.status} time={p.labCheckIn?.time} />
        </div>
      </div>
    </div>
  );
}