const Note=require('../models/note');
const axios=require('axios');

exports.getNotes=async (req, res) => {
  const { search, tag } = req.query;
  const query = { userId: req.user._id };

  if (search) query.title = { $regex: search, $options: 'i' };
  if (tag) query.tag = tag;

  try {
    const notes = await Note.find(query).sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes. Please try again.' });
  }
};

exports.createNote=async (req, res) => {
  const { title, content, tag } = req.body;

  try {
    // Check if note title already exists
    const existingNote = await Note.findOne({ title, userId:req.user._id});
    if (existingNote) {
      return res.status(400).json({ error: 'This note title is already used' });
    }

    // Create new note
    const note = new Note({
      userId: req.user._id,
      title,
      content,
      tag,
    });
    await note.save();

    res.status(201).json(note);
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ error: 'Failed to create note. Please try again.' });
  }
};

exports.updateNote=async (req, res) => {
  const { title, content, tag } = req.body;

  try {
    // Check if note exists
    const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Check if new title is unique
    if (title && title !== note.title) {
      const existingNote = await Note.findOne({ title,userId: req.user._id});
      if (existingNote) {
        return res.status(400).json({ error: 'You already have a note with this title.' });
      }
    }

    // Update note
    note.title = title || note.title;
    note.content = content || note.content;
    note.tag = tag || note.tag;
    await note.save();

    res.json(note);
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ error: 'Failed to update note. Please try again.' });
  }
};

exports.summarizeNote=async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Call Flask API for summarization
    const response = await axios.post('https://smart-notes-app-aazj.onrender.com/summarize', {
      text: note.content,
    });

    // Update note with summary
    note.summary = response.data.summary;
    await note.save();

    res.json(note);
  } catch (error) {
   console.error('Error summarizing note:', error);

    // If the error came from Flask and has a response
    if (error.response && error.response.data && error.response.data.error) {
      return res.status(error.response.status || 500).json({
        error: error.response.data.error
      });
    }

    // Fallback generic error
    res.status(500).json({ error: 'Failed to summarize note. Please try again.' });
  }
};

exports.extractKeywords=async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
      console.log("keyword request recieved");
    // Call Flask API for keyword extraction
    const response = await axios.post('https://smart-notes-app-aazj.onrender.com/extract-keywords', {
      text: note.content,
    });

    // Update note with keywords
    note.keywords = response.data.keywords;
    await note.save();

    res.json(note);
  } catch (error) {
    console.error('Error extracting keywords:', error);

    // If the error came from Flask and has a response
    if (error.response && error.response.data && error.response.data.error) {
      return res.status(error.response.status || 500).json({
        error: error.response.data.error
      });
    }

    // Fallback generic error
    res.status(500).json({ error: 'Failed to extract keywords. Please try again.' });
  }
};

exports.deleteNote=async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!note) return res.status(404).json({ error: 'Note not found' });
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete note' });
  }
};