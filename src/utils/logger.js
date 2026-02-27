/**
 * Simple structured logger for the job portal backend.
 * Logs to stdout with timestamps and levels.
 */
const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL?.toLowerCase()] ?? LOG_LEVELS.info;

function timestamp() {
  return new Date().toISOString();
}

function log(level, message, meta = {}) {
  if (LOG_LEVELS[level] < currentLevel) return;
  const entry = {
    time: timestamp(),
    level: level.toUpperCase(),
    msg: message,
    ...(Object.keys(meta).length ? meta : {}),
  };
  const out = level === 'error' ? console.error : console.log;
  out(JSON.stringify(entry));
}

module.exports = {
  debug: (msg, meta) => log('debug', msg, meta),
  info: (msg, meta) => log('info', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  error: (msg, meta) => log('error', msg, meta),
};
