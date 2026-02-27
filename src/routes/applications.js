const express = require('express');
const multer = require('multer');
const path = require('path');
const { authenticate, authorize } = require('../middleware/auth');
const {
  applyToJob,
  getApplicationsForJob,
  getMyApplications,
  getApplicationDetail,
} = require('../controllers/applicationController');

const router = express.Router();

// Multer config for PDF uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Candidate: apply to a job
router.post(
  '/jobs/:id/apply',
  authenticate,
  authorize('candidate'),
  upload.single('resume'),
  applyToJob
);

// Candidate: view my applications
router.get('/me', authenticate, authorize('candidate'), getMyApplications);

// Recruiter: view applications for a job (ranked by ATS score)
router.get('/jobs/:id/applications', authenticate, authorize('recruiter'), getApplicationsForJob);

// Both: view single application detail
router.get('/:id', authenticate, getApplicationDetail);

module.exports = router;
