'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { DBParticipant, DBSponsor } from '@/types';
import { getParticipants } from '@/actions/participants';
import { getSponsors } from '@/actions/sponsors';
import { sendEmailsAction } from '@/actions/email';

// Email templates with clean preview versions
const emailTemplates = {
  welcome: {
    preview: `<div style="text-align: center; padding: 40px 20px;">
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" style="margin: 0 auto 20px auto; display: block;">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
  <h2 style="margin: 0 0 16px 0; color: #000; font-size: 28px;">Welcome {{name}}!</h2>
  <p style="margin: 0 0 24px 0; color: #666; font-size: 16px;">We're excited to have you join us at our upcoming hackathon.</p>
  <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 24px 0;">
    <p style="margin: 0; color: #333; font-size: 14px;"><strong>Role:</strong> {{role}}</p>
    <p style="margin: 8px 0 0 0; color: #333; font-size: 14px;"><strong>Company:</strong> {{company}}</p>
  </div>
  <p style="margin: 24px 0 0 0; color: #666; font-size: 14px;">Looking forward to seeing you there!</p>
</div>`,
    html: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" style="margin: 0 auto 20px auto; display: block;">
  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
  <circle cx="12" cy="7" r="4"></circle>
</svg>
<h2 style="margin: 0 0 16px 0; color: #000000; font-size: 28px; text-align: center;">Welcome {{name}}!</h2>
<p style="margin: 0 0 24px 0; color: #666666; font-size: 16px; text-align: center;">We're excited to have you join us at our upcoming hackathon.</p>
<div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 24px 0;">
  <p style="margin: 0; color: #333333; font-size: 14px;"><strong>Role:</strong> {{role}}</p>
  <p style="margin: 8px 0 0 0; color: #333333; font-size: 14px;"><strong>Company:</strong> {{company}}</p>
</div>
<p style="margin: 24px 0 0 0; color: #666666; font-size: 14px; text-align: center;">Looking forward to seeing you there!</p>`
  },
  
  announcement: {
    preview: `<div style="padding: 20px;">
  <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
    </svg>
    <h1 style="font-size: 32px; margin: 0; color: #000;">Important Update!</h1>
  </div>
  <p style="margin: 0 0 16px 0; color: #333; font-size: 16px;">Hi {{name}},</p>
  <p style="margin: 0 0 16px 0; color: #333; font-size: 16px;">We have an important announcement regarding the upcoming event.</p>
  <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; margin: 24px 0;">
    <p style="margin: 0; color: #856404; font-size: 14px;"><strong>Key Information:</strong> [Add your announcement details here]</p>
  </div>
  <p style="margin: 24px 0 0 0; color: #666; font-size: 14px;">Best regards,<br>The Team</p>
</div>`,
    html: `<div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
  </svg>
  <h1 style="font-size: 32px; margin: 0; color: #000000;">Important Update!</h1>
</div>
<p style="margin: 0 0 16px 0; color: #333333; font-size: 16px;">Hi {{name}},</p>
<p style="margin: 0 0 16px 0; color: #333333; font-size: 16px;">We have an important announcement regarding the upcoming event.</p>
<div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; margin: 24px 0;">
  <p style="margin: 0; color: #856404; font-size: 14px;"><strong>Key Information:</strong> [Add your announcement details here]</p>
</div>
<p style="margin: 24px 0 0 0; color: #666666; font-size: 14px;">Best regards,<br>The Team</p>`
  },
  
  reminder: {
    preview: `<div style="text-align: center; padding: 40px 20px;">
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" style="margin: 0 auto 20px auto; display: block;">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
  <h2 style="margin: 0 0 16px 0; color: #000; font-size: 28px;">Reminder: Event Coming Up!</h2>
  <p style="margin: 0 0 24px 0; color: #333; font-size: 16px;">Hey {{name}},</p>
  <div style="background: #e3f2fd; padding: 24px; border-radius: 8px; margin: 24px 0;">
    <p style="margin: 0 0 12px 0; color: #1976d2; font-size: 18px; font-weight: bold;">Just 3 days to go!</p>
    <p style="margin: 0; color: #555; font-size: 14px;">Don't forget to prepare your pitch and bring your laptop.</p>
  </div>
  <p style="margin: 24px 0 0 0; color: #666; font-size: 14px;">See you soon!</p>
</div>`,
    html: `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" style="margin: 0 auto 20px auto; display: block;">
  <circle cx="12" cy="12" r="10"></circle>
  <polyline points="12 6 12 12 16 14"></polyline>
</svg>
<h2 style="margin: 0 0 16px 0; color: #000000; font-size: 28px; text-align: center;">Reminder: Event Coming Up!</h2>
<p style="margin: 0 0 24px 0; color: #333333; font-size: 16px; text-align: center;">Hey {{name}},</p>
<div style="background: #e3f2fd; padding: 24px; border-radius: 8px; margin: 24px 0;">
  <p style="margin: 0 0 12px 0; color: #1976d2; font-size: 18px; font-weight: bold; text-align: center;">Just 3 days to go!</p>
  <p style="margin: 0; color: #555555; font-size: 14px; text-align: center;">Don't forget to prepare your pitch and bring your laptop.</p>
</div>
<p style="margin: 24px 0 0 0; color: #666666; font-size: 14px; text-align: center;">See you soon!</p>`
  },
  
  thankyou: {
    preview: `<div style="text-align: center; padding: 40px 20px;">
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" style="margin: 0 auto 20px auto; display: block;">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
  <h2 style="margin: 0 0 16px 0; color: #000; font-size: 28px;">Thank You {{name}}!</h2>
  <p style="margin: 0 0 24px 0; color: #333; font-size: 16px;">Your participation made our event a success.</p>
  <div style="background: #f0f9ff; padding: 24px; border-radius: 8px; margin: 24px 0;">
    <p style="margin: 0; color: #0369a1; font-size: 16px;">We hope you enjoyed the experience and made valuable connections.</p>
  </div>
  <p style="margin: 24px 0 0 0; color: #666; font-size: 14px;">Stay in touch!</p>
</div>`,
    html: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" style="margin: 0 auto 20px auto; display: block;">
  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
  <polyline points="22 4 12 14.01 9 11.01"></polyline>
</svg>
<h2 style="margin: 0 0 16px 0; color: #000000; font-size: 28px; text-align: center;">Thank You {{name}}!</h2>
<p style="margin: 0 0 24px 0; color: #333333; font-size: 16px; text-align: center;">Your participation made our event a success.</p>
<div style="background: #f0f9ff; padding: 24px; border-radius: 8px; margin: 24px 0;">
  <p style="margin: 0; color: #0369a1; font-size: 16px; text-align: center;">We hope you enjoyed the experience and made valuable connections.</p>
</div>
<p style="margin: 24px 0 0 0; color: #666666; font-size: 14px; text-align: center;">Stay in touch!</p>`
  }
};

interface Participant {
  name: string;
  email: string;
  role?: string;
  company?: string;
  phone?: string;
  selected: boolean;
}

export default function MailerPage() {
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof emailTemplates | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedData = results.data.map((row: any) => ({
          name: row.name || 'N/A',
          email: row.email || '',
          role: row.role || '',
          company: row.company || '',
          phone: row.phone || '',
          selected: true,
        })).filter(p => p.email);

        setParticipants(parsedData);
        setStatus(`Loaded ${parsedData.length} recipients from ${file.name}`);
      },
      error: (error) => {
        setStatus(`Error parsing CSV: ${error.message}`);
      },
    });
  };

  const loadParticipantsFromDB = async () => {
    try {
      setStatus('Loading participants from database...');
      const dbParticipants = await getParticipants();
      
      const transformed: Participant[] = dbParticipants.map(p => ({
        name: p.name,
        email: p.email,
        role: p.role || '',
        company: p.institute || '',
        phone: p.phone || '',
        selected: true,
      }));
      
      setParticipants(transformed);
      setStatus(`Loaded ${transformed.length} participants from database`);
    } catch (error) {
      setStatus('Error loading participants from database');
      console.error(error);
    }
  };

  const loadSponsorsFromDB = async () => {
    try {
      setStatus('Loading sponsors from database...');
      const dbSponsors = await getSponsors();
      
      const transformed: Participant[] = dbSponsors.map(s => ({
        name: s.name,
        email: s.email,
        role: s.role || '',
        company: s.companyName,
        phone: s.phone || '',
        selected: true,
      }));
      
      setParticipants(transformed);
      setStatus(`Loaded ${transformed.length} sponsors from database`);
    } catch (error) {
      setStatus('Error loading sponsors from database');
      console.error(error);
    }
  };

  const toggleParticipant = (index: number) => {
    setParticipants(prev =>
      prev.map((p, i) => (i === index ? { ...p, selected: !p.selected } : p))
    );
  };

  const toggleAll = (selectAll: boolean) => {
    setParticipants(prev => prev.map(p => ({ ...p, selected: selectAll })));
  };

  const loadTemplate = (templateKey: keyof typeof emailTemplates) => {
    setHtmlContent(emailTemplates[templateKey].html);
    setSelectedTemplate(templateKey);
    setShowTemplates(false);
    setStatus('Template loaded! Customize the editable parts as needed.');
  };

  const handleSend = async () => {
    const selectedParticipants = participants.filter(p => p.selected);

    if (!subject.trim()) {
      setStatus('Please enter a subject line');
      return;
    }

    if (!htmlContent.trim()) {
      setStatus('Please enter email content');
      return;
    }

    if (selectedParticipants.length === 0) {
      setStatus('Please select at least one recipient');
      return;
    }

    setSending(true);
    setStatus(`Sending to ${selectedParticipants.length} recipients...`);

    try {
      const result = await sendEmailsAction(
        subject,
        htmlContent,
        selectedParticipants.map(p => ({
          name: p.name,
          email: p.email,
          role: p.role || '',
          company: p.company || '',
          phone: p.phone || '',
        }))
      );

      if (result.success) {
        setStatus(`${result.message}`);
        setSubject('');
        setHtmlContent('');
        setParticipants([]);
        setSelectedTemplate(null);
      } else {
        setStatus(`${result.message}`);
      }
    } catch (error) {
      setStatus(`Error sending emails: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSending(false);
    }
  };

  const selectedCount = participants.filter(p => p.selected).length;
  
  const filteredParticipants = participants.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.role && p.role.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (p.company && p.company.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <>
      {/* ── Mobile-responsive overrides ── */}
      <style>{`
        .ml-page { padding: 3rem; }
        .ml-import-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
        .ml-template-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
        .ml-recipient-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.5rem; }
        .ml-content-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
        .ml-recipients-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        @media (max-width: 640px) {
          .ml-page { padding: 1.25rem; padding-top: calc(60px + 1.25rem); }
          .ml-import-grid { grid-template-columns: 1fr 1fr; }
          .ml-template-grid { grid-template-columns: 1fr 1fr; }
          .ml-recipient-grid { grid-template-columns: 1fr; }
          .ml-content-header { flex-wrap: wrap; gap: 0.5rem; }
          .ml-recipients-header { flex-wrap: wrap; gap: 0.5rem; }
        }
      `}</style>

      <div className="ml-page">
        {/* Header */}
        <div style={{ marginBottom: '3rem' }}>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 6vw, 4rem)',
            fontWeight: 900,
            letterSpacing: '-0.05em',
            marginBottom: '0.5rem'
          }}>
            EMAIL COMPOSER
          </h1>
          <p style={{
            fontFamily: 'monospace',
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '1rem'
          }}>
            Create and send your batch email campaign
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '2rem'
        }}>
          {/* Subject Input */}
          <div style={{
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '1.5rem',
            transition: 'border-color 0.3s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontFamily: 'monospace',
              color: 'rgba(255, 255, 255, 0.6)',
              marginBottom: '0.75rem',
              letterSpacing: '0.05em'
            }}>
              SUBJECT LINE
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter your email subject..."
              style={{
                width: '100%',
                boxSizing: 'border-box',
                backgroundColor: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '0.75rem 1rem',
                color: '#fff',
                fontFamily: 'monospace',
                fontSize: '0.875rem'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
            />
          </div>

          {/* Import Recipients Section */}
          <div style={{
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '1.5rem',
            transition: 'border-color 0.3s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontFamily: 'monospace',
              color: 'rgba(255, 255, 255, 0.6)',
              marginBottom: '0.75rem',
              letterSpacing: '0.05em'
            }}>
              IMPORT RECIPIENTS
            </label>
            
            <div className="ml-import-grid">
              {/* Import Participants */}
              <button
                onClick={loadParticipantsFromDB}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  padding: '1.5rem 1rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  backgroundColor: 'transparent'
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
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginBottom: '0.5rem', opacity: 0.6 }}>
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                  textAlign: 'center',
                  letterSpacing: '0.05em'
                }}>
                  LOAD PARTICIPANTS
                </div>
              </button>

              {/* Import Sponsors */}
              <button
                onClick={loadSponsorsFromDB}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  padding: '1.5rem 1rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  backgroundColor: 'transparent'
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
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginBottom: '0.5rem', opacity: 0.6 }}>
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                  textAlign: 'center',
                  letterSpacing: '0.05em'
                }}>
                  LOAD SPONSORS
                </div>
              </button>
            </div>

            {/* Manual CSV Upload */}
            <div style={{ position: 'relative' }}>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer'
                }}
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px dashed rgba(255, 255, 255, 0.2)',
                  padding: '2rem 1rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginBottom: '0.75rem', opacity: 0.6 }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                  marginBottom: '0.25rem'
                }}>
                  {participants.length > 0 ? `${participants.length} recipients loaded` : 'Upload CSV File'}
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: 'rgba(255, 255, 255, 0.4)'
                }}>
                  Click to browse or drag and drop
                </div>
              </label>
            </div>
          </div>

          {/* Email Content */}
          <div style={{
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '1.5rem',
            transition: 'border-color 0.3s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'}>
            <div className="ml-content-header">
              <label style={{
                fontSize: '0.875rem',
                fontFamily: 'monospace',
                color: 'rgba(255, 255, 255, 0.6)',
                letterSpacing: '0.05em'
              }}>
                EMAIL CONTENT
              </label>
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  letterSpacing: '0.05em'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                {showTemplates ? 'HIDE TEMPLATES' : 'LOAD TEMPLATE'}
              </button>
            </div>

            {/* Template Selection with Previews */}
            {showTemplates && (
              <div className="ml-template-grid" style={{
                marginBottom: '1rem',
                padding: '1rem',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                {Object.keys(emailTemplates).map((key) => (
                  <div
                    key={key}
                    onClick={() => loadTemplate(key as keyof typeof emailTemplates)}
                    style={{
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    }}
                  >
                    {/* Template Preview */}
                    <div 
                      style={{
                        backgroundColor: '#fff',
                        padding: '1rem',
                        fontSize: '0.65rem',
                        height: '150px',
                        overflow: 'hidden'
                      }}
                      dangerouslySetInnerHTML={{ 
                        __html: emailTemplates[key as keyof typeof emailTemplates].preview 
                      }}
                    />
                    {/* Template Name */}
                    <div style={{
                      padding: '0.75rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      textAlign: 'center',
                      textTransform: 'uppercase',
                      color: '#fff',
                      letterSpacing: '0.05em'
                    }}>
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Show selected template preview above textarea */}
            {selectedTemplate && !showTemplates && (
              <div style={{
                marginBottom: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  letterSpacing: '0.05em'
                }}>
                  <span>TEMPLATE PREVIEW: {selectedTemplate.toUpperCase()}</span>
                  <button
                    onClick={() => setSelectedTemplate(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255, 255, 255, 0.6)',
                      cursor: 'pointer',
                      fontSize: '0.75rem'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
                <div 
                  style={{
                    backgroundColor: '#fff',
                    padding: '2rem',
                    maxHeight: '200px',
                    overflow: 'auto'
                  }}
                  dangerouslySetInnerHTML={{ 
                    __html: emailTemplates[selectedTemplate].preview 
                  }}
                />
              </div>
            )}

            <textarea
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              placeholder="Edit the template above or write your own HTML here...&#10;&#10;Use {{name}}, {{email}}, {{role}}, {{company}} for personalization."
              rows={12}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                backgroundColor: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '0.75rem 1rem',
                color: '#fff',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                resize: 'vertical'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
            />
            <div style={{
              marginTop: '0.75rem',
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.4)',
              fontFamily: 'monospace',
              display: 'flex',
              alignItems: 'start',
              gap: '0.5rem'
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: '0.125rem' }}>
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              <span>Customize the editable parts of the template. HTML formatting is supported. Your content will be wrapped in a professional email template automatically.</span>
            </div>
          </div>

          {/* Recipients List */}
          {participants.length > 0 && (
            <div style={{
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '1.5rem'
            }}>
              <div className="ml-recipients-header">
                <h3 style={{
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                  letterSpacing: '0.05em',
                  margin: 0
                }}>
                  RECIPIENTS
                </h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => toggleAll(true)}
                    style={{
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                      color: 'rgba(255, 255, 255, 0.6)',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'color 0.3s',
                      letterSpacing: '0.05em'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'}
                  >
                    SELECT ALL
                  </button>
                  <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>|</span>
                  <button
                    onClick={() => toggleAll(false)}
                    style={{
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                      color: 'rgba(255, 255, 255, 0.6)',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'color 0.3s',
                      letterSpacing: '0.05em'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'}
                  >
                    DESELECT ALL
                  </button>
                </div>
              </div>

              {/* Search Box */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ position: 'relative' }}>
                  <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                    style={{
                      position: 'absolute',
                      left: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      opacity: 0.4
                    }}
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search recipients..."
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      padding: '0.5rem 0.75rem 0.5rem 2.5rem',
                      color: '#fff',
                      fontFamily: 'monospace',
                      fontSize: '0.75rem'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)'}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
                  />
                </div>
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                maxHeight: '24rem',
                overflowY: 'auto'
              }}>
                {filteredParticipants.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '2rem 0',
                    color: 'rgba(255, 255, 255, 0.3)',
                    fontFamily: 'monospace',
                    fontSize: '0.75rem'
                  }}>
                    No results found
                  </div>
                ) : (
                  filteredParticipants.map((participant, index) => {
                    const originalIndex = participants.findIndex(p => p.email === participant.email);
                    return (
                      <div
                        key={originalIndex}
                        onClick={() => toggleParticipant(originalIndex)}
                        style={{
                          border: `1px solid ${participant.selected ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                          padding: '1.25rem',
                          cursor: 'pointer',
                          backgroundColor: participant.selected ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                          transition: 'all 0.3s'
                        }}
                        onMouseEnter={(e) => {
                          if (!participant.selected) {
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!participant.selected) {
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                          }
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                          <div style={{ marginTop: '0.25rem' }}>
                            <div style={{
                              width: '1rem',
                              height: '1rem',
                              border: `1px solid ${participant.selected ? '#fff' : 'rgba(255, 255, 255, 0.3)'}`,
                              backgroundColor: participant.selected ? '#fff' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.3s'
                            }}>
                              {participant.selected && (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              )}
                            </div>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontFamily: 'monospace',
                              fontSize: '1rem',
                              fontWeight: 'bold',
                              color: '#fff',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              marginBottom: '0.5rem'
                            }}>
                              {participant.name}
                            </div>
                            <div className="ml-recipient-grid" style={{
                              fontSize: '0.875rem',
                              fontFamily: 'monospace',
                              color: 'rgba(255, 255, 255, 0.6)'
                            }}>
                              <div>
                                <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Email:</span> {participant.email}
                              </div>
                              {participant.role && (
                                <div>
                                  <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Role:</span> {participant.role}
                                </div>
                              )}
                              {participant.company && (
                                <div>
                                  <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Company:</span> {participant.company}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div style={{
                marginTop: '1rem',
                paddingTop: '1rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                color: 'rgba(255, 255, 255, 0.6)'
              }}>
                {selectedCount} of {participants.length} selected
                {searchQuery && filteredParticipants.length !== participants.length && (
                  <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                    {' '}({filteredParticipants.length} shown)
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Status */}
          {status && (
            <div style={{
              border: '1px solid rgba(255, 255, 255, 0.2)',
              padding: '1rem',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              <div style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>{status}</div>
            </div>
          )}

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={sending || participants.length === 0}
            style={{
              width: '100%',
              padding: '1rem',
              fontWeight: 900,
              fontSize: '1.125rem',
              backgroundColor: sending || participants.length === 0 ? 'rgba(255, 255, 255, 0.1)' : '#fff',
              color: sending || participants.length === 0 ? 'rgba(255, 255, 255, 0.3)' : '#000',
              border: 'none',
              cursor: sending || participants.length === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
              letterSpacing: '0.05em'
            }}
            onMouseEnter={(e) => {
              if (!sending && participants.length > 0) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
              }
            }}
            onMouseLeave={(e) => {
              if (!sending && participants.length > 0) {
                e.currentTarget.style.backgroundColor = '#fff';
              }
            }}
          >
            {sending ? 'SENDING...' : `SEND TO ${selectedCount} RECIPIENTS`}
          </button>

          {/* Info Box */}
          <div style={{
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '1.5rem',
            backgroundColor: 'rgba(255, 255, 255, 0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <h4 style={{
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                color: 'rgba(255, 255, 255, 0.6)',
                letterSpacing: '0.05em',
                margin: 0
              }}>
                EMAIL INFO
              </h4>
            </div>
            <ul style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.5)',
              fontFamily: 'monospace',
              listStyle: 'none',
              padding: 0,
              margin: 0
            }}>
              <li style={{ display: 'flex', gap: '0.5rem' }}>
                <span style={{ opacity: 0.6 }}>•</span>
                <span>Professional email template included</span>
              </li>
              <li style={{ display: 'flex', gap: '0.5rem' }}>
                <span style={{ opacity: 0.6 }}>•</span>
                <span>Mobile-responsive design</span>
              </li>
              <li style={{ display: 'flex', gap: '0.5rem' }}>
                <span style={{ opacity: 0.6 }}>•</span>
                <span>Personalization with {'{{variables}}'}</span>
              </li>
              <li style={{ display: 'flex', gap: '0.5rem' }}>
                <span style={{ opacity: 0.6 }}>•</span>
                <span>Preview templates before use</span>
              </li>
              <li style={{ display: 'flex', gap: '0.5rem' }}>
                <span style={{ opacity: 0.6 }}>•</span>
                <span>Test with yourself first!</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}