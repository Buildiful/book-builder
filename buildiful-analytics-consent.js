/*
 * Buildiful® — optional Google Analytics 4 consent
 *
 * Install once per page, using a classic (non-module) script:
 * <script defer src="./buildiful-analytics-consent.js"
 *   data-measurement-id="G-XXXXXXXXXX"
 *   data-tool-name="Tool Name"
 *   data-privacy-url="./privacy.html"></script>
 *
 * Optional footer control:
 * <button type="button" data-buildiful-analytics-settings>Analytics settings</button>
 *
 * The Google Analytics script is not loaded until the visitor allows it.
 * The choice is shared across paths on the same website origin.
 */
(() => {
  'use strict';

  const script = document.currentScript;
  const measurementId = (script?.dataset.measurementId || '').trim();
  const toolName = script?.dataset.toolName || document.title || 'Buildiful® tool';
  const privacyUrl = script?.dataset.privacyUrl || './privacy.html';
  const storageKey = 'buildiful_analytics_consent_v1';
  let analyticsLoaded = false;
  let banner = null;

  if (!/^G-[A-Za-z0-9]+$/.test(measurementId)) {
    console.warn('Buildiful analytics: set a valid GA4 measurement ID.');
    return;
  }

  function getChoice() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
      return saved && (saved.choice === 'allow' || saved.choice === 'decline')
        ? saved.choice : null;
    } catch {
      return null;
    }
  }

  function rememberChoice(choice) {
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        choice,
        recordedAt: new Date().toISOString()
      }));
    } catch {
      // The preference lasts only for this visit if storage is unavailable.
    }
  }

  function enableAnalytics() {
    if (analyticsLoaded) return;
    analyticsLoaded = true;

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () {
      window.dataLayer.push(arguments);
    };

    // GA4 is initialized only after an affirmative choice.
    window.gtag('consent', 'default', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
    window.gtag('consent', 'update', { analytics_storage: 'granted' });
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      // Avoid passing search parameters or URL fragments to GA4.
      page_location: location.origin + location.pathname,
      page_title: toolName
    });

    const gaScript = document.createElement('script');
    gaScript.async = true;
    gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=' +
      encodeURIComponent(measurementId);
    document.head.appendChild(gaScript);
  }

  function clearAnalyticsCookies() {
    const names = document.cookie.split(';').map(part => part.trim().split('=')[0]);
    for (const name of names) {
      if (!/^(_ga(?:_.*)?|_gid|_gat(?:_.*)?)$/.test(name)) continue;
      document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
    }
    // Browsers may retain GA cookies with other domain scopes.
    // Consent withdrawal prevents new collection on future page loads.
  }

  function hideBanner() {
    banner?.remove();
    banner = null;
  }

  function selectChoice(choice) {
    rememberChoice(choice);
    hideBanner();
    if (choice === 'allow') {
      enableAnalytics();
    } else if (analyticsLoaded) {
      window.gtag?.('consent', 'update', { analytics_storage: 'denied' });
      clearAnalyticsCookies();
      location.reload(); // Remove the loaded Google tag from this page.
    }
  }

  function showBanner() {
    if (banner || !document.body) return;

    banner = document.createElement('section');
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Optional analytics');
    banner.style.cssText = [
      'position:fixed', 'bottom:16px', 'left:16px', 'right:16px',
      'max-width:450px', 'z-index:2147483647', 'box-sizing:border-box',
      'padding:16px', 'border:1px solid #d9dce5', 'border-radius:12px',
      'background:#fff', 'color:#232733',
      'box-shadow:0 7px 28px rgba(0,0,0,.17)',
      'font:14px/1.5 system-ui,-apple-system,BlinkMacSystemFont,sans-serif'
    ].join(';');

    const title = document.createElement('strong');
    title.textContent = 'Optional analytics';

    const description = document.createElement('p');
    description.style.margin = '8px 0 12px';
    description.textContent = 'May we use Google Analytics to understand visits to our free tools? You can decline; the tool works either way. We do not intentionally send the content you create to Analytics.';

    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap';

    function makeButton(label, choice, primary) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.style.cssText = 'padding:8px 12px;border-radius:8px;cursor:pointer;font:inherit;border:1px solid #737e93;' +
        (primary ? 'background:#344d9e;color:#fff' : 'background:#fff;color:#232733');
      button.addEventListener('click', () => selectChoice(choice));
      return button;
    }

    actions.append(
      makeButton('Decline analytics', 'decline', false),
      makeButton('Allow analytics', 'allow', true)
    );

    const privacyLink = document.createElement('a');
    privacyLink.href = privacyUrl;
    privacyLink.textContent = 'Privacy notice';
    privacyLink.style.cssText = 'display:inline-block;margin-top:10px;color:#344d9e';

    banner.append(title, description, actions, privacyLink);
    document.body.appendChild(banner);
  }

  function init() {
    document.addEventListener('click', event => {
      if (event.target.closest('[data-buildiful-analytics-settings]')) {
        event.preventDefault();
        showBanner();
      }
    });

    const choice = getChoice();
    if (choice === 'allow') enableAnalytics();
    else if (choice !== 'decline') showBanner();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
