import React, { useState } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
const SaveNoteModal = ({ onClose, onSave, initialTitle, isLoading }) => {
  const [title, setTitle] = useState(initialTitle);
  const [tag, setTag] = useState('personal');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formattedTitle = title
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
    if (!formattedTitle) return setError('Title is required');
    setTitle(formattedTitle);
    try {
      await onSave({title, tag });
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Error saving note');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-96">
        <h3 className="text-lg font-semibold mb-4">Save Note</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e)=>{  const input = e.target.value;

                const capitalized = input
                  .split(' ')
                  .map(word =>
                    word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : ''
                  )
                  .join(' ');
              
                setTitle(capitalized);
              }}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Tag</label>
            <select
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="work">Work</option>
              <option value="personal">Personal</option>
              <option value="research">Research</option>
            </select>
          </div>
          {error && (
            <div className="mb-4 p-2 bg-red-100 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? (
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
              ) : (
                'Save'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SaveNoteModal;