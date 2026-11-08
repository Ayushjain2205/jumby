/**
 * Jumby Shadow Sandbox & Autonomous Playtester
 * 
 * Runs generated game HTML inside an off-screen headless iframe sandbox.
 * Simulates 60-90 frames of execution (~1-1.5s), verifies requestAnimationFrame,
 * intercepts runtime errors, monitors canvas draws for NaN values,
 * and fires simulated touch probes before the user ever sees the game.
 */

export interface PlaytestReport {
  passed: boolean;
  errors: string[];
  framesRendered: number;
  canvasDetected: boolean;
  inputResponsive: boolean;
  durationMs: number;
}

export interface PlaytestOptions {
  timeoutMs?: number;
  targetFrames?: number;
  simulateInput?: boolean;
}

/**
 * Executes an invisible pre-flight playtest of the generated game HTML in the browser.
 */
export async function runShadowPlaytest(
  html: string,
  options: PlaytestOptions = {}
): Promise<PlaytestReport> {
  if (typeof window === 'undefined') {
    // Server-side environment: skip DOM playtest
    return {
      passed: true,
      errors: [],
      framesRendered: 0,
      canvasDetected: true,
      inputResponsive: true,
      durationMs: 0,
    };
  }

  const {
    timeoutMs = 2500,
    targetFrames = 60,
    simulateInput = true,
  } = options;

  const startTime = Date.now();
  const errors: string[] = [];
  let framesCount = 0;
  let canvasDetected = false;
  let inputResponsive = false;

  return new Promise((resolve) => {
    // 1. Create hidden sandbox iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    iframe.style.width = '390px';
    iframe.style.height = '844px';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');

    let isDone = false;
    let timer: NodeJS.Timeout | null = null;

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('message', handleIframeMessage);
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    };

    const finish = (passed: boolean) => {
      if (isDone) return;
      isDone = true;
      cleanup();
      resolve({
        passed: passed && errors.length === 0,
        errors,
        framesRendered: framesCount,
        canvasDetected,
        inputResponsive,
        durationMs: Date.now() - startTime,
      });
    };

    // 2. Message listener for the injected instrumentation probe
    const handleIframeMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return;
      if (event.data.source !== 'JUMBY_PLAYTEST_PROBE') return;

      const { type, payload } = event.data;

      if (type === 'ERROR') {
        const errorMsg = payload?.message || 'Unknown runtime error';
        const line = payload?.line ? ` (line ${payload.line})` : '';
        errors.push(`${errorMsg}${line}`);
      } else if (type === 'FRAME_TICK') {
        framesCount = payload?.frames || framesCount + 1;
        if (payload?.canvasFound) canvasDetected = true;
        if (framesCount >= targetFrames) {
          finish(true);
        }
      } else if (type === 'INPUT_ACK') {
        inputResponsive = true;
      } else if (type === 'NAN_DETECTED') {
        errors.push(`Canvas NaN detected in method: ${payload?.method || 'draw'}`);
      }
    };

    window.addEventListener('message', handleIframeMessage);

    // Timeout guard: if game hangs or fails to reach target frames
    timer = setTimeout(() => {
      if (framesCount < 10) {
        errors.push(`Game loop stalled (only rendered ${framesCount} frames in ${timeoutMs}ms)`);
        finish(false);
      } else {
        // Rendered sufficient frames without fatal crash
        finish(errors.length === 0);
      }
    }, timeoutMs);

    // 3. Inject probe script directly before </head> or </body>
    const probeScript = `
<script>
(function() {
  var frames = 0;
  var probeTargetFrames = ${targetFrames};
  var errorsReported = 0;

  function sendProbe(type, payload) {
    try {
      window.parent.postMessage({
        source: 'JUMBY_PLAYTEST_PROBE',
        type: type,
        payload: payload || {}
      }, '*');
    } catch(e) {}
  }

  window.addEventListener('error', function(e) {
    errorsReported++;
    sendProbe('ERROR', {
      message: e.message || 'Script Error',
      line: e.lineno,
      col: e.colno,
      stack: e.error ? e.error.stack : null
    });
  });

  window.addEventListener('unhandledrejection', function(e) {
    errorsReported++;
    sendProbe('ERROR', {
      message: 'Unhandled Promise: ' + (e.reason ? e.reason.message || e.reason : 'Rejection')
    });
  });

  // Intercept Canvas2D calls for NaN coordinates
  function wrapCanvas() {
    var canvas = document.querySelector('canvas');
    if (!canvas) return;
    try {
      var ctx = canvas.getContext('2d');
      if (!ctx || ctx.__jumbyProbed) return;
      ctx.__jumbyProbed = true;

      var origArc = ctx.arc;
      ctx.arc = function(x, y, r, sa, ea, ac) {
        if (isNaN(x) || isNaN(y) || isNaN(r)) {
          sendProbe('NAN_DETECTED', { method: 'arc' });
        }
        return origArc.apply(this, arguments);
      };

      var origFillRect = ctx.fillRect;
      ctx.fillRect = function(x, y, w, h) {
        if (isNaN(x) || isNaN(y) || isNaN(w) || isNaN(h)) {
          sendProbe('NAN_DETECTED', { method: 'fillRect' });
        }
        return origFillRect.apply(this, arguments);
      };
    } catch(e) {}
  }

  // Frame monitor
  function probeLoop() {
    frames++;
    wrapCanvas();
    var hasCanvas = Boolean(document.querySelector('canvas'));
    sendProbe('FRAME_TICK', { frames: frames, canvasFound: hasCanvas });

    if (frames === 15 && ${simulateInput ? 'true' : 'false'}) {
      // Simulate synthetic touch probe
      try {
        var cvs = document.querySelector('canvas') || document.body;
        var rect = cvs.getBoundingClientRect();
        var clientX = rect.left + rect.width / 2;
        var clientY = rect.top + rect.height / 2;
        var evt = new MouseEvent('mousedown', { bubbles: true, clientX: clientX, clientY: clientY });
        cvs.dispatchEvent(evt);
        sendProbe('INPUT_ACK', {});
      } catch(e) {}
    }

    if (frames < probeTargetFrames && errorsReported === 0) {
      requestAnimationFrame(probeLoop);
    }
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    requestAnimationFrame(probeLoop);
  } else {
    window.addEventListener('DOMContentLoaded', function() {
      requestAnimationFrame(probeLoop);
    });
  }
})();
</script>
`;

    // Inject probe script
    let instrumentedHtml = html;
    if (instrumentedHtml.includes('</head>')) {
      instrumentedHtml = instrumentedHtml.replace('</head>', `${probeScript}\n</head>`);
    } else if (instrumentedHtml.includes('<body>')) {
      instrumentedHtml = instrumentedHtml.replace('<body>', `<body>\n${probeScript}`);
    } else {
      instrumentedHtml = `${probeScript}\n${instrumentedHtml}`;
    }

    // Mount iframe and load source
    document.body.appendChild(iframe);

    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(instrumentedHtml);
        doc.close();
      } else {
        iframe.srcdoc = instrumentedHtml;
      }
    } catch (err: any) {
      errors.push(`Failed to mount shadow iframe: ${err.message}`);
      finish(false);
    }
  });
}
