const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();
const app = express();
app.use(cors());
app.use(bodyParser.json());
const mongouri=process.env.MONGO_URI;
mongoose.connect(mongouri)
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.error('MongoDB connection error:', err));

// Schemas
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
});

const noteSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  title: { type: String, required: true, unique: true },
  content: String,
  summary: String,
  keywords: [String],
  tag: { type: String, enum: ['work', 'personal', 'research'], default: 'personal' },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('noteUser', userSchema);
const Note = mongoose.model('Note', noteSchema);




// Authentication middleware
const authenticate = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extract token from "Bearer <token>"
  if (!token) return res.status(401).send('Access denied');

  try {
    const verified = jwt.verify(token, 'secret-key');
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).send('Invalid token');
  }
};

// Routes


app.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if username already exists
    console.log('Checking for existing user:', username);
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.log('Existing user:', existingUser);
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({ username, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ username, _id: user._id }, 'secret-key');
      res.json({ 
        token,
        user: { // Include user data in response
          _id: user._id,
          username: user.username
        }
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

app.get('/notes', authenticate, async (req, res) => {
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
});

app.post('/notes', authenticate, async (req, res) => {
  const { title, content, tag } = req.body;

  try {
    // Check if note title already exists
    const existingNote = await Note.findOne({ title });
    if (existingNote) {
      return res.status(400).json({ error: 'Note title must be unique' });
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
});

app.put('/notes/:id', authenticate, async (req, res) => {
  const { title, content, tag } = req.body;

  try {
    // Check if note exists
    const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Check if new title is unique
    if (title && title !== note.title) {
      const existingNote = await Note.findOne({ title });
      if (existingNote) {
        return res.status(400).json({ error: 'Note title must be unique' });
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
});

app.post('/notes/:id/summarize', authenticate, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Call Flask API for summarization
    const response = await axios.post('http://localhost:5001/summarize', {
      text: note.content,
    });

    // Update note with summary
    note.summary = response.data.summary;
    await note.save();

    res.json(note);
  } catch (error) {
    console.error('Error summarizing note:', error);
    res.status(500).json({ error: 'Failed to summarize note. Please try again.' });
  }
});

app.post('/notes/:id/keywords', authenticate, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Call Flask API for keyword extraction
    const response = await axios.post('http://localhost:5001/extract-keywords', {
      text: note.content,
    });

    // Update note with keywords
    note.keywords = response.data.keywords;
    await note.save();

    res.json(note);
  } catch (error) {
    console.error('Error extracting keywords:', error);
    res.status(500).json({ error: 'Failed to extract keywords. Please try again.' });
  }
});

app.delete('/notes/:id', authenticate, async (req, res) => {
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
});



app.listen(5000, () => console.log('Server running on port 5000'));