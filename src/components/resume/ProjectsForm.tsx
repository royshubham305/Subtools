import React, { memo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ResumeData } from './types';

interface ProjectsFormProps {
  data: ResumeData['projects'];
  updateData: (index: number, field: keyof ResumeData['projects'][0], value: string) => void;
  addItem: () => void;
  removeItem: (index: number) => void;
}

const ProjectsForm = memo(({ data, updateData, addItem, removeItem }: ProjectsFormProps) => {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold mb-4">Projects</h2>
      {data.map((project, index) => (
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
            placeholder="Project Title"
            className="p-2 border rounded w-full focus:ring-2 focus:ring-blue-500"
            value={project.title}
            onChange={(e) => updateData(index, 'title', e.target.value)}
          />
          <input
            type="text"
            placeholder="Technologies Used (comma separated)"
            className="p-2 border rounded w-full focus:ring-2 focus:ring-blue-500"
            value={project.technologies}
            onChange={(e) => updateData(index, 'technologies', e.target.value)}
          />
          <textarea
            placeholder="Project Description"
            className="p-2 border rounded w-full h-32 focus:ring-2 focus:ring-blue-500"
            value={project.description}
            onChange={(e) => updateData(index, 'description', e.target.value)}
          />
        </div>
      ))}
      <button
        onClick={addItem}
        className="mt-4 flex items-center text-blue-600 hover:text-blue-700"
      >
        <Plus className="w-4 h-4 mr-1" />
        Add Project
      </button>
    </div>
  );
});

export default ProjectsForm;
