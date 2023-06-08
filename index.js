// Importing necessary modules and libraries
const express = require('express'); // Express.js framework for building web applications
const multer = require('multer'); // Middleware for handling file uploads
const Datastore = require('nedb'); // Lightweight database for storing and querying data
const fs = require('fs'); // File System module for reading, writing, and deleting files
const path = require('path'); //Path module to extract the extension of the file
const crypto = require('crypto'); //Crypto module to give file a unique name

// Creating an instance of the express application
const app = express();

// Setting up multer middleware to handle file uploads
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: function (req, file, cb) {
    crypto.pseudoRandomBytes(16, function(err, raw) {
      if(err) {
        return cb(err);
      }
      cb(null, raw.toString('hex') + path.extname(file.originalname));
    });
  }
});

const upload = multer({ storage: storage });

// Creating an instance of the nedb database and setting it to autoload
const db = new Datastore({ filename: 'files.db', autoload: true });

// Setting up middleware for parsing urlencoded data and serving static files
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Route for handling file uploads
app.post('/upload', upload.single('file'), (req, res) => {
  const file = req.file;
  const data = {
    filename: file.originalname,
    path: file.path
  };
  // Checking if the file already exists in the database
  db.findOne({ filename: file.originalname }, (err, doc) => {
    if (err) {
      console.log(err);
      res.send('Error uploading file');
    } else if (doc) {
      //console.log('File already exists');
      // Deleting the uploaded file from the uploads folder if it already exists
      fs.unlinkSync(file.path);
      res.send('File already exists');
    } else {
      // Inserting the file data into the database if it doesn't already exist
      db.insert(data, (err, newDoc) => {
        if (err) {
          console.log(err);
          res.send('Error uploading file');
        } else {
          //console.log(newDoc);
          res.send('File uploaded successfully');
        }
      });
    }
  });
});

// This route handles downloads a file with the specified filename
// The :file(*) parameter in the URL matches any characters, including slashes, in the file name
app.get('/download/:file(*)', (req, res) => {
  // Extract the file name from the request parameters
  const file = req.params.file;

  // Construct the file path by joining the current directory with the file name
  const fileLocation = path.join(__dirname, file);

  // Check if the file exists at the specified location
  const fileExists = fs.existsSync(fileLocation);

  // If the file exists, set the response header to indicate that the response should be treated as a file download
  // Then create a read stream for the file and pipe it to the response object
  if (fileExists) {
    res.setHeader('Content-Disposition', `attachment; filename=${file}`);
    const filestream = fs.createReadStream(fileLocation);
    filestream.pipe(res);
  } else { // If the file does not exist, return a 404 error with an error message
    res.status(404).send('File not found');
  }
});


// Route for searching files in the database
app.get('/fileSearch', (req, res) => {
  // Constructing a regular expression object that matches filenames that contain the search query
  const query = req.query.q;
  if (!query) {
    return res.status(400).json([]);
  }
  db.findOne({ filename: { $regex: new RegExp(query, 'i') } }, (err, doc) => {
    if (err) {
      console.error(err);
      return res.status(500).json([]);
    }
    // Returning the search results as a JSON object
    res.json(doc ? [doc] : []);
  });
});

app.listen(5000, () => {
  console.log('Server running on port 5000. http://localhost:5000');
});