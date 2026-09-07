/* ============================================================
   Centralized status system.
   Every status has: label, tone (badge variant), icon (lucide name).
   ============================================================ */

export const APP_STATUS = {
  SUBMITTED: 'SUBMITTED',
  TA_REVIEW: 'TA_REVIEW',
  RETURNED: 'RETURNED',
  REJECTED: 'REJECTED',
  INTERVIEW_PLANNING: 'INTERVIEW_PLANNING',
  INTERVIEW_IN_PROGRESS: 'INTERVIEW_IN_PROGRESS',
  INTERVIEW_PASSED: 'INTERVIEW_PASSED',
  INTERVIEW_FAILED: 'INTERVIEW_FAILED',
  DOC_VERIFICATION: 'DOC_VERIFICATION',
  DOCS_VERIFIED: 'DOCS_VERIFIED',
  OFFER_DRAFT: 'OFFER_DRAFT',
  OFFER_PENDING_HR: 'OFFER_PENDING_HR',
  OFFER_ISSUED: 'OFFER_ISSUED',
  OFFER_ACCEPTED: 'OFFER_ACCEPTED',
  OFFER_DECLINED: 'OFFER_DECLINED',
  JOINING_PENDING: 'JOINING_PENDING',
  EMPLOYEE: 'EMPLOYEE',
};

export const STATUS_META = {
  [APP_STATUS.SUBMITTED]: { label: 'Application Submitted', tone: 'info', icon: 'FileText' },
  [APP_STATUS.TA_REVIEW]: { label: 'Under TA Review', tone: 'warning', icon: 'Eye' },
  [APP_STATUS.RETURNED]: { label: 'Returned to Candidate', tone: 'warning', icon: 'RotateCcw' },
  [APP_STATUS.REJECTED]: { label: 'Rejected', tone: 'error', icon: 'XCircle' },
  [APP_STATUS.INTERVIEW_PLANNING]: { label: 'Interview Planning', tone: 'info', icon: 'CalendarDays' },
  [APP_STATUS.INTERVIEW_IN_PROGRESS]: { label: 'Interview In Progress', tone: 'info', icon: 'CalendarDays' },
  [APP_STATUS.INTERVIEW_PASSED]: { label: 'Interviews Passed', tone: 'success', icon: 'CheckCircle2' },
  [APP_STATUS.INTERVIEW_FAILED]: { label: 'Interview Failed', tone: 'error', icon: 'XCircle' },
  [APP_STATUS.DOC_VERIFICATION]: { label: 'Document Verification', tone: 'warning', icon: 'Files' },
  [APP_STATUS.DOCS_VERIFIED]: { label: 'Documents Verified', tone: 'success', icon: 'CheckCircle2' },
  [APP_STATUS.OFFER_DRAFT]: { label: 'Offer Draft', tone: 'neutral', icon: 'FileCheck' },
  [APP_STATUS.OFFER_PENDING_HR]: { label: 'Offer Pending HR Approval', tone: 'warning', icon: 'FileCheck' },
  [APP_STATUS.OFFER_ISSUED]: { label: 'Offer Issued', tone: 'info', icon: 'FileCheck' },
  [APP_STATUS.OFFER_ACCEPTED]: { label: 'Offer Accepted', tone: 'success', icon: 'CheckCircle2' },
  [APP_STATUS.OFFER_DECLINED]: { label: 'Offer Declined', tone: 'error', icon: 'XCircle' },
  [APP_STATUS.JOINING_PENDING]: { label: 'Joining Pending', tone: 'warning', icon: 'Clock3' },
  [APP_STATUS.EMPLOYEE]: { label: 'Employee', tone: 'success', icon: 'UserRoundCheck' },
};

export function statusMeta(status) {
  return STATUS_META[status] || { label: status || 'Unknown', tone: 'neutral', icon: 'CircleDot' };
}

/* Ordered pipeline stages for candidate tracker */
export const PIPELINE_STAGES = [
  { key: 'application', label: 'Application Submitted', statuses: [APP_STATUS.SUBMITTED, APP_STATUS.RETURNED] },
  { key: 'ta_review', label: 'TA Review', statuses: [APP_STATUS.TA_REVIEW] },
  {
    key: 'interview',
    label: 'Interview',
    statuses: [APP_STATUS.INTERVIEW_PLANNING, APP_STATUS.INTERVIEW_IN_PROGRESS, APP_STATUS.INTERVIEW_PASSED, APP_STATUS.INTERVIEW_FAILED],
  },
  {
    key: 'documents',
    label: 'Document Verification',
    statuses: [APP_STATUS.DOC_VERIFICATION, APP_STATUS.DOCS_VERIFIED],
  },
  {
    key: 'offer',
    label: 'Offer',
    statuses: [APP_STATUS.OFFER_DRAFT, APP_STATUS.OFFER_PENDING_HR, APP_STATUS.OFFER_ISSUED, APP_STATUS.OFFER_ACCEPTED, APP_STATUS.OFFER_DECLINED],
  },
  { key: 'onboarding', label: 'HR Onboarding', statuses: [APP_STATUS.JOINING_PENDING, APP_STATUS.EMPLOYEE] },
];

const STAGE_ORDER = [
  APP_STATUS.SUBMITTED,
  APP_STATUS.RETURNED,
  APP_STATUS.TA_REVIEW,
  APP_STATUS.INTERVIEW_PLANNING,
  APP_STATUS.INTERVIEW_IN_PROGRESS,
  APP_STATUS.INTERVIEW_FAILED,
  APP_STATUS.INTERVIEW_PASSED,
  APP_STATUS.DOC_VERIFICATION,
  APP_STATUS.DOCS_VERIFIED,
  APP_STATUS.OFFER_DRAFT,
  APP_STATUS.OFFER_PENDING_HR,
  APP_STATUS.OFFER_ISSUED,
  APP_STATUS.OFFER_ACCEPTED,
  APP_STATUS.OFFER_DECLINED,
  APP_STATUS.JOINING_PENDING,
  APP_STATUS.EMPLOYEE,
];

export function stageIndexForStatus(status) {
  if (status === APP_STATUS.REJECTED) return -1;
  const idx = STAGE_ORDER.indexOf(status);
  if (idx < 0) return 0;
  // map to PIPELINE_STAGES index
  return PIPELINE_STAGES.findIndex((s) => s.statuses.includes(status));
}

/* Short pipeline-stage badge for tables and lists.
   Maps any detailed status to one of a few friendly stage names + a soft colour. */
const STAGE_BADGE_BY_KEY = {
  application: { label: 'Applied', tone: 'blue' },
  ta_review: { label: 'Screening', tone: 'violet' },
  interview: { label: 'Interview', tone: 'amber' },
  documents: { label: 'Documents', tone: 'teal' },
  offer: { label: 'Offer', tone: 'green' },
  onboarding: { label: 'Hired', tone: 'green' },
};

export function stageBadgeForStatus(status) {
  if (status === APP_STATUS.REJECTED || status === APP_STATUS.INTERVIEW_FAILED) {
    return { label: 'Rejected', tone: 'red' };
  }
  const stage = PIPELINE_STAGES[Math.max(0, stageIndexForStatus(status))];
  return STAGE_BADGE_BY_KEY[stage?.key] || { label: 'Applied', tone: 'blue' };
}

/* Interview round status */
export const ROUND_STATUS = {
  SCHEDULED: 'SCHEDULED',
  COMPLETED: 'COMPLETED',
  PASS: 'PASS',
  FAIL: 'FAIL',
  HOLD: 'HOLD',
};
export const ROUND_STATUS_META = {
  SCHEDULED: { label: 'Scheduled', tone: 'info', icon: 'CalendarDays' },
  COMPLETED: { label: 'Completed', tone: 'neutral', icon: 'CircleDot' },
  PASS: { label: 'Passed', tone: 'success', icon: 'CheckCircle2' },
  FAIL: { label: 'Failed', tone: 'error', icon: 'XCircle' },
  HOLD: { label: 'On Hold', tone: 'warning', icon: 'Clock3' },
};

/* Document status */
export const DOC_STATUS = {
  PENDING: 'PENDING',
  UPLOADED: 'UPLOADED',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
};
export const DOC_STATUS_META = {
  PENDING: { label: 'Pending Upload', tone: 'neutral', icon: 'Clock3' },
  UPLOADED: { label: 'Under Verification', tone: 'warning', icon: 'Eye' },
  VERIFIED: { label: 'Verified', tone: 'success', icon: 'CheckCircle2' },
  REJECTED: { label: 'Rejected', tone: 'error', icon: 'XCircle' },
};

/* Offer status */
export const OFFER_STATUS = {
  DRAFT: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  RETURNED: 'RETURNED',
  ISSUED: 'ISSUED',
  ACCEPTED: 'ACCEPTED',
  DECLINED: 'DECLINED',
};
export const OFFER_STATUS_META = {
  DRAFT: { label: 'Draft', tone: 'neutral', icon: 'Pencil' },
  PENDING_APPROVAL: { label: 'Pending HR Approval', tone: 'warning', icon: 'Clock3' },
  RETURNED: { label: 'Returned for Correction', tone: 'warning', icon: 'RotateCcw' },
  ISSUED: { label: 'Issued to Candidate', tone: 'info', icon: 'FileCheck' },
  ACCEPTED: { label: 'Accepted', tone: 'success', icon: 'CheckCircle2' },
  DECLINED: { label: 'Declined', tone: 'error', icon: 'XCircle' },
};

export const REQUIRED_DOCUMENTS = [
  { key: 'gov_id', label: 'Government ID', required: true, category: 'Identity' },
  { key: 'photograph', label: 'Photograph', required: true, category: 'Identity' },
  { key: 'education_cert', label: 'Education Certificate', required: true, category: 'Education' },
  { key: 'experience_cert', label: 'Experience Certificate', required: true, category: 'Employment' },
  { key: 'address_proof', label: 'Address Proof', required: true, category: 'Address' },
];

export const DOC_CATEGORIES = ['Identity', 'Education', 'Employment', 'Address'];

export const INTERVIEW_TYPES = ['HR Interview', 'Technical Interview', 'Managerial Interview', 'Final Interview', 'Other'];
export const INTERVIEW_MODES = ['Online', 'In-Person', 'Phone'];
