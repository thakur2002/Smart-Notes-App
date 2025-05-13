import React, { useState, useEffect} from 'react';
import axios from 'axios';
import RichTextEditor from './RichTextEditor';
import SaveNoteModal from './SaveNoteModal';
import jsPDF from 'jspdf';

const NoteEditor = ({ selectedNote, setSelectedNote, fetchNotes }) => {
  const [content, setContent] = useState('');
  const [textContent, setTextContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [isEditing, setIsEditing] = useState(true);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [summary, setSummary] = useState('');
  const [keywords, setKeywords] = useState([]);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isExtractingKeywords, setIsExtractingKeywords] = useState(false);
  const [showCopyPopup, setShowCopyPopup] = useState(false);
  const getTextFromHTML = (html) => {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  return tempDiv.textContent || '';
};

  useEffect(() => { 
   const trimmedText = textContent.trim();
  const initialText = (selectedNote?.content && getTextFromHTML(selectedNote.content))?.trim() || '';

  setHasChanges(trimmedText !== initialText && trimmedText.length > 0);
  }, [textContent, selectedNote]);

  // useEffect(() => {
  //   return () => {
  //     // Reset content when component unmounts (when switching notes)
  //     setContent('');
  //   };
  // }, []);


  useEffect(() => {
    if (selectedNote) {
      setContent(selectedNote.content || '');
      setOriginalContent(selectedNote.content || '');
      setSummary(selectedNote.summary || '');
      setKeywords(selectedNote.keywords || []);
      setIsEditing(false);
    } else {
           // Reset all content for new notes
      setContent('');
      setOriginalContent('');
      setSummary('');
      setKeywords([]);
      setIsEditing(true);
    }
  }, [selectedNote]);

  
  const handleEditorChange = (newHTML, plainText) => {
  setContent(newHTML);
  setTextContent(plainText);
};
  const handleSave = async (noteData) => {
    if (content.trim() === '') {
      setError('Note content cannot be empty');
      return;
    }
    setIsLoading(true);
    setError(null);
    
    try {
      if (selectedNote) {
        await axios.put(
          `https://smartnotesappserver.onrender.com/notes/${selectedNote._id}`,
          { ...noteData, content },
          { withCredentials:true }
        );
          // Update the selected note manually
  setSelectedNote((prev) => ({
    ...prev,
    content,
  }));
      } else {
        const response = await axios.post(
          'https://smartnotesappserver.onrender.com/notes',
          { ...noteData, content },
          { withCredentials:true }
        );
        setSelectedNote(response.data);
      }
      await fetchNotes();
      setShowSaveModal(false);
      setIsEditing(false);
    } catch (error) {
      throw error // Pass the error to SaveNoteModal
    } finally {
      setIsLoading(false);
    }
  };

  const handleSummarize = async () => {
    setIsSummarizing(true);
    try {
      const response = await axios.post(
        `https://smartnotesappserver.onrender.com/notes/${selectedNote._id}/summarize`,{},
        {withCredentials:true }
      );
      setSummary(response.data.summary);
      fetchNotes();
    } catch (error) {
      console.error('Summarization error:', error); 
      
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleExtractKeywords = async () => {
    setIsExtractingKeywords(true);
    try {
      const response = await axios.post(
        `https://smartnotesappserver.onrender.com/notes/${selectedNote._id}/keywords`,{},
        { withCredentials:true }
      );
      setKeywords(response.data.keywords);
      fetchNotes();
    } catch (error) {
      console.error('Keyword extraction error:', error);
    } finally {
      setIsExtractingKeywords(false);
    }
  };

  const downloadPDF = (type) => {
    const doc = new jsPDF();
    const title = selectedNote?.title || 'Untitled Note';
    const margin = 10;
    let y = 10;
  
    doc.setFontSize(14);
    doc.text(title, margin, y);
    y += 10;
  
    doc.setFontSize(12);
  
    if (type === 'summary') {
      doc.text('Summary:', margin, y);
      y += 10;
  
      doc.setFontSize(10);
      const textLines = doc.splitTextToSize(summary, 180); // 180 = page width - margins
      textLines.forEach((line) => {
        if (y >= 280) { // Close to page bottom
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += 7;
      });
    }
  
    if (type === 'keywords') {
      doc.text('Extracted Keywords:', margin, y);
      y += 10;
  
      doc.setFontSize(10);
      keywords.forEach((kw) => {
        if (y >= 280) {
          doc.addPage();
          y = margin;
        }
        doc.text(`- ${kw}`, margin, y);
        y += 7;
      });
    }
  
    doc.save(`${title}_${type}.pdf`);
  };
  
  // Function to download keywords as PDF
 
  return (
    <div className="flex-1 p-6 overflow-auto">
      {selectedNote && (
 <div className="flex items-center justify-between mb-4">
 {/* Left: Title */}
 <div className="flex-1">
   <h2 className="text-xl font-semibold">
     {selectedNote.title}
     <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
       {selectedNote.tag}
     </span>
   </h2>
 </div>

 {/* Center: Edit button */}
 <div className="flex-1 flex justify-center">
   {!isEditing && (
     <button
       onClick={() => {
         setIsEditing(true);
         setTimeout(() => {
           document.querySelector('.ProseMirror').focus();
         }, 50);
       }}
       className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
     >
       Edit
     </button>
   )}
 </div>

 {/* Right: Conditional buttons */}
 <div className="flex-1 flex justify-end space-x-2">
   {!isEditing ? (
     <>
       {!summary && (
         <button
           onClick={handleSummarize}
           disabled={isSummarizing}
           className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 disabled:opacity-50"
         >
           {isSummarizing ? 'Summarizing...' : 'Summarize'}
         </button>
       )}
       {!keywords.length && (
         <button
           onClick={handleExtractKeywords}
           disabled={isExtractingKeywords}
           className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 disabled:opacity-50"
         >
           {isExtractingKeywords ? 'Extracting...' : 'Extract Keywords'}
         </button>
       )}
     </>
   ) : (
     <>
       <button
         onClick={() => {
           setIsEditing(false);
           setContent(originalContent);
         }}
         className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
       >
         Cancel
       </button>
       <button
         onClick={() =>
           handleSave({ title: selectedNote.title, tag: selectedNote.tag })
         }
        disabled={!hasChanges || textContent.trim().length === 0}
         className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
       >
         Save Changes
       </button>
     </>
   )}
 </div>
</div>


)}

      <RichTextEditor
     key={selectedNote?._id || 'new-note'}
     initialContent={selectedNote?.content || ''}
     onChange={handleEditorChange}
     readOnly={!isEditing}
      />
 
 {showCopyPopup && (
  <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-100 text-green-700 px-4 py-2 rounded shadow-md transition-opacity duration-500">
    Copied to clipboard!
  </div>
)}

<div className="mt-4">
  <button
    onClick={() => {
      navigator.clipboard.writeText(textContent);
      setShowCopyPopup(true);
      setTimeout(() => setShowCopyPopup(false), 2000);
    }}
    disabled={textContent.trim().length === 0}
    className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 text-sm disabled:opacity-50"
  >
    📋 Copy Note
  </button>
</div>


      {!selectedNote && (
        <button
          onClick={() => setShowSaveModal(true)}
           disabled={!hasChanges || textContent.trim().length === 0}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Save New Note
        </button>
      )}

      {showSaveModal && (
        <SaveNoteModal
          onClose={() => setShowSaveModal(false)}
          onSave={handleSave}
          initialTitle={selectedNote?.title || ''}
          isLoading={isLoading}
        />
      )}

      {error && (
        <div className="mt-4 p-2 bg-red-100 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      {summary && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">Summary</h3>
            <div className="flex gap-2">
  <button
    onClick={handleSummarize}
    className="p-2 text-sm bg-green-100 text-green-600 rounded hover:bg-green-200"
  >
    Resummarize
  </button>
  <button
    onClick={() => downloadPDF('summary')}
    className="p-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
    title="Download summary as PDF"
  >
    📥
  </button>
</div>
          </div>
          <p className="text-gray-700">{summary}</p>
        </div>
      )}

      {keywords.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">Keywords</h3>
            <div className="flex gap-2">
  <button
    onClick={handleExtractKeywords}
    className="p-2 text-sm bg-purple-100 text-purple-600 rounded hover:bg-purple-200"
  >
    Re-extract Keywords
  </button>
  <button
    onClick={() => downloadPDF('keywords')}
    className="p-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
    title="Download keywords as PDF"
  >
    📥
  </button>
</div>
          </div>
          <div className="flex flex-wrap gap-2">
            {keywords.map((keyword, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-white rounded-full text-sm shadow-sm"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NoteEditor;
