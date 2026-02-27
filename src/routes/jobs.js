const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const { createJob, getJobs, getJobById, getMyJobs } = require('../controllers/jobController');

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

// Public: list all open jobs
router.get('/', getJobs);

// Recruiter: get my posted jobs (must be before /:id)
router.get('/me/posted', authenticate, authorize('recruiter'), getMyJobs);

// Public: get single job
router.get('/:id', getJobById);

// Recruiter: create a job
router.post(
  '/',
  authenticate,
  authorize('recruiter'),
  [
    body('title').notEmpty().withMessage('Job title is required'),
    body('description').notEmpty().withMessage('Job description is required'),
    body('required_skills').isArray({ min: 1 }).withMessage('At least one skill is required'),
    body('min_experience').optional().isInt({ min: 0 }).withMessage('Experience must be a non-negative integer'),
    body('job_type').optional().isIn(['full-time', 'part-time', 'contract', 'remote']),
  ],
  validate,
  createJob
);

module.exports = router;
