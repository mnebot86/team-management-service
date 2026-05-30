import multer from 'multer';

const storage = multer.diskStorage({});

const imageFileFilter: multer.Options['fileFilter'] = (req, file, callback) => {
  if (!file.mimetype.startsWith('image/')) {
    return callback(new Error('Only image uploads are allowed'));
  }

  callback(null, true);
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: imageFileFilter,
});
