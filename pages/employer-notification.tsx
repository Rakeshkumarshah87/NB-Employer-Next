import React, { useEffect, useState, useRef, useCallback } from 'react';
import Head from 'next/head';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { getNotificationsApi } from '@/services/api';
import styles from '@/styles/notifications.module.css';

interface NotificationItem {
  id: number;
  user_id: number;
  title?: string;
  message?: string;
  description?: string;
  date_time?: string;
  created_at?: string;
  is_read?: number;
  [key: string]: any;
}

export default function EmployerNotification() {
  const { user, loading } = useAuth();
  
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const observer = useRef<IntersectionObserver | null>(null);

  const fetchNotifications = async (currentOffset: number) => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);

    try {
      const limit = 15;
      const res = await getNotificationsApi(currentOffset, limit);
      
      if (res.status && res.data) {
        const newItems = res.data.data || [];
        const currentTotal = res.data.total || 0;
        
        setNotifications(prev => [...prev, ...newItems]);
        setTotal(currentTotal);
        
        if (newItems.length < limit || currentOffset + limit >= currentTotal) {
          setHasMore(false);
        } else {
          setOffset(currentOffset + limit);
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (!loading && user) {
      setOffset(0);
      setNotifications([]);
      setHasMore(true);
      fetchNotifications(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user]);

  // Infinite Scroll Observer
  const lastElementRef = useCallback((node: HTMLDivElement) => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchNotifications(offset);
      }
    });

    if (node) observer.current.observe(node);
  }, [isLoading, hasMore, offset]);

  // Handle Loading and Auth
  if (loading) {
    return (
      <DashboardLayout>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return null; // AuthContext redirect handles this
  }

  return (
    <DashboardLayout>
      <Head>
        <title>Notifications | NetworkBaba Employer</title>
      </Head>

      <div className={styles.pageContainer}>
        <div className={styles.headerArea}>
          <h1 className={styles.pageTitle}>All Notifications</h1>
          <div className={styles.badge}>{total} Updates</div>
        </div>

        <div className={styles.notificationList}>
          {notifications.length === 0 && !isLoading && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🔔</div>
              <h3>No Notifications Here</h3>
              <p>You currently don't have any updates right now.</p>
            </div>
          )}

          {notifications.map((notif, index) => {
            const isLast = index === notifications.length - 1;
            
            // Extract display info safely since schema depends on legacy user_notification
            const title = notif.title || 'Notification';
            const message = notif.message || notif.notification_text || notif.description || 'You have a new update';
            const date = notif.date_time || notif.created_at || notif.date || '';

            return (
              <div 
                key={notif.id || index} 
                className={`${styles.notificationCard} ${notif.is_read === 0 ? styles.unread : ''}`}
                ref={isLast ? lastElementRef : null}
              >
                <div className={styles.iconBox}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                </div>
                <div className={styles.textContent}>
                  {title && <h3 className={styles.title}>{title}</h3>}
                  <p className={styles.message}>{message}</p>
                  {date && <span className={styles.date}>{new Date(date).toLocaleString()}</span>}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className={styles.loaderArea}>
              <div className={styles.spinnerSmall}></div>
            </div>
          )}

          {!hasMore && notifications.length > 0 && (
            <div className={styles.endMessage}>
              <p>You've caught up with all your notifications.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
