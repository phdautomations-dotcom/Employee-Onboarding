import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../../components/common/Icon.jsx';
import TAHeader from '../../components/ta/TAHeader.jsx';
import DataGrid from '../../components/ta/DataGrid.jsx';
import Toolbar from '../../components/ta/Toolbar.jsx';
import Avatar from '../../components/ta/Avatar.jsx';
import Tag from '../../components/ta/Tag.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { useCollectionView } from '../../hooks/useCollectionView.js';
import { APP_STATUS, DOC_STATUS, OFFER_STATUS_META, HR_FUNNEL_STAGES, hrStageRank, stageBadgeForStatus, statusMeta } from '../../constants/statuses.js';
import { formatDate } from '../../utils/format.js';

// The old offer-status tones don't match Tag's tone names — map them once.
const OFFER_TONE = { neutral: 'grey', warning: 'amber', info: 'blue', success: 'green', error: 'red' };

const COLUMNS = [
  { key: 'name', label: 'Candidate', sortable: true },
  { key: 'position', label: 'Position', sortable: true },
  { key: 'docs', label: 'Documents' },
  { key: 'offerStatus', label: 'Offer Status' },
  { key: 'joiningDate', label: 'Joining Date', sortable: true },
  { key: 'hrStatus', label: 'HR Status', sortable: true },
  { key: 'actions', label: 'Actions' },
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
            docs: rejected ? { tone: 'red', text: `${rejected} rejected` }
              : docs.length && verified === docs.length ? { tone: 'green', text: 'All verified' }
              : verified ? { tone: 'amber', text: `${verified}/${docs.length} verified` }
              : { tone: 'grey', text: '—' },
          };
        }),
    [data.applications, offerFor, documentsFor]
  );

  // Stage filter is a bucket ("reached this stage or further"), not an exact status —
  // this matches the dashboard's funnel exactly, so clicking a funnel stage there
  // shows exactly the candidates counted in it here.
  const stageParam = HR_FUNNEL_STAGES.some((s) => s.key === sp.get('stage')) ? sp.get('stage') : 'all';
  const [stage, setStageKey] = useState(stageParam);

  // Exact-status filter — separate from the stage bucket above, this is what the
  // dashboard's "Onboarding Review Status" donut links to, since each of its
  // slices is one precise status, not "this stage or further".
  const statusParam = Object.values(APP_STATUS).includes(sp.get('status')) ? sp.get('status') : null;

  const view = useCollectionView(rows, {
    searchFields: ['name', 'candidateId'],
    pageSize: 12,
    initialSort: { key: 'name', dir: 'asc' },
    initialFilters: {
      ...(stageParam !== 'all' ? { hrRank: (r) => r.hrRank >= HR_FUNNEL_STAGES.find((s) => s.key === stageParam).rank } : {}),
      ...(statusParam ? { hrStatus: statusParam } : {}),
    },
  });

  const setStage = (key) => {
    setStageKey(key);
    const target = HR_FUNNEL_STAGES.find((s) => s.key === key);
    view.setFilter('hrRank', key === 'all' ? 'all' : (r) => r.hrRank >= target.rank);
  };

  const activeExactStatus = typeof view.filters.hrStatus === 'string' ? view.filters.hrStatus : null;

  const clearAll = () => {
    view.setQuery('');
    setStage('all');
    view.setFilter('hrStatus', 'all');
  };

  const chips = [
    stage !== 'all' && { key: 'stage', label: HR_FUNNEL_STAGES.find((s) => s.key === stage)?.label, onRemove: () => setStage('all') },
    activeExactStatus && { key: 'status', label: statusMeta(activeExactStatus).label, onRemove: () => view.setFilter('hrStatus', 'all') },
    view.query && { key: 'q', label: `“${view.query}”`, onRemove: () => view.setQuery('') },
  ].filter(Boolean);

  return (
    <>
      <TAHeader title="Candidates" subtitle="Candidates who have reached the HR stage." />

      <Toolbar
        search={{ value: view.query, onChange: view.setQuery, placeholder: 'Search candidate or ID…' }}
        filters={[
          {
            label: 'Stage',
            value: stage,
            onChange: setStage,
            options: HR_FUNNEL_STAGES.map((s) => ({ value: s.key, label: s.label })),
          },
        ]}
        chips={chips}
        onClearAll={chips.length > 1 ? clearAll : undefined}
      />

      <DataGrid
        columns={COLUMNS}
        rows={view.rows}
        sort={view.sort}
        onSort={view.onSort}
        pager={{ page: view.page, pageSize: view.pageSize, total: view.total, onPage: view.setPage }}
        empty={{ icon: 'Users', title: 'No candidates at the HR stage yet', message: 'Candidates appear here once their documents are verified.' }}
        renderRow={(r) => {
          const hrBadge = stageBadgeForStatus(r.hrStatus);
          const offerMeta = r.offerStatus ? OFFER_STATUS_META[r.offerStatus] : null;
          return (
            <tr key={r.id} onClick={() => navigate(`/hr/candidates/${r.candidateId}`)} style={{ cursor: 'pointer' }}>
              <td>
                <span className="ta-cell-cand">
                  <Avatar name={r.name} />
                  <span>
                    <span className="ta-cell-cand__name">{r.name}</span><br />
                    <span className="ta-cell-cand__sub">{r.candidateId}</span>
                  </span>
                </span>
              </td>
              <td>
                <span className="ta-cell-strong">{r.position}</span><br />
                <span className="ta-cell-sub">{r.department}</span>
              </td>
              <td>{r.docs.text === '—' ? <span className="ta-cell-mute">—</span> : <Tag tone={r.docs.tone}>{r.docs.text}</Tag>}</td>
              <td>
                {offerMeta ? (
                  <Tag tone={OFFER_TONE[offerMeta.tone] || 'grey'}>{offerMeta.label}</Tag>
                ) : (
                  <span className="ta-cell-mute">Not prepared</span>
                )}
              </td>
              <td className="ta-cell-mute">{r.joiningDate ? formatDate(r.joiningDate) : '—'}</td>
              <td><Tag tone={hrBadge.tone}>{hrBadge.label}</Tag></td>
              <td>
                <span className="ta-rowactions" onClick={(e) => e.stopPropagation()}>
                  <button className="ta-iconbtn" onClick={() => navigate(`/hr/candidates/${r.candidateId}`)} aria-label="Open candidate">
                    <Icon name="ArrowRight" size={15} />
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
