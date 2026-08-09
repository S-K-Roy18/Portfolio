/* ============================================================
   PROJECT - DETAILS PAGE SCRIPTS
   Included only on project-*.html pages
   ============================================================ */

/* ── Project Details Scroll Tracking ── */
document.addEventListener('DOMContentLoaded', () => {
    const scrollables = document.querySelectorAll('.project-right-scrollable');
    scrollables.forEach(el => {
        const updateScrollState = () => {
            const atTop = el.scrollTop <= 10;
            const atBottom = Math.ceil(el.scrollHeight - el.scrollTop) <= el.clientHeight + 10;
            
            el.classList.remove('is-top', 'is-middle', 'is-bottom');
            if (atTop && atBottom) {
                el.classList.add('is-top'); 
            } else if (atTop) {
                el.classList.add('is-top');
            } else if (atBottom) {
                el.classList.add('is-bottom');
            } else {
                el.classList.add('is-middle');
            }
        };
        
        el.addEventListener('scroll', updateScrollState);
        window.addEventListener('resize', updateScrollState);
        updateScrollState();
    });
});
