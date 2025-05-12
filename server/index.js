require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./utils/db');
const authRoutes = require('./routes/authroutes');
const noteRoutes = require('./routes/noteroutes');
const cookieParser = require('cookie-parser');
const app = express();
app.use(cors({
  origin: 'http://localhost:5173', //frontend origin
  credentials: true
}));
app.use(bodyParser.json());
app.use(cookieParser());

connectDB();

app.use('/auth', authRoutes);
app.use('/notes', noteRoutes);

const PORT=process.env.PORT|| 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
