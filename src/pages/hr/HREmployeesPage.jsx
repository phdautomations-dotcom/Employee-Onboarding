import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/common/Icon.jsx';
import TAHeader from '../../components/ta/TAHeader.jsx';
import Card from '../../components/ta/Card.jsx';
import DataGrid from '../../components/ta/DataGrid.jsx';
import Toolbar from '../../components/ta/Toolbar.jsx';
import Avatar from '../../components/ta/Avatar.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { useCollectionView } from '../../hooks/useCollectionView.js';
import { APP_STATUS } from '../../constants/statuses.js';
import { formatDate } from '../../utils/format.js';

const COLUMNS = [
  { key: 'name', label: 'Employee', sortable: true },
  { key: 'id', label: 'Employee ID', sortable: true },
  { key: 'position', label: 'Position', sortable: true },
  { key: 'department', label: 'Department', sortable: true },
  { key: 'joiningDate', label: 'Joined', sortable: true },
  { key: 'actions', label: 'Actions' },
];

export default function HREmployeesPage() {
  const navigate = useNavigate();
  const { data, offerFor, getApplication } = useApp();

  const joiningPending = useMemo(
    () => (data.applications || []).filter((a) => a.status === APP_STATUS.JOINING_PENDING),
    [data.applications]
  );

  const employees = data.employees || [];

  const view = useCollectionView(employees, {
    searchFields: ['name', 'id', 'position'],
    pageSize: 12,
    initialSort: { key: 'joiningDate', dir: 'desc' },
  });

  const departmentOptions = useMemo(
    () => [...new Set(employees.map((e) => e.department))].sort().map((d) => ({ value: d, label: d })),
    [employees]
  );
  const activeDepartment = typeof view.filters.department === 'string' ? view.filters.department : 'all';

  const chips = [
    activeDepartment !== 'all' && { key: 'dept', label: activeDepartment, onRemove: () => view.setFilter('department', 'all') },
    view.query && { key: 'q', label: `“${view.query}”`, onRemove: () => view.setQuery('') },
  ].filter(Boolean);

  const clearAll = () => {
    view.setQuery('');
    view.setFilter('department', 'all');
  };

  return (
    <>
      <TAHeader
        title="Employees"
        subtitle={`${joiningPending.length} joining · ${employees.length} onboarded`}
      />

      {joiningPending.length > 0 && (
        <Card title="Joining in Progress">
          <div className="ta-pipe">
            {joiningPending.map((a) => {
              const offer = offerFor(a.id);
              return (
                <button
                  key={a.id}
                  className="ta-pipe__row"
                  onClick={() => navigate(`/hr/candidates/${a.candidateId}`)}
                >
                  <Avatar name={`${a.personal.firstName} ${a.personal.lastName}`} size="sm" />
                  <span className="ta-pipe__label">
                    {a.personal.firstName} {a.personal.lastName}
                    <br />
                    <span className="ta-cell-sub">{a.jobTitle} · joins {formatDate(offer?.joiningDate)}</span>
                  </span>
                  <Icon name="ArrowRight" size={15} />
                </button>
              );
            })}
          </div>
        </Card>
      )}

      <Toolbar
        search={{ value: view.query, onChange: view.setQuery, placeholder: 'Search employees by name, ID or position…' }}
        filters={[
          { label: 'Department', value: activeDepartment, onChange: (v) => view.setFilter('department', v), options: departmentOptions },
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
        empty={{ icon: 'UserRoundCheck', title: 'No employees onboarded yet', message: 'Employees appear here once joining is marked complete.' }}
        renderRow={(e) => {
          const app = getApplication(e.applicationId);
          return (
            <tr
              key={e.id}
              onClick={() => app && navigate(`/hr/candidates/${app.candidateId}`)}
              style={{ cursor: app ? 'pointer' : 'default' }}
            >
              <td>
                <span className="ta-cell-cand">
                  <Avatar name={e.name} />
                  <span className="ta-cell-cand__name">{e.name}</span>
                </span>
              </td>
              <td className="ta-cell-mute">{e.id}</td>
              <td>{e.position}</td>
              <td className="ta-cell-mute">{e.department}</td>
              <td className="ta-cell-mute">{formatDate(e.joiningDate)}</td>
              <td>
                {app && (
                  <span className="ta-rowactions" onClick={(ev) => ev.stopPropagation()}>
                    <button className="ta-iconbtn" onClick={() => navigate(`/hr/candidates/${app.candidateId}`)} aria-label="Open profile">
                      <Icon name="ArrowRight" size={15} />
                    </button>
                  </span>
                )}
              </td>
            </tr>
          );
        }}
      />
    </>
  );
}
