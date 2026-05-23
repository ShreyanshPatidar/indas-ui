'use client'

import { useEffect } from 'react'

/**
 * PWA utilities — service worker registration, push notifications, and registrar component.
 */

export async function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
    return registration
  } catch {
    return null
  }
}

export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return null
  }

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      return null
    }

    const registration = await navigator.serviceWorker.ready
    const existing = await registration.pushManager.getSubscription()
    if (existing) {
      return existing
    }

    // VAPID public key needed when backend endpoint is ready
    // const subscription = await registration.pushManager.subscribe({
    //   userVisibleOnly: true,
    //   applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    // })
    // return subscription

    return null
  } catch {
    return null
  }
}

export function isPushSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window
}

/** Drop into layout — registers SW on mount */
export function PWARegistrar() {
  useEffect(() => {
    registerServiceWorker()
  }, [])

  return null
}
