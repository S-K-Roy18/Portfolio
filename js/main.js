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
            }, 800); 
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
