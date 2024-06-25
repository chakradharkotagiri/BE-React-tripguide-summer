const multer = require("multer");
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const MIME_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};

const uploadDir="uploads/images"

const fileUpload = multer({
  limits: { fileSize: 5000000 }, // corrected limits object
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      console.log('Destination middleware hit');
      cb(null, uploadDir); // Ensure this path is correct and exists
    },
    filename: (req, file, cb) => {
      const ext = MIME_TYPE_MAP[file.mimetype];
      const uniqueId = uuidv4();
      console.log('Filename middleware hit, generating filename:', uniqueId + "." + ext);
      cb(null, uniqueId + "." + ext);
    },
  }),
  fileFilter: (req, file, cb) => {
    console.log('File filter middleware hit');
    const isValid = !!MIME_TYPE_MAP[file.mimetype];
    let error = isValid ? null : new HttpError("Invalid mime type!",500);
    cb(error, isValid);
  },
});

module.exports = fileUpload;
