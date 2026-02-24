'use client';

import { useState, useRef } from 'react';
import IDCardTemplate from '@/components/id-card/IDCardTemplate';
import { IDCardData, HackathonInfo, DBParticipant } from '@/types';
import { parseCSVForIDCards } from '@/lib/csv';
import { downloadCSVTemplate } from '@/utils/csv-download';
import { getParticipants } from '@/actions/participants';
import { generateQRCode } from '@/utils/generate-qr';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import { generateBulkVectorPDFs } from '@/utils/generate-pdf';

interface SelectableIDCardData extends IDCardData {
  selected: boolean;
}

/**
 * ID Card Generator Page
 *
 * Upload CSV, preview cards, and generate
 * bulk PNG or vector PDF ID card downloads.
 */
export default function GeneratorPage() {
  const [cards, setCards] = useState<SelectableIDCardData[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadFormat, setDownloadFormat] = useState<'png' | 'pdf'>('png');
  const [fileName, setFileName] = useState('');
  const [status, setStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const hackathonInfo: HackathonInfo = {
    name: 'HACKOVERFLOW 4.0',
    date: 'March 15-16, 2026',
    venue: 'Pillai HOC College, Rasayani',
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    try {
      const text = await file.text();
      const processedCards = await parseCSVForIDCards(text);
      const selectableCards = processedCards.map(card => ({ ...card, selected: true }));
      setCards(selectableCards);
      setStatus(`Loaded ${processedCards.length} participants successfully`);
    } catch (error) {
      setStatus('Error processing CSV file. Please check the format.');
      console.error(error);
    }
  };

  const loadParticipants = async () => {
    try {
      setStatus('Loading participants from database...');
      const dbParticipants = await getParticipants();
      
      const transformedCards: SelectableIDCardData[] = await Promise.all(
        dbParticipants.map(async (p) => {
          const qrCodeDataURL = await generateQRCode(p.participantId);
          
          return {
            name: p.name,
            email: p.email,
            role: p.role || 'Participant',
            company: p.institute || 'N/A',
            phone: p.phone || '',
            participantId: p.participantId,
            qrCodeDataURL,
            selected: true,
          };
        })
      );
      
      setCards(transformedCards);
      setStatus(`Loaded ${transformedCards.length} participants from database`);
    } catch (error) {
      setStatus('Error loading participants from database');
      console.error(error);
    }
  };

  const toggleParticipant = (index: number) => {
    setCards(prev =>
      prev.map((card, i) => (i === index ? { ...card, selected: !card.selected } : card))
    );
  };

  const toggleAll = (selectAll: boolean) => {
    setCards(prev => prev.map(card => ({ ...card, selected: selectAll })));
  };

  const generatePNGCards = async () => {
    const selectedCards = cards.filter(card => card.selected);
    
    if (selectedCards.length === 0) {
      setStatus('Please select at least one participant');
      return;
    }

    setIsGenerating(true);
    setProgress(0);

    try {
      const zip = new JSZip();

      for (let i = 0; i < cards.length; i++) {
        if (!cards[i].selected) continue;
        
        const cardElement = cardRefs.current[i];
        if (!cardElement) continue;

        const canvas = await html2canvas(cardElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
        });

        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => resolve(blob!), 'image/png');
        });

        const fileName = `${cards[i].name.replace(/\s+/g, '_')}_${cards[i].participantId}.png`;
        zip.file(fileName, blob);

        const selectedIndex = selectedCards.findIndex(sc => sc.participantId === cards[i].participantId);
        setProgress(Math.round(((selectedIndex + 1) / selectedCards.length) * 100));
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'id-cards.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatus(`Generated ${selectedCards.length} ID cards successfully`);
    } catch (error) {
      setStatus('Error generating cards. Please try again.');
      console.error(error);
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const generatePDFCards = async () => {
    const selectedCards = cards.filter(card => card.selected);
    
    if (selectedCards.length === 0) {
      setStatus('Please select at least one participant');
      return;
    }

    setIsGenerating(true);
    setProgress(0);

    try {
      await generateBulkVectorPDFs(selectedCards, hackathonInfo, 'id-cards', (current, total) => {
        setProgress(Math.round((current / total) * 100));
      });

      setStatus(`Generated ${selectedCards.length} vector PDF cards successfully`);
    } catch (error) {
      setStatus('Error generating PDF cards. Please try again.');
      console.error(error);
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const handleGenerate = () => {
    if (downloadFormat === 'pdf') {
      generatePDFCards();
    } else {
      generatePNGCards();
    }
  };

  const selectedCount = cards.filter(card => card.selected).length;
  
  const filteredCards = cards.filter(card =>
    card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    card.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    card.participantId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (card.role && card.role.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (card.company && card.company.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div style={{ padding: '3rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '3rem' }}>
        <h1 style={{
          fontSize: 'clamp(2.5rem, 6vw, 4rem)',
          fontWeight: 900,
          letterSpacing: '-0.05em',
          marginBottom: '0.5rem'
        }}>
          ID CARD GENERATOR
        </h1>
        <p style={{
          fontFamily: 'monospace',
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: '1rem'
        }}>
          Upload CSV and generate professional ID cards in bulk
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '2rem'
      }}>
        {/* Upload Section */}
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
            IMPORT PARTICIPANTS
          </label>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            {/* Load Participants Button */}
            <button
              onClick={loadParticipants}
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
                LOAD FROM DATABASE
              </div>
            </button>

            {/* Download Template Button */}
            <button
              onClick={() => downloadCSVTemplate('id-card')}
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
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <div style={{
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                color: 'rgba(255, 255, 255, 0.6)',
                textAlign: 'center',
                letterSpacing: '0.05em'
              }}>
                DOWNLOAD TEMPLATE
              </div>
            </button>
          </div>

          {/* CSV Upload */}
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
                {fileName ? fileName : 'Upload CSV File'}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: 'rgba(255, 255, 255, 0.4)'
              }}>
                {cards.length > 0 ? `${cards.length} participants loaded` : 'Click to browse or drag and drop'}
              </div>
            </label>
          </div>
        </div>

        {/* Participant Selection */}
        {cards.length > 0 && (
          <div style={{
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '1.5rem'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <h3 style={{
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                color: 'rgba(255, 255, 255, 0.6)',
                letterSpacing: '0.05em',
                margin: 0
              }}>
                SELECT PARTICIPANTS
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
                  placeholder="Search participants..."
                  style={{
                    width: '100%',
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

            {/* Participants List */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              maxHeight: '24rem',
              overflowY: 'auto'
            }}>
              {filteredCards.length === 0 ? (
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
                filteredCards.map((card, index) => {
                  const originalIndex = cards.findIndex(c => c.participantId === card.participantId);
                  return (
                    <div
                      key={originalIndex}
                      onClick={() => toggleParticipant(originalIndex)}
                      style={{
                        border: `1px solid ${card.selected ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                        padding: '1.25rem',
                        cursor: 'pointer',
                        backgroundColor: card.selected ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                        transition: 'all 0.3s'
                      }}
                      onMouseEnter={(e) => {
                        if (!card.selected) {
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!card.selected) {
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                        <div style={{ marginTop: '0.25rem' }}>
                          <div style={{
                            width: '1rem',
                            height: '1rem',
                            border: `1px solid ${card.selected ? '#fff' : 'rgba(255, 255, 255, 0.3)'}`,
                            backgroundColor: card.selected ? '#fff' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.3s'
                          }}>
                            {card.selected && (
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
                            {card.name}
                          </div>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '0.5rem',
                            fontSize: '0.875rem',
                            fontFamily: 'monospace',
                            color: 'rgba(255, 255, 255, 0.6)'
                          }}>
                            <div>
                              <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Email:</span> {card.email}
                            </div>
                            <div>
                              <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>ID:</span> {card.participantId}
                            </div>
                            {card.role && (
                              <div>
                                <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Role:</span> {card.role}
                              </div>
                            )}
                            {card.company && (
                              <div>
                                <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Company:</span> {card.company}
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
              {selectedCount} of {cards.length} selected
              {searchQuery && filteredCards.length !== cards.length && (
                <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                  {' '}({filteredCards.length} shown)
                </span>
              )}
            </div>
          </div>
        )}

        {/* Format Selection & Generate */}
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
            DOWNLOAD FORMAT
          </label>

          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {(['png', 'pdf'] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setDownloadFormat(fmt)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: downloadFormat === fmt ? '#fff' : 'transparent',
                  color: downloadFormat === fmt ? '#000' : '#fff',
                  fontWeight: downloadFormat === fmt ? 'bold' : 'normal',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  fontFamily: 'monospace'
                }}
                onMouseEnter={(e) => {
                  if (downloadFormat !== fmt) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (downloadFormat !== fmt) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  }
                }}
              >
                {fmt}
              </button>
            ))}
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || selectedCount === 0}
            style={{
              width: '100%',
              padding: '1rem',
              fontWeight: 900,
              fontSize: '1.125rem',
              background:
                selectedCount === 0 || isGenerating
                  ? 'rgba(255, 255, 255, 0.1)'
                  : '#fff',
              color:
                selectedCount === 0 || isGenerating
                  ? 'rgba(255, 255, 255, 0.3)'
                  : '#000',
              cursor:
                selectedCount === 0 || isGenerating ? 'not-allowed' : 'pointer',
              border: 'none',
              transition: 'all 0.3s',
              letterSpacing: '0.05em'
            }}
            onMouseEnter={(e) => {
              if (!isGenerating && selectedCount > 0) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isGenerating && selectedCount > 0) {
                e.currentTarget.style.backgroundColor = '#fff';
              }
            }}
          >
            {isGenerating
              ? `GENERATING... ${progress}%`
              : `GENERATE ${selectedCount} ${downloadFormat.toUpperCase()} CARD${selectedCount !== 1 ? 'S' : ''}`}
          </button>

          {isGenerating && (
            <div style={{
              marginTop: '1rem',
              height: '4px',
              background: 'rgba(255, 255, 255, 0.1)',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                background: '#4ade80',
                width: `${progress}%`,
                transition: 'width 0.3s'
              }} />
            </div>
          )}
        </div>

        {/* Status Message */}
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

        {/* Generated Cards Preview */}
        <div style={{
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '1.5rem'
        }}>
          <div style={{
            fontSize: '0.875rem',
            fontFamily: 'monospace',
            color: 'rgba(255, 255, 255, 0.6)',
            marginBottom: '1.5rem',
            letterSpacing: '0.05em'
          }}>
            PREVIEW CARDS ({cards.length})
          </div>

          {cards.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '4rem 0',
              color: 'rgba(255, 255, 255, 0.3)',
              fontFamily: 'monospace',
              fontSize: '0.875rem'
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ margin: '0 auto 1rem auto', display: 'block', opacity: 0.3 }}>
                <rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect>
                <polyline points="22,7 12,13 2,7"></polyline>
              </svg>
              No participants loaded
              <br />
              Upload a CSV file to generate ID cards
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '1rem',
              maxHeight: '600px',
              overflowY: 'auto',
              padding: '0.5rem'
            }}>
              {cards.map((card, index) => (
                <div
                  key={index}
                  style={{
                    position: 'relative'
                  }}
                >
                  {/* Selection Indicator */}
                  {!card.selected && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      zIndex: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      pointerEvents: 'none'
                    }}>
                      <div style={{
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        color: 'rgba(255, 255, 255, 0.6)',
                        textAlign: 'center',
                        padding: '0.5rem'
                      }}>
                        NOT SELECTED
                      </div>
                    </div>
                  )}
                  <div
                    ref={(el) => {
                      cardRefs.current[index] = el;
                    }}
                    style={{
                      transform: 'scale(0.5)',
                      transformOrigin: 'top left',
                      width: '400px',
                      height: '650px',
                      border: `2px solid ${card.selected ? 'rgba(74, 222, 128, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
                      transition: 'border-color 0.3s'
                    }}
                  >
                    <IDCardTemplate data={card} hackathonInfo={hackathonInfo} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div style={{
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '1.5rem',
          backgroundColor: 'rgba(255, 255, 255, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <h4 style={{
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              color: 'rgba(255, 255, 255, 0.6)',
              letterSpacing: '0.05em',
              margin: 0
            }}>
              ID CARD INFO
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
              <span>Select specific participants to generate cards</span>
            </li>
            <li style={{ display: 'flex', gap: '0.5rem' }}>
              <span style={{ opacity: 0.6 }}>•</span>
              <span>Search by name, email, ID, role, or company</span>
            </li>
            <li style={{ display: 'flex', gap: '0.5rem' }}>
              <span style={{ opacity: 0.6 }}>•</span>
              <span>PNG format: High-quality raster images</span>
            </li>
            <li style={{ display: 'flex', gap: '0.5rem' }}>
              <span style={{ opacity: 0.6 }}>•</span>
              <span>PDF format: Vector graphics (crisp at any zoom)</span>
            </li>
            <li style={{ display: 'flex', gap: '0.5rem' }}>
              <span style={{ opacity: 0.6 }}>•</span>
              <span>QR codes automatically generated</span>
            </li>
            <li style={{ display: 'flex', gap: '0.5rem' }}>
              <span style={{ opacity: 0.6 }}>•</span>
              <span>Download as ZIP archive</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}