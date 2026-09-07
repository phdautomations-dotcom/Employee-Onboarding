import { useState } from 'react';
import { Modal } from '../common/Modal.jsx';
import Button from '../common/Button.jsx';
import { Field, Input, Select, Textarea } from '../common/Field.jsx';
import { Card, InfoList } from '../common/Card.jsx';
import { formatDate, formatCurrencyINR, todayISO } from '../../utils/format.js';

export default function OfferDrawer({ open, onClose, application, job, existingOffer, onSave }) {
  const [f, setF] = useState(() => ({
    candidateName: existingOffer?.candidateName || `${application.personal.firstName} ${application.personal.lastName}`,
    jobTitle: existingOffer?.jobTitle || application.jobTitle,
    department: existingOffer?.department || job?.department || '',
    location: existingOffer?.location || job?.location || '',
    joiningDate: existingOffer?.joiningDate || todayISO(),
    employmentType: existingOffer?.employmentType || job?.employmentType || 'Full-time',
    compensation: existingOffer?.compensation || application.professional.expectedCTC || '',
    benefits: existingOffer?.benefits || (job?.benefits || []).join(', '),
    reportingManager: existingOffer?.reportingManager || '',
    probationPeriod: existingOffer?.probationPeriod || '6 months',
  }));
  const [preview, setPreview] = useState(false);
  const [errors, setErrors] = useState({});
  const set = (patch) => setF((prev) => ({ ...prev, ...patch }));

  const validate = () => {
    const e = {};
    if (!f.joiningDate) e.joiningDate = 'Joining date is required.';
    if (!f.compensation) e.compensation = 'Compensation is required.';
    if (!f.reportingManager.trim()) e.reportingManager = 'Reporting manager is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = (submitForApproval) => {
    if (!validate()) return;
    onSave(f, submitForApproval);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={existingOffer ? 'Edit Offer' : 'Prepare Offer'}
      footer={
        <>
          <Button variant="secondary" onClick={() => save(false)}>
            Save Draft
          </Button>
          <Button icon="Send" onClick={() => save(true)}>
            Submit for HR Approval
          </Button>
        </>
      }
    >
      {existingOffer?.returnReason && (
        <div className="alert alert--warning mb-4">
          <span className="alert__icon" />
          <div>
            <div className="strong">Returned by HR</div>
            <div>{existingOffer.returnReason}</div>
          </div>
        </div>
      )}

      <div className="form-grid">
        <Field label="Candidate Name">
          <Input value={f.candidateName} disabled />
        </Field>
        <Field label="Job Title">
          <Input value={f.jobTitle} onChange={(e) => set({ jobTitle: e.target.value })} />
        </Field>
        <Field label="Department">
          <Input value={f.department} onChange={(e) => set({ department: e.target.value })} />
        </Field>
        <Field label="Location">
          <Input value={f.location} onChange={(e) => set({ location: e.target.value })} />
        </Field>
        <Field label="Joining Date" required error={errors.joiningDate}>
          <Input type="date" value={f.joiningDate} onChange={(e) => set({ joiningDate: e.target.value })} error={errors.joiningDate} />
        </Field>
        <Field label="Employment Type">
          <Select value={f.employmentType} onChange={(e) => set({ employmentType: e.target.value })} options={['Full-time', 'Contract', 'Internship']} />
        </Field>
        <Field label="Annual Compensation (₹)" required error={errors.compensation}>
          <Input type="number" value={f.compensation} onChange={(e) => set({ compensation: e.target.value })} error={errors.compensation} />
        </Field>
        <Field label="Probation Period">
          <Input value={f.probationPeriod} onChange={(e) => set({ probationPeriod: e.target.value })} />
        </Field>
        <Field label="Reporting Manager" required error={errors.reportingManager} full>
          <Input value={f.reportingManager} onChange={(e) => set({ reportingManager: e.target.value })} error={errors.reportingManager} />
        </Field>
        <Field label="Benefits" full>
          <Textarea rows={3} value={f.benefits} onChange={(e) => set({ benefits: e.target.value })} />
        </Field>
      </div>

      <Button variant="ghost" icon={preview ? 'EyeOff' : 'Eye'} onClick={() => setPreview((p) => !p)}>
        {preview ? 'Hide preview' : 'Preview Offer'}
      </Button>

      {preview && (
        <Card className="mt-4">
          <div className="offer-letter">
            <h2>Offer of Employment</h2>
            <p>Dear {f.candidateName},</p>
            <p>
              We are pleased to offer you the position of <strong>{f.jobTitle}</strong> in the {f.department} team, based in{' '}
              {f.location}.
            </p>
            <InfoList
              items={[
                { label: 'Joining Date', value: formatDate(f.joiningDate) },
                { label: 'Employment Type', value: f.employmentType },
                { label: 'Annual Compensation', value: formatCurrencyINR(f.compensation) },
                { label: 'Reporting Manager', value: f.reportingManager },
                { label: 'Probation Period', value: f.probationPeriod },
                { label: 'Benefits', value: f.benefits },
              ]}
            />
          </div>
        </Card>
      )}
    </Modal>
  );
}
