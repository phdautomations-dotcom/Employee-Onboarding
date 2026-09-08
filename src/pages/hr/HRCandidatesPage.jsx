import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../../components/common/Icon.jsx';
import TAHeader from '../../components/ta/TAHeader.jsx';
import StatBar from '../../components/ta/StatBar.jsx';
import DataGrid from '../../components/ta/DataGrid.jsx';
import Toolbar from '../../components/ta/Toolbar.jsx';
import Tag from '../../components/ta/Tag.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { useCollectionView } from '../../hooks/useCollectionView.js';
import { APP_STATUS, DOC_STATUS, OFFER_STATUS_META, HR_FUNNEL_STAGES, hrStageRank, hrStageBadge } from '../../constants/statuses.js';
import { formatDate } from '../../utils/format.js';

const COLUMNS = [
  { key: 'name', label: 'Candidate', sortable: true },
  { key: 'position', label: 'Position', sortable: true },
  { key: 'hrStatus', label: 'Onboarding Stage', sortable: true },
  { key: 'joiningDate', label: 'Joining', sortable: true },
  { key: 'actions', label: '' },
];

export default function HRCandidatesPage() {
  const navigate = useNavigate();
  const { data, offerFor, documentsFor } = useApp();
  const [sp] = useSearchParams();

  const rows = useMemo(
    () =>
      (data.applications || [])
        .filter((a) => hrStageRank(a.status) >= 0 || a.status === APP_STATUS.OFFER_DECLINED)
        .map((a) => {
          const offer = offerFor(a.id);
          const docs = documentsFor(a.id);
          const verified = docs.filter((d) => d.status === DOC_STATUS.VERIFIED).length;
          const rejected = docs.filter((d) => d.status === DOC_STATUS.REJECTED).length;
          return {
            id: a.id,
            candidateId: a.candidateId,
            name: `${a.personal.firstName} ${a.personal.lastName}`,
            position: a.jobTitle,
            department: offer?.department || 'General',
            offerStatus: offer?.status || null,
            joiningDate: offer?.joiningDate || null,
            hrStatus: a.status,
            hrRank: hrStageRank(a.status),
            docsIssue: rejected > 0,
            docsState: rejected ? 'rejected' : (docs.length && verified === docs.length ? 'verified' : 'pending'),
            docs: rejected ? { tone: 'red', text: `${rejected} rejected` }
              : docs.length && verified === docs.length ? { tone: 'green', text: 'All verified' }
              : verified ? { tone: 'amber', text: `${verified}/${docs.length} verified` }
              : { tone: 'grey', text: '—' },
          };
        }),
    [data.applications, offerFor, documentsFor]
  );

  // Stage filter = the candidate's current stage exactly (not "reached this or
  // further"), so it lines up 1:1 with the dashboard's "Onboarding by stage"
  // card — clicking a stage there shows only the people sitting in it.
  const stageParam = HR_FUNNEL_STAGES.some((s) => s.key === sp.get('stage')) ? sp.get('stage') : 'all';
  const offerParam = OFFER_STATUS_META[sp.get('offer')] ? sp.get('offer') : 'all';
  const [stage, setStageKey] = useState(stageParam);
  const [offer, setOfferKey] = useState(offerParam);

  const view = useCollectionView(rows, {
    searchFields: ['name', 'candidateId'],
    pageSize: 30,
    initialSort: { key: 'name', dir: 'asc' },
    initialFilters: {
      ...(stageParam !== 'all'
        ? { hrRank: (r) => r.hrRank === HR_FUNNEL_STAGES.find((s) => s.key === stageParam).rank }
        : {}),
      ...(offerParam !== 'all' ? { offerStatus: offerParam } : {}),
    },
  });

  const deptOptions = useMemo(
    () => [...new Set(rows.map((r) => r.department).filter(Boolean))].sort().map((d) => ({ value: d, label: d })),
    [rows]
  );
  const activeDept = typeof view.filters.department === 'string' ? view.filters.department : 'all';
  const activeDocs = typeof view.filters.docsState === 'string' ? view.filters.docsState : 'all';

  const [joined, setJoinedKey] = useState('all');
  const setJoined = (key) => {
    setJoinedKey(key);
    view.setFilter('joiningDate', key === 'all' ? 'all' : key === 'set' ? (r) => !!r.joiningDate : (r) => !r.joiningDate);
  };

  const setStage = (key) => {
    setStageKey(key);
    const target = HR_FUNNEL_STAGES.find((s) => s.key === key);
    view.setFilter('hrRank', key === 'all' ? 'all' : (r) => r.hrRank === target.rank);
  };

  const setOffer = (key) => {
    setOfferKey(key);
    view.setFilter('offerStatus', key === 'all' ? 'all' : key);
  };

  const clearAll = () => {
    setStage('all');
    setOffer('all');
    setJoined('all');
    view.setFilter('department', 'all');
    view.setFilter('docsState', 'all');
  };

  const DOCS_LABEL = { verified: 'All verified', rejected: 'Has rejection', pending: 'Docs pending' };
  const chips = [
    stage !== 'all' && { key: 'stage', label: HR_FUNNEL_STAGES.find((s) => s.key === stage)?.label, onRemove: () => setStage('all') },
    offer !== 'all' && { key: 'offer', label: OFFER_STATUS_META[offer]?.label, onRemove: () => setOffer('all') },
    activeDept !== 'all' && { key: 'dept', label: activeDept, onRemove: () => view.setFilter('department', 'all') },
    activeDocs !== 'all' && { key: 'docs', label: DOCS_LABEL[activeDocs], onRemove: () => view.setFilter('docsState', 'all') },
    joined !== 'all' && { key: 'join', label: joined === 'set' ? 'Joining date set' : 'No joining date', onRemove: () => setJoined('all') },
  ].filter(Boolean);

  const apps = data.applications || [];
  const kpis = [
    { icon: 'Users', accent: 'blue', label: 'At HR stage', value: rows.length, onClick: () => setStage('all') },
    { icon: 'Eye', accent: 'amber', label: 'Awaiting verification', value: apps.filter((a) => a.status === APP_STATUS.HR_VERIFICATION).length, onClick: () => setStage('verification') },
    { icon: 'CalendarClock', accent: 'violet', label: 'Joining scheduled', value: apps.filter((a) => a.status === APP_STATUS.JOINING_PENDING).length, onClick: () => setStage('joining') },
    { icon: 'UserRoundCheck', accent: 'green', label: 'Onboarded', value: apps.filter((a) => a.status === APP_STATUS.EMPLOYEE).length, onClick: () => setStage('onboarded') },
  ];

  return (
    <>
      <TAHeader title="Candidates" subtitle="Candidates who have reached the HR stage." />

      <StatBar items={kpis} />

      <Toolbar
        filters={[
          {
            label: 'Stage',
            value: stage,
            onChange: setStage,
            options: HR_FUNNEL_STAGES.map((s) => ({ value: s.key, label: s.label })),
          },
          {
            label: 'Offer',
            value: offer,
            onChange: setOffer,
            options: Object.entries(OFFER_STATUS_META).map(([value, m]) => ({ value, label: m.label })),
          },
          { label: 'Department', value: activeDept, onChange: (v) => view.setFilter('department', v), options: deptOptions },
          {
            label: 'Documents',
            value: activeDocs,
            onChange: (v) => view.setFilter('docsState', v),
            options: [
              { value: 'verified', label: 'All verified' },
              { value: 'rejected', label: 'Has rejection' },
              { value: 'pending', label: 'Pending' },
            ],
          },
          {
            label: 'Joining date',
            value: joined,
            onChange: setJoined,
            options: [
              { value: 'set', label: 'Date set' },
              { value: 'unset', label: 'Not set' },
            ],
          },
        ]}
        chips={chips}
        onClearAll={chips.length > 1 ? clearAll : undefined}
        pager={{ page: view.page, pageSize: view.pageSize, total: view.total, onPage: view.setPage }}
      />

      <DataGrid
        columns={COLUMNS}
        rows={view.rows}
        sort={view.sort}
        onSort={view.onSort}
        pager={{ page: view.page, pageSize: view.pageSize, total: view.total, onPage: view.setPage }}
        empty={{ icon: 'Users', title: 'No candidates at the HR stage yet', message: 'Candidates appear here once their documents are verified.' }}
        renderRow={(r) => {
          const hrBadge = hrStageBadge(r.hrStatus);
          return (
            <tr key={r.id} onClick={() => navigate(`/hr/candidates/${r.candidateId}`)} style={{ cursor: 'pointer' }}>
              <td>
                <span className="ta-cell-cand__name">{r.name}</span><br />
                <span className="ta-cell-cand__sub">{r.candidateId}</span>
              </td>
              <td>
                <span className="ta-cell-strong">{r.position}</span><br />
                <span className="ta-cell-sub">{r.department}</span>
              </td>
              <td>
                <Tag tone={hrBadge.tone}>{hrBadge.label}</Tag>
                {r.docsIssue && (
                  <div className="ta-cell-sub" style={{ marginTop: 2, color: 'var(--tag-red-fg)' }}>Document rejected</div>
                )}
              </td>
              <td className="ta-cell-mute">
                {r.joiningDate
                  ? <span className="hr-joined"><Icon name="CalendarCheck" size={13} /> {formatDate(r.joiningDate)}</span>
                  : 'Not set'}
              </td>
              <td>
                <span className="ta-rowactions" onClick={(e) => e.stopPropagation()}>
                  <button className="ta-iconbtn" onClick={() => navigate(`/hr/candidates/${r.candidateId}`)} aria-label="Open candidate">
                    <Icon name="ChevronRight" size={17} />
                  </button>
                </span>
              </td>
            </tr>
          );
        }}
      />
    </>
  );
}
