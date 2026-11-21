import multer from "multer";

export const MAX_RESUME_BYTES = 2 * 1024 * 1024; // 2 MB (NFR-03)

// Keeps the uploaded file in memory so it can be checked before it is saved to disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_RESUME_BYTES, files: 1 },
  fileFilter: (req, file, cb) => {
    const looksLikePdf = file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf");
    if (!looksLikePdf) {
      const err = new Error("Only PDF files are allowed");
      err.status = 400;
      return cb(err);
    }
    cb(null, true);
  },
});

// Accepts a single file in the "resume" form field.
export const uploadResume = upload.single("resume");
