import pb from '@/lib/pocketbase/client'
import {
  AdminOverviewData,
  AdminRole,
  UsageEvent,
  AdminAuditLog,
  SupportTicket,
  SubscriptionItem,
  PaymentItem,
} from '@/types'

export const adminService = {
  /**
   * Check if current user has admin/staff access
   */
  async checkAccess(): Promise<{ hasAccess: boolean; role: AdminRole; email?: string }> {
    try {
      const res = await pb.send<{ hasAccess: boolean; role: AdminRole; email?: string }>(
        '/backend/v1/studio-admin/check-access',
        { method: 'GET' },
      )
      return res
    } catch (err: any) {
      return { hasAccess: false, role: 'freelancer' }
    }
  },

  /**
   * Load overview data (all aggregates, user list, logs, subscriptions, tickets)
   */
  async getOverviewData(): Promise<AdminOverviewData> {
    return await pb.send<AdminOverviewData>('/backend/v1/studio-admin/overview-data', {
      method: 'GET',
    })
  },

  /**
   * Execute an administrative action on a user
   */
  async executeUserAction(
    userId: string,
    action:
      | 'block'
      | 'unblock'
      | 'revoke_sessions'
      | 'send_password_reset'
      | 'send_welcome_email'
      | 'change_role'
      | 'change_plan'
      | 'toggle_pilot_access'
      | 'delete_account',
    details?: Record<string, any>,
  ): Promise<{ success: boolean; message?: string; delivered?: boolean; method?: string }> {
    return await pb.send<{ success: boolean; message?: string }>(
      '/backend/v1/studio-admin/user-action',
      {
        method: 'POST',
        body: { userId, action, details },
      },
    )
  },

  /**
   * Execute support ticket action (reply or status update)
   */
  async executeSupportAction(
    ticketId: string,
    action: 'reply' | 'update_status',
    payload: { message?: string; status?: string },
  ): Promise<{ success: boolean; message?: string }> {
    return await pb.send<{ success: boolean; message?: string }>(
      '/backend/v1/studio-admin/support-action',
      {
        method: 'POST',
        body: { ticketId, action, ...payload },
      },
    )
  },

  /**
   * Record a custom usage event or audit action
   */
  async logUsageEvent(
    eventType: string,
    details?: Record<string, any>,
    resourceId?: string,
  ): Promise<void> {
    try {
      await pb.send('/backend/v1/usage/log-event', {
        method: 'POST',
        body: { eventType, details, resourceId },
      })
    } catch (_) {
      // Non-blocking
    }
  },
}
