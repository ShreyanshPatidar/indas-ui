/**
 * Notifications API Client
 *
 * Handles user notifications (create, list, mark-as-read, delete)
 */

import APIClient from '../../core/client'
import type { APIResponse } from '../../core/types'
import type {
  NotificationRequest,
  NotificationResponse,
  NotificationFilters,
  BackendNotificationResponse
} from './types'
import { fromBackendNotification, toBackendNotificationRequest } from './types'

/**
 * Notifications API
 */
class NotificationsAPI {
  /**
   * Create a new notification
   * POST /api/notifications
   */
  static async create(
    request: NotificationRequest,
    session: any,
    baseURL?: string
  ): Promise<APIResponse<{ notificationId: number }>> {
    try {
      const backendRequest = toBackendNotificationRequest(request)

      const response = await APIClient.post<{
        Message: string
        NotificationID: number
      }>('/api/notifications', backendRequest, session, baseURL)

      if (response.success && response.data) {
        return {
          success: true,
          data: {
            notificationId: response.data.NotificationID
          }
        }
      }

      return {
        success: false,
        error: response.error || 'Failed to create notification'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get notifications for current user
   * GET /api/notifications
   */
  static async getList(
    filters: NotificationFilters = {},
    session: any,
    baseURL?: string
  ): Promise<APIResponse<NotificationResponse[]>> {
    try {
      const queryParams = new URLSearchParams()

      if (filters.limit) queryParams.append('limit', filters.limit.toString())
      if (filters.unreadOnly) queryParams.append('unreadOnly', 'true')
      if (filters.type) queryParams.append('type', filters.type)
      if (filters.module) queryParams.append('module', filters.module)
      if (filters.priority) queryParams.append('priority', filters.priority)
      if (filters.category) queryParams.append('category', filters.category)

      const url = `/api/notifications${queryParams.toString() ? '?' + queryParams.toString() : ''}`

      const response = await APIClient.get<BackendNotificationResponse[]>(url, session, baseURL)

      if (response.success && response.data) {
        const notifications = Array.isArray(response.data)
          ? response.data.map(fromBackendNotification)
          : []

        return {
          success: true,
          data: notifications
        }
      }

      return {
        success: false,
        error: response.error || 'Failed to fetch notifications'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get unread notification count
   * GET /api/notifications/unread-count
   */
  static async getUnreadCount(session: any): Promise<APIResponse<number>> {
    try {
      const response = await APIClient.get<{ UnreadCount: number }>(
        '/api/notifications/unread-count',
        session
      )

      if (response.success && response.data) {
        return {
          success: true,
          data: response.data.UnreadCount
        }
      }

      return {
        success: false,
        error: response.error || 'Failed to fetch unread count'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Mark notifications as read
   * POST /api/notifications/mark-read
   */
  static async markAsRead(
    notificationIds: number[],
    session: any,
    baseURL?: string
  ): Promise<APIResponse<{ count: number }>> {
    try {
      const response = await APIClient.post<{
        Message: string
        Count: number
      }>('/api/notifications/mark-read', { NotificationIDs: notificationIds }, session, baseURL)

      if (response.success && response.data) {
        return {
          success: true,
          data: {
            count: response.data.Count
          }
        }
      }

      return {
        success: false,
        error: response.error || 'Failed to mark notifications as read'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Mark all notifications as read
   * POST /api/notifications/mark-all-read
   */
  static async markAllAsRead(session: any, baseURL?: string): Promise<APIResponse<{ count: number }>> {
    try {
      const response = await APIClient.post<{
        Message: string
        Count: number
      }>('/api/notifications/mark-all-read', {}, session, baseURL)

      if (response.success && response.data) {
        return {
          success: true,
          data: {
            count: response.data.Count
          }
        }
      }

      return {
        success: false,
        error: response.error || 'Failed to mark all notifications as read'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Delete a notification
   * POST /api/notifications/delete/{id}
   */
  static async delete(
    notificationId: number,
    session: any,
    baseURL?: string
  ): Promise<APIResponse<{ notificationId: number }>> {
    try {
      const response = await APIClient.post<{
        Message: string
        NotificationID: number
      }>(`/api/notifications/delete/${notificationId}`, {}, session, baseURL)

      if (response.success && response.data) {
        return {
          success: true,
          data: {
            notificationId: response.data.NotificationID
          }
        }
      }

      return {
        success: false,
        error: response.error || 'Failed to delete notification'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Clear all read notifications
   * POST /api/notifications/clear-read
   */
  static async clearRead(session: any, baseURL?: string): Promise<APIResponse<{ count: number }>> {
    try {
      const response = await APIClient.post<{
        Message: string
        Count: number
      }>('/api/notifications/clear-read', {}, session, baseURL)

      if (response.success && response.data) {
        return {
          success: true,
          data: {
            count: response.data.Count
          }
        }
      }

      return {
        success: false,
        error: response.error || 'Failed to clear read notifications'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

export default NotificationsAPI
export { NotificationsAPI }
