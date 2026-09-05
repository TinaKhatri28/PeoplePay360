import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LeaveService } from '../leave.service';
import { ConflictError, InsufficientLeaveBalanceError, ValidationError } from '../../../shared/errors/app.error';

describe('LeaveService - Bug 4 Overlapping Leave & Balance Protection', () => {
  let leaveService: LeaveService;
  let mockRepo: any;
  let mockAudit: any;

  beforeEach(() => {
    mockRepo = {
      findAllTypes: vi.fn(),
      findAllRequests: vi.fn(),
      findAllAllocations: vi.fn(),
      findAllocation: vi.fn(),
      findOverlappingRequests: vi.fn(),
      getPendingDuration: vi.fn(),
      createRequest: vi.fn(),
    };
    mockAudit = {
      log: vi.fn(),
    };
    leaveService = new LeaveService(mockRepo, mockAudit);
  });

  it('rejects leave request if start_date is after end_date', async () => {
    await expect(
      leaveService.createLeaveRequest('org_1', 'emp_1', {
        type_id: 'type_annual',
        start_date: '2026-06-10',
        end_date: '2026-06-05',
        duration: 5,
      })
    ).rejects.toThrow(ValidationError);
  });

  it('rejects leave request if duration is 0 or negative', async () => {
    await expect(
      leaveService.createLeaveRequest('org_1', 'emp_1', {
        type_id: 'type_annual',
        start_date: '2026-06-01',
        end_date: '2026-06-05',
        duration: 0,
      })
    ).rejects.toThrow(ValidationError);
  });

  it('rejects overlapping leave request with ConflictError (Bug 4 Fix)', async () => {
    mockRepo.findOverlappingRequests.mockResolvedValue([
      {
        id: 'req_existing',
        start_date: new Date('2026-06-01'),
        end_date: new Date('2026-06-05'),
        status: 'To Approve',
      },
    ]);

    await expect(
      leaveService.createLeaveRequest('org_1', 'emp_1', {
        type_id: 'type_annual',
        start_date: '2026-06-03',
        end_date: '2026-06-07',
        duration: 4,
      })
    ).rejects.toThrow(ConflictError);
  });

  it('accounts for pending requests in allocation check and rejects when balance exhausted (Bug 4 Fix)', async () => {
    mockRepo.findOverlappingRequests.mockResolvedValue([]);
    // Employee has 10 days total, 6 already taken
    mockRepo.findAllocation.mockResolvedValue({
      id: 'alloc_1',
      allocated: 10,
      taken: 6,
    });
    // And 3 days already pending in "To Approve" requests
    mockRepo.getPendingDuration.mockResolvedValue(3);

    // Remaining available is only 10 - 6 - 3 = 1 day. Requesting 2 days should fail!
    await expect(
      leaveService.createLeaveRequest('org_1', 'emp_1', {
        type_id: 'type_annual',
        start_date: '2026-06-15',
        end_date: '2026-06-16',
        duration: 2,
      })
    ).rejects.toThrow(InsufficientLeaveBalanceError);
  });

  it('successfully creates request when dates do not overlap and balance is sufficient', async () => {
    mockRepo.findOverlappingRequests.mockResolvedValue([]);
    mockRepo.findAllocation.mockResolvedValue({
      id: 'alloc_1',
      allocated: 10,
      taken: 2,
    });
    mockRepo.getPendingDuration.mockResolvedValue(1);
    // Effective remaining is 10 - 2 - 1 = 7 days. Requesting 2 days succeeds.

    const createdRecord = {
      id: 'req_new',
      employee_id: 'emp_1',
      type_id: 'type_annual',
      duration: 2,
      status: 'To Approve',
    };
    mockRepo.createRequest.mockResolvedValue(createdRecord);

    const result = await leaveService.createLeaveRequest('org_1', 'emp_1', {
      type_id: 'type_annual',
      start_date: '2026-06-20',
      end_date: '2026-06-21',
      duration: 2,
    });

    expect(result).toEqual(createdRecord);
    expect(mockRepo.createRequest).toHaveBeenCalled();
  });
});
