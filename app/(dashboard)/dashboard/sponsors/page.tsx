'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Papa from 'papaparse';
import { DBSponsor } from '@/types';
import {
  getSponsors,
  createSponsors,
  updateSponsor,
  deleteSponsor,
} from '@/actions/sponsors';

export default function SponsorsPage() {
  const [sponsors, setSponsors] = useState<DBSponsor[]>([]);
  const [filteredSponsors, setFilteredSponsors] = useState<DBSponsor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [fileName, setFileName] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<DBSponsor | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadSponsors();
  }, []);

  const loadSponsors = async () => {
    try {
      setLoading(true);
      const data = await getSponsors();
      setSponsors(data);
      setFilteredSponsors(data);
    } catch (error) {
      setStatus('Error loading sponsors from database');
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
          const parsedData: Omit<DBSponsor, '_id' | 'createdAt' | 'updatedAt'>[] = results.data
            .map((row: any) => ({
              sponsorId: `SPONSOR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: row.name || row.Name || row.contactName || 'N/A',
              email: row.email || row.Email || '',
              phone: row.phone || row.Phone || row['Phone Number'] || '',
              role: row.role || row.Role || row.position || '',
              companyName: row.companyName || row.company || row.Company || row['Company Name'] || '',
            }))
            .filter(s => s.email || s.companyName);

          if (parsedData.length === 0) {
            setStatus('No valid sponsors found in CSV');
            return;
          }

          setStatus('Saving to database...');
          const result = await createSponsors(parsedData);

          if (result.success) {
            setStatus(`Successfully added ${result.count} sponsors to database`);
            await loadSponsors();
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
      setFilteredSponsors(sponsors);
      return;
    }

    const lowercaseQuery = query.toLowerCase();
    const filtered = sponsors.filter(s => 
      s.name.toLowerCase().includes(lowercaseQuery) ||
      s.email.toLowerCase().includes(lowercaseQuery) ||
      (s.phone && s.phone.toLowerCase().includes(lowercaseQuery)) ||
      s.companyName.toLowerCase().includes(lowercaseQuery) ||
      (s.role && s.role.toLowerCase().includes(lowercaseQuery)) ||
      (s.sponsorId && s.sponsorId.toLowerCase().includes(lowercaseQuery))
    );

    setFilteredSponsors(filtered);
  };

  const handleSelectAll = () => {
    const allIds = new Set(filteredSponsors.map(s => s._id!).filter(Boolean));
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
    
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} sponsor(s)?`)) return;

    try {
      setStatus(`Deleting ${selectedIds.size} sponsors...`);
      
      const deletePromises = Array.from(selectedIds).map(id => deleteSponsor(id));
      const results = await Promise.all(deletePromises);
      
      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;

      if (failCount === 0) {
        setStatus(`Successfully deleted ${successCount} sponsor(s)`);
      } else {
        setStatus(`Deleted ${successCount} sponsor(s), ${failCount} failed`);
      }

      setSelectedIds(new Set());
      await loadSponsors();
    } catch (error) {
      setStatus(`Error deleting sponsors: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleEdit = (sponsor: DBSponsor) => {
    setEditingId(sponsor._id || null);
    setEditForm({ ...sponsor });
  };

  const handleSaveEdit = async () => {
    if (!editForm || !editingId) return;

    try {
      setStatus('Updating sponsor...');
      const result = await updateSponsor(editingId, {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        role: editForm.role,
        companyName: editForm.companyName,
      });

      if (result.success) {
        setStatus('Sponsor updated successfully');
        await loadSponsors();
        setEditingId(null);
        setEditForm(null);
      } else {
        setStatus(`Error: ${result.error}`);
      }
    } catch (error) {
      setStatus(`Error updating sponsor: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sponsor?')) return;

    try {
      setStatus('Deleting sponsor...');
      const result = await deleteSponsor(id);

      if (result.success) {
        setStatus('Sponsor deleted successfully');
        await loadSponsors();
      } else {
        setStatus(`Error: ${result.error}`);
      }
    } catch (error) {
      setStatus(`Error deleting sponsor: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleExport = () => {
    const exportData = sponsors.map(s => ({
      'Sponsor ID': s.sponsorId,
      'Name': s.name,
      'Email': s.email,
      'Phone': s.phone || '',
      'Role': s.role || '',
      'Company Name': s.companyName,
    }));

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sponsors-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    setStatus('Sponsors exported successfully');
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <div style={{
          fontFamily: 'monospace',
          fontSize: '1rem',
          color: 'rgba(255, 255, 255, 0.6)'
        }}>
          Loading sponsors...
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── Mobile-responsive overrides ── */}
      <style>{`
        .sp-page { padding: 3rem; }
        .sp-top { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; }
        .sp-edit-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
        .sp-info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.5rem; }
        .sp-view-row { display: flex; justify-content: space-between; align-items: start; gap: 1rem; }
        .sp-row-actions { display: flex; gap: 0.5rem; flex-shrink: 0; }
        .sp-bulk-bar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
        .sp-bulk-btns { display: flex; gap: 0.75rem; flex-wrap: wrap; }
        @media (max-width: 640px) {
          .sp-page { padding: 1.25rem; padding-top: calc(60px + 1.25rem); }
          .sp-top { grid-template-columns: 1fr; gap: 1rem; }
          .sp-edit-grid { grid-template-columns: 1fr; }
          .sp-info-grid { grid-template-columns: 1fr; }
          .sp-view-row { flex-wrap: wrap; }
          .sp-row-actions { width: 100%; justify-content: flex-end; margin-top: 0.5rem; }
          .sp-bulk-btns { width: 100%; }
          .sp-bulk-btns button { flex: 1; justify-content: center; }
        }
      `}</style>

      <div className="sp-page">
        {/* Header */}
        <div style={{ marginBottom: '3rem' }}>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 6vw, 4rem)',
            fontWeight: 900,
            letterSpacing: '-0.05em',
            marginBottom: '0.5rem'
          }}>
            SPONSORS
          </h1>
          <p style={{
            fontFamily: 'monospace',
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '1rem'
          }}>
            Manage your event sponsors and partnerships
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '2rem'
        }}>
          {/* Top Section - Upload & Search */}
          <div className="sp-top">
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
                      {sponsors.length} sponsors loaded
                    </div>
                  )}
                </label>
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
                SEARCH SPONSORS
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
                  placeholder="Search by name, company, email..."
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
                  TOTAL SPONSORS
                </div>
                <div style={{
                  fontSize: '2.5rem',
                  fontWeight: 900,
                  marginBottom: '0.5rem'
                }}>
                  {filteredSponsors.length}
                </div>
              </div>
              {sponsors.length > 0 && (
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
          {filteredSponsors.length > 0 && (
            <div className="sp-bulk-bar" style={{
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
                    {selectedIds.size} sponsor{selectedIds.size !== 1 ? 's' : ''} selected
                  </span>
                ) : (
                  'No sponsors selected'
                )}
              </div>
              <div className="sp-bulk-btns">
                <button
                  onClick={handleSelectAll}
                  disabled={selectedIds.size === filteredSponsors.length}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#fff',
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    cursor: selectedIds.size === filteredSponsors.length ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s',
                    opacity: selectedIds.size === filteredSponsors.length ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (selectedIds.size !== filteredSponsors.length) {
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

          {/* Sponsors List */}
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
              SPONSORS LIST
            </div>

            {filteredSponsors.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '4rem 0',
                color: 'rgba(255, 255, 255, 0.3)',
                fontFamily: 'monospace',
                fontSize: '0.875rem'
              }}>
                {sponsors.length === 0 ? (
                  <>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ margin: '0 auto 1rem auto', display: 'block', opacity: 0.3 }}>
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                    </svg>
                    No sponsors loaded
                    <br />
                    Upload a CSV file to begin
                  </>
                ) : (
                  'No sponsors match your search'
                )}
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                {filteredSponsors.map((sponsor) => (
                  <div
                    key={sponsor._id || sponsor.sponsorId}
                    style={{
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      padding: '1.25rem',
                      transition: 'all 0.3s',
                      backgroundColor: editingId === sponsor._id ? 'rgba(255, 255, 255, 0.05)' : 
                                      selectedIds.has(sponsor._id!) ? 'rgba(255, 255, 255, 0.03)' : 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      if (editingId !== sponsor._id) {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (editingId !== sponsor._id) {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      }
                    }}
                  >
                    {editingId === sponsor._id && editForm ? (
                      // Edit Mode
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="sp-edit-grid">
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
                              COMPANY NAME
                            </label>
                            <input
                              type="text"
                              value={editForm.companyName}
                              onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
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
                      <div className="sp-view-row">
                        {/* Checkbox */}
                        <div style={{ display: 'flex', alignItems: 'start', paddingTop: '0.25rem' }}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(sponsor._id!)}
                            onChange={() => handleToggleSelect(sponsor._id!)}
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
                            {sponsor.companyName}
                          </div>
                          <div style={{
                            fontSize: '0.75rem',
                            fontFamily: 'monospace',
                            color: 'rgba(255, 255, 255, 0.5)',
                            marginBottom: '0.75rem'
                          }}>
                            ID: {sponsor.sponsorId}
                          </div>
                          <div className="sp-info-grid" style={{
                            fontSize: '0.875rem',
                            fontFamily: 'monospace',
                            color: 'rgba(255, 255, 255, 0.6)'
                          }}>
                            <div>
                              <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Contact:</span> {sponsor.name}
                            </div>
                            <div>
                              <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Email:</span> {sponsor.email}
                            </div>
                            {sponsor.phone && (
                              <div>
                                <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Phone:</span> {sponsor.phone}
                              </div>
                            )}
                            {sponsor.role && (
                              <div>
                                <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Role:</span> {sponsor.role}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="sp-row-actions">
                          <button
                            onClick={() => handleEdit(sponsor)}
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
                            onClick={() => handleDelete(sponsor._id!)}
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