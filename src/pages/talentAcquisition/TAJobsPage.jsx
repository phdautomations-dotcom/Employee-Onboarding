import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/common/Icon.jsx';
import TAHeader from '../../components/ta/TAHeader.jsx';
import DataGrid from '../../components/ta/DataGrid.jsx';
import Toolbar from '../../components/ta/Toolbar.jsx';
import Button from '../../components/ta/Button.jsx';
import Tag from '../../components/ta/Tag.jsx';
import CreateJobDrawer from '../../components/workflow/CreateJobDrawer.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useCollectionView } from '../../hooks/useCollectionView.js';
import { formatDate } from '../../utils/format.js';

const COLUMNS = [
  { key: 'title', label: 'Job Title', sortable: true },
  { key: 'location', label: 'Location', sortable: true },
  { key: 'workMode', label: 'Mode', sortable: true },
  { key: 'applicants', label: 'Applicants', sortable: true },
  { key: 'deadline', label: 'Deadline', sortable: true },
  { key: 'actions', label: 'Actions' },
];

export default function TAJobsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { data, jobs, createJob } = useApp();
  const [open, setOpen] = useState(false);

  const rows = useMemo(() => {
    const counts = {};
    (data.applications || []).forEach((a) => { if (a.jobId) counts[a.jobId] = (counts[a.jobId] || 0) + 1; });
    return jobs.map((j) => ({ ...j, applicants: counts[j.id] || 0 }));
  }, [data.applications, jobs]);

  const view = useCollectionView(rows, {
    searchFields: ['title', 'department', 'id', 'location'],
    pageSize: 12,
    initialSort: { key: 'applicants', dir: 'desc' },
  });

  const deptOptions = useMemo(
    () => [...new Set(rows.map((r) => r.department))].sort().map((d) => ({ value: d, label: d })),
    [rows]
  );
  const activeDept = typeof view.filters.department === 'string' ? view.filters.department : 'all';

  const chips = [
    activeDept !== 'all' && { key: 'dept', label: activeDept, onRemove: () => view.setFilter('department', 'all') },
    view.query && { key: 'q', label: `“${view.query}”`, onRemove: () => view.setQuery('') },
  ].filter(Boolean);

  const totalApplicants = rows.reduce((sum, r) => sum + r.applicants, 0);

  return (
    <>
      <TAHeader title="Jobs" subtitle={`${jobs.length} open positions · ${totalApplicants} applicants in total`} />

      <Toolbar
        search={{ value: view.query, onChange: view.setQuery, placeholder: 'Search jobs by title, department or ID…' }}
        filters={[{ label: 'Department', value: activeDept, onChange: (v) => view.setFilter('department', v), options: deptOptions }]}
        chips={chips}
        onClearAll={chips.length > 1 ? () => { view.setQuery(''); view.setFilter('department', 'all'); } : undefined}
        action={<Button icon="Plus" onClick={() => setOpen(true)}>Create Job</Button>}
      />

      <DataGrid
        columns={COLUMNS}
        rows={view.rows}
        sort={view.sort}
        onSort={view.onSort}
        pager={{ page: view.page, pageSize: view.pageSize, total: view.total, onPage: view.setPage }}
        empty={{ icon: 'Briefcase', title: 'No jobs found', message: 'Try a different search, or create a new job.' }}
        renderRow={(j) => (
          <tr key={j.id} onClick={() => navigate(`/ta/jobs/${j.id}`)} style={{ cursor: 'pointer' }}>
            <td>
              <span className="ta-cell-strong">{j.title}</span>
              {j.custom && <Tag tone="blue">New</Tag>}
              <br />
              <span className="ta-cell-sub">{j.department}</span>
            </td>
            <td className="ta-cell-mute">{j.location}</td>
            <td className="ta-cell-mute">{j.workMode}</td>
            <td><Tag tone={j.applicants ? 'blue' : 'grey'}>{j.applicants}</Tag></td>
            <td className="ta-cell-mute">{formatDate(j.deadline)}</td>
            <td>
              <span className="ta-rowactions" onClick={(e) => e.stopPropagation()}>
                <button className="ta-iconbtn" onClick={() => navigate(`/ta/jobs/${j.id}`)} aria-label="Open job"><Icon name="ArrowRight" size={15} /></button>
              </span>
            </td>
          </tr>
        )}
      />

      <CreateJobDrawer
        open={open}
        onClose={() => setOpen(false)}
        onCreate={(payload) => {
          const job = createJob(payload);
          setOpen(false);
          toast.success(`${job.title} published (${job.id}).`);
        }}
      />
    </>
  );
}
