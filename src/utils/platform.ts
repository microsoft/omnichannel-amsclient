export const isBrowser = (): boolean => typeof window !== 'undefined' && typeof window.document !== 'undefined';
export const isNode = (): boolean => typeof process !== 'undefined' && process.versions != null && process.versions.node != null;
export const isReactNative = (): boolean => typeof navigator != 'undefined' && navigator.product == 'ReactNative';

/**
 * Detects Safari or iOS WebKit environments where cross-origin iframes
 * are blocked by Intelligent Tracking Prevention (ITP).
 * On iOS, ALL browsers use WebKit (Apple requirement), so all are affected.
 */
export const isSafariOrIOSWebView = (): boolean => {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent;
    // iOS — all browsers use WebKit, iframes blocked by ITP
    if (/iPad|iPhone|iPod/.test(ua)) return true;
    // iPadOS 13+ reports as macOS — detect via touch support
    if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) return true;
    // Safari on macOS (Chrome/Edge/Firefox all include "Safari" in UA but also their own name)
    if (/Safari/.test(ua) && !/Chrome|Chromium|Edg|Firefox|OPR/.test(ua)) return true;
    return false;
};

export default {
    isBrowser,
    isNode,
    isReactNative,
    isSafariOrIOSWebView
}