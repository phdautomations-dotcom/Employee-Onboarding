import { useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Icon from '../../components/common/Icon.jsx';
import Button from '../../components/common/Button.jsx';
import { Field, Input, Select, Textarea } from '../../components/common/Field.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { simulateResumeParse, ANALYZE_STEPS } from '../../utils/resumeParser.js';
import { loadJSON, saveJSON } from '../../hooks/useLocalStorage.js';
import { uid } from '../../utils/ids.js';

const DRAFT_KEY = 'talentflow.apply.draft.v2';
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRe = /^[+]?[\d\s()-]{8,}$/;
const EXP_OPTIONS = ['Fresher', '0–2 years', '2–5 years', '5–8 years', '8+ years'];
const NOTICE_OPTIONS = ['Immediate', '15 Days', '30 Days', '60 Days', '90 Days'];
const SOURCE_OPTIONS = ['Job Board', 'Referral', 'Social', 'Direct'];

function expBucket(y) {
  const n = Number(y) || 0;
  if (n <= 0) return 'Fresher';
  if (n <= 2) return '0–2 years';
  if (n <= 5) return '2–5 years';
  if (n <= 8) return '5–8 years';
  return '8+ years';
}
function expToNumber(b) {
  return { Fresher: '0', '0–2 years': '1', '2–5 years': '3', '5–8 years': '6', '8+ years': '9' }[b] || '';
}

function blankForm(jobId) {
  return {
    jobId: jobId || null,
    firstName: '', lastName: '', email: '', phone: '', currentLocation: '', experience: '',
    currentCompany: '', currentJobTitle: '', highestQualification: '', noticePeriod: '', expectedSalary: '',
    coverNote: '', portfolio: '', source: '',
    resume: null, skills: [], autofilled: [],
  };
}

const REQUIRED = ['firstName', 'lastName', 'email', 'phone', 'currentLocation', 'experience'];
const LABELS = {
  firstName: 'First name', lastName: 'Last name', email: 'Email', phone: 'Phone number',
  currentLocation: 'Current location', experience: 'Total experience',
};

export default function ApplyPage() {
  const { jobId: paramJobId } = useParams();
  const [sp] = useSearchParams();
  const jobId = paramJobId || sp.get('job') || null;

  const navigate = useNavigate();
  const { submitApplication, getJob } = useApp();
  const toast = useToast();
  const job = jobId ? getJob(jobId) : null;

  const [form, setForm] = useState(() => {
    const d = loadJSON(DRAFT_KEY, null);
    return d && d.jobId === (jobId || null) ? d : blankForm(jobId);
  });
  const [errors, setErrors] = useState({});
  const [analyzeIdx, setAnalyzeIdx] = useState(-1);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef(null);
  const timers = useRef([]);

  const parsing = analyzeIdx > -1 && analyzeIdx < ANALYZE_STEPS.length;
  const parsed = form.autofilled.length > 0;

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const isAuto = (k) => (parsed && form.autofilled.includes(k) ? 'extracted' : undefined);

  const validateField = (k, v) => {
    let msg = '';
    if (REQUIRED.includes(k) && !String(v).trim()) msg = `${LABELS[k]} is required.`;
    else if (k === 'email' && v && !emailRe.test(v)) msg = 'Please enter a valid email address.';
    else if (k === 'phone' && v && !phoneRe.test(v)) msg = 'Please enter a valid phone number.';
    setErrors((e) => ({ ...e, [k]: msg || undefined }));
    return !msg;
  };
  const setAndValidate = (k, v) => {
    set({ [k]: v });
    if (errors[k] !== undefined) validateField(k, v);
  };

  const validateAll = () => {
    const e = {};
    REQUIRED.forEach((k) => {
      if (!String(form[k]).trim()) e[k] = `${LABELS[k]} is required.`;
    });
    if (form.email && !emailRe.test(form.email)) e.email = 'Please enter a valid email address.';
    if (form.phone && !phoneRe.test(form.phone)) e.phone = 'Please enter a valid phone number.';
    if (!form.resume) e.resume = 'Please upload your resume (PDF, DOC or DOCX under 5 MB).';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleFile = (fileList) => {
    const file = fileList?.[0];
    if (!file) return;
    if (!/\.(pdf|docx?|)$/i.test(file.name) || file.size > 5 * 1024 * 1024) {
      setErrors((e) => ({ ...e, resume: 'Please upload a PDF, DOC or DOCX file under 5 MB.' }));
      return;
    }
    const meta = { name: file.name, size: file.size, type: file.type, uploadedAt: new Date().toISOString() };
    setErrors((e) => ({ ...e, resume: undefined }));
    set({ resume: meta });

    timers.current.forEach(clearTimeout);
    timers.current = [];
    setAnalyzeIdx(0);
    ANALYZE_STEPS.forEach((_, i) => timers.current.push(setTimeout(() => setAnalyzeIdx(i + 1), (i + 1) * 380)));
    timers.current.push(
      setTimeout(() => {
        const p = simulateResumeParse(meta.name);
        setForm((f) => ({
          ...f,
          firstName: p.firstName, lastName: p.lastName, email: p.email, phone: p.mobile,
          currentLocation: p.currentLocation, experience: expBucket(p.totalExperience),
          currentCompany: p.currentCompany, currentJobTitle: p.currentJobTitle,
          highestQualification: p.education?.[0]?.qualification || f.highestQualification,
          skills: [...p.skills],
          autofilled: ['firstName', 'lastName', 'email', 'phone', 'currentLocation', 'experience', 'currentCompany', 'currentJobTitle', 'highestQualification'],
        }));
        setErrors({});
        toast.success('Resume details extracted — review each field before submitting.');
      }, ANALYZE_STEPS.length * 380 + 200)
    );
  };

  const removeResume = () => {
    timers.current.forEach(clearTimeout);
    setAnalyzeIdx(-1);
    set({ resume: null, autofilled: [] });
  };

  const saveDraft = () => {
    saveJSON(DRAFT_KEY, form);
    toast.success('Draft saved on this device.');
  };

  const submit = () => {
    if (!validateAll()) {
      toast.error('Please fix the highlighted fields.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      const payload = {
        jobId: form.jobId,
        source: form.source || 'Direct',
        autofilled: form.autofilled,
        personal: {
          firstName: form.firstName, middleName: '', lastName: form.lastName,
          email: form.email, mobile: form.phone, dob: '', gender: '', nationality: '',
          currentLocation: form.currentLocation, preferredLocation: form.currentLocation,
          address: { line1: '', line2: '', city: form.currentLocation, state: '', country: 'India', postalCode: '' },
        },
        professional: {
          currentJobTitle: form.currentJobTitle, currentCompany: form.currentCompany,
          totalExperience: expToNumber(form.experience), relevantExperience: '',
          employmentStatus: form.currentCompany ? 'Employed' : '', currentCTC: '',
          expectedCTC: form.expectedSalary, noticePeriod: form.noticePeriod,
          preferredJobLocation: form.currentLocation,
          skills: form.skills, certifications: [], languages: [],
        },
        education: [{ id: uid('edu'), qualification: form.highestQualification, university: '', specialization: '', year: '', grade: '' }],
        additional: { coverNote: form.coverNote, referral: '', portfolio: form.portfolio },
        resume: form.resume,
      };
      const result = submitApplication(payload);
      saveJSON(DRAFT_KEY, null);
      setSubmitting(false);
      navigate('/candidate/application/success', { state: { ...result, jobTitle: job ? job.title : 'General Application' } });
    }, 900);
  };

  const filledRequired = useMemo(
    () => REQUIRED.filter((k) => String(form[k]).trim()).length + (form.resume ? 1 : 0),
    [form]
  );
  const totalRequired = REQUIRED.length + 1;
  const pct = Math.round((filledRequired / totalRequired) * 100);

  return (
    <div className="cand apply-wrap">
      <Button variant="ghost" icon="ArrowLeft" onClick={() => navigate(job ? `/candidate/jobs/${job.id}` : '/candidate/jobs')}>
        {job ? 'Back to Job' : 'Back to Jobs'}
      </Button>

      <h1 className="page-title mt-3" style={{ fontSize: 26 }}>Apply for this opportunity</h1>
      {job ? (
        <p className="text-secondary mb-5">
          <strong>{job.title}</strong> · {job.department} · {job.location} · {job.employmentType}
        </p>
      ) : (
        <p className="text-secondary mb-5">
          <strong>General Application</strong> — submit your profile and we'll consider you for future roles.
        </p>
      )}

      <div className="apply-grid">
        <div>
          {/* Compact resume upload at the top */}
          <div className="resume-strip" style={{ marginBottom: 'var(--space-4)' }}>
            <span className="resume-strip__icon"><Icon name="UploadCloud" size={18} /></span>
            {!form.resume ? (
              <>
                <div className="grow">
                  <div className="resume-strip__title">Upload Your Resume</div>
                  <div className="resume-strip__sub">We'll use your resume to pre-fill your application details.</div>
                </div>
                <Button variant="secondary" size="sm" icon="Upload" onClick={() => fileRef.current?.click()}>
                  Upload Resume
                </Button>
              </>
            ) : parsing ? (
              <>
                <div className="grow">
                  <div className="resume-strip__title">Analyzing resume…</div>
                  <div className="resume-strip__sub">{ANALYZE_STEPS[Math.min(analyzeIdx, ANALYZE_STEPS.length - 1)]}</div>
                </div>
                <span className="spinner" />
              </>
            ) : (
              <>
                <div className="grow">
                  <div className="resume-strip__title">{form.resume.name}</div>
                  <div className="resume-strip__sub" style={{ color: 'var(--cand-teal)', fontWeight: 600 }}>
                    <Icon name="CheckCircle2" size={12} /> Resume details extracted · {Math.round((form.resume.size || 0) / 1024)} KB
                  </div>
                </div>
                <button className="btn btn--secondary btn--sm" onClick={() => fileRef.current?.click()}>Replace</button>
                <button className="icon-btn" onClick={removeResume} aria-label="Remove resume"><Icon name="X" size={16} /></button>
              </>
            )}
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" hidden onChange={(e) => handleFile(e.target.files)} />
          </div>
          {errors.resume && (
            <span className="field__error" style={{ marginBottom: 'var(--space-4)', display: 'flex' }}>
              <Icon name="AlertCircle" size={12} /> {errors.resume}
            </span>
          )}

          <section className="apply-section">
            <div className="apply-section__head">
              <span className="apply-section__num">1</span>
              <h3 className="section-title">Personal Information</h3>
            </div>
            <div className="form-grid">
              <Field label="First Name" required error={errors.firstName} state={isAuto('firstName')}>
                <Input value={form.firstName} onChange={(e) => setAndValidate('firstName', e.target.value)} onBlur={(e) => validateField('firstName', e.target.value)} error={errors.firstName} />
              </Field>
              <Field label="Last Name" required error={errors.lastName} state={isAuto('lastName')}>
                <Input value={form.lastName} onChange={(e) => setAndValidate('lastName', e.target.value)} onBlur={(e) => validateField('lastName', e.target.value)} error={errors.lastName} />
              </Field>
              <Field label="Email" required error={errors.email} state={isAuto('email')}>
                <Input type="email" value={form.email} onChange={(e) => setAndValidate('email', e.target.value)} onBlur={(e) => validateField('email', e.target.value)} error={errors.email} />
              </Field>
              <Field label="Phone Number" required error={errors.phone} state={isAuto('phone')}>
                <Input value={form.phone} onChange={(e) => setAndValidate('phone', e.target.value)} onBlur={(e) => validateField('phone', e.target.value)} error={errors.phone} />
              </Field>
              <Field label="Current Location" required error={errors.currentLocation} state={isAuto('currentLocation')}>
                <Input value={form.currentLocation} onChange={(e) => setAndValidate('currentLocation', e.target.value)} onBlur={(e) => validateField('currentLocation', e.target.value)} error={errors.currentLocation} />
              </Field>
              <Field label="Total Experience" required error={errors.experience} state={isAuto('experience')}>
                <Select value={form.experience} onChange={(e) => setAndValidate('experience', e.target.value)} placeholder="Select" options={EXP_OPTIONS} error={errors.experience} />
              </Field>
            </div>
          </section>

          <section className="apply-section">
            <div className="apply-section__head">
              <span className="apply-section__num">2</span>
              <h3 className="section-title">Professional Information</h3>
            </div>
            <div className="form-grid">
              <Field label="Current Company" state={isAuto('currentCompany')}>
                <Input value={form.currentCompany} onChange={(e) => set({ currentCompany: e.target.value })} />
              </Field>
              <Field label="Current Job Title" state={isAuto('currentJobTitle')}>
                <Input value={form.currentJobTitle} onChange={(e) => set({ currentJobTitle: e.target.value })} />
              </Field>
              <Field label="Highest Qualification" state={isAuto('highestQualification')}>
                <Input value={form.highestQualification} onChange={(e) => set({ highestQualification: e.target.value })} />
              </Field>
              <Field label="Notice Period">
                <Select value={form.noticePeriod} onChange={(e) => set({ noticePeriod: e.target.value })} placeholder="Select" options={NOTICE_OPTIONS} />
              </Field>
              <Field label="Expected Salary (₹ / year)" hint="Optional" full>
                <Input type="number" value={form.expectedSalary} onChange={(e) => set({ expectedSalary: e.target.value })} />
              </Field>
            </div>
          </section>

          <section className="apply-section">
            <div className="apply-section__head">
              <span className="apply-section__num">3</span>
              <h3 className="section-title">Additional Information</h3>
            </div>
            <Field label="Cover Note" hint="Optional">
              <Textarea rows={3} value={form.coverNote} onChange={(e) => set({ coverNote: e.target.value })} placeholder="Anything you'd like the hiring team to know" />
            </Field>
            <Field label="Portfolio / LinkedIn URL" hint="Optional">
              <Input value={form.portfolio} onChange={(e) => set({ portfolio: e.target.value })} placeholder="https://" />
            </Field>
            <Field label="How did you hear about us?" hint="Optional">
              <Select value={form.source} onChange={(e) => set({ source: e.target.value })} placeholder="Select" options={SOURCE_OPTIONS} />
            </Field>
          </section>

          <div className="apply-section" style={{ marginBottom: 0 }}>
            <div className="row between wrap gap-3">
              <Button variant="secondary" icon="Save" onClick={saveDraft}>Save Draft</Button>
              <Button icon="ArrowRight" onClick={submit} disabled={submitting || parsing}>
                {submitting ? 'Submitting application…' : 'Submit Application'}
              </Button>
            </div>
            <p className="text-xs text-secondary mt-3">By submitting, you confirm that the information provided is accurate.</p>
          </div>
        </div>

        <aside className="apply-summary">
          <div className="apply-summary__head">
            <div className="strong">Application Summary</div>
            <div className="text-xs text-secondary">Estimated time: 2–3 minutes</div>
          </div>
          <div className="apply-summary__body">
            <div className="apply-summary__row"><span className="k">Position</span><span className="v">{job ? job.title : 'General Application'}</span></div>
            <div className="apply-summary__row"><span className="k">Department</span><span className="v">{job ? job.department : '—'}</span></div>
            <div className="apply-summary__row"><span className="k">Location</span><span className="v">{job ? job.location : '—'}</span></div>
            <div className="apply-summary__row"><span className="k">Employment</span><span className="v">{job ? job.employmentType : '—'}</span></div>
            <div className="apply-summary__row"><span className="k">Experience</span><span className="v">{job ? job.experience : '—'}</span></div>

            <div className="mt-4">
              <div className="row between text-xs text-secondary mb-2"><span>Completion</span><span>{filledRequired} / {totalRequired}</span></div>
              <div className="progress"><div className="progress__bar" style={{ width: `${pct}%` }} /></div>
            </div>

            {job && (
              <Button block variant="ghost" className="mt-3" icon="ArrowLeft" onClick={() => navigate(`/candidate/jobs/${job.id}`)}>
                View full job description
              </Button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
