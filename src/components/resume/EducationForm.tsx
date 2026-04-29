import React, { memo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ResumeData } from './types';

interface EducationFormProps {
  data: ResumeData['education'];
  updateData: (index: number, field: keyof ResumeData['education'][0], value: string) => void;
  addItem: () => void;
  removeItem: (index: number) => void;
}

const EducationForm = memo(({ data, updateData, addItem, removeItem }: EducationFormProps) => {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold mb-4">Education</h2>
      {data.map((edu, index) => (
        <div key={index} className="space-y-4 mb-6 p-4 bg-gray-50 rounded relative group">
          <button
            onClick={() => removeItem(index)}
            className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Remove"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <input
            type="text"
            placeholder="School/University"
            className="p-2 border rounded w-full focus:ring-2 focus:ring-blue-500"
            value={edu.school}
            onChange={(e) => updateData(index, 'school', e.target.value)}
          />
          <input
            type="text"
            placeholder="Degree"
            className="p-2 border rounded w-full focus:ring-2 focus:ring-blue-500"
            value={edu.degree}
            onChange={(e) => updateData(index, 'degree', e.target.value)}
          />
          <input
            type="text"
            placeholder="Graduation Year"
            className="p-2 border rounded w-full focus:ring-2 focus:ring-blue-500"
            value={edu.year}
            onChange={(e) => updateData(index, 'year', e.target.value)}
          />
        </div>
      ))}
      <button
        onClick={addItem}
        className="mt-4 flex items-center text-blue-600 hover:text-blue-700"
      >
        <Plus className="w-4 h-4 mr-1" />
        Add Education
      </button>
    </div>
  );
});

export default EducationForm;
