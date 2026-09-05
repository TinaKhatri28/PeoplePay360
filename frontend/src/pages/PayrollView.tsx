import React, { useState, useEffect, FormEvent } from 'react';
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
  DollarSign,
  LayoutDashboard,
  Coins
} from 'lucide-react';
import { apiRequest, downloadPayslipPdf } from '../api';
import { useAuth } from '../context/AuthContext';
import { Payrun, Payslip, Employee, SalaryStructure } from '../types';
import PayrollDashboardView from '../components/PayrollDashboardView';

export default function PayrollView() {
  const { isPayrollUser, isPayrollAdmin } = useAuth();
  const [payruns, setPayruns] = useState<Payrun[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayrun, setSelectedPayrun] = useState<Payrun | null>(null);
  const [payrunDetails, setPayrunDetails] = useState<Payrun | null>(null);
  const [payrollSubTab, setPayrollSubTab] = useState<'dashboard' | 'batches'>('dashboard');

  const [showNewModal, setShowNewModal] = useState(false);
  const [newYear, setNewYear] = useState<number>(2026);
  const [newMonth, setNewMonth] = useState<number>(9);
  const [eligible, setEligible] = useState<Employee[]>([]);
  const [selectedEmpIds, setSelectedEmpIds] = useState<number[]>([]);
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [selectedStructure, setSelectedStructure] = useState<string>('');
  const [loadingEligible, setLoadingEligible] = useState(false);

  const [validationReport, setValidationReport] = useState<{ valid?: number; total?: number; issues?: Array<{ type: string; message: string }> } | null>(null);
  const [inspectedSlip, setInspectedSlip] = useState<Payslip | null>(null);
  const [processing, setProcessing] = useState(false);

  const fetchPayruns = async () => {
    try {
      const data = await apiRequest<Payrun[]>('/api/payroll/payruns');
      setPayruns(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayrunDetails = async (id: number) => {
    try {
      const data = await apiRequest<Payrun>(`/api/payroll/payruns/${id}`);
      setPayrunDetails(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPayruns();
  }, []);

  const openPayrun = async (run: Partial<Payrun> & { id: number }) => {
    setSelectedPayrun(run as Payrun);
    fetchPayrunDetails(run.id);
  };

  const fetchEligible = async () => {
    setLoadingEligible(true);
    try {
      const [elData, structData] = await Promise.all([
        apiRequest<Employee[]>(`/api/payroll/eligible-employees?year=${newYear}&month=${newMonth}`),
        apiRequest<SalaryStructure[]>('/api/salary/structures'),
      ]);
      setEligible(elData);
      setSelectedEmpIds(elData.map((e) => e.id));
      setStructures(structData);
      if (structData.length > 0) setSelectedStructure(String(structData[0].id));
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

  const handleCreatePayrun = async (e: FormEvent) => {
    e.preventDefault();
    if (selectedEmpIds.length === 0) {
      alert('Please select at least one employee');
      return;
    }
    setProcessing(true);
    try {
      const res = await apiRequest<{ id: number }>('/api/payroll/payruns', {
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
    } catch (err: any) {
      alert(err.message || 'Failed to create payrun');
    } finally {
      setProcessing(false);
    }
  };

  const handleCompute = async () => {
    if (!selectedPayrun) return;
    setProcessing(true);
    try {
      await apiRequest(`/api/payroll/payruns/${selectedPayrun.id}/compute`, { method: 'POST' });
      await fetchPayrunDetails(selectedPayrun.id);
      await fetchPayruns();
    } catch (err: any) {
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
    } catch (err: any) {
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
    } catch (err: any) {
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
    } catch (err: any) {
      alert(err.message || 'Send failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadPdf = async (slip: Payslip) => {
    try {
      const filename = `Payslip-${slip.employee_name.replace(/\s/g, '_')}-${payrunDetails?.period_month}-${payrunDetails?.period_year}.pdf`;
      await downloadPayslipPdf(slip.id, filename);
    } catch (err: any) {
      alert(err.message || 'Download failed');
    }
  };

  const monthNames = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Selection for Batches Table
  const [selectedPayrunIds, setSelectedPayrunIds] = useState<number[]>([]);
  const isAllPayrunsSelected = payruns.length > 0 && payruns.every((p) => selectedPayrunIds.includes(p.id));
  const isSomePayrunsSelected = selectedPayrunIds.length > 0 && !isAllPayrunsSelected;

  const handleToggleSelectAllPayruns = () => {
    if (isAllPayrunsSelected) setSelectedPayrunIds([]);
    else setSelectedPayrunIds(payruns.map((p) => p.id));
  };

  const handleToggleSelectOnePayrun = (id: number, e?: React.MouseEvent | React.ChangeEvent) => {
    if (e) e.stopPropagation();
    setSelectedPayrunIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const exportPayrunsCSV = () => {
    const targets = selectedPayrunIds.length > 0
      ? payruns.filter((p) => selectedPayrunIds.includes(p.id))
      : payruns;

    const headers = ['Batch ID', 'Cycle Period', 'Company', 'Created Date', 'Status'];
    const rows = targets.map((p) => [
      p.id,
      `${monthNames[p.period_month]} ${p.period_year}`,
      p.company || '',
      p.created_at ? p.created_at.slice(0, 10) : '',
      p.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [
      headers.join(','),
      ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `payroll_batches_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Selection for Payslips Table
  const [selectedSlipIds, setSelectedSlipIds] = useState<number[]>([]);
  const slips = payrunDetails?.payslips || [];
  const isAllSlipsSelected = slips.length > 0 && slips.every((s) => selectedSlipIds.includes(s.id));
  const isSomeSlipsSelected = selectedSlipIds.length > 0 && !isAllSlipsSelected;

  const handleToggleSelectAllSlips = () => {
    if (isAllSlipsSelected) setSelectedSlipIds([]);
    else setSelectedSlipIds(slips.map((s) => s.id));
  };

  const handleToggleSelectOneSlip = (id: number, e?: React.MouseEvent | React.ChangeEvent) => {
    if (e) e.stopPropagation();
    setSelectedSlipIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const exportPayslipsCSV = () => {
    const targets = selectedSlipIds.length > 0
      ? slips.filter((s) => selectedSlipIds.includes(s.id))
      : slips;

    const headers = ['Payslip ID', 'Employee Name', 'Gross Wage', 'Deductions', 'Net Pay', 'Warnings', 'Sent Status'];
    const rows = targets.map((s) => [
      s.id,
      s.employee_name,
      s.gross || 0,
      s.deductions || 0,
      s.net || 0,
      s.warnings ? s.warnings.join('; ') : '',
      s.sent ? 'Sent' : 'Draft',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [
      headers.join(','),
      ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `payslips_batch_${selectedPayrun?.id || ''}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && !payruns.length) {
    return <div style={{ padding: '20px', color: '#64748B' }}>Loading payroll studio...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {!selectedPayrun ? (
        <>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: '#FFFFFF',
            padding: '8px 12px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid #E2E8F0',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <button
              onClick={() => setPayrollSubTab('dashboard')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: payrollSubTab === 'dashboard' ? '#1E3A5F' : 'transparent',
                color: payrollSubTab === 'dashboard' ? '#FFFFFF' : '#64748B',
                border: 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <LayoutDashboard size={16} />
              <span>Payroll Analytics Dashboard</span>
            </button>

            <button
              onClick={() => setPayrollSubTab('batches')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: payrollSubTab === 'batches' ? '#1E3A5F' : 'transparent',
                color: payrollSubTab === 'batches' ? '#FFFFFF' : '#64748B',
                border: 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <Coins size={16} />
              <span>Payrun Cycles & Batches ({payruns.length})</span>
            </button>
          </div>

          {payrollSubTab === 'dashboard' ? (
            <PayrollDashboardView onTabChange={(tab) => {
              if (tab === 'batches' || tab === 'payroll') {
                setPayrollSubTab('batches');
                if (tab === 'batches') {
                  setShowNewModal(true);
                }
              }
            }} />
          ) : (
            <>
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

              {/* Contextual Bulk Action Bar for Payrun Batches */}
              {selectedPayrunIds.length > 0 && (
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
                  animation: 'fadeIn 0.2s ease',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="badge badge-primary">{selectedPayrunIds.length} Selected</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600 }}>
                      {selectedPayrunIds.length === payruns.length
                        ? 'All payrun batches selected'
                        : `${selectedPayrunIds.length} of ${payruns.length} payrun batches selected`}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={exportPayrunsCSV}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}
                    >
                      <Download size={14} />
                      <span>Export CSV</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setSelectedPayrunIds([])}
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
                      checked={isAllPayrunsSelected}
                      ref={(input) => {
                        if (input) input.indeterminate = isSomePayrunsSelected;
                      }}
                      onChange={handleToggleSelectAllPayruns}
                      title="Select All Payruns"
                      style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#000000' }}
                    />
                  </th>
                  <th>Cycle Period</th>
                  <th>Company</th>
                  <th>Created Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {payruns.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#64748B' }}>
                      No payrun batches found.
                    </td>
                  </tr>
                ) : (
                  payruns.map((p) => {
                    const isSelected = selectedPayrunIds.includes(p.id);
                    return (
                      <tr
                        key={p.id}
                        style={{
                          backgroundColor: isSelected ? 'rgba(0, 0, 0, 0.03)' : undefined,
                          transition: 'background-color 0.15s ease',
                        }}
                      >
                        <td style={{ textAlign: 'center', padding: '10px 12px' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleToggleSelectOnePayrun(p.id, e)}
                            style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#000000' }}
                            title={`Select batch #${p.id}`}
                          />
                        </td>
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
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
                  Payrun: {monthNames[payrunDetails?.period_month || 0]} {payrunDetails?.period_year}
                </h2>
                <div style={{ fontSize: '0.775rem', color: '#64748B' }}>
                  Batch #{payrunDetails?.id} • {payrunDetails?.payslips?.length || 0} Employees Enrolled
                </div>
              </div>
            </div>

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

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1F2937' }}>Employee Payslips</h3>
              <span className="badge badge-info">{payrunDetails?.payslips?.length || 0} Slips</span>
            </div>

            {/* Contextual Bulk Action Bar for Payslips */}
            {selectedSlipIds.length > 0 && (
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
                  <span className="badge badge-primary">{selectedSlipIds.length} Selected</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600 }}>
                    {selectedSlipIds.length === slips.length
                      ? 'All payslips in batch selected'
                      : `${selectedSlipIds.length} of ${slips.length} payslips selected`}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={exportPayslipsCSV}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}
                  >
                    <Download size={14} />
                    <span>Export CSV</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setSelectedSlipIds([])}
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
                        checked={isAllSlipsSelected}
                        ref={(input) => {
                          if (input) input.indeterminate = isSomeSlipsSelected;
                        }}
                        onChange={handleToggleSelectAllSlips}
                        title="Select All Payslips"
                        style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#000000' }}
                      />
                    </th>
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
                  {slips.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: '#64748B' }}>
                        No payslips found in this payrun.
                      </td>
                    </tr>
                  ) : (
                    slips.map((slip) => {
                      const isSelected = selectedSlipIds.includes(slip.id);
                      return (
                        <tr
                          key={slip.id}
                          style={{
                            backgroundColor: isSelected ? 'rgba(0, 0, 0, 0.03)' : undefined,
                            transition: 'background-color 0.15s ease',
                          }}
                        >
                          <td style={{ textAlign: 'center', padding: '10px 12px' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => handleToggleSelectOneSlip(slip.id, e)}
                              style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#000000' }}
                              title={`Select payslip for ${slip.employee_name}`}
                            />
                          </td>
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
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

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

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label className="form-label" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        aria-label="Select all eligible employees"
                        checked={eligible.length > 0 && selectedEmpIds.length === eligible.length}
                        ref={(el) => {
                          if (el) {
                            el.indeterminate = selectedEmpIds.length > 0 && selectedEmpIds.length < eligible.length;
                          }
                        }}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedEmpIds(eligible.map((emp) => emp.id));
                          else setSelectedEmpIds([]);
                        }}
                        style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#1E3A5F' }}
                      />
                      <span>Eligible Employees ({selectedEmpIds.length}/{eligible.length})</span>
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

      {inspectedSlip && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.15rem', color: '#1F2937' }}>Payslip Itemization</h3>
                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                  {inspectedSlip.employee_name} • {monthNames[payrunDetails?.period_month || 0]} {payrunDetails?.period_year}
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
                        [{line.category}]
                      </span>
                    </div>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      color: line.category === 'Deduction' ? '#B42318' : '#1F2937',
                    }}>
                      {line.category === 'Deduction' ? '-' : ''}₹{Math.abs(line.amount).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{
                padding: '14px',
                background: 'rgba(30, 58, 95, 0.06)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(30, 58, 95, 0.2)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Net Take-Home Pay</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2E7D5B', fontFamily: 'var(--font-mono)' }}>
                    ₹{inspectedSlip.net?.toLocaleString('en-IN')}
                  </div>
                </div>
                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => handleDownloadPdf(inspectedSlip)}
                >
                  <Download size={14} />
                  <span>Download PDF Payslip</span>
                </button>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setInspectedSlip(null)}
              >
                Close Breakdown
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
