import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DataTable } from '../../components/common/Table.jsx';
import { StatusBadge, Badge } from '../../components/common/Badge.jsx';
import Avatar from '../../components/common/Avatar.jsx';
import Button from '../../components/common/Button.jsx';
import SearchBar from '../../components/common/SearchBar.jsx';
import FilterSelect from '../../components/common/FilterSelect.jsx';
import StatTiles from '../../components/common/StatTiles.jsx';
import { EmptyState } from '../../components/common/States.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { APP_STATUS, OFFER_STATUS_META } from '../../constants/statuses.js';
import { formatDate } from '../../utils/format.js';

const HR_STATUSES = [
  APP_STATUS.DOCS_VERIFIED,
  APP_STATUS.OFFER_DRAFT,
  APP_STATUS.OFFER_PENDING_HR,
  APP_STATUS.OFFER_ISSUED,
  APP_STATUS.OFFER_ACCEPTED,
  APP_STATUS.OFFER_DECLINED,
  APP_STATUS.JOINING_PENDING,
  APP_STATUS.EMPLOYEE,
];

const COLUMNS = [
  { key: 'candidateId', label: 'Candidate ID' },
  { key: 'name', label: 'Candidate Name' },
  { key: 'position', label: 'Position' },
  { key: 'department', label: 'Department' },
  { key: 'offerStatus', label: 'Offer Status' },
  { key: 'joiningDate', label: 'Joining Date' },
  { key: 'hrStatus', label: 'HR Status' },
  { key: 'action', label: 'Action' },
];

export default function HRCandidatesPage() {
  const { data, offerFor } = useApp();
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const stageParam = sp.get('stage');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState(stageParam || 'all');

  useEffect(() => {
    if (stageParam) setStatus(stageParam);
  }, [stageParam]);

  const rows = useMemo(
    () =>
      (data.applications || [])
        .filter((a) => HR_STATUSES.includes(a.status))
        .map((a) => {
          const offer = offerFor(a.id);
          return {
            id: a.id,
            candidateId: a.candidateId,
            name: `${a.personal.firstName} ${a.personal.lastName}`,
            position: a.jobTitle,
            department: offer?.department || '—',
            offerStatus: offer?.status || null,
            joiningDate: offer?.joiningDate || null,
            hrStatus: a.status,
          };
        })
        .filter((r) => {
          const t = q.trim().toLowerCase();
          return (!t || r.name.toLowerCase().includes(t) || r.candidateId.toLowerCase().includes(t)) && (status === 'all' || r.hrStatus === status);
        }),
    [data.applications, offerFor, q, status]
  );

  const tiles = useMemo(() => {
    const all = (data.applications || []).filter((a) => HR_STATUSES.includes(a.status));
    const c = (fn) => all.filter(fn).length;
    return [
      { n: c((a) => a.status === APP_STATUS.DOCS_VERIFIED || a.status === APP_STATUS.OFFER_PENDING_HR), label: 'Awaiting HR' },
      { n: c((a) => a.status === APP_STATUS.OFFER_ISSUED), label: 'Offer issued' },
      { n: c((a) => a.status === APP_STATUS.OFFER_ACCEPTED || a.status === APP_STATUS.JOINING_PENDING), label: 'Joining', tone: 'warn' },
      { n: c((a) => a.status === APP_STATUS.EMPLOYEE), label: 'Onboarded', tone: 'accent' },
    ];
  }, [data.applications]);

  return (
    <div className="page-body">
      <div className="page-head">
        <div>
          <h1 className="page-title">Candidates</h1>
          <div className="page-head__sub">Candidates who have reached the HR stage</div>
        </div>
      </div>
      <StatTiles tiles={tiles} />
      <div className="toolbar">
        <SearchBar value={q} onChange={setQ} placeholder="Search candidate or ID" />
        <FilterSelect
          label="HR Status"
          value={status}
          onChange={setStatus}
          options={HR_STATUSES.map((s) => ({ value: s, label: s }))}
        />
      </div>
      {rows.length === 0 ? (
        <EmptyState icon="Users" title="No candidates at the HR stage yet" message="Candidates appear here once their documents are verified." />
      ) : (
        <DataTable
          columns={COLUMNS}
          rows={rows}
          emptyProps={{ icon: 'Users', title: 'No candidates found' }}
          renderRow={(r) => (
            <tr key={r.id}>
              <td className="mono">{r.candidateId}</td>
              <td>
                <span className="identity">
                  <Avatar name={r.name} size="sm" />
                  <span className="strong">{r.name}</span>
                </span>
              </td>
              <td>{r.position}</td>
              <td>{r.department}</td>
              <td>
                {r.offerStatus ? (
                  <Badge tone={OFFER_STATUS_META[r.offerStatus].tone} icon={OFFER_STATUS_META[r.offerStatus].icon}>
                    {OFFER_STATUS_META[r.offerStatus].label}
                  </Badge>
                ) : (
                  <span className="text-secondary text-xs">Not prepared</span>
                )}
              </td>
              <td>{r.joiningDate ? formatDate(r.joiningDate) : '—'}</td>
              <td>
                <StatusBadge status={r.hrStatus} />
              </td>
              <td>
                <Button size="sm" variant="secondary" icon="ArrowRight" onClick={() => navigate(`/hr/candidates/${r.candidateId}`)}>
                  Open
                </Button>
              </td>
            </tr>
          )}
        />
      )}
    </div>
  );
}
