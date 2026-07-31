/**
 * Device and Web Browser Capability Detector.
 * Safely checks touch screens, viewport sizes, pixel densities, and environment properties.
 */
export class DeviceDetector {
  /**
   * Evaluates if the current platform supports touch interactions natively.
   */
  public static isTouchDevice(): boolean {
    if (typeof window === 'undefined') return false;
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      (navigator as any).msMaxTouchPoints > 0
    );
  }

  /**
   * Retrieves the current device pixel ratio (DPI scale factor)
   */
  public static getDevicePixelRatio(): number {
    if (typeof window === 'undefined') return 1;
    return window.devicePixelRatio || 1;
  }

  /**
   * Returns whether the browser layout is currently running in vertical/portrait orientation
   */
  public static isPortrait(): boolean {
    if (typeof window === 'undefined') return false;
    return window.innerHeight > window.innerWidth;
  }

  /**
   * Guesses the base Operating System profile based on modern client indicators
   */
  public static getOS(): 'iOS' | 'Android' | 'Desktop' | 'Unknown' {
    if (typeof window === 'undefined') return 'Unknown';
    
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

    // Check iOS devices
    if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
      return 'iOS';
    }

    // Check Android platforms
    if (/android/i.test(userAgent)) {
      return 'Android';
    }

    // Default back to desktop detection markers
    if (/Win|Mac|Linux/.test(navigator.platform)) {
      return 'Desktop';
    }

    return 'Unknown';
  }

  /**
   * Estimates available memory pool in Gigabytes if exposed by the hardware platform
   */
  public static getDeviceMemory(): number | null {
    if (typeof navigator === 'undefined') return null;
    return (navigator as any).deviceMemory || null;
  }

  /**
   * Retrieves quantity of hardware threads/cores for processing estimation
   */
  public static getCPUThreads(): number {
    if (typeof navigator === 'undefined') return 1;
    return navigator.hardwareConcurrency || 1;
  }
}
