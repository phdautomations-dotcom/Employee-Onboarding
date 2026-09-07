import { createContext, useCallback, useContext, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage.js';
import { buildSeed } from '../data/seed.js';
import { JOBS, findJob } from '../data/jobs.js';
import {
  APP_STATUS,
  ROUND_STATUS,
  DOC_STATUS,
  OFFER_STATUS,
  REQUIRED_DOCUMENTS,
} from '../constants/statuses.js';
import { ROLES } from '../constants/roles.js';
import {
  makeCandidateId,
  makeApplicationId,
  makeEmployeeId,
  makeOfferId,
  uid,
} from '../utils/ids.js';

const DATA_KEY = 'talentflow.data.v7';
const ROLE_KEY = 'talentflow.role.v3';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [data, setData] = useLocalStorage(DATA_KEY, () => buildSeed());
  const [role, setRole] = useLocalStorage(ROLE_KEY, null);

  const state = typeof data === 'function' ? buildSeed() : data;

  /* ---------- internal helpers ---------- */
  const mutate = useCallback(
    (fn) =>
      setData((prev) => {
        const draft = structuredCloneSafe(prev);
        fn(draft);
        return draft;
      }),
    [setData]
  );

  const logActivity = (draft, applicationId, type, title, description, actor = 'System') => {
    draft.activities.unshift({
      id: uid('act'),
      applicationId,
      type,
      title,
      description,
      actor,
      at: new Date().toISOString(),
    });
  };

  const notify = (draft, roleTarget, title, body) => {
    draft.notifications.unshift({
      id: uid('ntf'),
      role: roleTarget,
      title,
      body,
      at: new Date().toISOString(),
      read: false,
    });
  };

  const allRequiredDocsVerified = (draft, applicationId) => {
    const docs = draft.documents.filter((d) => d.applicationId === applicationId && d.required);
    return docs.length > 0 && docs.every((d) => d.status === DOC_STATUS.VERIFIED);
  };

  /* ---------- candidate: submit application ---------- */
  const submitApplication = useCallback(
    (form) => {
      const candidateSeq = (state.counters?.candidate || 0) + 1;
      const applicationSeq = (state.counters?.application || 0) + 1;
      const candidateId = makeCandidateId(candidateSeq);
      const applicationId = makeApplicationId(applicationSeq);
      mutate((draft) => {
        draft.counters.candidate = candidateSeq;
        draft.counters.application = applicationSeq;
        const job = form.jobId ? (draft.jobs || []).find((j) => j.id === form.jobId) || findJob(form.jobId) : null;

        const application = {
          id: applicationId,
          candidateId,
          jobId: form.jobId || null,
          jobTitle: job ? job.title : 'General Application',
          isGeneral: !form.jobId,
          source: form.source || 'Direct',
          status: APP_STATUS.SUBMITTED,
          submittedAt: new Date().toISOString(),
          assignedTo: 'Priya Nair',
          autofilled: form.autofilled || [],
          returnReason: null,
          rejectReason: null,
          personal: form.personal,
          professional: form.professional,
          education: form.education,
          additional: form.additional,
          resume: form.resume,
        };
        draft.applications.unshift(application);
        draft.myApplicationId = applicationId;

        REQUIRED_DOCUMENTS.forEach((d) => {
          draft.documents.push({
            id: uid('doc'),
            applicationId,
            key: d.key,
            label: d.label,
            required: d.required,
            category: d.category,
            status: DOC_STATUS.PENDING,
            fileName: null,
            uploadedAt: null,
            verifiedAt: null,
            rejectionReason: null,
          });
        });

        logActivity(
          draft,
          applicationId,
          'application',
          'Application Submitted',
          `Candidate applied for ${application.jobTitle}.`,
          `${form.personal.firstName} ${form.personal.lastName}`
        );
        notify(
          draft,
          ROLES.TA,
          'New application received',
          `${form.personal.firstName} ${form.personal.lastName} applied for ${application.jobTitle}.`
        );
      });
      return { candidateId, applicationId };
    },
    [mutate, state.counters]
  );

  const updateApplication = useCallback(
    (applicationId, patch) => {
      mutate((draft) => {
        const app = draft.applications.find((a) => a.id === applicationId);
        if (!app) return;
        Object.assign(app, patch);
      });
    },
    [mutate]
  );

  const resubmitApplication = useCallback(
    (applicationId) => {
      mutate((draft) => {
        const app = draft.applications.find((a) => a.id === applicationId);
        if (!app) return;
        app.status = APP_STATUS.TA_REVIEW;
        app.returnReason = null;
        logActivity(draft, applicationId, 'application', 'Application Resubmitted', 'Candidate resubmitted the application after changes.', 'Candidate');
        notify(draft, ROLES.TA, 'Application resubmitted', `${app.personal.firstName} ${app.personal.lastName} resubmitted their application.`);
      });
    },
    [mutate]
  );

  /* ---------- TA review workflow ---------- */
  const startReview = useCallback(
    (applicationId) => {
      mutate((draft) => {
        const app = draft.applications.find((a) => a.id === applicationId);
        if (!app || app.status !== APP_STATUS.SUBMITTED) return;
        app.status = APP_STATUS.TA_REVIEW;
        logActivity(draft, applicationId, 'review', 'TA Review Started', 'Talent Acquisition began reviewing the application.', 'Priya Nair');
      });
    },
    [mutate]
  );

  const approveApplication = useCallback(
    (applicationId) => {
      mutate((draft) => {
        const app = draft.applications.find((a) => a.id === applicationId);
        if (!app) return;
        app.status = APP_STATUS.INTERVIEW_PLANNING;
        logActivity(draft, applicationId, 'approve', 'Application Approved', 'TA approved the candidate and moved them to Interview Planning.', 'Priya Nair');
        notify(draft, ROLES.CANDIDATE, 'Application approved', `Your application for ${app.jobTitle} was approved. Interview scheduling is next.`);
      });
    },
    [mutate]
  );

  const returnApplication = useCallback(
    (applicationId, reason) => {
      mutate((draft) => {
        const app = draft.applications.find((a) => a.id === applicationId);
        if (!app) return;
        app.status = APP_STATUS.RETURNED;
        app.returnReason = reason;
        logActivity(draft, applicationId, 'return', 'Application Returned', `Returned to candidate: ${reason}`, 'Priya Nair');
        notify(draft, ROLES.CANDIDATE, 'Action needed on your application', reason);
      });
    },
    [mutate]
  );

  const rejectApplication = useCallback(
    (applicationId, reason) => {
      mutate((draft) => {
        const app = draft.applications.find((a) => a.id === applicationId);
        if (!app) return;
        app.status = APP_STATUS.REJECTED;
        app.rejectReason = reason;
        logActivity(draft, applicationId, 'reject', 'Application Rejected', `Rejected: ${reason}`, 'Priya Nair');
        notify(draft, ROLES.CANDIDATE, 'Application update', `Your application for ${app.jobTitle} was not taken forward.`);
      });
    },
    [mutate]
  );

  /* ---------- interviews ---------- */
  const scheduleInterview = useCallback(
    (applicationId, payload) => {
      mutate((draft) => {
        const app = draft.applications.find((a) => a.id === applicationId);
        if (!app) return;
        const existing = draft.interviews.filter((i) => i.applicationId === applicationId);
        const round = existing.length + 1;
        draft.interviews.push({
          id: uid('int'),
          applicationId,
          round,
          type: payload.type,
          interviewer: payload.interviewer,
          date: payload.date,
          time: payload.time,
          mode: payload.mode,
          link: payload.link || '',
          location: payload.location || '',
          notes: payload.notes || '',
          status: ROUND_STATUS.SCHEDULED,
          result: null,
          comments: '',
        });
        if (app.status === APP_STATUS.INTERVIEW_PLANNING || app.status === APP_STATUS.INTERVIEW_PASSED) {
          app.status = APP_STATUS.INTERVIEW_IN_PROGRESS;
        }
        logActivity(draft, applicationId, 'interview', `${payload.type} Scheduled`, `Round ${round} scheduled for ${payload.date} at ${payload.time} (${payload.mode}).`, 'Priya Nair');
        notify(draft, ROLES.CANDIDATE, 'Interview scheduled', `${payload.type} (Round ${round}) on ${payload.date} at ${payload.time}.`);
      });
    },
    [mutate]
  );

  const recordInterviewResult = useCallback(
    (interviewId, { result, comments }) => {
      mutate((draft) => {
        const iv = draft.interviews.find((i) => i.id === interviewId);
        if (!iv) return;
        iv.result = result;
        iv.comments = comments;
        iv.status = result; // PASS | FAIL | HOLD
        const app = draft.applications.find((a) => a.id === iv.applicationId);
        if (!app) return;

        if (result === ROUND_STATUS.FAIL) {
          app.status = APP_STATUS.INTERVIEW_FAILED;
          logActivity(draft, app.id, 'interview', `${iv.type} — Failed`, `Round ${iv.round} result recorded: Fail.`, 'Priya Nair');
          notify(draft, ROLES.CANDIDATE, 'Interview update', `Unfortunately you did not clear the ${iv.type}.`);
          return;
        }
        if (result === ROUND_STATUS.HOLD) {
          logActivity(draft, app.id, 'interview', `${iv.type} — On Hold`, `Round ${iv.round} result recorded: Hold.`, 'Priya Nair');
          return;
        }
        // PASS
        logActivity(draft, app.id, 'interview', `${iv.type} — Passed`, `Round ${iv.round} result recorded: Pass.`, 'Priya Nair');
        const rounds = draft.interviews.filter((i) => i.applicationId === app.id);
        const pending = rounds.some((r) => r.status === ROUND_STATUS.SCHEDULED || r.status === ROUND_STATUS.COMPLETED);
        if (!pending) {
          app.status = APP_STATUS.INTERVIEW_PASSED;
          logActivity(draft, app.id, 'interview', 'All Scheduled Rounds Passed', 'Add another round or move the candidate to document verification.', 'Priya Nair');
        }
      });
    },
    [mutate]
  );

  const advanceToDocuments = useCallback(
    (applicationId) => {
      mutate((draft) => {
        const app = draft.applications.find((a) => a.id === applicationId);
        if (!app || app.status !== APP_STATUS.INTERVIEW_PASSED) return;
        app.status = APP_STATUS.DOC_VERIFICATION;
        logActivity(draft, applicationId, 'documents', 'Moved to Document Verification', 'All required interview rounds passed.', 'Priya Nair');
        notify(draft, ROLES.CANDIDATE, 'Interviews cleared', 'Please upload your verification documents.');
      });
    },
    [mutate]
  );

  /* ---------- documents ---------- */
  const uploadDocument = useCallback(
    (documentId, fileMeta) => {
      mutate((draft) => {
        const doc = draft.documents.find((d) => d.id === documentId);
        if (!doc) return;
        doc.status = DOC_STATUS.UPLOADED;
        doc.fileName = fileMeta.name;
        doc.uploadedAt = new Date().toISOString();
        doc.rejectionReason = null;
        doc.verifiedAt = null;
        logActivity(draft, doc.applicationId, 'documents', 'Document Uploaded', `${doc.label} uploaded and is under verification.`, 'Candidate');
        notify(draft, ROLES.TA, 'Document uploaded', `${doc.label} uploaded for verification.`);
      });
    },
    [mutate]
  );

  const verifyDocument = useCallback(
    (documentId) => {
      mutate((draft) => {
        const doc = draft.documents.find((d) => d.id === documentId);
        if (!doc) return;
        doc.status = DOC_STATUS.VERIFIED;
        doc.verifiedAt = new Date().toISOString();
        doc.rejectionReason = null;
        logActivity(draft, doc.applicationId, 'documents', 'Document Verified', `${doc.label} verified.`, 'Priya Nair');
        if (allRequiredDocsVerified(draft, doc.applicationId)) {
          const app = draft.applications.find((a) => a.id === doc.applicationId);
          if (app && app.status === APP_STATUS.DOC_VERIFICATION) {
            app.status = APP_STATUS.DOCS_VERIFIED;
            logActivity(draft, app.id, 'documents', 'All Documents Verified', 'All mandatory documents verified. Offer preparation is now available.', 'Priya Nair');
            notify(draft, ROLES.TA, 'Documents verified', `All documents verified for ${app.personal.firstName} ${app.personal.lastName}. Prepare offer.`);
          }
        }
      });
    },
    [mutate]
  );

  const rejectDocument = useCallback(
    (documentId, reason) => {
      mutate((draft) => {
        const doc = draft.documents.find((d) => d.id === documentId);
        if (!doc) return;
        doc.status = DOC_STATUS.REJECTED;
        doc.rejectionReason = reason;
        doc.verifiedAt = null;
        logActivity(draft, doc.applicationId, 'documents', 'Document Rejected', `${doc.label} rejected: ${reason}`, 'Priya Nair');
        notify(draft, ROLES.CANDIDATE, 'Document rejected', `${doc.label}: ${reason}`);
      });
    },
    [mutate]
  );

  /* ---------- offers ---------- */
  const saveOffer = useCallback(
    (applicationId, payload, submitForApproval) => {
      mutate((draft) => {
        const app = draft.applications.find((a) => a.id === applicationId);
        if (!app) return;
        let offer = draft.offers.find((o) => o.applicationId === applicationId);
        if (!offer) {
          draft.counters.offer += 1;
          offer = {
            id: makeOfferId(draft.counters.offer),
            applicationId,
            createdAt: new Date().toISOString(),
            issuedAt: null,
            decisionAt: null,
            returnReason: null,
          };
          draft.offers.push(offer);
        }
        Object.assign(offer, payload);
        if (submitForApproval) {
          offer.status = OFFER_STATUS.PENDING_APPROVAL;
          offer.returnReason = null;
          app.status = APP_STATUS.OFFER_PENDING_HR;
          logActivity(draft, applicationId, 'offer', 'Offer Submitted for HR Approval', 'TA prepared and submitted the offer.', 'Priya Nair');
          notify(draft, ROLES.HR, 'Offer awaiting approval', `Offer for ${offer.candidateName} is pending your approval.`);
        } else {
          offer.status = OFFER_STATUS.DRAFT;
          app.status = APP_STATUS.OFFER_DRAFT;
          logActivity(draft, applicationId, 'offer', 'Offer Draft Saved', 'TA saved a draft of the offer.', 'Priya Nair');
        }
      });
    },
    [mutate]
  );

  const approveOffer = useCallback(
    (offerId) => {
      mutate((draft) => {
        const offer = draft.offers.find((o) => o.id === offerId);
        if (!offer) return;
        offer.status = OFFER_STATUS.ISSUED;
        offer.issuedAt = new Date().toISOString();
        const app = draft.applications.find((a) => a.id === offer.applicationId);
        if (app) app.status = APP_STATUS.OFFER_ISSUED;
        logActivity(draft, offer.applicationId, 'offer', 'Offer Approved by HR', 'HR approved the offer and it was issued to the candidate.', 'Arjun Mehta');
        notify(draft, ROLES.CANDIDATE, 'You have an offer', `Your offer for ${offer.jobTitle} has been issued.`);
      });
    },
    [mutate]
  );

  const returnOffer = useCallback(
    (offerId, reason) => {
      mutate((draft) => {
        const offer = draft.offers.find((o) => o.id === offerId);
        if (!offer) return;
        offer.status = OFFER_STATUS.RETURNED;
        offer.returnReason = reason;
        const app = draft.applications.find((a) => a.id === offer.applicationId);
        if (app) app.status = APP_STATUS.OFFER_DRAFT;
        logActivity(draft, offer.applicationId, 'offer', 'Offer Returned for Correction', reason, 'Arjun Mehta');
        notify(draft, ROLES.TA, 'Offer returned', `HR returned the offer for ${offer.candidateName}: ${reason}`);
      });
    },
    [mutate]
  );

  const acceptOffer = useCallback(
    (offerId) => {
      mutate((draft) => {
        const offer = draft.offers.find((o) => o.id === offerId);
        if (!offer) return;
        offer.status = OFFER_STATUS.ACCEPTED;
        offer.decisionAt = new Date().toISOString();
        const app = draft.applications.find((a) => a.id === offer.applicationId);
        if (app) app.status = APP_STATUS.JOINING_PENDING;
        logActivity(draft, offer.applicationId, 'offer', 'Offer Accepted', 'Candidate accepted the offer.', 'Candidate');
        notify(draft, ROLES.HR, 'Offer accepted', `${offer.candidateName} accepted the offer. Joining is pending.`);
      });
    },
    [mutate]
  );

  const declineOffer = useCallback(
    (offerId) => {
      mutate((draft) => {
        const offer = draft.offers.find((o) => o.id === offerId);
        if (!offer) return;
        offer.status = OFFER_STATUS.DECLINED;
        offer.decisionAt = new Date().toISOString();
        const app = draft.applications.find((a) => a.id === offer.applicationId);
        if (app) app.status = APP_STATUS.OFFER_DECLINED;
        logActivity(draft, offer.applicationId, 'offer', 'Offer Declined', 'Candidate declined the offer.', 'Candidate');
        notify(draft, ROLES.HR, 'Offer declined', `${offer.candidateName} declined the offer.`);
      });
    },
    [mutate]
  );

  const completeJoining = useCallback(
    (applicationId) => {
      const employeeId = makeEmployeeId((state.counters?.employee || 0) + 1);
      mutate((draft) => {
        const app = draft.applications.find((a) => a.id === applicationId);
        if (!app) return;
        app.status = APP_STATUS.EMPLOYEE;
        draft.counters.employee += 1;
        const offer = draft.offers.find((o) => o.applicationId === applicationId);
        draft.employees.push({
          id: employeeId,
          applicationId,
          name: `${app.personal.firstName} ${app.personal.lastName}`,
          position: app.jobTitle,
          department: offer?.department || '—',
          joiningDate: offer?.joiningDate || null,
          createdAt: new Date().toISOString(),
        });
        logActivity(draft, applicationId, 'onboarding', 'Joining Completed', 'HR marked joining as completed.', 'Arjun Mehta');
        logActivity(draft, applicationId, 'onboarding', 'Employee Created', `Employee record ${employeeId} created.`, 'System');
        notify(draft, ROLES.CANDIDATE, 'Welcome aboard', `Your employee ID is ${employeeId}.`);
      });
      return employeeId;
    },
    [mutate, state.counters]
  );

  const markNotificationsRead = useCallback(
    (roleTarget) => {
      mutate((draft) => {
        draft.notifications.forEach((n) => {
          if (n.role === roleTarget) n.read = true;
        });
      });
    },
    [mutate]
  );

  const createJob = useCallback(
    (payload) => {
      const jobSeq = (state.counters?.job || 1000) + 1;
      const job = {
        id: `JOB-${jobSeq}`,
        title: payload.title,
        department: payload.department,
        location: payload.location,
        workMode: payload.workMode,
        employmentType: payload.employmentType,
        experience: payload.experience,
        deadline: payload.deadline,
        description: payload.description,
        responsibilities: payload.responsibilities || [],
        requiredSkills: payload.requiredSkills || [],
        qualifications: payload.qualifications || [],
        preferredSkills: payload.preferredSkills || [],
        benefits: payload.benefits || [],
        custom: true,
      };
      mutate((draft) => {
        draft.counters.job = jobSeq;
        if (!draft.jobs) draft.jobs = [];
        draft.jobs.unshift({ ...job });
        draft.activities.unshift({
          id: uid('act'),
          applicationId: null,
          type: 'application',
          title: 'Job Created',
          description: `${job.title} (${job.id}) opened in ${job.department}.`,
          actor: 'Priya Nair',
          at: new Date().toISOString(),
        });
      });
      return job;
    },
    [mutate, state.counters]
  );

  const resetDemo = useCallback(() => {
    setData(buildSeed());
  }, [setData]);

  /* ---------- selectors ---------- */
  const selectors = useMemo(() => {
    const apps = state.applications || [];
    const allJobs = [...(state.jobs || []), ...JOBS];
    return {
      jobs: allJobs,
      getJob: (id) => allJobs.find((j) => j.id === id) || null,
      getApplication: (id) => apps.find((a) => a.id === id) || null,
      getApplicationByCandidate: (candidateId) => apps.find((a) => a.candidateId === candidateId) || null,
      interviewsFor: (appId) =>
        (state.interviews || []).filter((i) => i.applicationId === appId).sort((a, b) => a.round - b.round),
      documentsFor: (appId) => (state.documents || []).filter((d) => d.applicationId === appId),
      offerFor: (appId) => (state.offers || []).find((o) => o.applicationId === appId) || null,
      offerById: (offerId) => (state.offers || []).find((o) => o.id === offerId) || null,
      employeeFor: (appId) => (state.employees || []).find((e) => e.applicationId === appId) || null,
      activitiesFor: (appId) => (state.activities || []).filter((a) => a.applicationId === appId),
      notificationsFor: (roleTarget) => (state.notifications || []).filter((n) => n.role === roleTarget),
    };
  }, [state]);

  const value = useMemo(
    () => ({
      role,
      setRole,
      data: state,
      ...selectors,
      submitApplication,
      updateApplication,
      resubmitApplication,
      startReview,
      approveApplication,
      returnApplication,
      rejectApplication,
      scheduleInterview,
      recordInterviewResult,
      advanceToDocuments,
      uploadDocument,
      verifyDocument,
      rejectDocument,
      saveOffer,
      approveOffer,
      returnOffer,
      acceptOffer,
      declineOffer,
      completeJoining,
      createJob,
      markNotificationsRead,
      resetDemo,
    }),
    [
      role,
      setRole,
      state,
      selectors,
      createJob,
      submitApplication,
      updateApplication,
      resubmitApplication,
      startReview,
      approveApplication,
      returnApplication,
      rejectApplication,
      scheduleInterview,
      recordInterviewResult,
      advanceToDocuments,
      uploadDocument,
      verifyDocument,
      rejectDocument,
      saveOffer,
      approveOffer,
      returnOffer,
      acceptOffer,
      declineOffer,
      completeJoining,
      markNotificationsRead,
      resetDemo,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

function structuredCloneSafe(obj) {
  if (typeof structuredClone === 'function') return structuredClone(obj);
  return JSON.parse(JSON.stringify(obj));
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
