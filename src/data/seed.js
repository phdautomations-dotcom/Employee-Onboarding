import { APP_STATUS, ROUND_STATUS, DOC_STATUS, OFFER_STATUS, REQUIRED_DOCUMENTS } from '../constants/statuses.js';
import { findJob } from './jobs.js';
import { makeCandidateId, makeApplicationId, makeEmployeeId, makeOfferId, uid } from '../utils/ids.js';

function emptyAddress() {
  return { line1: '', line2: '', city: '', state: '', country: 'India', postalCode: '' };
}

function docsFor(applicationId, state = {}) {
  return REQUIRED_DOCUMENTS.map((d) => ({
    id: uid('doc'),
    applicationId,
    key: d.key,
    label: d.label,
    required: d.required,
    category: d.category,
    status: state[d.key]?.status || DOC_STATUS.PENDING,
    fileName: state[d.key]?.fileName || null,
    uploadedAt: state[d.key]?.uploadedAt || null,
    verifiedAt: state[d.key]?.verifiedAt || null,
    rejectionReason: state[d.key]?.rejectionReason || null,
  }));
}

function baseApplication({
  seq,
  jobId,
  status,
  submittedAt,
  first,
  last,
  email,
  mobile,
  skills,
  totalExp,
  company,
  title,
}) {
  const job = findJob(jobId);
  const candidateId = makeCandidateId(seq);
  const applicationId = makeApplicationId(seq + 750);
  const SOURCES = ['Direct', 'Job Board', 'Referral', 'Social'];
  return {
    id: applicationId,
    candidateId,
    jobId,
    jobTitle: job?.title || 'General Application',
    isGeneral: !jobId,
    source: SOURCES[seq % SOURCES.length],
    status,
    submittedAt,
    assignedTo: 'Priya Nair',
    autofilled: ['skills', 'totalExperience', 'currentCompany'],
    returnReason: null,
    rejectReason: null,
    personal: {
      firstName: first,
      middleName: '',
      lastName: last,
      email,
      mobile,
      dob: '',
      gender: '',
      nationality: 'Indian',
      currentLocation: job?.location?.split(',')[0] || 'Bengaluru',
      preferredLocation: job?.location?.split(',')[0] || 'Bengaluru',
      address: emptyAddress(),
    },
    professional: {
      currentJobTitle: title,
      currentCompany: company,
      totalExperience: String(totalExp),
      relevantExperience: String(Math.max(1, totalExp - 1)),
      employmentStatus: 'Employed',
      currentCTC: '1800000',
      expectedCTC: '2400000',
      noticePeriod: '60 days',
      preferredJobLocation: job?.location?.split(',')[0] || 'Bengaluru',
      skills,
      certifications: [],
      languages: ['English', 'Hindi'],
    },
    education: [
      {
        id: uid('edu'),
        qualification: 'B.Tech Computer Science',
        university: 'National Institute of Technology',
        specialization: 'Computer Science',
        year: String(2026 - totalExp - 4),
        grade: '8.1 CGPA',
      },
    ],
    additional: { coverNote: '', referral: '', portfolio: '' },
    resume: { name: `${first}_${last}_Resume.pdf`, size: 148000, uploadedAt: submittedAt },
  };
}

/* ------------------------------------------------------------------
   Synthetic candidates. The eight above are hand-built with full
   interview / document / offer chains; these fill out the pipeline so
   the dashboard and lists look like a real, busy recruitment desk.
   ------------------------------------------------------------------ */
const FIRST_NAMES = ['Aarav', 'Isha', 'Rohan', 'Priyanka', 'Aditya', 'Sneha', 'Kabir', 'Ananya', 'Devansh', 'Riya', 'Arnav', 'Tara', 'Yash', 'Nisha', 'Ved', 'Kavya', 'Ishaan', 'Meghna', 'Rehan', 'Pooja', 'Aryan', 'Diya', 'Kunal', 'Sara', 'Nikhil', 'Aisha', 'Varun', 'Simran', 'Dhruv', 'Lakshmi'];
const LAST_NAMES = ['Sharma', 'Verma', 'Nair', 'Reddy', 'Iyer', 'Menon', 'Bose', 'Kapoor', 'Chauhan', 'Pillai', 'Ghosh', 'Rao', 'Malhotra', 'Joshi', 'Sethi', 'Bhat', 'Kulkarni', 'Das', 'Shah', 'Mistry'];
const COMPANIES = ['BrightApps', 'DataForge', 'NimbusTech', 'CloudNine', 'PixelWorks', 'CoreLogic', 'Finmark', 'Zentrix', 'Apex Digital', 'Northwind'];
const SKILL_POOL = ['React', 'TypeScript', 'Node.js', 'Python', 'SQL', 'AWS', 'Docker', 'Figma', 'SAP', 'Kubernetes', 'Testing', 'Analytics'];
const SOURCE_WEIGHTS = [['Direct', 35], ['Job Board', 28], ['Referral', 22], ['Social', 15]];
const STAGE_PLAN = [
  [APP_STATUS.SUBMITTED, 20], [APP_STATUS.TA_REVIEW, 13], [APP_STATUS.INTERVIEW_PLANNING, 7],
  [APP_STATUS.INTERVIEW_IN_PROGRESS, 10], [APP_STATUS.INTERVIEW_PASSED, 4], [APP_STATUS.INTERVIEW_FAILED, 4],
  [APP_STATUS.DOC_VERIFICATION, 6], [APP_STATUS.DOCS_VERIFIED, 3], [APP_STATUS.OFFER_PENDING_HR, 3],
  [APP_STATUS.OFFER_ISSUED, 4], [APP_STATUS.OFFER_ACCEPTED, 3], [APP_STATUS.JOINING_PENDING, 2],
  [APP_STATUS.EMPLOYEE, 6], [APP_STATUS.REJECTED, 12],
];
const JOB_IDS = ['JOB-1024', 'JOB-1025', 'JOB-1026', 'JOB-1027', 'JOB-1028', 'JOB-1029', 'JOB-1030', 'JOB-1031', 'JOB-1032', 'JOB-1033', 'JOB-1034', 'JOB-1035'];

/* Tiny deterministic PRNG so the demo data is identical on every load. */
function makeRng(seed) {
  let s = seed;
  return () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function weightedPick(rng, pairs) {
  const total = pairs.reduce((sum, [, w]) => sum + w, 0);
  let r = rng() * total;
  for (const [value, w] of pairs) { if ((r -= w) <= 0) return value; }
  return pairs[0][0];
}

function docStateForStatus(status, uploadedAt) {
  const reached = (list) => list.includes(status);
  const afterDocs = reached([APP_STATUS.DOCS_VERIFIED, APP_STATUS.OFFER_PENDING_HR, APP_STATUS.OFFER_ISSUED, APP_STATUS.OFFER_ACCEPTED, APP_STATUS.JOINING_PENDING, APP_STATUS.EMPLOYEE]);
  if (afterDocs) {
    return Object.fromEntries(REQUIRED_DOCUMENTS.map((d) => [d.key, { status: DOC_STATUS.VERIFIED, fileName: `${d.key}.pdf`, uploadedAt, verifiedAt: uploadedAt }]));
  }
  if (status === APP_STATUS.DOC_VERIFICATION) {
    return Object.fromEntries(REQUIRED_DOCUMENTS.map((d, i) => [d.key, { status: i < 3 ? DOC_STATUS.UPLOADED : DOC_STATUS.PENDING, fileName: i < 3 ? `${d.key}.pdf` : null, uploadedAt: i < 3 ? uploadedAt : null }]));
  }
  return {};
}

function buildSyntheticCandidates(startSeq) {
  const rng = makeRng(20260903);
  const out = { applications: [], documents: [], interviews: [], offers: [], employees: [], activities: [] };
  const statuses = STAGE_PLAN.flatMap(([status, n]) => Array(n).fill(status));
  let seq = startSeq;
  let offerSeq = 100;
  let empSeq = 200;

  statuses.forEach((status, idx) => {
    const first = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
    const last = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
    const jobId = JOB_IDS[Math.floor(rng() * JOB_IDS.length)];
    const daysAgo = 4 + Math.floor(rng() * 150);
    const submittedAt = new Date(Date.now() - daysAgo * 86400000).toISOString();
    const totalExp = 1 + Math.floor(rng() * 14);
    const skills = [...SKILL_POOL].sort(() => rng() - 0.5).slice(0, 3 + Math.floor(rng() * 2));

    const app = baseApplication({
      seq: seq + 1000, jobId, status, submittedAt,
      first, last,
      email: `${first.toLowerCase()}.${last.toLowerCase()}${idx}@example.com`,
      mobile: `+91 9${Math.floor(1000000000 + rng() * 8999999999)}`.slice(0, 14),
      skills, totalExp,
      company: COMPANIES[Math.floor(rng() * COMPANIES.length)],
      title: skills[0] + ' Specialist',
    });
    app.source = weightedPick(rng, SOURCE_WEIGHTS);
    out.applications.push(app);
    out.documents.push(...docsFor(app.id, docStateForStatus(status, submittedAt)));
    out.activities.push({ id: uid('act'), applicationId: app.id, type: 'application', title: 'Application Submitted', description: `${first} ${last} applied for ${app.jobTitle}.`, at: submittedAt, actor: `${first} ${last}` });

    const inOrPastInterview = [APP_STATUS.INTERVIEW_IN_PROGRESS, APP_STATUS.INTERVIEW_PASSED, APP_STATUS.INTERVIEW_FAILED, APP_STATUS.DOC_VERIFICATION, APP_STATUS.DOCS_VERIFIED, APP_STATUS.OFFER_PENDING_HR, APP_STATUS.OFFER_ISSUED, APP_STATUS.OFFER_ACCEPTED, APP_STATUS.JOINING_PENDING, APP_STATUS.EMPLOYEE].includes(status);
    if (inOrPastInterview) {
      const done = status !== APP_STATUS.INTERVIEW_IN_PROGRESS;
      out.interviews.push({
        id: uid('int'), applicationId: app.id, round: 1, type: 'Technical Interview',
        interviewer: 'Priya Nair', date: new Date(Date.now() - (daysAgo - 5) * 86400000).toISOString().slice(0, 10),
        time: '11:00', mode: 'Online', link: 'https://meet.example/xyz', location: '', notes: '',
        status: status === APP_STATUS.INTERVIEW_FAILED ? ROUND_STATUS.FAIL : done ? ROUND_STATUS.PASS : ROUND_STATUS.SCHEDULED,
        result: status === APP_STATUS.INTERVIEW_FAILED ? ROUND_STATUS.FAIL : done ? ROUND_STATUS.PASS : null,
        comments: done ? 'Solid problem solving.' : '',
      });
    }

    const hasOffer = [APP_STATUS.OFFER_PENDING_HR, APP_STATUS.OFFER_ISSUED, APP_STATUS.OFFER_ACCEPTED, APP_STATUS.JOINING_PENDING, APP_STATUS.EMPLOYEE].includes(status);
    if (hasOffer) {
      const offerStatus = status === APP_STATUS.OFFER_PENDING_HR ? OFFER_STATUS.PENDING_APPROVAL
        : status === APP_STATUS.OFFER_ISSUED ? OFFER_STATUS.ISSUED : OFFER_STATUS.ACCEPTED;
      const createdAt = new Date(Date.now() - (daysAgo - 15) * 86400000).toISOString();
      out.offers.push({
        id: makeOfferId(offerSeq++), applicationId: app.id, candidateName: `${first} ${last}`,
        jobTitle: app.jobTitle, department: findJob(jobId)?.department || 'General', location: findJob(jobId)?.location || 'Bengaluru, India',
        joiningDate: new Date(Date.now() + 20 * 86400000).toISOString().slice(0, 10), employmentType: 'Full-time',
        compensation: String(1600000 + Math.floor(rng() * 1800000)), benefits: 'Health insurance, learning budget',
        reportingManager: 'Priya Nair', probationPeriod: '6 months',
        status: offerStatus, returnReason: null, createdAt,
        issuedAt: offerStatus === OFFER_STATUS.PENDING_APPROVAL ? null : createdAt,
        decisionAt: offerStatus === OFFER_STATUS.ACCEPTED ? createdAt : null,
      });
    }

    if (status === APP_STATUS.EMPLOYEE) {
      out.employees.push({
        id: makeEmployeeId(empSeq++), applicationId: app.id, name: `${first} ${last}`,
        position: app.jobTitle, department: findJob(jobId)?.department || 'General',
        joiningDate: new Date(Date.now() - (daysAgo - 30) * 86400000).toISOString().slice(0, 10),
        createdAt: submittedAt,
      });
    }

    seq += 1;
  });

  return out;
}

export function buildSeed() {
  const activities = [];
  const addActivity = (applicationId, type, title, description, at, actor = 'System') => {
    activities.push({ id: uid('act'), applicationId, type, title, description, at, actor });
  };

  const applications = [];
  const interviews = [];
  let documents = [];
  const offers = [];
  const employees = [];

  // 1. Fresh submission -> under TA review
  const a1 = baseApplication({
    seq: 118,
    jobId: 'JOB-1025',
    status: APP_STATUS.TA_REVIEW,
    submittedAt: '2026-08-30T09:10:00',
    first: 'Meera',
    last: 'Krishnan',
    email: 'meera.krishnan@example.com',
    mobile: '+91 98111 20034',
    skills: ['React', 'TypeScript', 'CSS', 'Testing'],
    totalExp: 6,
    company: 'BrightApps',
    title: 'Frontend Engineer',
  });
  applications.push(a1);
  addActivity(a1.id, 'application', 'Application Submitted', 'Candidate submitted application.', a1.submittedAt, 'Meera Krishnan');
  addActivity(a1.id, 'review', 'TA Review Started', 'Priya Nair started reviewing the application.', '2026-08-30T11:00:00', 'Priya Nair');
  documents = documents.concat(docsFor(a1.id));

  // 2. Approved -> interview planning
  const a2 = baseApplication({
    seq: 119,
    jobId: 'JOB-1027',
    status: APP_STATUS.INTERVIEW_PLANNING,
    submittedAt: '2026-08-28T14:20:00',
    first: 'Vikram',
    last: 'Desai',
    email: 'vikram.desai@example.com',
    mobile: '+91 99220 45611',
    skills: ['Node.js', 'PostgreSQL', 'REST', 'Docker'],
    totalExp: 5,
    company: 'DataForge',
    title: 'Backend Engineer',
  });
  applications.push(a2);
  addActivity(a2.id, 'application', 'Application Submitted', 'Candidate submitted application.', a2.submittedAt, 'Vikram Desai');
  addActivity(a2.id, 'approve', 'Application Approved', 'TA approved the candidate for interviews.', '2026-08-29T10:15:00', 'Priya Nair');
  documents = documents.concat(docsFor(a2.id));

  // 3. Interview in progress (round 1 passed, round 2 scheduled)
  const a3 = baseApplication({
    seq: 120,
    jobId: 'JOB-1024',
    status: APP_STATUS.INTERVIEW_IN_PROGRESS,
    submittedAt: '2026-08-20T10:00:00',
    first: 'Rahul',
    last: 'Sharma',
    email: 'rahul.sharma@example.com',
    mobile: '+91 98200 11234',
    skills: ['SAP', 'SAP CAP', 'OData', 'Fiori', 'JavaScript'],
    totalExp: 5,
    company: 'ABC Technologies',
    title: 'Senior SAP Consultant',
  });
  applications.push(a3);
  interviews.push(
    {
      id: uid('int'),
      applicationId: a3.id,
      round: 1,
      type: 'HR Interview',
      interviewer: 'Priya Nair',
      date: '2026-08-25',
      time: '11:00',
      mode: 'Online',
      link: 'https://meet.example.com/rahul-hr',
      location: '',
      notes: 'Intro + culture fit',
      status: ROUND_STATUS.PASS,
      result: 'PASS',
      comments: 'Strong communication, aligned with role expectations.',
    },
    {
      id: uid('int'),
      applicationId: a3.id,
      round: 2,
      type: 'Technical Interview',
      interviewer: 'Karthik Rao',
      date: '2026-09-04',
      time: '15:00',
      mode: 'Online',
      link: 'https://meet.example.com/rahul-tech',
      location: '',
      notes: 'CAP + OData deep dive',
      status: ROUND_STATUS.SCHEDULED,
      result: null,
      comments: '',
    }
  );
  addActivity(a3.id, 'application', 'Application Submitted', 'Candidate submitted application.', a3.submittedAt, 'Rahul Sharma');
  addActivity(a3.id, 'approve', 'Application Approved', 'TA approved the candidate for interviews.', '2026-08-22T09:00:00', 'Priya Nair');
  addActivity(a3.id, 'interview', 'HR Interview Scheduled', 'Round 1 scheduled for 25 Aug 2026.', '2026-08-22T09:30:00', 'Priya Nair');
  addActivity(a3.id, 'interview', 'HR Interview Passed', 'Round 1 result recorded: Pass.', '2026-08-25T12:30:00', 'Priya Nair');
  addActivity(a3.id, 'interview', 'Technical Interview Scheduled', 'Round 2 scheduled for 04 Sep 2026.', '2026-08-26T10:00:00', 'Priya Nair');
  documents = documents.concat(docsFor(a3.id));

  // 4. Document verification stage
  const a4 = baseApplication({
    seq: 121,
    jobId: 'JOB-1028',
    status: APP_STATUS.DOC_VERIFICATION,
    submittedAt: '2026-08-12T08:30:00',
    first: 'Ananya',
    last: 'Iyer',
    email: 'ananya.iyer@example.com',
    mobile: '+91 99870 55210',
    skills: ['Figma', 'Prototyping', 'Design Systems'],
    totalExp: 7,
    company: 'Nimbus Digital',
    title: 'Product Designer',
  });
  applications.push(a4);
  interviews.push({
    id: uid('int'),
    applicationId: a4.id,
    round: 1,
    type: 'Managerial Interview',
    interviewer: 'Sneha Kapoor',
    date: '2026-08-18',
    time: '10:00',
    mode: 'In-Person',
    link: '',
    location: 'Bengaluru Office, Level 4',
    notes: '',
    status: ROUND_STATUS.PASS,
    result: 'PASS',
    comments: 'Excellent portfolio and craft.',
  });
  documents = documents.concat(
    docsFor(a4.id, {
      gov_id: { status: DOC_STATUS.VERIFIED, fileName: 'aadhaar.pdf', uploadedAt: '2026-08-19T09:00:00', verifiedAt: '2026-08-20T10:00:00' },
      education_cert: { status: DOC_STATUS.UPLOADED, fileName: 'degree.pdf', uploadedAt: '2026-08-19T09:05:00' },
      experience_cert: { status: DOC_STATUS.REJECTED, fileName: 'exp_letter.jpg', uploadedAt: '2026-08-19T09:10:00', rejectionReason: 'Document is unclear. Please upload a clearer copy.' },
      photograph: { status: DOC_STATUS.VERIFIED, fileName: 'photo.jpg', uploadedAt: '2026-08-19T09:12:00', verifiedAt: '2026-08-20T10:05:00' },
    })
  );
  addActivity(a4.id, 'application', 'Application Submitted', 'Candidate submitted application.', a4.submittedAt, 'Ananya Iyer');
  addActivity(a4.id, 'approve', 'Application Approved', 'TA approved the candidate for interviews.', '2026-08-14T09:00:00', 'Priya Nair');
  addActivity(a4.id, 'interview', 'Managerial Interview Passed', 'Round 1 result recorded: Pass.', '2026-08-18T12:00:00', 'Priya Nair');
  addActivity(a4.id, 'documents', 'Moved to Document Verification', 'All interview rounds passed.', '2026-08-18T12:10:00', 'Priya Nair');
  addActivity(a4.id, 'documents', 'Document Rejected', 'Experience Certificate rejected: unclear copy.', '2026-08-20T10:10:00', 'Priya Nair');

  // 5. Offer pending HR approval
  const a5 = baseApplication({
    seq: 122,
    jobId: 'JOB-1029',
    status: APP_STATUS.OFFER_PENDING_HR,
    submittedAt: '2026-07-28T08:30:00',
    first: 'Sameer',
    last: 'Khan',
    email: 'sameer.khan@example.com',
    mobile: '+91 98333 71200',
    skills: ['SQL', 'Python', 'Power BI'],
    totalExp: 4,
    company: 'InsightWorks',
    title: 'Data Analyst',
  });
  applications.push(a5);
  interviews.push({
    id: uid('int'),
    applicationId: a5.id,
    round: 1,
    type: 'Technical Interview',
    interviewer: 'Karthik Rao',
    date: '2026-08-02',
    time: '14:00',
    mode: 'Online',
    link: 'https://meet.example.com/sameer-tech',
    location: '',
    notes: '',
    status: ROUND_STATUS.PASS,
    result: 'PASS',
    comments: 'Solid SQL and analytical thinking.',
  });
  documents = documents.concat(
    docsFor(a5.id, {
      gov_id: { status: DOC_STATUS.VERIFIED, fileName: 'pan.pdf', uploadedAt: '2026-08-05T09:00:00', verifiedAt: '2026-08-06T10:00:00' },
      education_cert: { status: DOC_STATUS.VERIFIED, fileName: 'degree.pdf', uploadedAt: '2026-08-05T09:02:00', verifiedAt: '2026-08-06T10:02:00' },
      experience_cert: { status: DOC_STATUS.VERIFIED, fileName: 'exp.pdf', uploadedAt: '2026-08-05T09:04:00', verifiedAt: '2026-08-06T10:04:00' },
      address_proof: { status: DOC_STATUS.VERIFIED, fileName: 'utility_bill.pdf', uploadedAt: '2026-08-05T09:06:00', verifiedAt: '2026-08-06T10:06:00' },
      photograph: { status: DOC_STATUS.VERIFIED, fileName: 'photo.jpg', uploadedAt: '2026-08-05T09:08:00', verifiedAt: '2026-08-06T10:08:00' },
    })
  );
  offers.push({
    id: makeOfferId(41),
    applicationId: a5.id,
    candidateName: 'Sameer Khan',
    jobTitle: 'Data Analyst',
    department: 'Business Intelligence',
    location: 'Pune, India',
    joiningDate: '2026-10-01',
    employmentType: 'Full-time',
    compensation: '2200000',
    benefits: 'Health insurance, Certification support, Hybrid work',
    reportingManager: 'Latha Suresh',
    probationPeriod: '6 months',
    status: OFFER_STATUS.PENDING_APPROVAL,
    returnReason: null,
    createdAt: '2026-08-08T11:00:00',
    issuedAt: null,
    decisionAt: null,
  });
  addActivity(a5.id, 'application', 'Application Submitted', 'Candidate submitted application.', a5.submittedAt, 'Sameer Khan');
  addActivity(a5.id, 'approve', 'Application Approved', 'TA approved the candidate for interviews.', '2026-07-30T09:00:00', 'Priya Nair');
  addActivity(a5.id, 'interview', 'Technical Interview Passed', 'Round 1 result recorded: Pass.', '2026-08-02T16:00:00', 'Priya Nair');
  addActivity(a5.id, 'documents', 'Documents Verified', 'All mandatory documents verified.', '2026-08-06T10:30:00', 'Priya Nair');
  addActivity(a5.id, 'offer', 'Offer Submitted for HR Approval', 'TA prepared and submitted the offer.', '2026-08-08T11:00:00', 'Priya Nair');

  // 6. Offer issued, awaiting candidate
  const a6 = baseApplication({
    seq: 123,
    jobId: 'JOB-1030',
    status: APP_STATUS.OFFER_ISSUED,
    submittedAt: '2026-07-20T08:30:00',
    first: 'Divya',
    last: 'Menon',
    email: 'divya.menon@example.com',
    mobile: '+91 98444 90021',
    skills: ['Playwright', 'JavaScript', 'CI/CD'],
    totalExp: 5,
    company: 'QualityLabs',
    title: 'QA Automation Engineer',
  });
  applications.push(a6);
  documents = documents.concat(
    docsFor(
      a6.id,
      Object.fromEntries(
        REQUIRED_DOCUMENTS.map((d) => [
          d.key,
          { status: DOC_STATUS.VERIFIED, fileName: `${d.key}.pdf`, uploadedAt: '2026-07-25T09:00:00', verifiedAt: '2026-07-26T10:00:00' },
        ])
      )
    )
  );
  offers.push({
    id: makeOfferId(42),
    applicationId: a6.id,
    candidateName: 'Divya Menon',
    jobTitle: 'QA Automation Engineer',
    department: 'Quality Engineering',
    location: 'Remote, India',
    joiningDate: '2026-09-25',
    employmentType: 'Full-time',
    compensation: '2600000',
    benefits: 'Fully remote, Flexible hours, Learning budget',
    reportingManager: 'Nikhil Verma',
    probationPeriod: '3 months',
    status: OFFER_STATUS.ISSUED,
    returnReason: null,
    createdAt: '2026-07-28T11:00:00',
    issuedAt: '2026-07-30T09:00:00',
    decisionAt: null,
  });
  addActivity(a6.id, 'application', 'Application Submitted', 'Candidate submitted application.', a6.submittedAt, 'Divya Menon');
  addActivity(a6.id, 'offer', 'Offer Approved by HR', 'HR approved the offer.', '2026-07-29T15:00:00', 'Arjun Mehta');
  addActivity(a6.id, 'offer', 'Offer Issued', 'Offer issued to the candidate.', '2026-07-30T09:00:00', 'Arjun Mehta');

  // 7. Onboarded employee
  const a7 = baseApplication({
    seq: 124,
    jobId: 'JOB-1034',
    status: APP_STATUS.EMPLOYEE,
    submittedAt: '2026-06-10T08:30:00',
    first: 'Karan',
    last: 'Bhatia',
    email: 'karan.bhatia@example.com',
    mobile: '+91 98555 33410',
    skills: ['Requirements Analysis', 'UML', 'SQL'],
    totalExp: 6,
    company: 'ConsultEdge',
    title: 'Business Analyst',
  });
  applications.push(a7);
  documents = documents.concat(
    docsFor(
      a7.id,
      Object.fromEntries(
        REQUIRED_DOCUMENTS.map((d) => [
          d.key,
          { status: DOC_STATUS.VERIFIED, fileName: `${d.key}.pdf`, uploadedAt: '2026-06-18T09:00:00', verifiedAt: '2026-06-19T10:00:00' },
        ])
      )
    )
  );
  offers.push({
    id: makeOfferId(43),
    applicationId: a7.id,
    candidateName: 'Karan Bhatia',
    jobTitle: 'Business Analyst',
    department: 'Enterprise Solutions',
    location: 'Chennai, India',
    joiningDate: '2026-07-15',
    employmentType: 'Full-time',
    compensation: '2100000',
    benefits: 'Health insurance, Hybrid work',
    reportingManager: 'Ramesh Pillai',
    probationPeriod: '6 months',
    status: OFFER_STATUS.ACCEPTED,
    returnReason: null,
    createdAt: '2026-06-20T11:00:00',
    issuedAt: '2026-06-22T09:00:00',
    decisionAt: '2026-06-24T12:00:00',
  });
  employees.push({
    id: makeEmployeeId(124),
    applicationId: a7.id,
    name: 'Karan Bhatia',
    position: 'Business Analyst',
    department: 'Enterprise Solutions',
    joiningDate: '2026-07-15',
    createdAt: '2026-07-15T09:30:00',
  });
  addActivity(a7.id, 'application', 'Application Submitted', 'Candidate submitted application.', a7.submittedAt, 'Karan Bhatia');
  addActivity(a7.id, 'offer', 'Offer Accepted', 'Candidate accepted the offer.', '2026-06-24T12:00:00', 'Karan Bhatia');
  addActivity(a7.id, 'onboarding', 'Joining Completed', 'HR marked joining as completed.', '2026-07-15T09:30:00', 'Arjun Mehta');
  addActivity(a7.id, 'onboarding', 'Employee Created', 'Employee record EMP-2026-00124 created.', '2026-07-15T09:31:00', 'System');

  // 8. Offer accepted, joining pending
  const a8 = baseApplication({
    seq: 125,
    jobId: 'JOB-1031',
    status: APP_STATUS.JOINING_PENDING,
    submittedAt: '2026-07-05T09:00:00',
    first: 'Neha',
    last: 'Reddy',
    email: 'neha.reddy@example.com',
    mobile: '+91 98666 22110',
    skills: ['AWS', 'Terraform', 'Kubernetes', 'CI/CD'],
    totalExp: 6,
    company: 'CloudScale',
    title: 'DevOps Engineer',
  });
  applications.push(a8);
  documents = documents.concat(
    docsFor(
      a8.id,
      Object.fromEntries(
        REQUIRED_DOCUMENTS.map((d, i) => [
          d.key,
          i < 4
            ? { status: DOC_STATUS.VERIFIED, fileName: `${d.key}.pdf`, uploadedAt: '2026-07-20T09:00:00', verifiedAt: '2026-07-21T10:00:00' }
            : { status: DOC_STATUS.UPLOADED, fileName: `${d.key}.pdf`, uploadedAt: '2026-07-22T09:00:00' },
        ])
      )
    )
  );
  offers.push({
    id: makeOfferId(44),
    applicationId: a8.id,
    candidateName: 'Neha Reddy',
    jobTitle: 'DevOps Engineer',
    department: 'Platform',
    location: 'Bengaluru, India',
    joiningDate: '2026-09-15',
    employmentType: 'Full-time',
    compensation: '2800000',
    benefits: 'Health insurance, On-call compensation, Hybrid work',
    reportingManager: 'Nikhil Verma',
    probationPeriod: '6 months',
    status: OFFER_STATUS.ACCEPTED,
    returnReason: null,
    createdAt: '2026-08-01T11:00:00',
    issuedAt: '2026-08-03T09:00:00',
    decisionAt: '2026-08-06T14:00:00',
  });
  addActivity(a8.id, 'application', 'Application Submitted', 'Candidate submitted application.', a8.submittedAt, 'Neha Reddy');
  addActivity(a8.id, 'offer', 'Offer Accepted', 'Candidate accepted the offer.', '2026-08-06T14:00:00', 'Neha Reddy');

  // Fill out the pipeline with synthetic candidates.
  const extra = buildSyntheticCandidates(200);
  applications.push(...extra.applications);
  documents = documents.concat(extra.documents);
  interviews.push(...extra.interviews);
  offers.push(...extra.offers);
  employees.push(...extra.employees);
  extra.activities.forEach((a) => activities.push(a));

  activities.sort((x, y) => new Date(y.at) - new Date(x.at));

  const notifications = [
    { id: uid('ntf'), role: 'ta', title: 'New application received', body: 'Meera Krishnan applied for Senior Frontend Engineer.', at: a1.submittedAt, read: false },
    { id: uid('ntf'), role: 'ta', title: 'Interview coming up', body: 'Technical Interview with Rahul Sharma on 04 Sep 2026.', at: '2026-08-26T10:00:00', read: false },
    { id: uid('ntf'), role: 'hr', title: 'Offer awaiting approval', body: 'Offer for Sameer Khan is pending your approval.', at: '2026-08-08T11:00:00', read: false },
    { id: uid('ntf'), role: 'candidate', title: 'You have an offer', body: 'Divya, your offer for QA Automation Engineer has been issued.', at: '2026-07-30T09:00:00', read: false },
  ];

  return {
    applications,
    interviews,
    documents,
    offers,
    employees,
    activities,
    notifications,
    jobs: [],
    counters: { candidate: 320, application: 1120, employee: 260, offer: 200, job: 1035 },
    // The candidate portal follows one application; default to a mid-journey
    // seeded candidate so "My Application" has something to show on first load.
    // A real submission via the apply form overwrites this.
    myApplicationId: a4.id,
  };
}
