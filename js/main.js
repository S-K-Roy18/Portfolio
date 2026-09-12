/* ============================================================
   MAIN - GLOBAL SCRIPTS
   Included on all pages (index, works, project details)
   ============================================================ */

/* ── Mobile Menu Toggle ── */
var sidemenu = document.getElementById("sidemenu");
var overlay  = document.getElementById("navOverlay");

function isMobile() {
    return window.innerWidth <= 768;
}

function openmenu() {
    if (sidemenu) {
        sidemenu.style.right = "0";
    }
    if (overlay) {
        overlay.style.display = "block";
        setTimeout(() => { overlay.style.opacity = "1"; }, 10);
    }
    document.body.style.overflow = "hidden";
}

function closemenu() {
    if (sidemenu) {
        sidemenu.style.right = ""; // Remove inline style so CSS takes over
    }
    if (overlay) {
        overlay.style.opacity = "0";
        setTimeout(() => { overlay.style.display = "none"; }, 300);
    }
    document.body.style.overflow = "auto";
}

/* ── Splash Screen Intro ── */
(function() {
    const introScreen = document.getElementById('intro-screen');
    if (!introScreen) return;
    const introText = document.getElementById('intro-text');
    const introTagline = document.getElementById('intro-tagline');
    const introDivider = document.getElementById('intro-divider');
    const introLoader = document.querySelector('.loader-container');
    const greetings = ["Hello", "नमस्ते", "নমস্কার"];
    let introIndex = 0;

    function animateIntro() {
        if (introIndex < greetings.length) {
            introText.innerHTML = greetings[introIndex];
            introText.classList.add('fade-in');

            if (introIndex === 0) {
                if(introTagline) introTagline.classList.add('fade-in');
                if(introDivider) introDivider.classList.add('fade-in');
                if(introLoader) introLoader.classList.add('fade-in');
            }
            
            setTimeout(() => {
                introText.classList.remove('fade-in');
                
                if (introIndex === greetings.length - 1) {
                    if(introTagline) introTagline.classList.remove('fade-in');
                    if(introDivider) introDivider.classList.remove('fade-in');
                    if(introLoader) introLoader.classList.remove('fade-in');
                }
                
                setTimeout(() => {
                    introIndex++;
                    animateIntro();
                }, 800); 
            }, 2300); 
        } else {
            introScreen.classList.add('slide-up');
            document.body.style.overflow = 'auto';
            setTimeout(() => {
                introScreen.style.display = 'none';
            }, 2000); 
        }
    }

    window.addEventListener('load', () => {
        let shouldShowIntro = true;
        const navEntries = performance.getEntriesByType("navigation");
        const isInternalNav = sessionStorage.getItem("portfolio_session_active");

        if (navEntries.length > 0) {
            const navType = navEntries[0].type;
            if (navType === "reload") {
                shouldShowIntro = true;
            } else if (navType === "back_forward") {
                shouldShowIntro = false;
            } else if (navType === "navigate") {
                if (isInternalNav) {
                    shouldShowIntro = false;
                } else {
                    shouldShowIntro = true;
                }
            }
        }

        sessionStorage.setItem("portfolio_session_active", "true");

        if (shouldShowIntro) {
            document.body.style.overflow = 'hidden';
            setTimeout(animateIntro, 200); 
        } else {
            introScreen.style.display = 'none';
            document.body.style.overflow = 'auto'; // Ensure scroll is available
        }
        
        // Enable smooth scrolling AFTER the browser has restored the scroll position instantly
        setTimeout(() => {
            document.documentElement.style.scrollBehavior = 'smooth';
        }, 50);
    });
})();

/* ── Shared Showreel Navigation ── */
(function() {
    const navRight = document.querySelector('.nav-right');
    if (navRight && !navRight.querySelector('.showreel-btn')) {
        const showreelButton = document.createElement('i');
        showreelButton.className = 'fa-solid fa-circle-play showreel-btn';
        showreelButton.setAttribute('onclick', 'openShowreel()');
        showreelButton.setAttribute('title', 'Play Showreel');
        showreelButton.setAttribute('role', 'button');
        showreelButton.setAttribute('tabindex', '0');
        showreelButton.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                window.openShowreel();
            }
        });
        navRight.insertBefore(showreelButton, navRight.querySelector('.profile-logo'));
    }

    let showreelModal = document.getElementById('showreel-modal');
    if (!showreelModal) {
        showreelModal = document.createElement('div');
        showreelModal.id = 'showreel-modal';
        showreelModal.className = 'showreel-modal';
        showreelModal.innerHTML = `
            <div class="showreel-close" role="button" tabindex="0" aria-label="Close showreel">
                <i class="fa-solid fa-rectangle-xmark"></i>
            </div>
            <div class="showreel-content">
                <video id="showreel-video" controls playsinline preload="metadata">
                    Your browser does not support the video tag.
                </video>
            </div>
            <div id="showreel-status" class="showreel-status" role="status" aria-live="polite" aria-hidden="true">
                <span class="showreel-spinner" aria-hidden="true"></span>
                <span class="showreel-status-message">Wait to start, it may take a few seconds...</span>
            </div>`;
        document.body.appendChild(showreelModal);
    }

    const showreelVideo = showreelModal.querySelector('#showreel-video');
    const showreelStatus = showreelModal.querySelector('#showreel-status');
    const showreelStatusMessage = showreelStatus?.querySelector('.showreel-status-message');
    const showreelClose = showreelModal.querySelector('.showreel-close');
    let showreelStatusShownAt = 0;
    let showreelStatusHideTimer;

    function showShowreelStatus(message, isError = false) {
        if (!showreelStatus || !showreelStatusMessage) return;
        clearTimeout(showreelStatusHideTimer);
        showreelStatusShownAt = Date.now();
        showreelStatusMessage.textContent = message;
        showreelStatus.classList.toggle('error', isError);
        showreelStatus.classList.add('visible');
        showreelStatus.setAttribute('aria-hidden', 'false');
    }

    function hideShowreelStatus(force = false) {
        if (!showreelStatus) return;
        if (!force) {
            const remainingTime = Math.max(0, 3000 - (Date.now() - showreelStatusShownAt));
            if (remainingTime > 0) {
                showreelStatusHideTimer = setTimeout(hideShowreelStatus, remainingTime);
                return;
            }
        }
        showreelStatus.classList.remove('visible');
        showreelStatus.setAttribute('aria-hidden', 'true');
    }

    window.openShowreel = function() {
        if (!showreelModal || !showreelVideo) return;
        const videoRoot = window.location.pathname.includes('/html/') ? '../Video/' : 'Video/';
        showreelVideo.src = window.matchMedia('(orientation: portrait)').matches
            ? `${videoRoot}Surya portfolio(1920x1020) mobile.mp4`
            : `${videoRoot}Surya portfolio(1920x1020).mp4`;
        showShowreelStatus('Wait to start, it may take a few seconds...');
        showreelModal.classList.add('active');
        document.body.classList.add('modal-open');
        showreelVideo.currentTime = 0;
        showreelVideo.play().catch(() => {
            showShowreelStatus('Unable to load video. Please try again.', true);
        });
    };

    window.closeShowreel = function() {
        if (!showreelModal || !showreelVideo) return;
        showreelModal.classList.remove('active');
        document.body.classList.remove('modal-open');
        showreelVideo.pause();
        clearTimeout(showreelStatusHideTimer);
        hideShowreelStatus(true);
    };

    showreelVideo.addEventListener('playing', hideShowreelStatus);
    showreelVideo.addEventListener('error', () => {
        showShowreelStatus('Unable to load video. Please try again.', true);
    });
    showreelVideo.addEventListener('ended', window.closeShowreel);
    showreelClose.addEventListener('click', window.closeShowreel);
    showreelClose.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            window.closeShowreel();
        }
    });
    showreelModal.addEventListener('click', (event) => {
        if (event.target === showreelModal || event.target.classList.contains('showreel-content')) {
            window.closeShowreel();
        }
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && showreelModal.classList.contains('active')) {
            window.closeShowreel();
        }
    });
})();
