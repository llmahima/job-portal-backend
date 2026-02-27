const { EDUCATION_RANK } = require('./resumeParser');

// Weights for each scoring dimension (total = 100)
const WEIGHTS = {
  skills: 40,
  experience: 30,
  education: 15,
  job_title_relevance: 15,
};

/**
 * Rule-based ATS scoring engine.
 * Produces a transparent, deterministic score with full breakdown.
 */
function calculateATSScore(parsedResume, job) {
  if (!parsedResume || parsedResume.error) {
    return {
      total_score: 0,
      breakdown: {},
      explanation: 'Insufficient data to evaluate this candidate.',
      sufficient_data: false,
    };
  }

  const breakdown = {};
  const explanations = [];

  // 1. Skills Match (40 points)
  const requiredSkills = (job.required_skills || []).map(s => s.toLowerCase());
  const candidateSkills = (parsedResume.skills || []).map(s => s.toLowerCase());

  if (requiredSkills.length === 0) {
    breakdown.skills = { score: WEIGHTS.skills, max: WEIGHTS.skills, detail: 'No specific skills required' };
    explanations.push(`Skills: ${WEIGHTS.skills}/${WEIGHTS.skills} — No specific skills required by the job.`);
  } else {
    const matched = requiredSkills.filter(s => candidateSkills.includes(s));
    const ratio = matched.length / requiredSkills.length;
    const score = Math.round(ratio * WEIGHTS.skills * 100) / 100;

    breakdown.skills = {
      score,
      max: WEIGHTS.skills,
      matched_skills: matched,
      missing_skills: requiredSkills.filter(s => !candidateSkills.includes(s)),
      match_ratio: `${matched.length}/${requiredSkills.length}`,
    };
    explanations.push(
      `Skills: ${score}/${WEIGHTS.skills} — Matched ${matched.length} of ${requiredSkills.length} required skills [${matched.join(', ') || 'none'}]. Missing: [${breakdown.skills.missing_skills.join(', ') || 'none'}].`
    );
  }

  // 2. Experience Match (30 points)
  const candidateExp = parsedResume.experience_years || 0;
  const requiredExp = job.min_experience || 0;

  let expScore;
  if (requiredExp === 0) {
    expScore = WEIGHTS.experience;
  } else if (candidateExp >= requiredExp) {
    expScore = WEIGHTS.experience;
  } else if (candidateExp > 0) {
    expScore = Math.round((candidateExp / requiredExp) * WEIGHTS.experience * 100) / 100;
  } else {
    expScore = 0;
  }

  breakdown.experience = {
    score: expScore,
    max: WEIGHTS.experience,
    candidate_years: candidateExp,
    required_years: requiredExp,
  };
  explanations.push(
    `Experience: ${expScore}/${WEIGHTS.experience} — Candidate has ${candidateExp} years, job requires ${requiredExp} years.`
  );

  // 3. Education Match (15 points)
  const candidateEdu = parsedResume.education || [];
  const requiredEdu = (job.education_level || '').toLowerCase();

  let eduScore = 0;
  if (!requiredEdu) {
    eduScore = WEIGHTS.education;
    breakdown.education = { score: eduScore, max: WEIGHTS.education, detail: 'No education requirement specified' };
    explanations.push(`Education: ${eduScore}/${WEIGHTS.education} — No specific education required.`);
  } else {
    const requiredRank = EDUCATION_RANK[requiredEdu] || 0;
    const candidateMaxRank = Math.max(0, ...candidateEdu.map(e => EDUCATION_RANK[e] || 0));

    if (candidateMaxRank >= requiredRank) {
      eduScore = WEIGHTS.education;
    } else if (candidateMaxRank > 0) {
      eduScore = Math.round((candidateMaxRank / requiredRank) * WEIGHTS.education * 100) / 100;
    }

    breakdown.education = {
      score: eduScore,
      max: WEIGHTS.education,
      candidate_education: candidateEdu,
      required_education: requiredEdu,
    };
    explanations.push(
      `Education: ${eduScore}/${WEIGHTS.education} — Candidate has [${candidateEdu.join(', ') || 'none detected'}], job requires ${requiredEdu}.`
    );
  }

  // 4. Job Title Relevance (15 points) — keyword overlap between resume text and job title
  const jobTitleWords = job.title
    .toLowerCase()
    .split(/[\s/,.-]+/)
    .filter(w => w.length > 2);

  const resumeTextLower = (parsedResume.raw_text || '').toLowerCase();
  const titleMatched = jobTitleWords.filter(w => resumeTextLower.includes(w));
  const titleRatio = jobTitleWords.length > 0 ? titleMatched.length / jobTitleWords.length : 1;
  const titleScore = Math.round(titleRatio * WEIGHTS.job_title_relevance * 100) / 100;

  breakdown.job_title_relevance = {
    score: titleScore,
    max: WEIGHTS.job_title_relevance,
    matched_keywords: titleMatched,
    job_title_keywords: jobTitleWords,
  };
  explanations.push(
    `Job Title Relevance: ${titleScore}/${WEIGHTS.job_title_relevance} — Matched keywords [${titleMatched.join(', ') || 'none'}] from job title "${job.title}".`
  );

  // Total
  const total = Math.round(
    (breakdown.skills.score + breakdown.experience.score + breakdown.education.score + breakdown.job_title_relevance.score) * 100
  ) / 100;

  return {
    total_score: total,
    max_score: 100,
    breakdown,
    explanation: explanations,
    sufficient_data: true,
    scoring_weights: WEIGHTS,
  };
}

module.exports = { calculateATSScore };
