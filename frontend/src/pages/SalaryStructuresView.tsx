import React, { useState, useEffect, FormEvent } from 'react';
import {
  Sliders,
  Plus,
  Clock,
  CheckCircle2,
  Trash2,
  X,
  Layers,
  Calculator,
  Calendar,
  Download
} from 'lucide-react';
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

  const [selectedRuleIds, setSelectedRuleIds] = useState<number[]>([]);

  const handleToggleSelectAllRules = (rules: Array<{ id: number }>) => {
    const ids = rules.map((r) => r.id);
    const allSelected = ids.length > 0 && ids.every((id) => selectedRuleIds.includes(id));
    if (allSelected) {
      setSelectedRuleIds((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedRuleIds((prev) => Array.from(new Set([...prev, ...ids])));
    }
  };

  const handleToggleSelectOneRule = (id: number, e?: React.MouseEvent | React.ChangeEvent) => {
    if (e) e.stopPropagation();
    setSelectedRuleIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const exportSelectedRulesCSV = (structureName: string, rules: any[]) => {
    const targets = rules.filter((r) => selectedRuleIds.includes(r.id));
    const toExport = targets.length > 0 ? targets : rules;

    const headers = ['Structure', 'Sequence', 'Rule Name', 'Category', 'Compute Method', 'Value / Formula'];
    const rows = toExport.map((r) => [
      structureName,
      r.sequence,
      r.name,
      r.category,
      r.compute_method,
      r.compute_method === 'FIXED' ? `Fixed ₹${r.amount || 0}` :
      r.compute_method === 'PERCENTAGE' ? `${r.percentage}% of ${r.percentage_of}` :
      `Formula [${r.formula_key}]`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [
      headers.join(','),
      ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${structureName.toLowerCase().replace(/\s+/g, '_')}_rules_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkDeleteRules = async () => {
    if (!selectedRuleIds.length) return;
    if (!confirm(`Are you sure you want to remove ${selectedRuleIds.length} selected rule(s)?`)) return;
    try {
      await Promise.all(selectedRuleIds.map((id) => apiRequest(`/api/salary/rules/${id}`, { method: 'DELETE' })));
      setSelectedRuleIds([]);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete selected rules');
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
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Configured Salary Structures & Rules</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '2px' }}>
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
                borderBottom: '1px solid var(--border-subtle)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Layers size={20} color="var(--primary-light, #6366f1)" />
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>{st.name}</h4>
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

              {/* Contextual Bulk Action Bar when rules in this structure are selected */}
              {(() => {
                const stRuleIds = (st.rules || []).map((r) => r.id);
                const selectedInSt = stRuleIds.filter((id) => selectedRuleIds.includes(id));
                const isAllInSt = stRuleIds.length > 0 && selectedInSt.length === stRuleIds.length;
                const isSomeInSt = selectedInSt.length > 0 && !isAllInSt;

                return (
                  <>
                    {selectedInSt.length > 0 && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 18px',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(0, 0, 0, 0.04)',
                        border: '1px solid rgba(0, 0, 0, 0.12)',
                        flexWrap: 'wrap',
                        gap: '12px',
                        marginBottom: '16px',
                        animation: 'fadeIn 0.2s ease',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span className="badge badge-primary">{selectedInSt.length} Selected</span>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600 }}>
                            {selectedInSt.length === stRuleIds.length
                              ? `All ${st.name} rules selected`
                              : `${selectedInSt.length} of ${stRuleIds.length} rules selected`}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          {isPayrollAdmin && (
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={handleBulkDeleteRules}
                              style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem' }}
                            >
                              <Trash2 size={13} />
                              <span>Delete Selected</span>
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => exportSelectedRulesCSV(st.name, st.rules || [])}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}
                          >
                            <Download size={14} />
                            <span>Export CSV</span>
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setSelectedRuleIds((prev) => prev.filter((id) => !stRuleIds.includes(id)))}
                            style={{ fontSize: '0.78rem' }}
                          >
                            Clear Selection
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th style={{ width: '42px', textAlign: 'center', padding: '10px 12px' }}>
                              <input
                                type="checkbox"
                                checked={isAllInSt}
                                ref={(input) => {
                                  if (input) input.indeterminate = isSomeInSt;
                                }}
                                onChange={() => handleToggleSelectAllRules(st.rules || [])}
                                title={`Select All ${st.name} Rules`}
                                style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#000000' }}
                              />
                            </th>
                            <th>Seq</th>
                            <th>Rule / Component</th>
                            <th>Category</th>
                            <th>Method</th>
                            <th>Value Formula</th>
                            {isPayrollAdmin && <th>Remove</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {st.rules?.length === 0 ? (
                            <tr>
                              <td colSpan={isPayrollAdmin ? 7 : 6} style={{ textAlign: 'center', padding: '24px', color: '#64748B' }}>
                                No salary rules configured for this structure.
                              </td>
                            </tr>
                          ) : (
                            st.rules?.map((r) => {
                              const isSelected = selectedRuleIds.includes(r.id);
                              return (
                                <tr
                                  key={r.id}
                                  style={{
                                    backgroundColor: isSelected ? 'rgba(0, 0, 0, 0.03)' : undefined,
                                    transition: 'background-color 0.15s ease',
                                  }}
                                >
                                  <td style={{ textAlign: 'center', padding: '10px 12px' }}>
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={(e) => handleToggleSelectOneRule(r.id, e)}
                                      style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#000000' }}
                                      title={`Select rule ${r.name}`}
                                    />
                                  </td>
                                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-subtle)' }}>{r.sequence}</td>
                                  <td style={{ fontWeight: 600 }}>{r.name}</td>
                                  <td>
                                    <span className={`badge ${
                                      r.category === 'Basic' ? 'badge-primary' :
                                      r.category === 'Allowance' ? 'badge-success' : 'badge-danger'
                                    }`}>
                                      {r.category}
                                    </span>
                                  </td>
                                  <td>
                                    <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>{r.compute_method}</span>
                                  </td>
                                  <td>
                                    {r.compute_method === 'FIXED' && `Fixed ₹${r.amount?.toLocaleString('en-IN')}`}
                                    {r.compute_method === 'PERCENTAGE' && `${r.percentage}% of ${r.percentage_of}`}
                                    {r.compute_method === 'FORMULA' && `Formula [${r.formula_key}]`}
                                  </td>
                                  {isPayrollAdmin && (
                                    <td>
                                      <button
                                        style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '4px' }}
                                        onClick={() => handleDeleteRule(r.id)}
                                      >
                                        <Trash2 size={15} />
                                      </button>
                                    </td>
                                  )}
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                );
              })()}
            </div>
          ))}
        </div>
      </div>

      <div>
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Company Working Schedules</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '2px' }}>
            Shift hours, weekly working days, and break definitions
          </p>
        </div>

        <div className="grid-3">
          {schedules.map((sc) => {
            const daysList = (sc.schedule || sc.days || []) as Array<{ day: string; start?: string; end?: string; breakHours?: number }>;
            const totalHours = sc.weekly_hours ?? sc.total_hours ?? (sc.days_per_week * (sc.standard_hours || 8));
            const firstShift = daysList.find((d) => d.start && d.end);

            return (
              <div key={sc.id} className="card card-interactive" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>{sc.name}</h4>
                    <span className="badge badge-info">{sc.days_per_week} Days/Wk</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-dark, #0f172a)', fontFamily: 'var(--font-mono)' }}>
                    {totalHours} <span style={{ fontSize: '0.825rem', color: 'var(--text-subtle)', fontWeight: 500 }}>hrs/week</span>
                  </div>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '12px', borderTop: '1px solid var(--border-subtle, #e2e8f0)', paddingTop: '8px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-main, #334155)', marginBottom: '3px' }}>
                    Days: {daysList.length > 0 ? daysList.map((d) => (d.day || '').slice(0, 3)).filter(Boolean).join(', ') : `${sc.days_per_week} days/week`}
                  </div>
                  {firstShift && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                      Shift: {firstShift.start} – {firstShift.end} {firstShift.breakHours ? `(${firstShift.breakHours}h break)` : ''}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showRuleModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem' }}>Add Salary Component Rule</h3>
              <button
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
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
