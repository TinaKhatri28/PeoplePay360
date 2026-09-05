import React, { useState, useEffect, FormEvent } from 'react';
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Calendar,
  X,
  CreditCard,
  Briefcase,
  ArrowLeft,
  Building2,
  Clock,
  UserCheck,
  Edit3,
  ExternalLink,
  ShieldCheck,
  Layers,
  ChevronRight,
  Info,
  Download
} from 'lucide-react';
import { apiRequest } from '../api';
import { useAuth } from '../context/AuthContext';
import { Contract, Employee, SalaryStructure, WorkingSchedule } from '../types';

interface ContractsViewProps {
  onNavigate?: (tab: string) => void;
}

export default function ContractsView({ onNavigate }: ContractsViewProps = {}) {
  const { isPayrollUser } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [schedules, setSchedules] = useState<WorkingSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [search, setSearch] = useState('');

  // Selected Contract Detail State (Form view of one contract)
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // New Contract Modal State
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit Contract Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    wage: '',
    status: 'Running',
    start_date: '',
    end_date: '',
    department: '',
    position: '',
    schedule_id: '',
    salary_structure_id: '',
  });

  const [formData, setFormData] = useState({
    employee_id: '',
    wage: '',
    start_date: new Date().toISOString().slice(0, 10),
    end_date: '',
    status: 'Running',
    salary_structure_id: '',
    schedule_id: '',
  });

  const formatDate = (dateStr?: string | null): string => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getUTCDate()).padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[d.getUTCMonth()];
      const year = d.getUTCFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return dateStr;
    }
  };

  const fetchData = async () => {
    try {
      const [cData, empData, structData, schedData] = await Promise.all([
        apiRequest<Contract[]>('/api/contracts'),
        apiRequest<Employee[]>('/api/employees'),
        apiRequest<SalaryStructure[]>('/api/salary/structures').catch(() => []),
        apiRequest<WorkingSchedule[]>('/api/schedules').catch(() => []),
      ]);
      setContracts(cData || []);
      setEmployees(empData || []);
      setStructures(structData || []);
      setSchedules(schedData || []);
    } catch (err) {
      console.error('Failed to fetch contract dependencies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openContractDetails = async (c: Contract) => {
    setSelectedContract(c);
    setLoadingDetail(true);
    try {
      const detail = await apiRequest<Contract>(`/api/contracts/${c.id}`);
      setSelectedContract(detail);
    } catch (err) {
      console.error('Failed to fetch contract details:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCreateContract = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const res = await apiRequest<any>('/api/contracts', {
        method: 'POST',
        body: {
          ...formData,
          employee_id: formData.employee_id,
          wage: +formData.wage,
          salary_structure_id: formData.salary_structure_id || null,
          schedule_id: formData.schedule_id || null,
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
      await fetchData();
      if (res?.id) {
        const newlyCreated = await apiRequest<Contract>(`/api/contracts/${res.id}`).catch(() => null);
        if (newlyCreated) setSelectedContract(newlyCreated);
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to create contract');
    } finally {
      setSubmitting(false);
    }
  };

  const startEditContract = (c: Contract) => {
    setEditFormData({
      wage: String(c.wage || ''),
      status: c.status || 'Running',
      start_date: c.start_date ? new Date(c.start_date).toISOString().slice(0, 10) : '',
      end_date: c.end_date ? new Date(c.end_date).toISOString().slice(0, 10) : '',
      department: c.department || c.employee?.department?.name || '',
      position: c.position || c.employee?.position || '',
      schedule_id: String(c.schedule_id || ''),
      salary_structure_id: String(c.salary_structure_id || ''),
    });
    setShowEditModal(true);
  };

  const handleUpdateContract = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedContract) return;
    setFormError(null);
    setSubmitting(true);
    try {
      const updated = await apiRequest<Contract>(`/api/contracts/${selectedContract.id}`, {
        method: 'PUT',
        body: {
          wage: +editFormData.wage,
          status: editFormData.status,
          start_date: editFormData.start_date,
          end_date: editFormData.end_date || null,
          department: editFormData.department || null,
          position: editFormData.position || null,
          schedule_id: editFormData.schedule_id || null,
          salary_structure_id: editFormData.salary_structure_id || null,
        },
      });
      setShowEditModal(false);
      setSelectedContract(updated || { ...selectedContract, ...editFormData, wage: +editFormData.wage } as any);
      fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update contract');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusToggle = async (newStatus: 'Running' | 'Expired') => {
    if (!selectedContract) return;
    try {
      const updated = await apiRequest<Contract>(`/api/contracts/${selectedContract.id}`, {
        method: 'PUT',
        body: { status: newStatus },
      });
      setSelectedContract(updated || { ...selectedContract, status: newStatus });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to change contract status');
    }
  };

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filtered = contracts.filter((c) => {
    if (filterStatus !== 'All' && c.status !== filterStatus) return false;
    if (search) {
      const term = search.toLowerCase();
      const matchRef = c.ref?.toLowerCase().includes(term);
      const matchName = (c.employee_name || `${c.employee?.first_name || ''} ${c.employee?.last_name || ''}`)
        .toLowerCase()
        .includes(term);
      if (!matchRef && !matchName) return false;
    }
    return true;
  });

  const isAllSelected = filtered.length > 0 && filtered.every((c) => selectedIds.includes(String(c.id)));
  const isSomeSelected = selectedIds.length > 0 && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((c) => String(c.id)));
    }
  };

  const handleToggleSelectOne = (id: string | number, e?: React.MouseEvent | React.ChangeEvent) => {
    if (e) e.stopPropagation();
    const strId = String(id);
    setSelectedIds((prev) =>
      prev.includes(strId) ? prev.filter((item) => item !== strId) : [...prev, strId]
    );
  };

  const exportSelectedCSV = () => {
    const targetContracts = selectedIds.length > 0
      ? contracts.filter((c) => selectedIds.includes(String(c.id)))
      : filtered;

    const headers = ['Contract Ref', 'Employee Name', 'Department', 'Position', 'Monthly Wage', 'Start Date', 'End Date', 'Status'];
    const rows = targetContracts.map((c) => [
      c.ref,
      c.employee_name || `${c.employee?.first_name || ''} ${c.employee?.last_name || ''}`,
      c.department || c.employee?.department?.name || '',
      c.position || c.employee?.position || '',
      c.wage || 0,
      c.start_date || '',
      c.end_date || '',
      c.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [
      headers.join(','),
      ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `contracts_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && !contracts.length) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: '#64748B',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
      }}>
        <div style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          border: '3px solid #E2E8F0',
          borderTopColor: '#1E3A5F',
          animation: 'spin 0.8s linear infinite',
        }} />
        <span>Loading employment contracts...</span>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: CONTRACT DETAILS FORM VIEW (Matching Excalidraw Blueprint)
  // =========================================================================
  if (selectedContract) {
    const empName = selectedContract.employee_name ||
      (selectedContract.employee ? `${selectedContract.employee.first_name} ${selectedContract.employee.last_name}` : 'Unknown Employee');
    const empEmail = selectedContract.employee?.email || 'N/A';
    const deptName = selectedContract.department || selectedContract.employee?.department?.name || 'General';
    const positionName = selectedContract.position || selectedContract.employee?.position || 'Staff';
    const scheduleTitle = selectedContract.schedule_name || selectedContract.schedule?.name || '40 Hours / Week';
    const structureTitle = selectedContract.salary_structure_name || selectedContract.salary_structure?.name || 'Employee Salary';
    const rules = selectedContract.salary_structure?.rules || [];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Top Breadcrumb & Actions Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={() => setSelectedContract(null)}
              className="btn btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                fontWeight: 600,
                color: '#1E3A5F',
                borderColor: '#E2E8F0',
                background: '#FFFFFF',
              }}
            >
              <ArrowLeft size={16} />
              <span>Back to Contracts</span>
            </button>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>
                  Contracts /
                </span>
                <h2 style={{
                  fontSize: '1.35rem',
                  fontWeight: 800,
                  color: '#1E3A5F',
                  fontFamily: 'var(--font-mono)',
                  margin: 0,
                }}>
                  {selectedContract.ref}
                </h2>
                <span className={`badge ${
                  selectedContract.status === 'Running' ? 'badge-success' :
                  selectedContract.status === 'Expired' ? 'badge-neutral' : 'badge-warning'
                }`}>
                  <span className="badge-dot" />
                  {selectedContract.status}
                </span>
              </div>
              <p style={{ fontSize: '0.775rem', color: '#64748B', margin: '3px 0 0 0' }}>
                Form view of one contract • Linked to employee payroll calculations
              </p>
            </div>
          </div>

          {/* Action Controls for HR / Payroll Admin */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isPayrollUser && (
              <>
                {selectedContract.status === 'Running' ? (
                  <button
                    onClick={() => handleStatusToggle('Expired')}
                    className="btn btn-secondary"
                    style={{
                      color: '#B42318',
                      borderColor: 'rgba(180, 35, 24, 0.3)',
                      background: 'rgba(180, 35, 24, 0.05)',
                    }}
                  >
                    Mark Expired
                  </button>
                ) : (
                  <button
                    onClick={() => handleStatusToggle('Running')}
                    className="btn btn-secondary"
                    style={{
                      color: '#2E7D5B',
                      borderColor: 'rgba(46, 125, 91, 0.3)',
                      background: 'rgba(46, 125, 91, 0.05)',
                    }}
                  >
                    Set as Running
                  </button>
                )}

                <button
                  onClick={() => startEditContract(selectedContract)}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Edit3 size={15} />
                  <span>Edit Contract</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Main Contract Details Card (Two-Column Excalidraw Form View) */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
          padding: '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '28px',
        }}>
          {/* Header Banner */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '20px',
            borderBottom: '1px solid #E2E8F0',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(30, 58, 95, 0.08)',
                color: '#1E3A5F',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <FileText size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1E3A5F', margin: 0 }}>
                  Contract / {selectedContract.ref}
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                  Form View of one contract
                </span>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              background: '#F8F9FA',
              borderRadius: 'var(--radius-full)',
              border: '1px solid #E2E8F0',
              fontSize: '0.8rem',
              color: '#1F2937',
              fontWeight: 600,
            }}>
              <span>Status:</span>
              <span style={{
                color: selectedContract.status === 'Running' ? '#2E7D5B' : selectedContract.status === 'Expired' ? '#64748B' : '#B7791F',
                fontWeight: 700,
              }}>
                ● {selectedContract.status}
              </span>
            </div>
          </div>

          {/* Form View 2-Column Grid (Direct representation from Excalidraw) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px 32px',
          }}>
            {/* LEFT COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Field 1: Employee */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B', display: 'block', marginBottom: '6px' }}>
                  Employee
                </label>
                <div style={{
                  padding: '12px 16px',
                  background: '#F8F9FA',
                  border: '1px solid #E2E8F0',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: '#1E3A5F',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                  }}>
                    {empName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#1F2937', fontSize: '0.95rem' }}>{empName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{empEmail}</div>
                  </div>
                </div>
              </div>

              {/* Field 2: Start Date */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B', display: 'block', marginBottom: '6px' }}>
                  Start Date
                </label>
                <div style={{
                  padding: '12px 16px',
                  background: '#F8F9FA',
                  border: '1px solid #E2E8F0',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '0.9rem',
                  color: '#1F2937',
                  fontWeight: 600,
                  fontFamily: 'var(--font-mono)',
                }}>
                  <Calendar size={16} color="#1E3A5F" />
                  <span>{formatDate(selectedContract.start_date)}</span>
                </div>
              </div>

              {/* Field 3: End Date */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B', display: 'block', marginBottom: '6px' }}>
                  End Date
                </label>
                <div style={{
                  padding: '12px 16px',
                  background: '#F8F9FA',
                  border: '1px solid #E2E8F0',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '0.9rem',
                  color: selectedContract.end_date ? '#1F2937' : '#94A3B8',
                  fontWeight: 600,
                  fontFamily: 'var(--font-mono)',
                }}>
                  <Calendar size={16} color="#64748B" />
                  <span>{selectedContract.end_date ? formatDate(selectedContract.end_date) : '— (Open-ended)'}</span>
                </div>
              </div>

              {/* Field 4: Status */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B', display: 'block', marginBottom: '6px' }}>
                  Status
                </label>
                <div style={{
                  padding: '12px 16px',
                  background: '#F8F9FA',
                  border: '1px solid #E2E8F0',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <span style={{ fontWeight: 700, color: '#1F2937' }}>{selectedContract.status}</span>
                  <span className={`badge ${
                    selectedContract.status === 'Running' ? 'badge-success' :
                    selectedContract.status === 'Expired' ? 'badge-neutral' : 'badge-warning'
                  }`}>
                    <span className="badge-dot" />
                    {selectedContract.status === 'Running' ? 'Active in Payroll' : selectedContract.status}
                  </span>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Field 5: Department */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B', display: 'block', marginBottom: '6px' }}>
                  Department
                </label>
                <div style={{
                  padding: '12px 16px',
                  background: '#F8F9FA',
                  border: '1px solid #E2E8F0',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '0.9rem',
                  color: '#1F2937',
                  fontWeight: 600,
                }}>
                  <Building2 size={16} color="#1E3A5F" />
                  <span>{deptName}</span>
                </div>
              </div>

              {/* Field 6: Job Position */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B', display: 'block', marginBottom: '6px' }}>
                  Job Position
                </label>
                <div style={{
                  padding: '12px 16px',
                  background: '#F8F9FA',
                  border: '1px solid #E2E8F0',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '0.9rem',
                  color: '#1F2937',
                  fontWeight: 600,
                }}>
                  <Briefcase size={16} color="#1E3A5F" />
                  <span>{positionName}</span>
                </div>
              </div>

              {/* Field 7: Wage / Month */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B', display: 'block', marginBottom: '6px' }}>
                  Wage / Month
                </label>
                <div style={{
                  padding: '12px 16px',
                  background: 'rgba(46, 125, 91, 0.06)',
                  border: '1px solid rgba(46, 125, 91, 0.25)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CreditCard size={18} color="#2E7D5B" />
                    <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#2E7D5B', fontFamily: 'var(--font-mono)' }}>
                      ₹{Number(selectedContract.wage || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#2E7D5B', fontWeight: 600 }}>
                    Monthly Base
                  </span>
                </div>
              </div>

              {/* Field 8: Working Schedule */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B', display: 'block', marginBottom: '6px' }}>
                  Working Schedule
                </label>
                <div style={{
                  padding: '12px 16px',
                  background: '#F8F9FA',
                  border: '1px solid #E2E8F0',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '0.9rem',
                  color: '#1F2937',
                  fontWeight: 600,
                }}>
                  <Clock size={16} color="#1E3A5F" />
                  <span>{scheduleTitle}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Salary Structure / Notes (Excalidraw Card) */}
          <div style={{
            background: '#F8F9FA',
            border: '1px solid #E2E8F0',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={18} color="#1E3A5F" />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1E3A5F', margin: 0 }}>
                  Salary Structure / Notes
                </h4>
              </div>
              <span className="badge badge-primary">
                Structure Type: {structureTitle}
              </span>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#1F2937', margin: 0, lineHeight: 1.5 }}>
              This running contract is the source for payroll calculation in the active period.
            </p>

            {rules.length > 0 && (
              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                  Configured Salary Rules & Components ({rules.length}):
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                  {rules.map((r: any) => (
                    <div key={r.id} style={{
                      background: '#FFFFFF',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #E2E8F0',
                      fontSize: '0.8rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <span style={{ fontWeight: 600, color: '#1E3A5F' }}>{r.name}</span>
                      <span style={{ fontSize: '0.725rem', fontFamily: 'var(--font-mono)', color: r.category === 'Deduction' ? '#B42318' : '#2E7D5B' }}>
                        {r.code} ({r.category})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Useful Note Box (Matching Excalidraw Blueprint exactly) */}
          <div style={{
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(30, 58, 95, 0.05)',
            border: '1px solid rgba(30, 58, 95, 0.15)',
            fontSize: '0.825rem',
            color: '#1E3A5F',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            lineHeight: 1.5,
          }}>
            <Info size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Useful note:</strong> For the problem statement, one employee should not have multiple Running contracts for the same period. If an overlapping Running contract is created or updated, previous contracts are automatically transitioned to Expired to ensure clean payroll execution.
            </div>
          </div>
        </div>

        {/* Edit Contract Modal */}
        {showEditModal && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '640px' }}>
              <div className="modal-header">
                <h3 style={{ fontSize: '1.15rem' }}>Edit Contract / {selectedContract.ref}</h3>
                <button
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  onClick={() => setShowEditModal(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUpdateContract}>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {formError && (
                    <div style={{
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(180, 35, 24, 0.1)',
                      color: '#B42318',
                      fontSize: '0.825rem',
                    }}>
                      {formError}
                    </div>
                  )}

                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Monthly Base Wage (₹) *</label>
                      <input
                        type="number"
                        className="form-control"
                        value={editFormData.wage}
                        onChange={(e) => setEditFormData({ ...editFormData, wage: e.target.value })}
                        required
                        min="1"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Contract Status</label>
                      <select
                        className="form-control"
                        value={editFormData.status}
                        onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
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
                        value={editFormData.start_date}
                        onChange={(e) => setEditFormData({ ...editFormData, start_date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">End Date (Optional)</label>
                      <input
                        type="date"
                        className="form-control"
                        value={editFormData.end_date}
                        onChange={(e) => setEditFormData({ ...editFormData, end_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Department</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Finance"
                        value={editFormData.department}
                        onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Job Position</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Payroll Specialist"
                        value={editFormData.position}
                        onChange={(e) => setEditFormData({ ...editFormData, position: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Salary Structure</label>
                      <select
                        className="form-control"
                        value={editFormData.salary_structure_id}
                        onChange={(e) => setEditFormData({ ...editFormData, salary_structure_id: e.target.value })}
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
                        value={editFormData.schedule_id}
                        onChange={(e) => setEditFormData({ ...editFormData, schedule_id: e.target.value })}
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
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW 1: CONTRACTS LIST VIEW (Matching Excalidraw Table List)
  // =========================================================================
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Search & Actions Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '300px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} color="#64748B" style={{ position: 'absolute', left: '14px', top: '12px' }} />
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
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} />
            <span>New Employment Contract</span>
          </button>
        )}
      </div>

      {/* Contextual Bulk Action Bar when items are selected */}
      {selectedIds.length > 0 && (
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
            <span className="badge badge-primary">{selectedIds.length} Selected</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600 }}>
              {selectedIds.length === filtered.length
                ? 'All contracts in current view selected'
                : `${selectedIds.length} of ${filtered.length} contracts selected`}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={exportSelectedCSV}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setSelectedIds([])}
              style={{ fontSize: '0.78rem' }}
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Contracts Table List with Clickable Rows */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '42px', textAlign: 'center', padding: '10px 12px' }}>
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = isSomeSelected;
                  }}
                  onChange={handleToggleSelectAll}
                  title="Select All Contracts"
                  style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#000000' }}
                />
              </th>
              <th>Contract Ref</th>
              <th>Employee</th>
              <th>Monthly Wage</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: '#64748B' }}>
                  No contracts found matching your filters.
                </td>
              </tr>
            ) : (
              filtered.map((c) => {
                const empName = c.employee_name ||
                  (c.employee ? `${c.employee.first_name} ${c.employee.last_name}` : 'Unknown');
                const position = c.position || c.employee?.position || 'Standard';
                const isSelected = selectedIds.includes(String(c.id));

                return (
                  <tr
                    key={c.id}
                    onClick={() => openContractDetails(c)}
                    style={{
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                      backgroundColor: isSelected ? 'rgba(0, 0, 0, 0.03)' : undefined,
                    }}
                    title="Click to open contract details"
                  >
                    <td style={{ textAlign: 'center', padding: '10px 12px' }} onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleToggleSelectOne(c.id, e)}
                        style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#000000' }}
                        title={`Select contract ${c.ref}`}
                      />
                    </td>
                    <td>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        color: '#1E3A5F',
                        background: 'rgba(30, 58, 95, 0.08)',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}>
                        {c.ref}
                        <ChevronRight size={14} color="#64748B" />
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#1F2937' }}>{empName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{position}</div>
                    </td>
                    <td>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#2E7D5B' }}>
                        ₹{Number(c.wage || 0).toLocaleString('en-IN')}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', color: '#1F2937' }}>
                        {formatDate(c.start_date)}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', color: c.end_date ? '#1F2937' : '#94A3B8' }}>
                        {c.end_date ? formatDate(c.end_date) : 'Open-ended'}
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
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openContractDetails(c);
                        }}
                        className="btn btn-secondary"
                        style={{
                          padding: '4px 10px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: '#1E3A5F',
                        }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Useful Note Callout on List View (Matching Excalidraw) */}
      <div style={{
        padding: '12px 16px',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(30, 58, 95, 0.04)',
        border: '1px solid rgba(30, 58, 95, 0.12)',
        fontSize: '0.8rem',
        color: '#1E3A5F',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <Info size={16} color="#1E3A5F" />
        <span>
          <strong>Useful note:</strong> Retain contract history, but make the active <em>Running</em> contract obvious because payroll calculations depend on it. Click any contract row above to inspect its full configuration.
        </span>
      </div>

      {/* Create Contract Modal */}
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
                    background: 'rgba(180, 35, 24, 0.1)',
                    color: '#B42318',
                    fontSize: '0.825rem',
                  }}>
                    {formError}
                  </div>
                )}

                <div style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(30, 58, 95, 0.06)',
                  border: '1px solid rgba(30, 58, 95, 0.15)',
                  fontSize: '0.8rem',
                  color: '#1E3A5F',
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
