'use client';

import type { SelectableParticipant } from '@/types';

interface RecipientListProps {
  readonly participants: SelectableParticipant[];
  readonly selectedCount: number;
  readonly onToggle: (index: number) => void;
  readonly onToggleAll: () => void;
}

/**
 * Displays and manages the list of email recipients
 * with individual and bulk selection controls.
 */
export default function RecipientList({
  participants,
  selectedCount,
  onToggle,
  onToggleAll,
}: RecipientListProps) {
  return (
    <div
      style={{
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '1.5rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}
      >
        <h3
          style={{
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            color: 'rgba(255, 255, 255, 0.6)',
          }}
        >
          RECIPIENTS
        </h3>
        {participants.length > 0 && (
          <button
            onClick={onToggleAll}
            style={{
              fontSize: '0.75rem',
              fontFamily: 'monospace',
              color: 'rgba(255, 255, 255, 0.6)',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'color 0.3s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)')
            }
          >
            {participants.every((p) => p.selected) ? 'DESELECT ALL' : 'SELECT ALL'}
          </button>
        )}
      </div>

      {participants.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '3rem 0',
            color: 'rgba(255, 255, 255, 0.3)',
            fontFamily: 'monospace',
            fontSize: '0.875rem',
          }}
        >
          No participants loaded
          <br />
          Upload a CSV file to begin
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            maxHeight: '24rem',
            overflowY: 'auto',
          }}
        >
          {participants.map((participant, index) => (
            <div
              key={index}
              onClick={() => onToggle(index)}
              style={{
                border: `1px solid ${
                  participant.selected
                    ? 'rgba(255, 255, 255, 0.3)'
                    : 'rgba(255, 255, 255, 0.1)'
                }`,
                padding: '0.75rem',
                cursor: 'pointer',
                backgroundColor: participant.selected
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'transparent',
                transition: 'all 0.3s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                <div style={{ marginTop: '0.25rem' }}>
                  <div
                    style={{
                      width: '1rem',
                      height: '1rem',
                      border: `1px solid ${
                        participant.selected ? '#fff' : 'rgba(255, 255, 255, 0.3)'
                      }`,
                      backgroundColor: participant.selected ? '#fff' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s',
                    }}
                  >
                    {participant.selected && (
                      <div
                        style={{
                          color: '#000',
                          fontSize: '0.75rem',
                          lineHeight: 1,
                        }}
                      >
                        ✓
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      color: '#fff',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {participant.name}
                  </div>
                  <div
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      color: 'rgba(255, 255, 255, 0.5)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {participant.email}
                  </div>
                  {participant.role && (
                    <div
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        color: 'rgba(255, 255, 255, 0.3)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginTop: '0.25rem',
                      }}
                    >
                      {participant.role}
                      {participant.company && ` at ${participant.company}`}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {participants.length > 0 && (
        <div
          style={{
            marginTop: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            color: 'rgba(255, 255, 255, 0.6)',
          }}
        >
          {selectedCount} of {participants.length} selected
        </div>
      )}
    </div>
  );
}
