import multer from "multer";

// Handles unknown routes and unexpected errors in one place.
export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  // Request body is not valid JSON
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Request body must be valid JSON" });
  }
  // File upload problems (e.g. file larger than 2 MB)
  if (err instanceof multer.MulterError) {
    const message = err.code === "LIMIT_FILE_SIZE" ? "The file is too large. Maximum size is 2 MB." : "File upload failed";
    return res.status(err.code === "LIMIT_FILE_SIZE" ? 413 : 400).json({ message });
  }
  // MongoDB unique index violation (e.g. two sign-ups with the same email at the same time)
  if (err.code === 11000) {
    const message = err.keyPattern?.email ? "An account with this email already exists" : "This record already exists";
    return res.status(409).json({ message });
  }
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ message: status >= 500 ? "Something went wrong on the server" : err.message });
}
