require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./utils/db');
const authRoutes = require('./routes/authroutes');
const noteRoutes = require('./routes/noteroutes');
const cookieParser = require('cookie-parser');
const app = express();
const allowedOrigins = [
  'https://notegenius-beta.vercel.app',      // previous Vercel frontend
  'http://localhost:5173',                   // local development
  'https://notegenius-le2t.onrender.com'     // new Render frontend
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(bodyParser.json());
app.use(cookieParser());

connectDB();

app.use('/auth', authRoutes);
app.use('/notes', noteRoutes);

const PORT=process.env.PORT|| 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
