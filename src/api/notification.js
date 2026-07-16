/**
 * 消息通知 API
 */
import { get, put } from '@/utils/http'

/** 获取通知列表 */
export function getNotifications(page = 1, size = 20) {
  return get(`/notification?page=${page}&size=${size}`)
}

/** 获取未读消息数量 */
export function getUnreadCount() {
  return get('/notification/unread-count')
}

/** 标记单条通知为已读 */
export function markAsRead(notificationId) {
  return put(`/notification/${notificationId}/read`)
}

/** 全部标记为已读 */
export function markAllAsRead() {
  return put('/notification/read-all')
}