const db = require('../config/db');
const logger = require('../utils/logger');

async function createJob(req, res) {
  try {
    const { title, description, required_skills, min_experience, education_level, location, job_type } = req.body;

    logger.info('Creating job', {
      title,
      skillsCount: required_skills?.length ?? 0,
      recruiterId: req.user?.id,
    });

    const [job] = await db('jobs')
      .insert({
        recruiter_id: req.user.id,
        title,
        description,
        required_skills: required_skills || [],
        min_experience: min_experience || 0,
        education_level,
        location,
        job_type,
      })
      .returning('*');

    logger.info('Job created', { jobId: job.id, title: job.title });
    res.status(201).json(job);
  } catch (err) {
    logger.error('Create job failed', { message: err.message });
    res.status(500).json({ error: err.message });
  }
}

async function getJobs(req, res) {
  try {
    const jobs = await db('jobs')
      .select('jobs.*', 'users.name as recruiter_name')
      .join('users', 'users.id', 'jobs.recruiter_id')
      .where('jobs.status', 'open')
      .orderBy('jobs.created_at', 'desc');

    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getJobById(req, res) {
  try {
    const job = await db('jobs')
      .select('jobs.*', 'users.name as recruiter_name')
      .join('users', 'users.id', 'jobs.recruiter_id')
      .where('jobs.id', req.params.id)
      .first();

    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getMyJobs(req, res) {
  try {
    const jobs = await db('jobs')
      .where({ recruiter_id: req.user.id })
      .orderBy('created_at', 'desc');

    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { createJob, getJobs, getJobById, getMyJobs };
