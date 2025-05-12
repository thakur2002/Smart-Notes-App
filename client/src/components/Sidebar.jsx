import React, { useState } from 'react';
import { MagnifyingGlassIcon, TrashIcon, PencilIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import debounce from 'lodash.debounce';

const Sidebar = ({
  notes,
  onSelectNote,
  searchTerm,
  setSearchTerm,
  selectedTag,
  setSelectedTag,
  fetchNotes,
  selectedNote
}) => {
  const [renamingNoteId, setRenamingNoteId] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [renameFailed, setRenameFailed] = useState(false);

  const debouncedSearch = debounce((term) => setSearchTerm(term), 300);

  const handleSearchChange = (e) => debouncedSearch(e.target.value);

  const handleNewNote = () => {
    onSelectNote(null);
    fetchNotes();
  };

  const formatTitle = (title) => {
    return title
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  };
  const handleRename = async (noteId) => {
    setIsLoading(true);
    setError(null);
    const formattedTitle = formatTitle(newTitle);
    try {
      await axios.put(
        `https://notesappserver-u4v5.onrender.com/notes/${noteId}`,
        { title: formattedTitle },
        { withCredentials:true }
      );
      setRenamingNoteId(null);
      fetchNotes();
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to rename note';
      setError(message);
      setRenameFailed(true);
    
      // Delay exiting edit mode for 500ms to show red border
      setTimeout(() => {
        setRenamingNoteId(null);
        const originalNote = notes.find((n) => n._id === noteId);
        setNewTitle(originalNote?.title || '');
        setRenameFailed(false);
      }, 1000);
    
      // Clear error message after 4s
      setTimeout(() => setError(null), 4000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (noteId) => {
    setIsLoading(true);
    setError(null);
    try {
      await axios.delete(
        `https://notesappserver-u4v5.onrender.com/notes/${noteId}`,
        {withCredentials:true}
      );
      fetchNotes();
      if (selectedNote?._id === noteId) onSelectNote(null);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to delete note');
      setTimeout(() => setError(null), 4000);
    } finally {
      setIsLoading(false);
    }
  };

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center p-6 text-center text-gray-500">
      <DocumentTextIcon className="w-12 h-12 mb-4" />
      <p>No notes found.</p>
      <p>Create a new note or adjust your filters.</p>
    </div>
  );

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b">
        <div className="relative">
          <input
            type="text"
            placeholder="Search notes..."
            defaultValue={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
        </div>
      </div>
      <div className="p-4 border-b">
        <select
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Tags</option>
          <option value="work">Work</option>
          <option value="personal">Personal</option>
          <option value="research">Research</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <button
          onClick={handleNewNote}
          className="w-full mb-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + New Note
        </button>

        {error && (
  <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white px-4 py-2 rounded shadow-md transition-opacity duration-500">
    {error}
  </div>
)}
        {notes.length === 0 ? (
          renderEmptyState()
        ) : (
          notes.map((note) => (
            <div
              key={note._id}
              className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer ${
                selectedNote?._id === note._id 
                  ? 'bg-blue-100 border-2 border-blue-200' 
                  : 'hover:bg-gray-100'
              }`}
              onClick={() => onSelectNote(note)}
            >
              {renamingNoteId === note._id ? (
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRename(note._id)}
                  className="flex-1 px-2 py-1 border rounded focus:outline-none focus:ring-2 ${
    renameFailed ? 'border-red-500 ring-red-300' : 'focus:ring-blue-500"
                  autoFocus
                />
              ) : (
                <div className="flex-1 truncate">{note.title}</div>
              )}

              <div className="flex space-x-2 opacity-0 group-hover:opacity-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setRenamingNoteId(note._id);
                    setNewTitle(note.title);
                  }}
                  className="p-1 text-gray-500 hover:text-blue-600"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(note._id);
                  }}
                  className="p-1 text-gray-500 hover:text-red-600"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Sidebar;