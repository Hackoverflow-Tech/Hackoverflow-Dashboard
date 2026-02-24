/**
 * CSV Template Download Utility
 *
 * Shared helper for downloading sample CSV templates
 * used across mailer and ID card generator features.
 *
 * @module utils/csv-download
 */

const SAMPLE_CSV = `name,email,role,company,phone
John Doe,john@example.com,Developer,TechCorp,+1234567890
Jane Smith,jane@example.com,Designer,DesignCo,+0987654321
Alex Johnson,alex@example.com,Manager,StartupXYZ,+1122334455`;

/**
 * Triggers a CSV template file download in the browser.
 *
 * @param fileName - Name for the downloaded file (default: 'participants-template.csv')
 */
export function downloadCSVTemplate(
  fileName: string = 'participants-template.csv'
): void {
  const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
