/* ============================================================
   HOME - INDEX PAGE SCRIPTS
   Included only on index.html
   ============================================================ */

/* ── About Me Tabs ── */
var tablinks = document.getElementsByClassName("tab-links");
var tabcontents = document.getElementsByClassName("tab-contents");
function opentab(tabname){
    for(let tablink of tablinks){
        tablink.classList.remove("active-link");
    }
    for(let tabcontent of tabcontents){
        tabcontent.classList.remove("active-tab");
    }
    event.currentTarget.classList.add("active-link");
    const target = document.getElementById(tabname);
    if(target) target.classList.add("active-tab");
}

/* ── Navbar Scroll & Effects ── */
const navbar = document.getElementById("navbar");
const bgLayer = document.getElementById("bgLayer");
const heroText = document.querySelector(".header-text");

window.addEventListener("scroll", function () {
    let scrollY = window.scrollY;
    
    if(navbar) {
        if (scrollY > 50) {
            navbar.classList.add("scrolled");
        } else {
            navbar.classList.remove("scrolled");
        }
    }
    
    // Dynamic blur, fade, and parallax effect
    let maxScroll = window.innerHeight; 
    let progress = Math.min(scrollY / maxScroll, 1);
    
    let blurValue = progress * 8; // 0 to 8px
    let overlayAlpha = progress * 0.75; // 0 to 0.75 dark overlay
    let heroOpacity = 1 - (progress * 1.5); // fades slightly faster
    
    if(bgLayer) {
        bgLayer.style.backdropFilter = `blur(${blurValue}px)`;
        bgLayer.style.webkitBackdropFilter = `blur(${blurValue}px)`;
        bgLayer.style.background = `rgba(0, 0, 0, ${overlayAlpha})`;
    }
    
    if(heroText) {
        heroText.style.opacity = Math.max(heroOpacity, 0);
        heroText.style.transform = `translateY(${progress * 60}px)`;
    }
});

/* ── Active link tracking ── */
document.addEventListener("DOMContentLoaded", function() {
    const sections = document.querySelectorAll("section, div[id]");
    const navLinks = document.querySelectorAll("#sidemenu li a");
    const glider = document.querySelector(".glider");

    // Intersection observer for section tracking
    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                navLinks.forEach(function (link) {
                    link.classList.remove("active-nav");
                    if (link.getAttribute("href") === "#" + entry.target.id) {
                        link.classList.add("active-nav");
                    }
                });
            }
        });
    }, { threshold: 0.3 });

    sections.forEach(function (section) {
        observer.observe(section);
    });

    // Update active nav and mobile glider based on scroll height
    const headerSections = document.querySelectorAll("#header, #about, #portfolio, #contact");
    function updateActiveNav() {
        let current = "";
        headerSections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (window.scrollY >= sectionTop - window.innerHeight / 3) {
                current = section.getAttribute("id");
            }
        });

        navLinks.forEach(link => {
            link.classList.remove("active-nav");
            if (current && link.getAttribute("href") === `#${current}`) {
                link.classList.add("active-nav");
                
                // Move the mobile glider to the active item
                if (glider && window.innerWidth <= 1024) {
                    const li = link.parentElement;
                    glider.style.transform = `translateY(${li.offsetTop}px)`;
                    glider.style.height = `${li.offsetHeight}px`;
                }
            }
        });
    }

    window.addEventListener("scroll", updateActiveNav);
    window.addEventListener("resize", updateActiveNav); 
    setTimeout(updateActiveNav, 100); 

    // Smooth scrolling and Edge security fix
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId && targetId !== '#') {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    e.preventDefault(); 
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });
});

/* ── Portrait Clip Path Effect ── */
document.addEventListener("DOMContentLoaded", function() {
    const header = document.getElementById("header");
    const portrait = document.querySelector(".hero-portrait");
    
    if (!header || !portrait) return;

    function updatePortraitClip() {
        if (window.innerWidth <= 1024) return;
        const rect = header.getBoundingClientRect();
        const viewportHeight = window.innerHeight;

        if (rect.bottom < viewportHeight) {
            const clipAmount = viewportHeight - rect.bottom;
            portrait.style.clipPath = `inset(0 0 ${clipAmount}px 0)`;
        } else {
            portrait.style.clipPath = `inset(0)`;
        }
    }

    let ticking = false;
    window.addEventListener("scroll", function() {
        if (!ticking) {
            window.requestAnimationFrame(function() {
                updatePortraitClip();
                ticking = false;
            });
            ticking = true;
        }
    });
    
    window.addEventListener("resize", updatePortraitClip);
    updatePortraitClip();
});

/* ── Location Box Hover ── */
const locationBox = document.querySelector(".location-box");
if (locationBox) {
    const locationText = document.getElementById("location-text");
    const locationIconWrapper = document.getElementById("location-icon-wrapper");
    let isTimeShowing = false;

    function showTime() {
        if(!locationText || !locationIconWrapper) return;
        locationText.innerHTML = new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
        locationIconWrapper.innerHTML = '<i class="fa-regular fa-clock"></i>';
    }

    function showLocation() {
        if(!locationText || !locationIconWrapper) return;
        locationText.innerHTML = "Kolkata, West Bengal";
        locationIconWrapper.innerHTML = '<i class="fa-solid fa-location-dot"></i>';
    }

    locationBox.addEventListener("mouseenter", () => {
        if (!window.matchMedia("(max-width: 768px)").matches) {
            showTime();
        }
    });

    locationBox.addEventListener("mouseleave", () => {
        if (!window.matchMedia("(max-width: 768px)").matches) {
            showLocation();
        }
    });

    locationBox.addEventListener("click", () => {
        if (window.matchMedia("(max-width: 768px)").matches) {
            isTimeShowing = !isTimeShowing;
            if (isTimeShowing) showTime();
            else showLocation();
        }
    });
}

/* ── Wheel/Touch Card Gallery (About) ── */
(function () {
    const gallery  = document.getElementById('cardGallery');
    const aboutSection = document.getElementById('about');
    if (!gallery || !aboutSection) return;

    const cards = Array.from(gallery.querySelectorAll('.gallery-card'));
    const TOTAL = cards.length;
    let current = 0;

    function getStateClass(i, active) {
        if (i === active) return 'card-active';
        const prev = (active - 1 + TOTAL) % TOTAL;
        const next = (active + 1) % TOTAL;
        if (i === prev) return 'card-prev';
        if (i === next) return 'card-next';
        return i < active ? 'card-far-prev' : 'card-far-next';
    }

    function updateCards(idx) {
        cards.forEach((card, i) => {
            card.className = 'gallery-card ' + getStateClass(i, idx);
        });
        current = idx;
    }

    function goTo(idx) {
        idx = (idx + TOTAL) % TOTAL;
        updateCards(idx);
    }

    let autoScrollTimer = null;
    let interactionTimeout = null;
    let isAboutVisible = false;
    let isInteracting = false;

    function startAutoScroll() {
        if (autoScrollTimer) clearInterval(autoScrollTimer);
        if (!isAboutVisible || isInteracting || document.hidden) return;
        autoScrollTimer = setInterval(() => { goTo(current + 1); }, 6000);
    }

    function pauseAutoScroll() {
        if (autoScrollTimer) clearInterval(autoScrollTimer);
        autoScrollTimer = null;
    }

    function handleUserInteraction() {
        isInteracting = true;
        pauseAutoScroll();
        if (interactionTimeout) clearTimeout(interactionTimeout);
        interactionTimeout = setTimeout(() => {
            isInteracting = false;
            startAutoScroll();
        }, 6000);
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            isAboutVisible = entry.isIntersecting;
            if (isAboutVisible) {
                handleUserInteraction();
            } else {
                pauseAutoScroll();
            }
        });
    }, { threshold: 0.1 }); 
    observer.observe(gallery);

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) pauseAutoScroll();
        else if (isAboutVisible) handleUserInteraction();
    });

    window.addEventListener('scroll', handleUserInteraction, { passive: true });
    window.addEventListener('keydown', handleUserInteraction, { passive: true });
    window.addEventListener('touchstart', handleUserInteraction, { passive: true });
    window.addEventListener('touchmove', handleUserInteraction, { passive: true });

    let wheelLock = false;
    gallery.addEventListener('wheel', (e) => {
        e.preventDefault();
        handleUserInteraction();
        if (wheelLock) return;
        wheelLock = true;
        goTo(current + (e.deltaY > 0 ? 1 : -1));
        setTimeout(() => { wheelLock = false; }, 520);
    }, { passive: false });

    let touchY = 0;
    gallery.addEventListener('touchstart', (e) => {
        touchY = e.touches[0].clientY;
        handleUserInteraction();
    }, { passive: true });

    gallery.addEventListener('touchmove', (e) => {
        e.preventDefault();
        handleUserInteraction();
    }, { passive: false });

    gallery.addEventListener('touchend', (e) => {
        const dy = touchY - e.changedTouches[0].clientY;
        if (Math.abs(dy) > 40) goTo(current + (dy > 0 ? 1 : -1));
        handleUserInteraction();
    }, { passive: true });

    updateCards(0);
})();

/* ── Coverflow Carousel (Portfolio) ── */
document.addEventListener("DOMContentLoaded", () => {
    const coverflow = document.getElementById("coverflow");
    if (!coverflow) return;

    const cards = Array.from(coverflow.querySelectorAll(".coverflow-card"));
    const n = cards.length;
    if (n === 0) return;

    let active = 0; 
    
    const MAX_VISIBLE = 2;
    const SCALE_STEP = 0.16;
    const DEPTH = 240;
    const gap = 9; 
    const tilt = 12;
    const sideTilt = 8;

    function updateCoverflow() {
        cards.forEach((card, i) => {
            let rel = i - active;
            if (rel > Math.floor(n / 2)) rel -= n;
            if (rel < -Math.floor(n / 2)) rel += n;

            const ax = Math.abs(rel);
            const visible = ax <= MAX_VISIBLE;
            const isActive = (rel === 0);
            
            const sc = Math.max(0.4, 1 - ax * SCALE_STEP);
            const tx = rel * (gap * 30);
            const tz = -ax * DEPTH;
            const ry = -rel * tilt;
            const rz = rel * sideTilt;

            card.style.transform = `translate(-50%, -50%) translateX(${tx}px) translateZ(${tz}px) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${sc})`;
            
            if (visible) {
                card.style.opacity = 1;
                card.style.pointerEvents = "auto";
                card.style.zIndex = n - ax; 
            } else {
                card.style.opacity = 0;
                card.style.pointerEvents = "none";
                card.style.zIndex = 0;
            }
            
            if (isActive) card.classList.add("active");
            else card.classList.remove("active");

            const dim = card.querySelector(".card-dim");
            if (dim) dim.style.opacity = isActive ? 0 : 0.6;

            const overlay = card.querySelector(".card-overlay");
            if (overlay) {
                if (isActive) overlay.classList.add("active");
                else overlay.classList.remove("active");
            }
        });
    }

    window.handleCardClick = function(index) {
        if (active !== index) {
            active = index;
            updateCoverflow();
        }
    };

    updateCoverflow();

    window.addEventListener("keydown", (e) => {
        const rect = coverflow.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            if (e.key === "ArrowRight") {
                active = (active + 1) % n;
                updateCoverflow();
            } else if (e.key === "ArrowLeft") {
                active = (active - 1 + n) % n;
                updateCoverflow();
            }
        }
    });
});

/* ── Showreel Modal ── */
const showreelModal = document.getElementById('showreel-modal');
const showreelVideo = document.getElementById('showreel-video');

function openShowreel() {
    if(!showreelModal || !showreelVideo) return;
    if (window.innerWidth <= 768) {
        showreelVideo.src = "Video/PortVideoMobile.mp4";
    } else {
        showreelVideo.src = "Video/PortVideo.mp4";
    }
    
    showreelModal.classList.add('active');
    document.body.classList.add('modal-open');
    showreelVideo.currentTime = 0;
    showreelVideo.play();
}

function closeShowreel() {
    if(!showreelModal || !showreelVideo) return;
    showreelModal.classList.remove('active');
    document.body.classList.remove('modal-open');
    showreelVideo.pause();
}

if(showreelVideo && showreelModal) {
    showreelVideo.addEventListener('ended', closeShowreel);
    showreelModal.addEventListener('click', (e) => {
        if (e.target === showreelModal || e.target.classList.contains('showreel-content')) {
            closeShowreel();
        }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && showreelModal.classList.contains('active')) {
            closeShowreel();
        }
    });
}
