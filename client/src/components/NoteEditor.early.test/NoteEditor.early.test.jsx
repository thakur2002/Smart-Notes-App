import React from 'react'
import axios from 'axios';
import NoteEditor from '../NoteEditor';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import "@testing-library/jest-dom";

// Mocking the components and axios
jest.mock("axios");
jest.mock("../RichTextEditor", () => ({ content, onChange, readOnly }) => (
    <textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
    />
));
jest.mock("../SaveNoteModal", () => ({ onClose, onSave, initialTitle, isLoading }) => (
    <div>
        <button onClick={onClose}>Close</button>
        <button onClick={() => onSave({ title: initialTitle })} disabled={isLoading}>
            Save
        </button>
    </div>
));

describe('NoteEditor() NoteEditor method', () => {
    const fetchNotesMock = jest.fn();
    const setSelectedNoteMock = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Happy Paths', () => {
        it('should render the NoteEditor with a selected note', () => {
            const selectedNote = { _id: '1', title: 'Test Note', content: 'Test Content', tag: 'Test Tag' };
            render(<NoteEditor selectedNote={selectedNote} setSelectedNote={setSelectedNoteMock} fetchNotes={fetchNotesMock} />);

            expect(screen.getByText('Test Note')).toBeInTheDocument();
            expect(screen.getByText('Test Tag')).toBeInTheDocument();
            expect(screen.getByDisplayValue('Test Content')).toBeInTheDocument();
        });

        it('should allow editing and saving changes to a note', async () => {
            const selectedNote = { _id: '1', title: 'Test Note', content: 'Test Content', tag: 'Test Tag' };
            axios.put.mockResolvedValueOnce({});
            render(<NoteEditor selectedNote={selectedNote} setSelectedNote={setSelectedNoteMock} fetchNotes={fetchNotesMock} />);

            fireEvent.click(screen.getByText('Edit'));
            fireEvent.change(screen.getByDisplayValue('Test Content'), { target: { value: 'Updated Content' } });
            fireEvent.click(screen.getByText('Save Changes'));

            await waitFor(() => expect(axios.put).toHaveBeenCalledWith(
                'http://localhost:5000/notes/1',
                { title: 'Test Note', tag: 'Test Tag', content: 'Updated Content' },
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            ));
            expect(fetchNotesMock).toHaveBeenCalled();
        });

        it('should open and close the SaveNoteModal for a new note', () => {
            render(<NoteEditor selectedNote={null} setSelectedNote={setSelectedNoteMock} fetchNotes={fetchNotesMock} />);

            fireEvent.click(screen.getByText('Save New Note'));
            expect(screen.getByText('Save')).toBeInTheDocument();

            fireEvent.click(screen.getByText('Close'));
            expect(screen.queryByText('Save')).not.toBeInTheDocument();
        });
    });

    describe('Edge Cases', () => {
        it('should display an error when trying to save an empty note', async () => {
            const selectedNote = { _id: '1', title: 'Test Note', content: '', tag: 'Test Tag' };
            render(<NoteEditor selectedNote={selectedNote} setSelectedNote={setSelectedNoteMock} fetchNotes={fetchNotesMock} />);

            fireEvent.click(screen.getByText('Edit'));
            fireEvent.change(screen.getByDisplayValue(''), { target: { value: '' } });
            fireEvent.click(screen.getByText('Save Changes'));

            expect(screen.getByText('Note content cannot be empty')).toBeInTheDocument();
        });

        it('should handle API errors gracefully when saving a note', async () => {
            const selectedNote = { _id: '1', title: 'Test Note', content: 'Test Content', tag: 'Test Tag' };
            axios.put.mockRejectedValueOnce(new Error('API Error'));
            render(<NoteEditor selectedNote={selectedNote} setSelectedNote={setSelectedNoteMock} fetchNotes={fetchNotesMock} />);

            fireEvent.click(screen.getByText('Edit'));
            fireEvent.change(screen.getByDisplayValue('Test Content'), { target: { value: 'Updated Content' } });
            fireEvent.click(screen.getByText('Save Changes'));

            await waitFor(() => expect(screen.getByText('Failed to save note. Please try again.')).toBeInTheDocument());
        });

        it('should not allow saving if there are no changes', () => {
            const selectedNote = { _id: '1', title: 'Test Note', content: 'Test Content', tag: 'Test Tag' };
            render(<NoteEditor selectedNote={selectedNote} setSelectedNote={setSelectedNoteMock} fetchNotes={fetchNotesMock} />);

            expect(screen.getByText('Save Changes')).toBeDisabled();
        });
    });
});