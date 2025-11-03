// ============================================
// ANTI-FRAUD TRACKER - Website Integration
// ============================================

(function() {
  const WORKER_URL = 'https://your-worker.workers.dev'; // ← Thay URL Worker
  
  let startTime = Date.now();
  let mouseMovements = 0;
  let scrollDepth = 0;
  let clicks = 0;
  
  // Track mouse movement
  document.addEventListener('mousemove', () => {
    mouseMovements++;
  });
  
  // Track scroll
  window.addEventListener('scroll', () => {
    const winHeight = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    scrollDepth = Math.max(scrollDepth, ((scrollTop + winHeight) / docHeight) * 100);
  });
  
  // Track clicks
  document.addEventListener('click', () => {
    clicks++;
  });
  
  // Generate device fingerprint
  function generateFingerprint() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('fingerprint', 2, 2);
    const canvasHash = canvas.toDataURL().slice(-50);
    
    const fingerprint = {
      screen: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: navigator.deviceMemory || 'unknown',
      canvas: canvasHash,
      userAgent: navigator.userAgent
    };
    
    const str = JSON.stringify(fingerprint);
    return btoa(str).substring(0, 32);
  }
  
  // Calculate engagement quality
  function getEngagementQuality() {
    const timeOnPage = (Date.now() - startTime) / 1000; // seconds
    
    let score = 0;
    
    // Time on page (max 40 points)
    if (timeOnPage > 30) score += 40;
    else if (timeOnPage > 10) score += 30;
    else if (timeOnPage > 5) score += 20;
    else score += 10;
    
    // Mouse movements (max 30 points)
    if (mouseMovements > 100) score += 30;
    else if (mouseMovements > 50) score += 20;
    else if (mouseMovements > 10) score += 10;
    
    // Scroll depth (max 20 points)
    if (scrollDepth > 70) score += 20;
    else if (scrollDepth > 30) score += 15;
    else if (scrollDepth > 10) score += 10;
    
    // Clicks (max 10 points)
    if (clicks > 3) score += 10;
    else if (clicks > 1) score += 5;
    
    return Math.min(score, 100);
  }
  
  // Send data to Worker
  async function sendTrackingData() {
    try {
      const response = await fetch(`${WORKER_URL}/api/log-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          device_fingerprint: generateFingerprint(),
          engagement_quality: getEngagementQuality(),
          page_url: window.location.href,
          referrer: document.referrer,
          timestamp: Date.now()
        })
      });
      
      const data = await response.json();
      
      // Nếu bị chặn, có thể redirect hoặc hiển thị thông báo
      if (!data.allowed) {
        console.warn('Access blocked:', data.reason);
        // Optional: window.location.href = '/blocked.html';
      }
      
    } catch (error) {
      console.error('Tracking error:', error);
    }
  }
  
  // Send after 3 seconds on page
  setTimeout(sendTrackingData, 3000);
  
  // Send before page unload
  window.addEventListener('beforeunload', () => {
    navigator.sendBeacon(`${WORKER_URL}/api/log-access`, JSON.stringify({
      device_fingerprint: generateFingerprint(),
      engagement_quality: getEngagementQuality(),
      page_url: window.location.href,
      timestamp: Date.now()
    }));
  });
  
})();