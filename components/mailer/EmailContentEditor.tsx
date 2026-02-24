'use client';

import { exampleTemplates } from '@/lib/email-template';

interface EmailContentEditorProps {
  readonly htmlContent: string;
  readonly onContentChange: (content: string) => void;
  readonly showTemplates: boolean;
  readonly onToggleTemplates: () => void;
  readonly onLoadTemplate: (key: keyof typeof exampleTemplates) => void;
}

/**
 * Email content editor with HTML support and template selection.
 * Supports personalization variables like {{name}}, {{email}}, etc.
 */
export default function EmailContentEditor({
  htmlContent,
  onContentChange,
  showTemplates,
  onToggleTemplates,
  onLoadTemplate,
}: EmailContentEditorProps) {
  return (
    <div
      style={{
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '1.5rem',
        transition: 'border-color 0.3s',
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)')
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)')
      }
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.75rem',
        }}
      >
        <label
          style={{
            fontSize: '0.875rem',
            fontFamily: 'monospace',
            color: 'rgba(255, 255, 255, 0.6)',
          }}
        >
          03. EMAIL CONTENT (HTML SUPPORTED)
        </label>
        <button
          onClick={onToggleTemplates}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#fff',
            fontSize: '0.75rem',
            fontFamily: 'monospace',
            cursor: 'pointer',
            transition: 'all 0.3s',
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)')
          }
        >
          {showTemplates ? 'HIDE TEMPLATES' : 'LOAD TEMPLATE'}
        </button>
      </div>

      {/* Template Selection */}
      {showTemplates && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '0.75rem',
            marginBottom: '1rem',
            padding: '1rem',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {(Object.keys(exampleTemplates) as (keyof typeof exampleTemplates)[]).map(
            (key) => (
              <button
                key={key}
                onClick={() => onLoadTemplate(key)}
                style={{
                  padding: '0.75rem',
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </button>
            )
          )}
        </div>
      )}

      <textarea
        value={htmlContent}
        onChange={(e) => onContentChange(e.target.value)}
        placeholder={`<h1 style='margin: 0 0 20px 0; color: #000000; font-size: 32px;'>Hello {{name}}! 👋</h1>\n<p style='margin: 0 0 16px 0; color: #333333; font-size: 16px;'>Welcome to our hackathon!</p>\n\nUse HTML for formatting. Your content will be wrapped in a professional template automatically.`}
        rows={12}
        style={{
          width: '100%',
          backgroundColor: 'transparent',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          padding: '0.75rem 1rem',
          color: '#fff',
          fontFamily: 'monospace',
          fontSize: '0.875rem',
          resize: 'vertical',
        }}
        onFocus={(e) =>
          (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)')
        }
        onBlur={(e) =>
          (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)')
        }
      />
      <div
        style={{
          marginTop: '0.75rem',
          fontSize: '0.75rem',
          color: 'rgba(255, 255, 255, 0.4)',
          fontFamily: 'monospace',
        }}
      >
        💡 Use {'{{name}}'}, {'{{email}}'}, {'{{role}}'}, {'{{company}}'} for
        personalization. Your content will be automatically wrapped in a professional
        email template.
      </div>
    </div>
  );
}
