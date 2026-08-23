// ECP Lab — Notification Template Helpers
// All notification messages must use these templates for consistency.

export type NotificationType = "borrow_status" | "damage_report" | "system" | "announcement" | "overdue_reminder";
export type NotificationRefType = "borrow_request" | "damage_report" | "announcement";

// ============================================================================
// ADMIN NOTIFICATIONS
// ============================================================================
export const adminNotifications = {
  newBorrowRequest: (studentName: string, qty: number, eqName: string) => ({
    title: "New Borrow Request",
    message: `${studentName} requested to borrow ${qty} ${eqName}.`,
  }),
  borrowApproved: (studentName: string, qty: number, eqName: string) => ({
    title: "Borrow Request Approved",
    message: `${studentName}'s request for ${qty} ${eqName} has been approved by Faculty.`,
  }),
  borrowRejected: (studentName: string, qty: number, eqName: string) => ({
    title: "Borrow Request Rejected",
    message: `${studentName}'s request for ${qty} ${eqName} has been rejected by Faculty.`,
  }),
  returnRequest: (studentName: string, qty: number, eqName: string) => ({
    title: "Return Request",
    message: `${studentName} requested to return ${qty} ${eqName}.`,
  }),
  equipmentReturned: (studentName: string, qty: number, eqName: string) => ({
    title: "Equipment Returned",
    message: `${studentName} returned ${qty} ${eqName}.`,
  }),
  overdueEquipment: (studentName: string, qty: number, eqName: string) => ({
    title: "Overdue Equipment",
    message: `${studentName}'s ${qty} ${eqName} are overdue.`,
  }),
  penaltyReminder: (penaltyRate: number) => ({
    title: "Penalty Reminder",
    message: `Reminder: For each day the return date is exceeded, a ₱${penaltyRate} penalty must be paid.`,
  }),
  equipmentDamaged: (summary: string, studentName: string) => ({
    title: "Equipment Marked as Damaged",
    message: `${summary} returned by ${studentName} have been marked as Damaged.`,
  }),
  equipmentReplaced: (summary: string) => ({
    title: "Equipment Replaced",
    message: `The ${summary} previously marked as Damaged have been replaced and are now available for use.`,
  }),
  lowAvailability: (qty: number, eqName: string) => ({
    title: "Low Equipment Availability",
    message: `Low Equipment Availability - Only ${qty} ${eqName} is currently available.`,
  }),
};

// ============================================================================
// FACULTY NOTIFICATIONS
// ============================================================================
export const facultyNotifications = {
  newBorrowRequest: (studentName: string, qty: number, eqName: string) => ({
    title: "New Borrow Request",
    message: `${studentName} requested to borrow ${qty} ${eqName}. Please review the request.`,
  }),
  borrowApproved: (studentName: string, qty: number, eqName: string) => ({
    title: "Borrow Request Approved",
    message: `${studentName}'s request for ${qty} ${eqName} has been approved.`,
  }),
  borrowRejected: (studentName: string, qty: number, eqName: string) => ({
    title: "Borrow Request Rejected",
    message: `${studentName}'s request for ${qty} ${eqName} has been rejected.`,
  }),
  returnRequest: (studentName: string, qty: number, eqName: string) => ({
    title: "Return Request",
    message: `${studentName} requested to return ${qty} ${eqName}.`,
  }),
  equipmentReturned: (studentName: string, qty: number, eqName: string) => ({
    title: "Equipment Returned",
    message: `${studentName} returned ${qty} ${eqName}.`,
  }),
  overdueEquipment: (studentName: string, qty: number, eqName: string) => ({
    title: "Overdue Equipment",
    message: `${studentName}'s ${qty} ${eqName} are overdue.`,
  }),
  equipmentDamaged: (summary: string, studentName: string) => ({
    title: "Equipment Marked as Damaged",
    message: `${summary} returned by ${studentName} have been marked as Damaged.`,
  }),
  equipmentReplaced: (summary: string) => ({
    title: "Equipment Replaced",
    message: `The ${summary} previously marked as Damaged have been replaced and are now available for use.`,
  }),
};

// ============================================================================
// STUDENT NOTIFICATIONS
// ============================================================================
export const studentNotifications = {
  borrowSubmitted: (qty: number, eqName: string) => ({
    title: "Borrow Request Submitted",
    message: `Your request to borrow ${qty} ${eqName} has been submitted successfully.`,
  }),
  borrowApproved: (qty: number, eqName: string) => ({
    title: "Borrow Request Approved",
    message: `Your request to borrow ${qty} ${eqName} has been approved.`,
  }),
  borrowRejected: (qty: number, eqName: string) => ({
    title: "Borrow Request Rejected",
    message: `Your request to borrow ${qty} ${eqName} has been rejected. Please check the request details.`,
  }),
  returnReminder: (qty: number, eqName: string, days: number) => ({
    title: "Return Reminder",
    message: `Your ${qty} ${eqName} are due for return in ${days} day(s).`,
  }),
  returnDueToday: (qty: number, eqName: string) => ({
    title: "Return Due Today",
    message: `Your ${qty} ${eqName} are due for return today.`,
  }),
  overdueEquipment: (qty: number, eqName: string) => ({
    title: "Overdue Equipment",
    message: `Your ${qty} ${eqName} are overdue. Please return them as soon as possible.`,
  }),
  penaltyReminder: (penaltyRate: number) => ({
    title: "Penalty Reminder",
    message: `Reminder: For each day the return date is exceeded, you must pay a ₱${penaltyRate} penalty.`,
  }),
  returnSubmitted: (qty: number, eqName: string) => ({
    title: "Return Request Submitted",
    message: `Your request to return ${qty} ${eqName} has been submitted successfully.`,
  }),
  equipmentReturned: (qty: number, eqName: string) => ({
    title: "Equipment Returned",
    message: `Your ${qty} ${eqName} have been successfully returned.`,
  }),
  equipmentDamaged: (summary: string) => ({
    title: "Equipment Marked as Damaged",
    message: `${summary} you returned have been marked as Damaged.`,
  }),
  equipmentReplaced: (summary: string) => ({
    title: "Equipment Replaced",
    message: `The ${summary} you returned and were marked as Damaged have been replaced.`,
  }),
};
