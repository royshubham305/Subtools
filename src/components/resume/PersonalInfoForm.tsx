import React, { memo } from 'react';
import { ResumeData } from './types';

interface PersonalInfoFormProps {
  data: ResumeData['personalInfo'];
  updateData: (field: keyof ResumeData['personalInfo'], value: string) => void;
}

const PersonalInfoForm = memo(({ data, updateData }: PersonalInfoFormProps) => {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold mb-4">Personal Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Full Name"
          className="p-2 border rounded w-full focus:ring-2 focus:ring-blue-500"
          value={data.name}
          onChange={(e) => updateData('name', e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          className="p-2 border rounded w-full focus:ring-2 focus:ring-blue-500"
          value={data.email}
          onChange={(e) => updateData('email', e.target.value)}
        />
        <input
          type="tel"
          placeholder="Phone"
          className="p-2 border rounded w-full focus:ring-2 focus:ring-blue-500"
          value={data.phone}
          onChange={(e) => updateData('phone', e.target.value)}
        />
        <input
          type="text"
          placeholder="Location"
          className="p-2 border rounded w-full focus:ring-2 focus:ring-blue-500"
          value={data.location}
          onChange={(e) => updateData('location', e.target.value)}
        />
        <input
          type="url"
          placeholder="LinkedIn URL"
          className="p-2 border rounded w-full focus:ring-2 focus:ring-blue-500"
          value={data.linkedin || ''}
          onChange={(e) => updateData('linkedin', e.target.value)}
        />
        <input
          type="url"
          placeholder="GitHub URL"
          className="p-2 border rounded w-full focus:ring-2 focus:ring-blue-500"
          value={data.github || ''}
          onChange={(e) => updateData('github', e.target.value)}
        />
      </div>
    </div>
  );
});

export default PersonalInfoForm;
