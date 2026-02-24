'use client';

import React from 'react';
import { IDCardData, HackathonInfo } from '@/types';

interface IDCardTemplateProps {
  data: IDCardData;
  hackathonInfo: HackathonInfo;
}

const IDCardTemplate: React.FC<IDCardTemplateProps> = ({ data, hackathonInfo }) => {
  return (
    <div style={{
      width: '400px',
      height: '650px',
      background: '#fff',
      border: '3px solid #000',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'Poppins, system-ui, sans-serif',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header Section with College Info */}
      <div style={{
        background: 'linear-gradient(135deg, #000 0%, #1a1a1a 100%)',
        color: '#fff',
        padding: '1rem 1rem',
        textAlign: 'center',
        borderBottom: '4px solid #fff',
        flexShrink: 0
      }}>
        <div style={{
          fontSize: '0.5rem',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontWeight: '400',
          marginBottom: '0.25rem',
          opacity: '0.9'
        }}>
          Mahatma Education Society&apos;s
        </div>
        <h1 style={{
          fontSize: '0.7rem',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          lineHeight: '1.2',
          marginBottom: '0.25rem'
        }}>
          Pillai HOC College of Engineering<br />and Technology, Rasayani
        </h1>
        <div style={{
          fontSize: '0.5rem',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          fontWeight: '400',
          marginBottom: '0.5rem',
          opacity: '0.8'
        }}>
          (Autonomous)
        </div>
        <div style={{
          height: '1px',
          width: '80%',
          background: 'rgba(255, 255, 255, 0.3)',
          margin: '0.5rem auto'
        }} />
        <div style={{
          fontSize: '0.6rem',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          fontWeight: '600',
          marginBottom: '0.5rem'
        }}>
          Department of Computer Engineering
        </div>
        <div style={{
          fontSize: '1.25rem',
          fontWeight: '800',
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          background: 'linear-gradient(90deg, #fff 0%, #ddd 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginTop: '0.5rem'
        }}>
          HACKOVERFLOW 4.0
        </div>
      </div>

      {/* Participant Info Section */}
      <div style={{
        padding: '1.25rem 1.25rem 0.75rem',
        flex: '1',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.875rem'
      }}>
        {/* Name Card */}
        <div style={{
          border: '2px solid #000',
          padding: '1rem',
          background: 'linear-gradient(135deg, #f8f8f8 0%, #fff 100%)',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: '-8px',
            left: '1rem',
            background: '#fff',
            padding: '0 0.5rem',
            fontSize: '0.625rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontWeight: '600',
            color: '#666'
          }}>
            Participant
          </div>
          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: '800',
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
            lineHeight: '1.2',
            marginBottom: '0.5rem',
            color: '#000',
            wordWrap: 'break-word'
          }}>
            {data.name}
          </h2>
          <div style={{
            display: 'inline-block',
            background: '#000',
            color: '#fff',
            padding: '0.375rem 0.875rem',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontWeight: '600'
          }}>
            {data.role}
          </div>
        </div>

        {/* Details Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '0.625rem',
          fontSize: '0.75rem'
        }}>
          {[
            { label: 'Company:', value: data.company },
            { label: 'Email:', value: data.email, small: true },
            { label: 'Phone:', value: data.phone },
            { label: 'ID:', value: data.participantId, mono: true },
          ].map((detail) => (
            <div key={detail.label} style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0.5rem',
              border: '1px solid #e0e0e0',
              background: '#fafafa'
            }}>
              <span style={{
                fontWeight: '700',
                textTransform: 'uppercase',
                fontSize: '0.625rem',
                letterSpacing: '0.08em',
                color: '#666',
                minWidth: '70px'
              }}>
                {detail.label}
              </span>
              <span style={{
                fontWeight: detail.mono ? '600' : '500',
                fontFamily: detail.mono ? 'monospace' : 'inherit',
                fontSize: detail.small ? '0.65rem' : undefined,
                color: '#000',
                marginLeft: '0.5rem',
                wordBreak: detail.small ? 'break-all' : undefined
              }}>
                {detail.value}
              </span>
            </div>
          ))}
        </div>

        {/* QR Code Section */}
        <div style={{
          border: '2px solid #000',
          padding: '0.75rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: '#fff',
          marginTop: 'auto',
          marginBottom: '0.5rem'
        }}>
          <p style={{
            fontSize: '0.625rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: '0.5rem',
            color: '#000'
          }}>
            Scan for Details
          </p>
          <div style={{
            background: '#fff',
            padding: '0.375rem',
            border: '2px solid #000'
          }}>
            <img
              src={data.qrCodeDataURL}
              alt="QR Code"
              style={{ width: '100px', height: '100px', display: 'block' }}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        background: '#000',
        color: '#fff',
        textAlign: 'center',
        padding: '0.625rem',
        fontSize: '0.625rem',
        textTransform: 'uppercase',
        letterSpacing: '0.2em',
        fontWeight: '600',
        borderTop: '2px solid #fff',
        flexShrink: 0
      }}>
        Official Participant ID Card
      </div>

      {/* Decorative Corner Elements */}
      <div style={{
        position: 'absolute',
        top: '0',
        left: '0',
        width: '20px',
        height: '20px',
        borderTop: '3px solid #fff',
        borderLeft: '3px solid #fff'
      }} />
      <div style={{
        position: 'absolute',
        top: '0',
        right: '0',
        width: '20px',
        height: '20px',
        borderTop: '3px solid #fff',
        borderRight: '3px solid #fff'
      }} />
    </div>
  );
};

export default IDCardTemplate;
