// Logs one line per request: time, method, path, status code and duration.
// Request bodies are never logged, so passwords and tokens do not end up in log files.
// Turned off in automated tests with LOG_REQUESTS=false.
export function requestLogger(req, res, next) {
  if (process.env.LOG_REQUESTS === "false") return next();
  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    const time = new Date().toTimeString().slice(0, 8);
    console.log(`${time} ${req.method.padEnd(6)} ${req.originalUrl} -> ${res.statusCode} (${ms.toFixed(1)} ms)`);
  });
  next();
}
