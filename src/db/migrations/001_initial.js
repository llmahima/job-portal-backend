const db = require('../../config/db');

async function migrate() {
  // Users table
  await db.raw(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL CHECK (role IN ('recruiter', 'candidate')),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // Jobs table
  await db.raw(`
    CREATE TABLE IF NOT EXISTS jobs (
      id SERIAL PRIMARY KEY,
      recruiter_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      required_skills TEXT[] NOT NULL DEFAULT '{}',
      min_experience INTEGER NOT NULL DEFAULT 0,
      education_level VARCHAR(100),
      location VARCHAR(255),
      job_type VARCHAR(50) CHECK (job_type IN ('full-time', 'part-time', 'contract', 'remote')),
      status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed')),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // Applications table with unique constraint for duplicate prevention
  await db.raw(`
    CREATE TABLE IF NOT EXISTS applications (
      id SERIAL PRIMARY KEY,
      job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
      candidate_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      resume_path VARCHAR(500),
      parsed_resume JSONB,
      ats_score NUMERIC(5,2),
      score_breakdown JSONB,
      status VARCHAR(30) DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewed', 'shortlisted', 'rejected')),
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(job_id, candidate_id)
    )
  `);

  console.log('Migration completed successfully');
  await db.destroy();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
