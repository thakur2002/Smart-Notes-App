import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import NoteEditor from '../components/NoteEditor';
import { ArrowPathIcon, UserCircleIcon, ChevronDownIcon} from '@heroicons/react/24/outline';

const ProfileDropdown = ({ user, logout }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white rounded-full p-2 shadow-lg hover:shadow-md"
      >
        <UserCircleIcon className="w-8 h-8 text-gray-600" />
        <span className="font-medium">{user?.username}</span>
        <ChevronDownIcon className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
          <button
            onClick={logout}
            className="block w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 rounded-md"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

const Dashboard = () => {
  const { user, loading, logout } = useAuth();
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await axios.get('https://notesappserver-u4v5.onrender.com/notes', {
        params: { search: searchTerm, tag: selectedTag} ,
      withCredentials:true});
      setNotes(res.data);
    } catch (error) {
      setError(error.response?.data?.error||"Request failed");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotes();
    }
  }, [searchTerm, selectedTag, user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <ArrowPathIcon className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        notes={notes}
        onSelectNote={setSelectedNote}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedTag={selectedTag}
        setSelectedTag={setSelectedTag}
        fetchNotes={fetchNotes}
        selectedNote={selectedNote}
      />

      <div className="flex-1 flex flex-col">
        <header className="bg-[#8f9ed8] shadow-sm py-4 px-6 flex items-center relative">
          <h1 className="text-xl font-bold text-gray-800 absolute left-1/2 transform -translate-x-1/2">
            AI Powered Notes Application
          </h1>
          <div className="ml-auto">
            <ProfileDropdown user={user} logout={logout} />
          </div>
        </header>
        <div className="flex-1 p-6 overflow-auto">
          {isLoading && (
            <div className="flex justify-center items-center h-full">
              <ArrowPathIcon className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          )}

          {error && (
            <div className="mb-4 p-2 bg-red-100 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <NoteEditor
            selectedNote={selectedNote}
            setSelectedNote={setSelectedNote}
            fetchNotes={fetchNotes}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;