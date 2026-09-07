import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DataTable } from '../../components/common/Table.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import SearchBar from '../../components/common/SearchBar.jsx';
import FilterSelect from '../../components/common/FilterSelect.jsx';
import { Modal, ConfirmDialog } from '../../components/common/Modal.jsx';
import { InfoList } from '../../components/common/Card.jsx';
import ReasonModal from '../../components/workflow/ReasonModal.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { OFFER_STATUS, OFFER_STATUS_META } from '../../constants/statuses.js';
import { formatDate, formatCurrencyINR } from '../../utils/format.js';

const COLUMNS = [
  { key: 'candidate', label: 'Candidate' },
  { key: 'job', label: 'Position' },
  { key: 'joiningDate', label: 'Joining Date' },
  { key: 'compensation', label: 'Compensation' },
  { key: 'status', label: 'Status' },
  { key: 'action', label: 'Action' },
];

export default function HROffersPage() {
  const { data, getApplication, approveOffer, returnOffer } = useApp();
  const toast = useToast();
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const statusParam = sp.get('status');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState(statusParam || 'all');
  const [view, setView] = useState(null);

  useEffect(() => {
    if (statusParam) setStatus(statusParam);
  }, [statusParam]);
  const [approving, setApproving] = useState(null);
  const [returning, setReturning] = useState(null);

  const rows = useMemo(
    () =>
      (data.offers || [])
        .map((o) => {
          const app = getApplication(o.applicationId);
          return app ? { ...o, candidate: o.candidateName, candidateId: app.candidateId, job: o.jobTitle } : null;
        })
        .filter(Boolean)
        .filter((r) => {
          const t = q.trim().toLowerCase();
          return (!t || r.candidate.toLowerCase().includes(t) || r.job.toLowerCase().includes(t)) && (status === 'all' || r.status === status);
        }),
    [data.offers, q, status, getApplication]
  );

  return (
    <div className="page-body">
      <h1 className="page-title mb-4">Offers</h1>
      <div className="toolbar">
        <SearchBar value={q} onChange={setQ} placeholder="Search candidate or position" />
        <FilterSelect
          label="Status"
          value={status}
          onChange={setStatus}
          options={Object.entries(OFFER_STATUS_META).map(([value, m]) => ({ value, label: m.label }))}
        />
      </div>
      <DataTable
        columns={COLUMNS}
        rows={rows}
        emptyProps={{ icon: 'FileCheck', title: 'No offers found' }}
        renderRow={(r) => {
          const m = OFFER_STATUS_META[r.status];
          return (
            <tr key={r.id}>
              <td className="strong">{r.candidate}</td>
              <td>{r.job}</td>
              <td>{formatDate(r.joiningDate)}</td>
              <td>{formatCurrencyINR(r.compensation)}</td>
              <td><Badge tone={m.tone} icon={m.icon}>{m.label}</Badge></td>
              <td>
                <div className="row gap-1">
                  <Button size="sm" variant="secondary" icon="Eye" onClick={() => setView(r)}>
                    View
                  </Button>
                  {r.status === OFFER_STATUS.PENDING_APPROVAL && (
                    <>
                      <Button size="sm" variant="success" icon="CheckCircle2" onClick={() => setApproving(r)}>
                        Approve
                      </Button>
                      <Button size="sm" variant="secondary" icon="RotateCcw" onClick={() => setReturning(r)}>
                        Return
                      </Button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          );
        }}
      />

      <Modal
        open={!!view}
        onClose={() => setView(null)}
        title="Offer details"
        size="lg"
        footer={
          view?.status === OFFER_STATUS.PENDING_APPROVAL ? (
            <>
              <Button variant="secondary" icon="RotateCcw" onClick={() => { setReturning(view); setView(null); }}>
                Return for Correction
              </Button>
              <Button variant="success" icon="CheckCircle2" onClick={() => { setApproving(view); setView(null); }}>
                Approve Offer
              </Button>
            </>
          ) : (
            <Button variant="secondary" onClick={() => { navigate(`/hr/candidates/${view.candidateId}`); }}>
              Open candidate
            </Button>
          )
        }
      >
        {view && (
          <div className="offer-letter">
            <h2>Offer of Employment</h2>
            <p>Dear {view.candidateName},</p>
            <p>Position of <strong>{view.jobTitle}</strong>, {view.department} team, {view.location}.</p>
            <InfoList
              items={[
                { label: 'Joining Date', value: formatDate(view.joiningDate) },
                { label: 'Employment Type', value: view.employmentType },
                { label: 'Annual Compensation', value: formatCurrencyINR(view.compensation) },
                { label: 'Reporting Manager', value: view.reportingManager },
                { label: 'Probation Period', value: view.probationPeriod },
                { label: 'Benefits', value: view.benefits },
                { label: 'Status', value: OFFER_STATUS_META[view.status].label },
              ]}
            />
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!approving}
        onClose={() => setApproving(null)}
        title="Approve this offer?"
        message={`The offer for ${approving?.candidateName} will be issued to the candidate immediately.`}
        confirmLabel="Approve & Issue"
        tone="success"
        onConfirm={() => { approveOffer(approving.id); setApproving(null); toast.success('Offer approved and issued.'); }}
      />
      <ReasonModal
        open={!!returning}
        onClose={() => setReturning(null)}
        title="Return Offer for Correction"
        label="What needs to change?"
        confirmLabel="Return Offer"
        tone="secondary"
        onSubmit={(reason) => { returnOffer(returning.id, reason); setReturning(null); toast.success('Offer returned to Talent Acquisition.'); }}
      />
    </div>
  );
}
