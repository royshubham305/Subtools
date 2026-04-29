import React, { memo } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface CertificationsFormProps {
  data: string[];
  updateData: (index: number, value: string) => void;
  addItem: () => void;
  removeItem: (index: number) => void;
}

const CertificationsForm = memo(({ data, updateData, addItem, removeItem }: CertificationsFormProps) => {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold mb-4">Certifications</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.map((certification, index) => (
          <div key={index} className="relative group">
            <input
              type="text"
              placeholder="Certification (e.g., AWS Certified Developer)"
              className="p-2 border rounded w-full focus:ring-2 focus:ring-blue-500 pr-8"
              value={certification}
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
        Add Certification
      </button>
    </div>
  );
});

export default CertificationsForm;
