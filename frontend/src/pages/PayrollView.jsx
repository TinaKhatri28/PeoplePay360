import React, { useState, useEffect } from 'react';
import {
  Plus,
  Play,
  CheckCircle2,
  AlertTriangle,
  Send,
  Download,
  Eye,
  X,
  ChevronRight,
  ArrowLeft,
  DollarSign
} from 'lucide-react';
import { apiRequest, downloadPayslipPdf } from '../api';
import { useAuth } from '../context/AuthContext';

export default function PayrollView() {
  const { isPayrollUser, isPayrollAdmin } = useAuth();
  const [payruns, setPayruns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayrun, setSelectedPayrun] = useState(null);
  const [payrunDetails, setPayrunDetails] = useState(null);

  // New Payrun Modal State
  const [showNewModal, setShowNewModal] = useState(false);
  const [newYear, setNewYear] = useState(2026);
  const [newMonth, setNewMonth] = useState(9); // September
  const [eligible, setEligible] = useState([]);
  const [selectedEmpIds, setSelectedEmpIds] = useState([]);
  const [structures, setStructures] = useState([]);
  const [selectedStructure, setSelectedStructure] = useState('');
  const [loadingEligible, setLoadingEligible] = useState(false);

  // Validation Report Modal State
  const [validationReport, setValidationReport] = useState(null);

  // Payslip Inspection Drawer State
  const [inspectedSlip, setInspectedSlip] = useState(null);

  const [processing, setProcessing] = useState(false);

  const fetchPayruns = async () => {
    try {
      const data = await apiRequest('/api/payroll/payruns');
      setPayruns(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayrunDetails = async (id) => {
    try {
      const data = await apiRequest(`/api/payroll/payruns/${id}`);
      setPayrunDetails(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPayruns();
  }, []);

  const openPayrun = async (run) => {
    setSelectedPayrun(run);
    fetchPayrunDetails(run.id);
  };

  // Fetch eligible employees when new payrun modal changes period
  const fetchEligible = async () => {
    setLoadingEligible(true);
    try {
      const [elData, structData] = await Promise.all([
        apiRequest(`/api/payroll/eligible-employees?year=${newYear}&month=${newMonth}`),
        apiRequest('/api/salary/structures'),
      ]);
      setEligible(elData);
      setSelectedEmpIds(elData.map((e) => e.id)); // select all by default
      setStructures(structData);
      if (structData.length > 0) setSelectedStructure(structData[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEligible(false);
    }
  };

  useEffect(() => {
    if (showNewModal) {
      fetchEligible();
    }
  }, [showNewModal, newYear, newMonth]);

  const handleCreatePayrun = async (e) => {
    e.preventDefault();
    if (selectedEmpIds.length === 0) {
      alert('Please select at least one employee');
      return;
    }
    setProcessing(true);
    try {
      const res = await apiRequest('/api/payroll/payruns', {
        method: 'POST',
        body: {
          period_year: +newYear,
          period_month: +newMonth,
          structure_id: selectedStructure ? +selectedStructure : null,
          employee_ids: selectedEmpIds,
          company: 'OXP Pvt Ltd',
        },
      });
      setShowNewModal(false);
      await fetchPayruns();
      openPayrun({ id: res.id });
    } catch (err) {
      alert(err.message || 'Failed to create payrun');
    } finally {
      setProcessing(false);
    }
  };

  // Stepper Actions
  const handleCompute = async () => {
    if (!selectedPayrun) return;
    setProcessing(true);
    try {
      await apiRequest(`/api/payroll/payruns/${selectedPayrun.id}/compute`, { method: 'POST' });
      await fetchPayrunDetails(selectedPayrun.id);
      await fetchPayruns();
    } catch (err) {
      alert(err.message || 'Compute failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleValidate = async () => {
    if (!selectedPayrun) return;
    setProcessing(true);
    try {
      const report = await apiRequest(`/api/payroll/payruns/${selectedPayrun.id}/validate`, { method: 'POST' });
      setValidationReport(report);
      await fetchPayrunDetails(selectedPayrun.id);
      await fetchPayruns();
    } catch (err) {
      alert(err.message || 'Validation failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!selectedPayrun) return;
    setProcessing(true);
    try {
      await apiRequest(`/api/payroll/payruns/${selectedPayrun.id}/mark-paid`, { method: 'POST' });
      await fetchPayrunDetails(selectedPayrun.id);
      await fetchPayruns();
    } catch (err) {
      alert(err.message || 'Mark paid failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleSendPayslips = async () => {
    if (!selectedPayrun) return;
    setProcessing(true);
    try {
      await apiRequest(`/api/payroll/payruns/${selectedPayrun.id}/send-payslips`, { method: 'POST' });
      await fetchPayrunDetails(selectedPayrun.id);
      await fetchPayruns();
      alert('Digital payslips have been dispatched to employees!');
    } catch (err) {
      alert(err.message || 'Send failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadPdf = async (slip) => {
    try {
      const filename = `Payslip-${slip.employee_name.replace(/\s/g, '_')}-${payrunDetails.period_month}-${payrunDetails.period_year}.pdf`;
      await downloadPayslipPdf(slip.id, filename);
    } catch (err) {
      alert(err.message || 'Download failed');
    }
  };

  const monthNames = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* View Switch: List of Payruns vs Selected Payrun Studio */}
      {!selectedPayrun ? (
        <>
          {/* Top Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1F2937' }}>Payroll Cycles & Batches</h2>
              <p style={{ fontSize: '0.8rem', color: '#64748B' }}>
                Track scheduled disbursements, compute salary rules, and generate payslips
              </p>
            </div>

            {isPayrollUser && (
              <button
                className="btn btn-primary"
                onClick={() => setShowNewModal(true)}
              >
                <Plus size={16} />
                <span>Create New Payrun</span>
              </button>
            )}
          </div>

          {/* Payruns Table */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cycle Period</th>
                  <th>Company</th>
                  <th>Created Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {payruns.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#1F2937' }}>
                        {monthNames[p.period_month]} {p.period_year}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', fontFamily: 'var(--font-mono)' }}>
                        Batch #{p.id}
                      </div>
                    </td>
                    <td>{p.company}</td>
                    <td>
                      <div style={{ fontSize: '0.825rem' }}>{p.created_at ? p.created_at.slice(0, 10) : '—'}</div>
                    </td>
                    <td>
                      <span className={`badge ${
                        p.status === 'Paid' ? 'badge-success' :
                        p.status === 'Validated' ? 'badge-info' :
                        p.status === 'Computed' ? 'badge-warning' : 'badge-neutral'
                      }`}>
                        <span className="badge-dot" />
                        {p.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => openPayrun(p)}
                      >
                        <span>Open Batch Studio</span>
                        <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* Selected Payrun Execution Studio */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Back Button and Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            paddingBottom: '16px',
            borderBottom: '1px solid #E2E8F0',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => { setSelectedPayrun(null); setPayrunDetails(null); }}
              >
                <ArrowLeft size={16} />
                <span>All Payruns</span>
              </button>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1F2937' }}>
                  Payrun: {monthNames[payrunDetails?.period_month]} {payrunDetails?.period_year}
                </h2>
                <div style={{ fontSize: '0.775rem', color: '#64748B' }}>
                  Batch #{payrunDetails?.id} • {payrunDetails?.payslips?.length || 0} Employees Enrolled
                </div>
              </div>
            </div>

            {/* Stepper Status Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className={`badge badge-lg ${
                payrunDetails?.status === 'Paid' ? 'badge-success' :
                payrunDetails?.status === 'Validated' ? 'badge-info' :
                payrunDetails?.status === 'Computed' ? 'badge-warning' : 'badge-neutral'
              }`}>
                <span className="badge-dot" />
                Current Status: {payrunDetails?.status}
              </span>
            </div>
          </div>

          {/* Stepper Workflow Visualizer & Controls */}
          <div className="card" style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#1E3A5F', fontWeight: 700, textTransform: 'uppercase' }}>
                  Step-by-Step Processing Studio
                </div>
                <div style={{ fontSize: '0.9rem', color: '#64748B', marginTop: '2px' }}>
                  {payrunDetails?.status === 'Draft' && 'Ready to compute salary rules, attendance overtime, and unpaid leave penalties.'}
                  {payrunDetails?.status === 'Computed' && 'Salaries computed. Run validation checks to ensure complete bank details & contract compliance.'}
                  {payrunDetails?.status === 'Validated' && 'Payrun verified. HR Admin can now approve disbursement.'}
                  {payrunDetails?.status === 'Paid' && 'Batch disbursed! Dispatched digital payslips to employee portals.'}
                </div>
              </div>

              {/* Action Buttons based on stage */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {payrunDetails?.status === 'Draft' && isPayrollUser && (
                  <button
                    className="btn btn-primary btn-lg"
                    disabled={processing}
                    onClick={handleCompute}
                  >
                    <Play size={18} />
                    <span>Compute Payroll</span>
                  </button>
                )}

                {payrunDetails?.status === 'Computed' && isPayrollUser && (
                  <>
                    <button
                      className="btn btn-secondary btn-lg"
                      disabled={processing}
                      onClick={handleCompute}
                      title="Re-run calculation"
                    >
                      Re-compute
                    </button>
                    <button
                      className="btn btn-primary btn-lg"
                      disabled={processing}
                      onClick={handleValidate}
                    >
                      <CheckCircle2 size={18} />
                      <span>Validate Payrun</span>
                    </button>
                  </>
                )}

                {payrunDetails?.status === 'Validated' && (
                  <>
                    <button
                      className="btn btn-secondary btn-lg"
                      onClick={() => setValidationReport({ issues: [] })}
                    >
                      View Report
                    </button>
                    {isPayrollAdmin ? (
                      <button
                        className="btn btn-success btn-lg"
                        disabled={processing}
                        onClick={handleMarkPaid}
                      >
                        <DollarSign size={18} />
                        <span>Mark Paid (Approve Batch)</span>
                      </button>
                    ) : (
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        (Requires HR Payroll Admin to mark paid)
                      </div>
                    )}
                  </>
                )}

                {payrunDetails?.status === 'Paid' && isPayrollUser && (
                  <button
                    className="btn btn-primary btn-lg"
                    disabled={processing}
                    onClick={handleSendPayslips}
                  >
                    <Send size={18} />
                    <span>Send Digital Payslips</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Payslips Table */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1F2937' }}>Employee Payslips</h3>
              <span className="badge badge-info">{payrunDetails?.payslips?.length || 0} Slips</span>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Gross Wage</th>
                    <th>Deductions</th>
                    <th>Net Pay</th>
                    <th>Warnings</th>
                    <th>Sent</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payrunDetails?.payslips?.map((slip) => (
                    <tr key={slip.id}>
                      <td>
                        <span style={{ fontWeight: 600, color: '#1F2937' }}>{slip.employee_name}</span>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>
                          ₹{slip.gross?.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', color: slip.deductions > 0 ? '#B42318' : '#64748B' }}>
                          {slip.deductions > 0 ? `-₹${slip.deductions.toLocaleString('en-IN')}` : '₹0'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#2E7D5B', fontSize: '1rem' }}>
                          ₹{slip.net?.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td>
                        {slip.warnings?.length > 0 ? (
                          <span className="badge badge-warning" title={slip.warnings.join(', ')}>
                            <AlertTriangle size={12} />
                            <span>{slip.warnings.length} Issue(s)</span>
                          </span>
                        ) : (
                          <span className="badge badge-success">
                            <CheckCircle2 size={12} />
                            <span>Clean</span>
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${slip.sent ? 'badge-success' : 'badge-neutral'}`}>
                          {slip.sent ? 'Sent' : 'Draft'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setInspectedSlip(slip)}
                          >
                            <Eye size={13} />
                            <span>Breakdown</span>
                          </button>
                          <button
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => handleDownloadPdf(slip)}
                            title="Download PDF"
                          >
                            <Download size={13} />
                            <span>PDF</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* New Payrun Creation Modal */}
      {showNewModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem', color: '#1F2937' }}>Initiate Payroll Run</h3>
              <button
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
                onClick={() => setShowNewModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreatePayrun}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Period Month</label>
                    <select
                      className="form-control"
                      value={newMonth}
                      onChange={(e) => setNewMonth(+e.target.value)}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                        <option key={m} value={m}>{monthNames[m]}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Period Year</label>
                    <select
                      className="form-control"
                      value={newYear}
                      onChange={(e) => setNewYear(+e.target.value)}
                    >
                      <option value={2026}>2026</option>
                      <option value={2025}>2025</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Default Salary Structure</label>
                  <select
                    className="form-control"
                    value={selectedStructure}
                    onChange={(e) => setSelectedStructure(e.target.value)}
                  >
                    {structures.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Eligible Employees Checklist */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>
                      Eligible Employees with Active Contracts ({eligible.length})
                    </label>
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: '#1E3A5F', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                      onClick={() => {
                        if (selectedEmpIds.length === eligible.length) setSelectedEmpIds([]);
                        else setSelectedEmpIds(eligible.map((e) => e.id));
                      }}
                    >
                      {selectedEmpIds.length === eligible.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  {loadingEligible ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#64748B' }}>
                      Evaluating active contracts...
                    </div>
                  ) : eligible.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#64748B' }}>
                      No active contracts found covering this month.
                    </div>
                  ) : (
                    <div style={{
                      maxHeight: '200px',
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      padding: '8px',
                      background: '#F8F9FA',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid #E2E8F0',
                    }}>
                      {eligible.map((emp) => {
                        const checked = selectedEmpIds.includes(emp.id);
                        return (
                          <label
                            key={emp.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '8px 12px',
                              borderRadius: 'var(--radius-xs)',
                              background: checked ? 'rgba(30, 58, 95, 0.08)' : 'transparent',
                              cursor: 'pointer',
                              fontSize: '0.825rem',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedEmpIds([...selectedEmpIds, emp.id]);
                                else setSelectedEmpIds(selectedEmpIds.filter((id) => id !== emp.id));
                              }}
                            />
                            <span style={{ fontWeight: 600, color: '#1F2937' }}>{emp.name}</span>
                            <span style={{ color: '#64748B' }}>({emp.position})</span>
                            <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', color: '#2E7D5B', fontWeight: 600 }}>
                              ₹{emp.contract?.wage?.toLocaleString('en-IN')}/mo
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowNewModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={processing || selectedEmpIds.length === 0}
                >
                  {processing ? 'Creating...' : `Create Payrun (${selectedEmpIds.length} Selected)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Validation Report Modal */}
      {validationReport && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={20} color="#2E7D5B" />
                <h3 style={{ fontSize: '1.15rem', color: '#1F2937' }}>Payrun Validation Audit</h3>
              </div>
              <button
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
                onClick={() => setValidationReport(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: '#F8F9FA',
                borderRadius: 'var(--radius-md)',
                border: '1px solid #E2E8F0',
              }}>
                <span style={{ color: '#64748B' }}>Total Payslips Scanned:</span>
                <strong style={{ color: '#1F2937' }}>{payrunDetails?.payslips?.length || 0}</strong>
              </div>

              <div>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '8px', color: '#1F2937' }}>Audited Flags & Warnings</h4>
                {validationReport.issues?.length === 0 ? (
                  <div style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(46, 125, 91, 0.08)',
                    border: '1px solid rgba(46, 125, 91, 0.25)',
                    color: '#2E7D5B',
                    fontSize: '0.85rem',
                    textAlign: 'center',
                    fontWeight: 600,
                  }}>
                    All payslips passed integrity checks with 0 critical blockers!
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {validationReport.issues?.map((iss, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-md)',
                          background: 'rgba(183, 121, 31, 0.08)',
                          border: '1px solid rgba(183, 121, 31, 0.25)',
                          color: '#B7791F',
                          fontSize: '0.825rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                        <span>{iss.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-primary"
                onClick={() => setValidationReport(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Payslip Breakdown Drawer */}
      {inspectedSlip && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.15rem', color: '#1F2937' }}>Payslip Itemization</h3>
                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                  {inspectedSlip.employee_name} • {monthNames[payrunDetails?.period_month]} {payrunDetails?.period_year}
                </div>
              </div>
              <button
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
                onClick={() => setInspectedSlip(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Warnings Banner if any */}
              {inspectedSlip.warnings?.length > 0 && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(183, 121, 31, 0.08)',
                  border: '1px solid rgba(183, 121, 31, 0.25)',
                  color: '#B7791F',
                  fontSize: '0.8rem',
                }}>
                  {inspectedSlip.warnings.join('; ')}
                </div>
              )}

              {/* Line Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {inspectedSlip.lines?.map((line, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: '#F8F9FA',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid #E2E8F0',
                      fontSize: '0.85rem',
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600, color: '#1F2937' }}>{line.name}</span>
                      <span style={{
                        marginLeft: '8px',
                        fontSize: '0.7rem',
                        color: line.category === 'Deduction' ? '#B42318' : '#1E3A5F',
                        fontWeight: 600,
                      }}>
                        {line.category}
                      </span>
                    </div>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                      color: line.category === 'Deduction' ? '#B42318' : '#1F2937',
                    }}>
                      {line.category === 'Deduction' ? '-' : '+'}₹{Math.abs(line.amount).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Summary Totals */}
              <div style={{
                marginTop: '10px',
                padding: '16px',
                background: '#F8F9FA',
                borderRadius: 'var(--radius-md)',
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: '#64748B' }}>Gross Earnings:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#1F2937' }}>
                    ₹{inspectedSlip.gross?.toLocaleString('en-IN')}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: '#64748B' }}>Total Deductions:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: '#B42318', fontWeight: 600 }}>
                    -₹{inspectedSlip.deductions?.toLocaleString('en-IN')}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  paddingTop: '8px',
                  borderTop: '1px solid #E2E8F0',
                  color: '#1F2937',
                }}>
                  <span>Net Take-Home Pay:</span>
                  <span style={{ color: '#2E7D5B', fontFamily: 'var(--font-mono)' }}>
                    ₹{inspectedSlip.net?.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-outline-primary"
                onClick={() => handleDownloadPdf(inspectedSlip)}
              >
                <Download size={15} />
                <span>Download Official PDF</span>
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setInspectedSlip(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
