const db = require('../config/db');
const { parseResume } = require('../services/resumeParser');
const { calculateATSScore } = require('../services/atsScorer');
const path = require('path');

async function applyToJob(req, res) {
  try {
    const { id: jobId } = req.params;
    const candidateId = req.user.id;

    // Check job exists and is open
    const job = await db('jobs').where({ id: jobId, status: 'open' }).first();
    if (!job) {
      return res.status(404).json({ error: 'Job not found or no longer accepting applications' });
    }

    // Duplicate prevention
    const existing = await db('applications').where({ job_id: jobId, candidate_id: candidateId }).first();
    if (existing) {
      return res.status(409).json({ error: 'You have already applied to this job' });
    }

    // Resume file is required
    if (!req.file) {
      return res.status(400).json({ error: 'Resume PDF file is required' });
    }

    // Parse resume
    const parsedResume = await parseResume(req.file.path);

    // Calculate ATS score
    const scoreResult = calculateATSScore(parsedResume, job);

    // Save application
    const [application] = await db('applications')
      .insert({
        job_id: jobId,
        candidate_id: candidateId,
        resume_path: req.file.path,
        parsed_resume: JSON.stringify(parsedResume),
        ats_score: scoreResult.total_score,
        score_breakdown: JSON.stringify(scoreResult),
      })
      .returning('*');

    res.status(201).json({
      application,
      ats_result: scoreResult,
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'You have already applied to this job' });
    }
    res.status(500).json({ error: err.message });
  }
}

async function getApplicationsForJob(req, res) {
  try {
    const { id: jobId } = req.params;

    // Verify the recruiter owns this job
    const job = await db('jobs').where({ id: jobId, recruiter_id: req.user.id }).first();
    if (!job) {
      return res.status(404).json({ error: 'Job not found or you do not own this job' });
    }

    const applications = await db('applications')
      .select('applications.*', 'users.name as candidate_name', 'users.email as candidate_email')
      .join('users', 'users.id', 'applications.candidate_id')
      .where({ job_id: jobId })
      .orderBy('ats_score', 'desc');

    res.json({
      job_title: job.title,
      total_applications: applications.length,
      candidates: applications.map(app => ({
        application_id: app.id,
        candidate_name: app.candidate_name,
        candidate_email: app.candidate_email,
        ats_score: parseFloat(app.ats_score),
        score_breakdown: app.score_breakdown,
        status: app.status,
        applied_at: app.created_at,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getMyApplications(req, res) {
  try {
    const applications = await db('applications')
      .select('applications.*', 'jobs.title as job_title', 'jobs.required_skills')
      .join('jobs', 'jobs.id', 'applications.job_id')
      .where({ candidate_id: req.user.id })
      .orderBy('applications.created_at', 'desc');

    res.json(applications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getApplicationDetail(req, res) {
  try {
    const { id } = req.params;

    const application = await db('applications')
      .select('applications.*', 'jobs.title as job_title', 'users.name as candidate_name')
      .join('jobs', 'jobs.id', 'applications.job_id')
      .join('users', 'users.id', 'applications.candidate_id')
      .where('applications.id', id)
      .first();

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Only the candidate or the recruiter who owns the job can view
    const job = await db('jobs').where({ id: application.job_id }).first();
    if (req.user.id !== application.candidate_id && req.user.id !== job.recruiter_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(application);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { applyToJob, getApplicationsForJob, getMyApplications, getApplicationDetail };
