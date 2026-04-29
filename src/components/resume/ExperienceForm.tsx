import React, { memo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ResumeData } from './types';

interface ExperienceFormProps {
  data: ResumeData['experience'];
  updateData: (index: number, field: keyof ResumeData['experience'][0], value: string) => void;
  addItem: () => void;
  removeItem: (index: number) => void;
}

const ExperienceForm = memo(({ data, updateData, addItem, removeItem }: ExperienceFormProps) => {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold mb-4">Work Experience</h2>
      {data.map((exp, index) => (
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
            placeholder="Company"
            className="p-2 border rounded w-full focus:ring-2 focus:ring-blue-500"
            value={exp.company}
            onChange={(e) => updateData(index, 'company', e.target.value)}
          />
          <input
            type="text"
            placeholder="Position"
            className="p-2 border rounded w-full focus:ring-2 focus:ring-blue-500"
            value={exp.position}
            onChange={(e) => updateData(index, 'position', e.target.value)}
          />
          <input
            type="text"
            placeholder="Duration (e.g., Jan 2020 - Present)"
            className="p-2 border rounded w-full focus:ring-2 focus:ring-blue-500"
            value={exp.duration}
            onChange={(e) => updateData(index, 'duration', e.target.value)}
          />
          <textarea
            placeholder="Description (Use bullet points)"
            className="p-2 border rounded w-full h-32 focus:ring-2 focus:ring-blue-500"
            value={exp.description}
            onChange={(e) => updateData(index, 'description', e.target.value)}
          />
        </div>
      ))}
      <button
        onClick={addItem}
        className="mt-4 flex items-center text-blue-600 hover:text-blue-700"
      >
        <Plus className="w-4 h-4 mr-1" />
        Add Experience
      </button>
    </div>
  );
});

export default ExperienceForm;
