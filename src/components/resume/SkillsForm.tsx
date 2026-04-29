import React, { memo } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface SkillsFormProps {
  data: string[];
  updateData: (index: number, value: string) => void;
  addItem: () => void;
  removeItem: (index: number) => void;
}

const SkillsForm = memo(({ data, updateData, addItem, removeItem }: SkillsFormProps) => {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold mb-4">Technical Skills</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.map((skill, index) => (
          <div key={index} className="relative group">
            <input
              type="text"
              placeholder="Skill (e.g., Python, React)"
              className="p-2 border rounded w-full focus:ring-2 focus:ring-blue-500 pr-8"
              value={skill}
              onChange={(e) => updateData(index, e.target.value)}
            />
             <button
              onClick={() => removeItem(index)}
              className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Remove"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={addItem}
        className="mt-4 flex items-center text-blue-600 hover:text-blue-700"
      >
        <Plus className="w-4 h-4 mr-1" />
        Add Skill
      </button>
    </div>
  );
});

export default SkillsForm;
