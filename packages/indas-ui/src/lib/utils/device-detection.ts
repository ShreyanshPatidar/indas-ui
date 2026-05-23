/**
 * Device Detection Utility
 * Detects browser, OS, and device type from user agent
 */

export interface DeviceDetectionResult {
  browser: string
  os: string
  deviceType: 'desktop' | 'mobile' | 'tablet'
}

export function detectDevice(): DeviceDetectionResult {
  if (typeof window === 'undefined') {
    return {
      browser: 'Unknown',
      os: 'Unknown',
      deviceType: 'desktop'
    }
  }

  const userAgent = window.navigator.userAgent
  const platform = window.navigator.platform

  // Detect Browser
  let browser = 'Unknown'
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    browser = 'Chrome'
  } else if (userAgent.includes('Edg')) {
    browser = 'Edge'
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browser = 'Safari'
  } else if (userAgent.includes('Firefox')) {
    browser = 'Firefox'
  } else if (userAgent.includes('MSIE') || userAgent.includes('Trident')) {
    browser = 'Internet Explorer'
  } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
    browser = 'Opera'
  }

  // Detect OS
  let os = 'Unknown'
  if (platform.includes('Win')) {
    os = 'Windows'
  } else if (platform.includes('Mac')) {
    os = 'macOS'
  } else if (platform.includes('Linux')) {
    os = 'Linux'
  } else if (userAgent.includes('Android')) {
    os = 'Android'
  } else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    os = 'iOS'
  }

  // Detect Device Type
  let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop'
  if (/Mobi|Android/i.test(userAgent)) {
    deviceType = 'mobile'
  } else if (/Tablet|iPad/i.test(userAgent)) {
    deviceType = 'tablet'
  }

  return {
    browser,
    os,
    deviceType
  }
}

/**
 * Get device ID from browser fingerprint
 * Uses a combination of user agent, screen resolution, and timezone
 */
export function getDeviceId(): string {
  if (typeof window === 'undefined') {
    return 'server'
  }

  const components = [
    window.navigator.userAgent,
    window.screen.width,
    window.screen.height,
    window.screen.colorDepth,
    new Date().getTimezoneOffset(),
    window.navigator.language
  ]

  // Simple hash function
  const hash = components.join('|').split('').reduce((acc, char) => {
    const chr = char.charCodeAt(0)
    acc = ((acc << 5) - acc) + chr
    return acc & acc
  }, 0)

  return `device-${Math.abs(hash).toString(36)}`
}

/**
 * Get device name based on browser and OS
 */
export function getDeviceName(): string {
  const { browser, os, deviceType } = detectDevice()

  if (deviceType === 'mobile') {
    return `${os} Mobile`
  } else if (deviceType === 'tablet') {
    return `${os} Tablet`
  } else {
    return `${browser} on ${os}`
  }
}
