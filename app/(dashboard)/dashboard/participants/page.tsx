'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Papa from 'papaparse';
import { DBParticipant } from '@/types';
import {
  getParticipants,
  createParticipants,
  updateParticipant,
  deleteParticipant,
} from '@/actions/participants';

export default function ParticipantsPage() {
  const [participants, setParticipants] = useState<DBParticipant[]>([]);
  const [filteredParticipants, setFilteredParticipants] = useState<DBParticipant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [fileName, setFileName] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<DBParticipant | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadParticipants();
  }, []);

  const loadParticipants = async () => {
    try {
      setLoading(true);
      const data = await getParticipants();
      setParticipants(data);
      setFilteredParticipants(data);
    } catch (error) {
      setStatus('Error loading participants from database');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setStatus('Processing CSV...');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const parsedData: Omit<DBParticipant, '_id' | 'createdAt' | 'updatedAt'>[] = results.data
            .map((row: any) => {
              const participantId = row.participant_id || row.participantId || row['Participant ID'] || '';
              const name = row.name || row.Name || '';
              const email = row.email || row.Email || '';
              const phone = row.phone || row.Phone || row['phone number'] || '';
              const role = row.role || row.Role || '';
              const teamName = row.team || row.Team || row.teamName || row['Team Name'] || '';
              const institute = row.institute || row.Institute || row.college || row.College || '';
              const labAllotted = row.lab_alloted || row.labAllotted || row['Lab Allotted'] || row.lab || '';
              const wifiCreds = row.wifi_credentials || row.wifiCredentials || row['WiFi Credentials'] || '';
              
              return {
                participantId,
                name,
                email,
                phone,
                role,
                teamName,
                institute,
                labAllotted,
                wifiCredentials: {
                  ssid: wifiCreds ? 'Hackoverflow_Guest' : '',
                  password: wifiCreds || '',
                },
                collegeCheckIn: {
                  status: false,
                },
                labCheckIn: {
                  status: false,
                },
              };
            })
            .filter(p => p.email && p.participantId);

          if (parsedData.length === 0) {
            setStatus('No valid participants found in CSV. Make sure each row has participant_id and email.');
            return;
          }

          setStatus('Saving to database...');
          const result = await createParticipants(parsedData);

          if (result.success) {
            setStatus(`Successfully added ${result.count} participants to database`);
            await loadParticipants();
          } else {
            setStatus(`Error: ${result.error}`);
          }
        } catch (error) {
          setStatus(`Error processing CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      },
      error: (error) => {
        setStatus(`Error parsing CSV: ${error.message}`);
      },
    });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredParticipants(participants);
      return;
    }

    const lowercaseQuery = query.toLowerCase();
    const filtered = participants.filter(p => 
      p.name.toLowerCase().includes(lowercaseQuery) ||
      p.email.toLowerCase().includes(lowercaseQuery) ||
      (p.phone && p.phone.toLowerCase().includes(lowercaseQuery)) ||
      (p.teamName && p.teamName.toLowerCase().includes(lowercaseQuery)) ||
      (p.role && p.role.toLowerCase().includes(lowercaseQuery)) ||
      (p.institute && p.institute.toLowerCase().includes(lowercaseQuery)) ||
      (p.participantId && p.participantId.toLowerCase().includes(lowercaseQuery))
    );

    setFilteredParticipants(filtered);
  };

  const handleSelectAll = () => {
    const allIds = new Set(filteredParticipants.map(p => p._id!).filter(Boolean));
    setSelectedIds(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} participant(s)?`)) return;

    try {
      setStatus(`Deleting ${selectedIds.size} participants...`);
      
      const deletePromises = Array.from(selectedIds).map(id => deleteParticipant(id));
      const results = await Promise.all(deletePromises);
      
      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;

      if (failCount === 0) {
        setStatus(`Successfully deleted ${successCount} participant(s)`);
      } else {
        setStatus(`Deleted ${successCount} participant(s), ${failCount} failed`);
      }

      setSelectedIds(new Set());
      await loadParticipants();
    } catch (error) {
      setStatus(`Error deleting participants: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleEdit = (participant: DBParticipant) => {
    setEditingId(participant._id || null);
    setEditForm({ ...participant });
  };

  const handleSaveEdit = async () => {
    if (!editForm || !editingId) return;

    try {
      setStatus('Updating participant...');
      const result = await updateParticipant(editingId, {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        role: editForm.role,
        teamName: editForm.teamName,
        institute: editForm.institute,
        labAllotted: editForm.labAllotted,
        wifiCredentials: editForm.wifiCredentials,
      });

      if (result.success) {
        setStatus('Participant updated successfully');
        await loadParticipants();
        setEditingId(null);
        setEditForm(null);
      } else {
        setStatus(`Error: ${result.error}`);
      }
    } catch (error) {
      setStatus(`Error updating participant: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this participant?')) return;

    try {
      setStatus('Deleting participant...');
      const result = await deleteParticipant(id);

      if (result.success) {
        setStatus('Participant deleted successfully');
        await loadParticipants();
      } else {
        setStatus(`Error: ${result.error}`);
      }
    } catch (error) {
      setStatus(`Error deleting participant: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleExport = () => {
    const exportData = participants.map(p => ({
      'participant_id': p.participantId,
      'name': p.name,
      'email': p.email,
      'phone': p.phone || '',
      'role': p.role || '',
      'team': p.teamName || '',
      'institute': p.institute || '',
      'lab_alloted': p.labAllotted || '',
      'wifi_credentials': p.wifiCredentials?.password || '',
      'college_checkin_status': p.collegeCheckIn?.status ? 'Yes' : 'No',
      'college_checkin_time': p.collegeCheckIn?.time ? new Date(p.collegeCheckIn.time).toISOString() : '',
      'lab_checkin_status': p.labCheckIn?.status ? 'Yes' : 'No',
      'lab_checkin_time': p.labCheckIn?.time ? new Date(p.labCheckIn.time).toISOString() : '',
    }));

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `participants-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    setStatus('Participants exported successfully');
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <div style={{
          fontFamily: 'monospace',
          fontSize: '1rem',
          color: 'rgba(255, 255, 255, 0.6)'
        }}>
          Loading participants...
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── Mobile-responsive overrides ── */}
      <style>{`
        .pp-page { padding: 3rem; }
        .pp-top { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; }
        .pp-edit-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
        .pp-info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 0.5rem; }
        .pp-view-row { display: flex; justify-content: space-between; align-items: start; gap: 1rem; }
        .pp-row-actions { display: flex; gap: 0.5rem; flex-shrink: 0; }
        .pp-bulk-bar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
        .pp-bulk-btns { display: flex; gap: 0.75rem; flex-wrap: wrap; }
        @media (max-width: 640px) {
          .pp-page { padding: 1.25rem; padding-top: calc(60px + 1.25rem); }
          .pp-top { grid-template-columns: 1fr; gap: 1rem; }
          .pp-edit-grid { grid-template-columns: 1fr; }
          .pp-info-grid { grid-template-columns: 1fr; }
          .pp-view-row { flex-wrap: wrap; }
          .pp-row-actions { width: 100%; justify-content: flex-end; margin-top: 0.5rem; }
          .pp-bulk-btns { width: 100%; }
          .pp-bulk-btns button { flex: 1; justify-content: center; }
        }
      `}</style>

      <div className="pp-page">
        {/* Header */}
        <div style={{ marginBottom: '3rem' }}>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 6vw, 4rem)',
            fontWeight: 900,
            letterSpacing: '-0.05em',
            marginBottom: '0.5rem'
          }}>
            PARTICIPANTS
          </h1>
          <p style={{
            fontFamily: 'monospace',
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '1rem'
          }}>
            Manage your event attendees
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '2rem'
        }}>
          {/* Top Section - Upload & Search */}
          <div className="pp-top">
            {/* CSV Upload */}
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
                UPLOAD CSV FILE
              </label>
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
                    width: '100%',
                    border: '1px dashed rgba(255, 255, 255, 0.2)',
                    padding: '2rem 1rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
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
                    textAlign: 'center'
                  }}>
                    {fileName ? fileName : 'Click to upload CSV'}
                  </div>
                  {fileName && (
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'rgba(255, 255, 255, 0.4)',
                      marginTop: '0.5rem'
                    }}>
                      {participants.length} participants loaded
                    </div>
                  )}
                </label>
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: 'rgba(255, 255, 255, 0.4)',
                marginTop: '0.75rem',
                fontFamily: 'monospace'
              }}>
                Required: participant_id, name, email
              </div>
            </div>

            {/* Search */}
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
                SEARCH PARTICIPANTS
              </label>
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
                    left: '1rem',
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
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search by name, email, ID, team..."
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    padding: '0.75rem 1rem 0.75rem 3rem',
                    color: '#fff',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
                />
              </div>
            </div>

            {/* Stats & Export */}
            <div style={{
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{
                  fontSize: '0.875rem',
                  fontFamily: 'monospace',
                  color: 'rgba(255, 255, 255, 0.6)',
                  marginBottom: '0.75rem',
                  letterSpacing: '0.05em'
                }}>
                  TOTAL PARTICIPANTS
                </div>
                <div style={{
                  fontSize: '2.5rem',
                  fontWeight: 900,
                  marginBottom: '0.5rem'
                }}>
                  {filteredParticipants.length}
                </div>
              </div>
              {participants.length > 0 && (
                <button
                  onClick={handleExport}
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#fff',
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
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
                  EXPORT CSV
                </button>
              )}
            </div>
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

          {/* Bulk Actions */}
          {filteredParticipants.length > 0 && (
            <div className="pp-bulk-bar" style={{
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '1rem 1.5rem',
            }}>
              <div style={{
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                color: 'rgba(255, 255, 255, 0.6)'
              }}>
                {selectedIds.size > 0 ? (
                  <span style={{ color: '#fff' }}>
                    {selectedIds.size} participant{selectedIds.size !== 1 ? 's' : ''} selected
                  </span>
                ) : (
                  'No participants selected'
                )}
              </div>
              <div className="pp-bulk-btns">
                <button
                  onClick={handleSelectAll}
                  disabled={selectedIds.size === filteredParticipants.length}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#fff',
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    cursor: selectedIds.size === filteredParticipants.length ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s',
                    opacity: selectedIds.size === filteredParticipants.length ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (selectedIds.size !== filteredParticipants.length) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  }}
                >
                  SELECT ALL
                </button>
                <button
                  onClick={handleDeselectAll}
                  disabled={selectedIds.size === 0}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#fff',
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    cursor: selectedIds.size === 0 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s',
                    opacity: selectedIds.size === 0 ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (selectedIds.size > 0) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  }}
                >
                  DESELECT ALL
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={selectedIds.size === 0}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: selectedIds.size > 0 ? 'rgba(248, 113, 113, 0.2)' : 'transparent',
                    border: '1px solid rgba(248, 113, 113, 0.4)',
                    color: selectedIds.size > 0 ? '#f87171' : 'rgba(248, 113, 113, 0.4)',
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    cursor: selectedIds.size === 0 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s',
                    opacity: selectedIds.size === 0 ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedIds.size > 0) {
                      e.currentTarget.style.backgroundColor = 'rgba(248, 113, 113, 0.3)';
                      e.currentTarget.style.borderColor = 'rgba(248, 113, 113, 0.6)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedIds.size > 0) {
                      e.currentTarget.style.backgroundColor = 'rgba(248, 113, 113, 0.2)';
                      e.currentTarget.style.borderColor = 'rgba(248, 113, 113, 0.4)';
                    }
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                  DELETE SELECTED ({selectedIds.size})
                </button>
              </div>
            </div>
          )}

          {/* Participants List */}
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
              PARTICIPANTS LIST
            </div>

            {filteredParticipants.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '4rem 0',
                color: 'rgba(255, 255, 255, 0.3)',
                fontFamily: 'monospace',
                fontSize: '0.875rem'
              }}>
                {participants.length === 0 ? (
                  <>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ margin: '0 auto 1rem auto', display: 'block', opacity: 0.3 }}>
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    No participants loaded
                    <br />
                    Upload a CSV file to begin
                  </>
                ) : (
                  'No participants match your search'
                )}
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                {filteredParticipants.map((participant) => (
                  <div
                    key={participant._id || participant.participantId}
                    style={{
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      padding: '1.25rem',
                      transition: 'all 0.3s',
                      backgroundColor: editingId === participant._id ? 'rgba(255, 255, 255, 0.05)' : 
                                      selectedIds.has(participant._id!) ? 'rgba(255, 255, 255, 0.03)' : 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      if (editingId !== participant._id) {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (editingId !== participant._id) {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      }
                    }}
                  >
                    {editingId === participant._id && editForm ? (
                      // Edit Mode
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="pp-edit-grid">
                          <div>
                            <label style={{
                              display: 'block',
                              fontSize: '0.75rem',
                              fontFamily: 'monospace',
                              color: 'rgba(255, 255, 255, 0.5)',
                              marginBottom: '0.5rem'
                            }}>
                              NAME
                            </label>
                            <input
                              type="text"
                              value={editForm.name}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              style={{
                                width: '100%',
                                boxSizing: 'border-box',
                                backgroundColor: 'transparent',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                padding: '0.5rem',
                                color: '#fff',
                                fontFamily: 'monospace',
                                fontSize: '0.875rem'
                              }}
                            />
                          </div>
                          <div>
                            <label style={{
                              display: 'block',
                              fontSize: '0.75rem',
                              fontFamily: 'monospace',
                              color: 'rgba(255, 255, 255, 0.5)',
                              marginBottom: '0.5rem'
                            }}>
                              EMAIL
                            </label>
                            <input
                              type="email"
                              value={editForm.email}
                              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                              style={{
                                width: '100%',
                                boxSizing: 'border-box',
                                backgroundColor: 'transparent',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                padding: '0.5rem',
                                color: '#fff',
                                fontFamily: 'monospace',
                                fontSize: '0.875rem'
                              }}
                            />
                          </div>
                          <div>
                            <label style={{
                              display: 'block',
                              fontSize: '0.75rem',
                              fontFamily: 'monospace',
                              color: 'rgba(255, 255, 255, 0.5)',
                              marginBottom: '0.5rem'
                            }}>
                              PHONE
                            </label>
                            <input
                              type="text"
                              value={editForm.phone || ''}
                              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                              style={{
                                width: '100%',
                                boxSizing: 'border-box',
                                backgroundColor: 'transparent',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                padding: '0.5rem',
                                color: '#fff',
                                fontFamily: 'monospace',
                                fontSize: '0.875rem'
                              }}
                            />
                          </div>
                          <div>
                            <label style={{
                              display: 'block',
                              fontSize: '0.75rem',
                              fontFamily: 'monospace',
                              color: 'rgba(255, 255, 255, 0.5)',
                              marginBottom: '0.5rem'
                            }}>
                              TEAM NAME
                            </label>
                            <input
                              type="text"
                              value={editForm.teamName || ''}
                              onChange={(e) => setEditForm({ ...editForm, teamName: e.target.value })}
                              style={{
                                width: '100%',
                                boxSizing: 'border-box',
                                backgroundColor: 'transparent',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                padding: '0.5rem',
                                color: '#fff',
                                fontFamily: 'monospace',
                                fontSize: '0.875rem'
                              }}
                            />
                          </div>
                          <div>
                            <label style={{
                              display: 'block',
                              fontSize: '0.75rem',
                              fontFamily: 'monospace',
                              color: 'rgba(255, 255, 255, 0.5)',
                              marginBottom: '0.5rem'
                            }}>
                              ROLE
                            </label>
                            <input
                              type="text"
                              value={editForm.role || ''}
                              onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                              style={{
                                width: '100%',
                                boxSizing: 'border-box',
                                backgroundColor: 'transparent',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                padding: '0.5rem',
                                color: '#fff',
                                fontFamily: 'monospace',
                                fontSize: '0.875rem'
                              }}
                            />
                          </div>
                          <div>
                            <label style={{
                              display: 'block',
                              fontSize: '0.75rem',
                              fontFamily: 'monospace',
                              color: 'rgba(255, 255, 255, 0.5)',
                              marginBottom: '0.5rem'
                            }}>
                              INSTITUTE
                            </label>
                            <input
                              type="text"
                              value={editForm.institute || ''}
                              onChange={(e) => setEditForm({ ...editForm, institute: e.target.value })}
                              style={{
                                width: '100%',
                                boxSizing: 'border-box',
                                backgroundColor: 'transparent',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                padding: '0.5rem',
                                color: '#fff',
                                fontFamily: 'monospace',
                                fontSize: '0.875rem'
                              }}
                            />
                          </div>
                          <div>
                            <label style={{
                              display: 'block',
                              fontSize: '0.75rem',
                              fontFamily: 'monospace',
                              color: 'rgba(255, 255, 255, 0.5)',
                              marginBottom: '0.5rem'
                            }}>
                              LAB ALLOTTED
                            </label>
                            <input
                              type="text"
                              value={editForm.labAllotted || ''}
                              onChange={(e) => setEditForm({ ...editForm, labAllotted: e.target.value })}
                              style={{
                                width: '100%',
                                boxSizing: 'border-box',
                                backgroundColor: 'transparent',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                padding: '0.5rem',
                                color: '#fff',
                                fontFamily: 'monospace',
                                fontSize: '0.875rem'
                              }}
                            />
                          </div>
                          <div>
                            <label style={{
                              display: 'block',
                              fontSize: '0.75rem',
                              fontFamily: 'monospace',
                              color: 'rgba(255, 255, 255, 0.5)',
                              marginBottom: '0.5rem'
                            }}>
                              WiFi SSID
                            </label>
                            <input
                              type="text"
                              value={editForm.wifiCredentials?.ssid || ''}
                              onChange={(e) => setEditForm({
                                ...editForm,
                                wifiCredentials: {
                                  ...editForm.wifiCredentials,
                                  ssid: e.target.value
                                }
                              })}
                              style={{
                                width: '100%',
                                boxSizing: 'border-box',
                                backgroundColor: 'transparent',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                padding: '0.5rem',
                                color: '#fff',
                                fontFamily: 'monospace',
                                fontSize: '0.875rem'
                              }}
                            />
                          </div>
                          <div>
                            <label style={{
                              display: 'block',
                              fontSize: '0.75rem',
                              fontFamily: 'monospace',
                              color: 'rgba(255, 255, 255, 0.5)',
                              marginBottom: '0.5rem'
                            }}>
                              WiFi PASSWORD
                            </label>
                            <input
                              type="text"
                              value={editForm.wifiCredentials?.password || ''}
                              onChange={(e) => setEditForm({
                                ...editForm,
                                wifiCredentials: {
                                  ...editForm.wifiCredentials,
                                  password: e.target.value
                                }
                              })}
                              style={{
                                width: '100%',
                                boxSizing: 'border-box',
                                backgroundColor: 'transparent',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                padding: '0.5rem',
                                color: '#fff',
                                fontFamily: 'monospace',
                                fontSize: '0.875rem'
                              }}
                            />
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                          <button
                            onClick={handleCancelEdit}
                            style={{
                              padding: '0.5rem 1.5rem',
                              backgroundColor: 'transparent',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                              color: '#fff',
                              fontFamily: 'monospace',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              transition: 'all 0.3s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            CANCEL
                          </button>
                          <button
                            onClick={handleSaveEdit}
                            style={{
                              padding: '0.5rem 1.5rem',
                              backgroundColor: '#fff',
                              border: 'none',
                              color: '#000',
                              fontFamily: 'monospace',
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              transition: 'all 0.3s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#fff';
                            }}
                          >
                            SAVE
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div className="pp-view-row">
                        {/* Checkbox */}
                        <div style={{ display: 'flex', alignItems: 'start', paddingTop: '0.25rem' }}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(participant._id!)}
                            onChange={() => handleToggleSelect(participant._id!)}
                            style={{
                              width: '18px',
                              height: '18px',
                              cursor: 'pointer',
                              accentColor: '#fff'
                            }}
                          />
                        </div>
                        
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontFamily: 'monospace',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            marginBottom: '0.25rem'
                          }}>
                            {participant.name}
                          </div>
                          <div style={{
                            fontSize: '0.75rem',
                            fontFamily: 'monospace',
                            color: 'rgba(255, 255, 255, 0.5)',
                            marginBottom: '0.75rem'
                          }}>
                            ID: {participant.participantId}
                          </div>
                          <div className="pp-info-grid" style={{
                            fontSize: '0.875rem',
                            fontFamily: 'monospace',
                            color: 'rgba(255, 255, 255, 0.6)'
                          }}>
                            <div>
                              <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Email:</span> {participant.email}
                            </div>
                            {participant.phone && (
                              <div>
                                <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Phone:</span> {participant.phone}
                              </div>
                            )}
                            {participant.teamName && (
                              <div>
                                <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Team:</span> {participant.teamName}
                              </div>
                            )}
                            {participant.role && (
                              <div>
                                <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Role:</span> {participant.role}
                              </div>
                            )}
                            {participant.institute && (
                              <div>
                                <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Institute:</span> {participant.institute}
                              </div>
                            )}
                            {participant.labAllotted && (
                              <div>
                                <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Lab:</span> {participant.labAllotted}
                              </div>
                            )}
                            {participant.wifiCredentials?.ssid && (
                              <div>
                                <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>WiFi:</span> {participant.wifiCredentials.ssid}
                              </div>
                            )}
                            <div>
                              <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>College Check-In:</span>{' '}
                              <span style={{ color: participant.collegeCheckIn?.status ? '#4ade80' : '#f87171' }}>
                                {participant.collegeCheckIn?.status ? (
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ display: 'inline', verticalAlign: 'middle' }}>
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                  </svg>
                                ) : (
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ display: 'inline', verticalAlign: 'middle' }}>
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                  </svg>
                                )}
                                {' '}{participant.collegeCheckIn?.status ? 'Yes' : 'No'}
                              </span>
                              {participant.collegeCheckIn?.time && (
                                <span style={{ fontSize: '0.75rem', marginLeft: '0.5rem' }}>
                                  ({new Date(participant.collegeCheckIn.time).toLocaleString()})
                                </span>
                              )}
                            </div>
                            <div>
                              <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Lab Check-In:</span>{' '}
                              <span style={{ color: participant.labCheckIn?.status ? '#4ade80' : '#f87171' }}>
                                {participant.labCheckIn?.status ? (
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ display: 'inline', verticalAlign: 'middle' }}>
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                  </svg>
                                ) : (
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ display: 'inline', verticalAlign: 'middle' }}>
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                  </svg>
                                )}
                                {' '}{participant.labCheckIn?.status ? 'Yes' : 'No'}
                              </span>
                              {participant.labCheckIn?.time && (
                                <span style={{ fontSize: '0.75rem', marginLeft: '0.5rem' }}>
                                  ({new Date(participant.labCheckIn.time).toLocaleString()})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="pp-row-actions">
                          <button
                            onClick={() => handleEdit(participant)}
                            style={{
                              padding: '0.5rem 1rem',
                              backgroundColor: 'transparent',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                              color: '#fff',
                              fontFamily: 'monospace',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              transition: 'all 0.3s',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
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
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                            EDIT
                          </button>
                          <button
                            onClick={() => handleDelete(participant._id!)}
                            style={{
                              padding: '0.5rem 1rem',
                              backgroundColor: 'transparent',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                              color: '#fff',
                              fontFamily: 'monospace',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              transition: 'all 0.3s',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
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
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                            DELETE
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}