const { EDUCATION_RANK } = require('./resumeParser');
const { skillMatches, fuzzySkillMatch, getSkillCategory, getCanonical, SKILL_GROUPS } = require('./skillSynonyms');

// Weights for each scoring dimension (total = 100)
const WEIGHTS = {
  skills_required: 35,
  skills_nice_to_have: 5,
  experience: 25,
  experience_bonus: 5,
  education: 15,
  job_title_relevance: 15,
};

/**
 * Extract skills mentioned in the job description text and classify them
 * as required or nice-to-have based on surrounding context.
 */
function extractSkillsFromDescription(description) {
  if (!description) return { required: [], niceToHave: [] };
  const lower = description.toLowerCase();

  const niceToHavePatterns = [/nice\s+to\s+have/i, /preferred/i, /bonus/i, /plus\b/i, /desired/i, /optional/i, /good\s+to\s+have/i];

  // Find all skills mentioned in description
  const foundSkills = [];
  for (const group of SKILL_GROUPS) {
    const allVariants = [group.canonical, ...group.variants];
    for (const v of allVariants) {
      const escaped = v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const match = lower.match(new RegExp(`\\b${escaped}\\b`, 'i'));
      if (match) {
        foundSkills.push({ canonical: group.canonical, index: match.index });
        break;
      }
    }
  }

  // Classify: skills near "nice to have" phrases are nice-to-have
  const niceToHave = [];
  const required = [];
  for (const skill of foundSkills) {
    const nearNiceToHave = niceToHavePatterns.some(p => {
      const match = lower.match(p);
      return match && Math.abs(match.index - skill.index) < 200;
    });
    if (nearNiceToHave) {
      niceToHave.push(skill.canonical);
    } else {
      required.push(skill.canonical);
    }
  }

  return { required, niceToHave };
}

/**
 * Score a single skill match with partial credit support.
 * Returns: 1.0 (exact), 0.8 (fuzzy), 0.3 (same category), 0 (no match)
 */
function scoreSkillMatch(requiredSkill, candidateSkillsLower, rawTextLower) {
  // Full match via synonyms + raw text
  if (skillMatches(requiredSkill, candidateSkillsLower, rawTextLower)) return { score: 1.0, type: 'exact' };

  // Fuzzy match
  const fuzzy = fuzzySkillMatch(requiredSkill, candidateSkillsLower);
  if (fuzzy) return { score: 0.8, type: 'fuzzy', matched_via: fuzzy };

  // Same-category partial credit
  const reqCategory = getSkillCategory(requiredSkill);
  if (reqCategory) {
    const sameCatSkill = candidateSkillsLower.find(cs => getSkillCategory(cs) === reqCategory);
    if (sameCatSkill) return { score: 0.3, type: 'category', matched_via: sameCatSkill, category: reqCategory };
  }

  return { score: 0, type: 'none' };
}

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

  const candidateSkills = (parsedResume.skills || []).map(s => s.toLowerCase());
  const rawTextLower = (parsedResume.raw_text || '').toLowerCase();

  // ──────────────────────────────────────────────
  // 1. Skills Match (35 points required + 5 points nice-to-have)
  // ──────────────────────────────────────────────

  // Combine explicit required_skills with skills found in job description
  const explicitRequired = (job.required_skills || []).map(s => s.toLowerCase().trim()).filter(Boolean);
  const descSkills = extractSkillsFromDescription(job.description);

  // Merge: explicit required + description-required (deduplicated via canonical)
  const requiredSkillsSet = new Set(explicitRequired.map(s => getCanonical(s)));
  for (const s of descSkills.required) {
    requiredSkillsSet.add(getCanonical(s));
  }
  // Remove any that are already in explicit required (avoid double counting)
  const requiredSkills = Array.from(requiredSkillsSet);

  const niceToHaveSkills = descSkills.niceToHave
    .map(s => getCanonical(s))
    .filter(s => !requiredSkillsSet.has(s));

  // Score required skills with partial credit
  let requiredSkillScore = 0;
  const matched = [];
  const partialMatches = [];
  const missing = [];

  if (requiredSkills.length === 0) {
    requiredSkillScore = WEIGHTS.skills_required;
    explanations.push(`Skills: ${WEIGHTS.skills_required}/${WEIGHTS.skills_required} — No specific skills required.`);
  } else {
    for (const skill of requiredSkills) {
      const result = scoreSkillMatch(skill, candidateSkills, rawTextLower);
      requiredSkillScore += result.score;
      if (result.score === 1.0) {
        matched.push(skill);
      } else if (result.score > 0) {
        partialMatches.push({ skill, ...result });
      } else {
        missing.push(skill);
      }
    }
    const ratio = requiredSkillScore / requiredSkills.length;
    requiredSkillScore = Math.round(ratio * WEIGHTS.skills_required * 100) / 100;

    explanations.push(
      `Skills: ${requiredSkillScore}/${WEIGHTS.skills_required} — Matched ${matched.length} of ${requiredSkills.length} required skills [${matched.join(', ') || 'none'}].${partialMatches.length > 0 ? ` Partial matches: [${partialMatches.map(p => `${p.skill} (${p.type})`).join(', ')}].` : ''} Missing: [${missing.join(', ') || 'none'}].`
    );
  }

  // Score nice-to-have skills
  let niceToHaveScore = 0;
  const niceToHaveMatched = [];
  if (niceToHaveSkills.length > 0) {
    for (const skill of niceToHaveSkills) {
      if (skillMatches(skill, candidateSkills, rawTextLower)) {
        niceToHaveMatched.push(skill);
      }
    }
    const nthRatio = niceToHaveMatched.length / niceToHaveSkills.length;
    niceToHaveScore = Math.round(nthRatio * WEIGHTS.skills_nice_to_have * 100) / 100;
    if (niceToHaveSkills.length > 0) {
      explanations.push(
        `Nice-to-have: ${niceToHaveScore}/${WEIGHTS.skills_nice_to_have} — Matched [${niceToHaveMatched.join(', ') || 'none'}] of [${niceToHaveSkills.join(', ')}].`
      );
    }
  } else {
    niceToHaveScore = 0;
  }

  const totalSkillScore = requiredSkillScore + niceToHaveScore;
  breakdown.skills = {
    score: totalSkillScore,
    max: WEIGHTS.skills_required + WEIGHTS.skills_nice_to_have,
    matched_skills: matched,
    missing_skills: missing,
    partial_matches: partialMatches,
    match_ratio: `${matched.length}/${requiredSkills.length}`,
    nice_to_have_matched: niceToHaveMatched,
    nice_to_have_score: niceToHaveScore,
  };

  // ──────────────────────────────────────────────
  // 2. Experience Match (25 points + 5 bonus)
  // ──────────────────────────────────────────────
  const candidateExp = parsedResume.experience_years || 0;
  const requiredExp = job.min_experience || 0;

  let expScore;
  let expBonus = 0;
  if (requiredExp === 0) {
    expScore = WEIGHTS.experience;
  } else if (candidateExp >= requiredExp) {
    expScore = WEIGHTS.experience;
    // Bonus: up to 5 extra points for exceeding (capped at 2x required)
    const excessRatio = Math.min((candidateExp - requiredExp) / requiredExp, 1);
    expBonus = Math.round(excessRatio * WEIGHTS.experience_bonus * 100) / 100;
  } else if (candidateExp > 0) {
    expScore = Math.round((candidateExp / requiredExp) * WEIGHTS.experience * 100) / 100;
  } else {
    expScore = 0;
  }

  breakdown.experience = {
    score: expScore + expBonus,
    max: WEIGHTS.experience + WEIGHTS.experience_bonus,
    candidate_years: candidateExp,
    required_years: requiredExp,
    base_score: expScore,
    bonus: expBonus,
  };
  explanations.push(
    `Experience: ${expScore}/${WEIGHTS.experience} — Candidate has ${candidateExp} years, job requires ${requiredExp} years.${expBonus > 0 ? ` Bonus: +${expBonus} for exceeding requirement.` : ''}`
  );

  // ──────────────────────────────────────────────
  // 3. Education Match (15 points)
  // ──────────────────────────────────────────────
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

  // ──────────────────────────────────────────────
  // 4. Job Title Relevance (15 points)
  // ──────────────────────────────────────────────
  const jobTitleWords = job.title
    .toLowerCase()
    .split(/[\s/,.-]+/)
    .filter(w => w.length > 2);

  const titleMatched = jobTitleWords.filter(w => rawTextLower.includes(w));
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

  // ──────────────────────────────────────────────
  // Total
  // ──────────────────────────────────────────────
  const total = Math.round(
    (breakdown.skills.score + breakdown.experience.score + breakdown.education.score + breakdown.job_title_relevance.score) * 100
  ) / 100;

  return {
    total_score: Math.min(total, 100),
    max_score: 100,
    breakdown,
    explanation: explanations,
    sufficient_data: true,
    scoring_weights: WEIGHTS,
  };
}

module.exports = { calculateATSScore };
