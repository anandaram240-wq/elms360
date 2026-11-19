# ELMS 360 — Manager Module Button Functionality Matrix

| Page / Route | Button / Action Label | Handler / Trigger | Server Action / Destination | Status |
|---|---|---|---|---|
| `/manager/dashboard` | Review Approvals | `Link href="/manager/approvals"` | `/manager/approvals` | Working |
| `/manager/dashboard` | Team Calendar | `Link href="/manager/team-calendar"` | `/manager/team-calendar` | Working |
| `/manager/dashboard` | Full Calendar (Weekly Card) | `Link href="/manager/team-calendar"` | `/manager/team-calendar` | Working |
| `/manager/dashboard` | View All (Recent Actions) | `Link href="/manager/history"` | `/manager/history` | Working |
| `/manager/dashboard` | Approval Queue (Quick Action) | `Link href="/manager/approvals"` | `/manager/approvals` | Working |
| `/manager/dashboard` | Team Leave Calendar (Quick Action) | `Link href="/manager/team-calendar"` | `/manager/team-calendar` | Working |
| `/manager/dashboard` | Direct Reports Directory (Quick Action) | `Link href="/manager/team"` | `/manager/team` | Working |
| `/manager/dashboard` | Approval Delegations (Quick Action) | `Link href="/manager/delegations"` | `/manager/delegations` | Working |
| `/manager/dashboard` | Quick Approve (Preview row) | `onClick={() => handleOpenAction(req, 'APPROVE')}` | `processApprovalAction({ requestId, action: 'APPROVE', comments })` | Working |
| `/manager/dashboard` | Quick Reject (Preview row) | `onClick={() => handleOpenAction(req, 'REJECT')}` | `processApprovalAction({ requestId, action: 'REJECT', reason })` | Working |
| `/manager/dashboard` | Confirm Approval (Preview Modal) | `onClick={handleConfirmAction}` | `processApprovalAction({ action: 'APPROVE' })` | Working |
| `/manager/dashboard` | Confirm Rejection (Preview Modal) | `onClick={handleConfirmAction}` | `processApprovalAction({ action: 'REJECT' })` | Working |
| `/manager/dashboard` | Details (Preview row) | `Link href="/manager/approvals/[id]"` | `/manager/approvals/[id]` | Working |
| `/manager/dashboard` | View All Approvals (Header) | `Link href="/manager/approvals"` | `/manager/approvals` | Working |
| `/manager/approvals` | Bulk Approve (N) | `onClick={handleOpenBulkApprove}` | Opens bulk confirmation modal | Working |
| `/manager/approvals` | Confirm Bulk Approve | `onClick={handleConfirmAction}` | `bulkApproveRequests({ requestIds, comments })` | Working |
| `/manager/approvals` | Refresh | `onClick={() => fetchApprovals()}` | `getMyPendingApprovals(...)` | Working |
| `/manager/approvals` | Pending Review Filter | `onClick={() => setStatusFilter('PENDING')}` | Filters pending status | Working |
| `/manager/approvals` | All Requests Filter | `onClick={() => setStatusFilter('ALL')}` | Filters all requests | Working |
| `/manager/approvals` | Leave Type Filter | `onValueChange={setLeaveTypeFilter}` | Filters by leave type | Working |
| `/manager/approvals` | Select All Checkbox | `onCheckedChange={handleSelectAll}` | Toggles row selection | Working |
| `/manager/approvals` | Row Selection Checkbox | `onCheckedChange={handleSelectOne}` | Toggles single selection | Working |
| `/manager/approvals` | Row Quick Approve | `onClick={() => handleOpenApprove(req)}` | Opens approve modal | Working |
| `/manager/approvals` | Row Quick Reject | `onClick={() => handleOpenReject(req)}` | Opens reject modal | Working |
| `/manager/approvals` | Row Request Clarification | `onClick={() => handleOpenClarify(req)}` | Opens clarify modal | Working |
| `/manager/approvals` | Confirm Approve Modal | `onClick={handleConfirmAction}` | `processApprovalAction({ action: 'APPROVE' })` | Working |
| `/manager/approvals` | Confirm Reject Modal | `onClick={handleConfirmAction}` | `processApprovalAction({ action: 'REJECT' })` | Working |
| `/manager/approvals` | Confirm Clarification Modal | `onClick={handleConfirmAction}` | `processApprovalAction({ action: 'REQUEST_CLARIFICATION' })` | Working |
| `/manager/approvals` | Row View Details | `Link href="/manager/approvals/[id]"` | `/manager/approvals/[id]` | Working |
| `/manager/approvals` | Pagination Previous | `onClick={() => setPage(p - 1)}` | Navigates previous page | Working |
| `/manager/approvals` | Pagination Next | `onClick={() => setPage(p + 1)}` | Navigates next page | Working |
| `/manager/approvals/[id]` | Back to Approval Queue | `Link href="/manager/approvals"` | `/manager/approvals` | Working |
| `/manager/approvals/[id]` | Top Bar Approve | `onClick={() => setActiveModal('APPROVE')}` | Opens approve modal | Working |
| `/manager/approvals/[id]` | Top Bar Reject | `onClick={() => setActiveModal('REJECT')}` | Opens reject modal | Working |
| `/manager/approvals/[id]` | Top Bar Request Clarification | `onClick={() => setActiveModal('CLARIFY')}` | Opens clarification modal | Working |
| `/manager/approvals/[id]` | Confirm Approve Modal | `onClick={handleAction}` | `processApprovalAction({ action: 'APPROVE', comments })` | Working |
| `/manager/approvals/[id]` | Confirm Reject Modal | `onClick={handleAction}` | `processApprovalAction({ action: 'REJECT', reason })` | Working |
| `/manager/approvals/[id]` | Confirm Clarify Modal | `onClick={handleAction}` | `processApprovalAction({ action: 'REQUEST_CLARIFICATION', message })` | Working |
| `/manager/approvals/[id]` | Expand Details / Collapse | `onClick={() => setShowFullHistory(!showFullHistory)}` | Toggles leave history details | Working |
| `/manager/team` | Refresh Team | `onClick={() => loadTeam(search)}` | `getDirectReportsDirectory()` | Working |
| `/manager/team` | Team Member Card Click | `onClick={() => setSelectedEmployee(emp)}` | Opens employee profile modal | Working |
| `/manager/team` | View History &rarr; | `onClick={() => setSelectedEmployee(emp)}` | Opens employee history modal | Working |
| `/manager/team-calendar` | Month View Toggle | `onClick={() => setViewMode('MONTH')}` | Switches to month view | Working |
| `/manager/team-calendar` | Week View Toggle | `onClick={() => setViewMode('WEEK')}` | Switches to week view | Working |
| `/manager/team-calendar` | Previous Month/Week | `onClick={handlePrev}` | Navigates backward | Working |
| `/manager/team-calendar` | Next Month/Week | `onClick={handleNext}` | Navigates forward | Working |
| `/manager/team-calendar` | Today | `onClick={handleToday}` | Resets to current date | Working |
| `/manager/team-calendar` | Refresh | `onClick={() => fetchCalendar()}` | `getTeamLeaveCalendar(...)` | Working |
| `/manager/team-calendar` | Employee Filter | `onValueChange={setSelectedEmployeeId}` | Filters team calendar | Working |
| `/manager/team-calendar` | Leave Type Filter | `onValueChange={setSelectedLeaveType}` | Filters by leave type | Working |
| `/manager/delegations` | New Delegation | `onClick={() => setIsCreateOpen(true)}` | Opens create delegation modal | Working |
| `/manager/delegations` | Assign Delegation Submit | `onSubmit={handleCreateDelegation}` | `delegateApproval(...)` | Working |
| `/manager/delegations` | Revoke Delegation | `onClick={() => setCancelTargetId(d.id)}` | Opens revoke confirmation modal | Working |
| `/manager/delegations` | Confirm Revoke Authority | `onClick={handleConfirmCancel}` | `cancelDelegation(id)` | Working |
| `/manager/delegations` | Refresh | `onClick={() => loadData()}` | `getMyDelegations()` | Working |
| `/manager/history` | Export CSV | `onClick={handleExportCSV}` | Client-side CSV generation via PapaParse | Working |
| `/manager/history` | Refresh | `onClick={() => fetchHistory()}` | `getApprovalHistory(...)` | Working |
| `/manager/history` | Action Filter | `onValueChange={setActionFilter}` | Filters by approval action | Working |
| `/manager/history` | Employee Filter | `onValueChange={setEmployeeFilter}` | Filters by direct report | Working |
| `Manager Sidebar` | Dashboard | `Link href="/manager/dashboard"` | `/manager/dashboard` | Working |
| `Manager Sidebar` | Approvals | `Link href="/manager/approvals"` | `/manager/approvals` | Working |
| `Manager Sidebar` | Team | `Link href="/manager/team"` | `/manager/team` | Working |
| `Manager Sidebar` | Team Calendar | `Link href="/manager/team-calendar"` | `/manager/team-calendar` | Working |
| `Manager Sidebar` | Delegations | `Link href="/manager/delegations"` | `/manager/delegations` | Working |
| `Manager Sidebar` | History | `Link href="/manager/history"` | `/manager/history` | Working |
