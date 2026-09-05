import React, { useState, useEffect, FormEvent } from 'react';
import { Plus, Trash2, X, Layers } from 'lucide-react';
import { apiRequest } from '../api';
import { useAuth } from '../context/AuthContext';
import { SalaryStructure, WorkingSchedule } from '../types';

export default function SalaryStructuresView() {
  const { isPayrollAdmin } = useAuth();
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [schedules, setSchedules] = useState<WorkingSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  const [showRuleModal, setShowRuleModal] = useState(false);
  const [selectedStructId, setSelectedStructId] = useState<number | null>(null);
  const [ruleForm, setRuleForm] = useState({
    name: '',
    category: 'Allowance',
    compute_method: 'FIXED',
    amount: '',
    percentage: '',
    percentage_of: 'BASIC',
    formula_key: 'OVERTIME',
    sequence: 10,
  });

  const fetchData = async () => {
    try {
      const [structData, schedData] = await Promise.all([
        apiRequest<SalaryStructure[]>('/api/salary/structures'),
        apiRequest<WorkingSchedule[]>('/api/schedules'),
      ]);
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

  const handleAddRule = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedStructId) return;
    try {
      await apiRequest('/api/salary/rules', {
        method: 'POST',
        body: {
          ...ruleForm,
          structure_id: selectedStructId,
          amount: ruleForm.compute_method === 'FIXED' ? +ruleForm.amount : null,
          percentage: ruleForm.compute_method === 'PERCENTAGE' ? +ruleForm.percentage : null,
          percentage_of: ruleForm.compute_method === 'PERCENTAGE' ? ruleForm.percentage_of : null,
          formula_key: ruleForm.compute_method === 'FORMULA' ? ruleForm.formula_key : null,
          sequence: +ruleForm.sequence,
        },
      });
      setShowRuleModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to add rule');
    }
  };

  const handleDeleteRule = async (ruleId: number) => {
    if (!confirm('Are you sure you want to remove this salary rule?')) return;
    try {
      await apiRequest(`/api/salary/rules/${ruleId}`, { method: 'DELETE' });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete rule');
    }
  };

  if (loading && !structures.length) {
    return <div style={{ padding: '20px', color: '#64748B' }}>Loading salary structure configurations...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1F2937' }}>Configured Salary Structures & Rules</h3>
            <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
              Define compensation components, tax deduction percentages, and overtime multiplier formulas
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {structures.map((st) => (
            <div key={st.id} className="card">
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '16px',
                marginBottom: '16px',
                borderBottom: '1px solid #E2E8F0',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Layers size={20} color="#1E3A5F" />
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1F2937' }}>{st.name}</h4>
                </div>

                {isPayrollAdmin && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setSelectedStructId(st.id);
                      setShowRuleModal(true);
                    }}
                  >
                    <Plus size={14} />
                    <span>Add Component Rule</span>
                  </button>
                )}
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Seq</th>
                      <th>Rule / Component</th>
                      <th>Category</th>
                      <th>Method</th>
                      <th>Value Formula</th>
                      {isPayrollAdmin && <th>Remove</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {st.rules?.map((r) => (
                      <tr key={r.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', color: '#64748B' }}>{r.sequence}</td>
                        <td style={{ fontWeight: 600, color: '#1F2937' }}>{r.name}</td>
                        <td>
                          <span className={`badge ${
                            r.category === 'Basic' ? 'badge-primary' :
                            r.category === 'Allowance' ? 'badge-success' : 'badge-danger'
                          }`}>
                            {r.category}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#1F2937' }}>{r.compute_method}</span>
                        </td>
                        <td style={{ color: '#1F2937' }}>
                          {r.compute_method === 'FIXED' && `Fixed ₹${r.amount?.toLocaleString('en-IN')}`}
                          {r.compute_method === 'PERCENTAGE' && `${r.percentage}% of ${r.percentage_of}`}
                          {r.compute_method === 'FORMULA' && `Formula [${r.formula_key}]`}
                        </td>
                        {isPayrollAdmin && (
                          <td>
                            <button
                              style={{ background: 'none', border: 'none', color: '#B42318', cursor: 'pointer', padding: '4px' }}
                              onClick={() => handleDeleteRule(r.id)}
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1F2937' }}>Company Working Schedules</h3>
          <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
            Shift hours, weekly working days, and break definitions
          </p>
        </div>

        <div className="grid-3">
          {schedules.map((sc) => (
            <div key={sc.id} className="card card-interactive">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1F2937' }}>{sc.name}</h4>
                <span className="badge badge-info">{sc.days_per_week} Days/Wk</span>
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1E3A5F', fontFamily: 'var(--font-mono)' }}>
                {sc.total_hours} <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 400 }}>hrs/week</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '8px' }}>
                Standard shifts covering {sc.days?.map((d) => d.day.slice(0, 3)).join(', ')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showRuleModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem', color: '#1F2937' }}>Add Salary Component Rule</h3>
              <button
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
                onClick={() => setShowRuleModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddRule}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Component Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Internet Reimbursement"
                    value={ruleForm.name}
                    onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-control"
                      value={ruleForm.category}
                      onChange={(e) => setRuleForm({ ...ruleForm, category: e.target.value })}
                    >
                      <option value="Basic">Basic</option>
                      <option value="Allowance">Allowance (Earning)</option>
                      <option value="Deduction">Deduction (Withholding)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Computation Method</label>
                    <select
                      className="form-control"
                      value={ruleForm.compute_method}
                      onChange={(e) => setRuleForm({ ...ruleForm, compute_method: e.target.value })}
                    >
                      <option value="FIXED">FIXED Amount</option>
                      <option value="PERCENTAGE">PERCENTAGE Calculation</option>
                      <option value="FORMULA">FORMULA Engine</option>
                    </select>
                  </div>
                </div>

                {ruleForm.compute_method === 'FIXED' && (
                  <div className="form-group">
                    <label className="form-label">Fixed Amount (₹) *</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="e.g. 2500"
                      value={ruleForm.amount}
                      onChange={(e) => setRuleForm({ ...ruleForm, amount: e.target.value })}
                      required
                    />
                  </div>
                )}

                {ruleForm.compute_method === 'PERCENTAGE' && (
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Percentage (%) *</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="e.g. 12"
                        value={ruleForm.percentage}
                        onChange={(e) => setRuleForm({ ...ruleForm, percentage: e.target.value })}
                        required
                        step="0.1"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Percentage Of</label>
                      <select
                        className="form-control"
                        value={ruleForm.percentage_of}
                        onChange={(e) => setRuleForm({ ...ruleForm, percentage_of: e.target.value })}
                      >
                        <option value="BASIC">BASIC Wage</option>
                        <option value="GROSS_SO_FAR">GROSS_SO_FAR</option>
                      </select>
                    </div>
                  </div>
                )}

                {ruleForm.compute_method === 'FORMULA' && (
                  <div className="form-group">
                    <label className="form-label">Formula Key</label>
                    <select
                      className="form-control"
                      value={ruleForm.formula_key}
                      onChange={(e) => setRuleForm({ ...ruleForm, formula_key: e.target.value })}
                    >
                      <option value="OVERTIME">OVERTIME (1.5x Hourly Rate * Overtime Hours)</option>
                      <option value="UNPAID_LEAVE_DEDUCTION">UNPAID_LEAVE_DEDUCTION (Per Day Rate * Unpaid Days)</option>
                      <option value="ATTENDANCE_BASED">ATTENDANCE_BASED (Pro-rated by Working Ratio)</option>
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Execution Sequence</label>
                  <input
                    type="number"
                    className="form-control"
                    value={ruleForm.sequence}
                    onChange={(e) => setRuleForm({ ...ruleForm, sequence: +e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowRuleModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Save Component Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
