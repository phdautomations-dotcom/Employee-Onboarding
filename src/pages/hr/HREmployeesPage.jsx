import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../../components/common/Table.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import Avatar, { Identity } from '../../components/common/Avatar.jsx';
import Metric from '../../components/common/Metric.jsx';
import Button from '../../components/common/Button.jsx';
import SearchBar from '../../components/common/SearchBar.jsx';
import { Card, InfoList } from '../../components/common/Card.jsx';
import { EmptyState } from '../../components/common/States.jsx';
import { ConfirmDialog, Modal } from '../../components/common/Modal.jsx';
import OnboardingJourney from '../../components/workflow/OnboardingJourney.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { APP_STATUS } from '../../constants/statuses.js';
import { formatDate } from '../../utils/format.js';

export default function HREmployeesPage() {
  const { data, offerFor, documentsFor, completeJoining } = useApp();
  const toast = useToast();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [joining, setJoining] = useState(null);
  const [created, setCreated] = useState(null);

  const joiningPending = useMemo(
    () => (data.applications || []).filter((a) => a.status === APP_STATUS.JOINING_PENDING),
    [data.applications]
  );

  const employees = useMemo(
    () =>
      (data.employees || []).filter((e) => {
        const t = q.trim().toLowerCase();
        return !t || e.name.toLowerCase().includes(t) || e.id.toLowerCase().includes(t) || e.position.toLowerCase().includes(t);
      }),
    [data.employees, q]
  );

  return (
    <div className="page-body">
      <div className="page-head">
        <div>
          <h1 className="page-title">Employee Onboarding</h1>
          <div className="page-head__sub">{joiningPending.length} joining · {(data.employees || []).length} onboarded</div>
        </div>
      </div>

      <div className="metric-grid mb-6">
        <Metric label="Joining Soon" value={joiningPending.length} tone={joiningPending.length ? 'amber' : undefined} />
        <Metric label="Employees Onboarded" value={(data.employees || []).length} tone="teal" />
        <Metric label="Accepted Offers" value={(data.offers || []).filter((o) => o.status === 'ACCEPTED').length} tone="indigo" />
      </div>

      {joiningPending.length > 0 && (
        <Card title="Joining in progress" className="mb-6">
          <div className="stack gap-4">
            {joiningPending.map((a) => {
              const offer = offerFor(a.id);
              return (
                <div className="round-card" key={a.id}>
                  <div className="round-card__head">
                    <Identity
                      name={`${a.personal.firstName} ${a.personal.lastName}`}
                      meta={`${a.candidateId} · ${a.jobTitle} · joins ${formatDate(offer?.joiningDate)}`}
                    />
                    <Button size="sm" variant="success" icon="UserRoundCheck" onClick={() => setJoining(a)}>
                      Mark Joining Completed
                    </Button>
                  </div>
                  <div className="mt-2">
                    <OnboardingJourney application={a} documents={documentsFor(a.id)} offer={offer} employee={null} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <div className="toolbar">
        <SearchBar value={q} onChange={setQ} placeholder="Search employees by name, ID or position" />
      </div>
      {employees.length === 0 ? (
        <EmptyState icon="UserRoundCheck" title="No employees onboarded yet" />
      ) : (
        <DataTable
          columns={[
            { key: 'name', label: 'Employee' },
            { key: 'id', label: 'Employee ID' },
            { key: 'position', label: 'Position' },
            { key: 'department', label: 'Department' },
            { key: 'joiningDate', label: 'Joined' },
            { key: 'action', label: '' },
          ]}
          rows={employees}
          emptyProps={{ icon: 'UserRoundCheck', title: 'No employees found' }}
          renderRow={(e) => {
            const app = (data.applications || []).find((a) => a.id === e.applicationId);
            return (
              <tr key={e.id}>
                <td>
                  <span className="identity">
                    <Avatar name={e.name} size="sm" />
                    <span className="strong">{e.name}</span>
                  </span>
                </td>
                <td className="mono">{e.id}</td>
                <td>{e.position}</td>
                <td>{e.department}</td>
                <td>{formatDate(e.joiningDate)}</td>
                <td>
                  {app && (
                    <Button size="sm" variant="secondary" icon="Eye" onClick={() => navigate(`/hr/candidates/${app.candidateId}`)}>
                      Profile
                    </Button>
                  )}
                </td>
              </tr>
            );
          }}
        />
      )}

      <ConfirmDialog
        open={!!joining}
        onClose={() => setJoining(null)}
        title="Mark joining as completed?"
        message={`This creates the employee record for ${joining?.personal.firstName} ${joining?.personal.lastName} and generates their Employee ID.`}
        confirmLabel="Confirm joining"
        tone="success"
        onConfirm={() => {
          const app = joining;
          const empId = completeJoining(app.id);
          setJoining(null);
          setCreated({ name: `${app.personal.firstName} ${app.personal.lastName}`, candidateId: app.candidateId, position: app.jobTitle, empId });
          toast.success('Joining completed — employee record created.');
        }}
      />

      <Modal
        open={!!created}
        onClose={() => setCreated(null)}
        title="Employee created"
        footer={<Button onClick={() => setCreated(null)}>Done</Button>}
      >
        <div className="alert alert--success mb-4">
          <span className="alert__icon"><Badge tone="success" icon="CheckCircle2">Onboarded</Badge></span>
          <div>{created?.name} has been onboarded. Their Employee ID has been generated and shared with them.</div>
        </div>
        {created && (
          <InfoList
            items={[
              { label: 'Candidate ID', value: created.candidateId },
              { label: 'Employee ID', value: created.empId },
              { label: 'Position', value: created.position },
            ]}
          />
        )}
      </Modal>
    </div>
  );
}
