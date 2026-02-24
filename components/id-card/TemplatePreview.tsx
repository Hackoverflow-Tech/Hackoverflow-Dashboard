'use client';

import React from 'react';
import IDCardTemplate from './IDCardTemplate';
import { IDCardData, HackathonInfo } from '@/types';

const TemplatePreview: React.FC = () => {
  const sampleData: IDCardData = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'Full Stack Developer',
    company: 'Tech Innovations Inc.',
    phone: '+1 (555) 123-4567',
    participantId: 'PART-0001',
    qrCodeDataURL:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  };

  const hackathonInfo: HackathonInfo = {
    name: 'HackFest 2026',
    date: 'February 15-16, 2026',
    venue: 'Tech Hub Convention Center',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h3 style={{
        fontSize: '0.875rem',
        fontWeight: '600',
        marginBottom: '1rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        Template Preview
      </h3>
      <div style={{ transform: 'scale(0.75)', transformOrigin: 'top' }}>
        <IDCardTemplate data={sampleData} hackathonInfo={hackathonInfo} />
      </div>
    </div>
  );
};

export default TemplatePreview;
