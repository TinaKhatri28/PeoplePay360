import React, { useState, useEffect, FormEvent } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Calendar,
  X,
  CreditCard,
  Briefcase
} from 'lucide-react';
import { apiRequest } from '../api';
import { useAuth } from '../context/AuthContext';
import { Contract, Employee, SalaryStructure, WorkingSchedule } from '../types';

export default function ContractsView() {
  const { isPayrollUser } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [schedules, setSchedules] = useState<WorkingSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    employee_id: '',
    wage: '',
    start_date: new Date().toISOString().slice(0, 10),
    end_date: '',
    status: 'Running',
    salary_structure_id: '',
    schedule_id: '',
  });

  const fetchData = async () => {
    try {
      const [cData, empData, structData, schedData] = await Promise.all([
        apiRequest<Contract[]>('/api/contracts'),
        apiRequest<Employee[]>('/api/employees'),
        apiRequest<SalaryStructure[]>('/api/salary/structures'),
        apiRequest<WorkingSchedule[]>('/api/schedules'),
      ]);
      setContracts(cData);
      setEmployees(empData);
      setStructures(structData);
      setSchedules(schedData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateContract = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await apiRequest('/api/contracts', {
        method: 'POST',
        body: {
          ...formData,
          employee_id: +formData.employee_id,
          wage: +formData.wage,
          salary_structure_id: formData.salary_structure_id ? +formData.salary_structure_id : null,
          schedule_id: formData.schedule_id ? +formData.schedule_id : null,
        },
      });
      setShowModal(false);
      setFormData({
        employee_id: '',
        wage: '',
        start_date: new Date().toISOString().slice(0, 10),
        end_date: '',
        status: 'Running',
        salary_structure_id: '',
        schedule_id: '',
      });
      fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create contract');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = contracts.filter((c) => {
    if (filterStatus !== 'All' && c.status !== filterStatus) return false;
    if (search) {
      const term = search.toLowerCase();
      const matchRef = c.ref?.toLowerCase().includes(term);
      const matchName = c.employee_name?.toLowerCase().includes(term);
      if (!matchRef && !matchName) return false;
    }
    return true;
  });

  if (loading && !contracts.length) {
    return <div style={{ padding: '20px', color: '#64748B' }}>Loading contract data...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '300px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} color="var(--text-subtle)" style={{ position: 'absolute', left: '14px', top: '12px' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Search by contract reference or employee name..."
              style={{ paddingLeft: '38px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-control"
            style={{ width: '160px' }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Running">Running</option>
            <option value="Expired">Expired</option>
            <option value="Draft">Draft</option>
          </select>
        </div>

        {isPayrollUser && (
          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            <Plus size={16} />
            <span>New Employment Contract</span>
          </button>
        )}
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Contract Ref</th>
              <th>Employee</th>
              <th>Monthly Wage</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id}>
                <td>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#818cf8' }}>
                    {c.ref}
                  </span>
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>{c.employee_name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>{c.position || 'Standard'}</div>
                </td>
                <td>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#34d399' }}>
                    ₹{c.wage?.toLocaleString('en-IN')}
                  </div>
                </td>
                <td>
                  <div style={{ fontSize: '0.85rem' }}>{c.start_date}</div>
                </td>
                <td>
                  <div style={{ fontSize: '0.85rem', color: c.end_date ? 'var(--text-main)' : 'var(--text-subtle)' }}>
                    {c.end_date || 'Open-ended'}
                  </div>
                </td>
                <td>
                  <span className={`badge ${
                    c.status === 'Running' ? 'badge-success' :
                    c.status === 'Expired' ? 'badge-neutral' : 'badge-warning'
                  }`}>
                    <span className="badge-dot" />
                    {c.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem' }}>Issue New Employment Contract</h3>
              <button
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                onClick={() => setShowModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateContract}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {formError && (
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(244, 63, 94, 0.15)',
                    color: '#fca5a5',
                    fontSize: '0.825rem',
                  }}>
                    {formError}
                  </div>
                )}

                <div style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  fontSize: '0.8rem',
                  color: '#c7d2fe',
                }}>
                  <strong>Running Contract Rule:</strong> If set to <em>Running</em>, any previous active contract for the selected employee will be automatically transitioned to <em>Expired</em> on the day preceding the start date.
                </div>

                <div className="form-group">
                  <label className="form-label">Employee *</label>
                  <select
                    className="form-control"
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>{e.name} ({e.email})</option>
                    ))}
                  </select>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Monthly Base Wage (₹) *</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="e.g. 75000"
                      value={formData.wage}
                      onChange={(e) => setFormData({ ...formData, wage: e.target.value })}
                      required
                      min="1"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contract Status</label>
                    <select
                      className="form-control"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="Running">Running (Active)</option>
                      <option value="Draft">Draft</option>
                      <option value="Expired">Expired</option>
                    </select>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Start Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date (Optional)</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Salary Structure</label>
                    <select
                      className="form-control"
                      value={formData.salary_structure_id}
                      onChange={(e) => setFormData({ ...formData, salary_structure_id: e.target.value })}
                    >
                      <option value="">Default Structure</option>
                      {structures.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Working Schedule</label>
                    <select
                      className="form-control"
                      value={formData.schedule_id}
                      onChange={(e) => setFormData({ ...formData, schedule_id: e.target.value })}
                    >
                      <option value="">Default (40h/week)</option>
                      {schedules.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Generating...' : 'Issue Contract'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
