const REQUIRED_VARS = {
  MONGODB_URI: 'MongoDB Atlas connection string',
  JWT_SECRET:  'Secret used to sign and verify JWT tokens',
};

function validateEnv() {
  const missing = Object.entries(REQUIRED_VARS)
    .filter(([key]) => !process.env[key])
    .map(([key, desc]) => `  ${key} — ${desc}`);

  if (missing.length === 0) return;

  console.error('FATAL: The following required environment variables are not set:');
  missing.forEach(line => console.error(line));
  console.error('Configure them in App Runner (production) or in a .env file (development), then restart.');
  process.exit(1);
}

module.exports = { validateEnv };
