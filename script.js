/* ============================================
   PDX Home Energy Score - JavaScript v2.5
   Hybrid Booking Flow: Size Select -> Acuity Embed
   ============================================ */

// ========== ACUITY CONFIG ==========
var ACUITY_OWNER = '37810233';
var ACUITY_BASE  = 'https://app.acuityscheduling.com/schedule.php';

// ========== DOM READY ==========
document.addEventListener('DOMContentLoaded', function () {

    // ---------- STICKY HEADER SHADOW ----------
    var header = document.getElementById('header');
    window.addEventListener('scroll', function () {
        if (window.pageYOffset > 20) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }, { passive: true });

    // ---------- MOBILE NAV TOGGLE ----------
    var mobileToggle = document.getElementById('mobileToggle');
    var mainNav = document.getElementById('mainNav');

    if (mobileToggle) {
        mobileToggle.addEventListener('click', function () {
            mainNav.classList.toggle('active');
            mobileToggle.classList.toggle('active');
        });
    }

    // Close mobile nav when clicking a nav link
    document.querySelectorAll('.nav-link, .btn-nav').forEach(function (link) {
        link.addEventListener('click', function () {
            if (mainNav) mainNav.classList.remove('active');
            if (mobileToggle) mobileToggle.classList.remove('active');
        });
    });

    // ---------- SMOOTH SCROLL ----------
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
        link.addEventListener('click', function (e) {
            var targetId = this.getAttribute('href');
            if (targetId === '#') return;
            var target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                var offset = target.getBoundingClientRect().top + window.pageYOffset - 80;
                window.scrollTo({ top: offset, behavior: 'smooth' });
            }
        });
    });

    // ---------- FADE-IN ON SCROLL ----------
    var fadeEls = document.querySelectorAll('.fade-in');
    if (fadeEls.length > 0) {
        var fadeObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    fadeObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });
        fadeEls.forEach(function (el) { fadeObserver.observe(el); });
    }

}); // END DOMContentLoaded

// ========== HYBRID BOOKING FLOW ==========
// Step 1: User clicks a size option -> we show the Acuity embed
// The Acuity embed handles date/time selection, intake form, and Stripe payment

function selectAcuityType(size) {
    // Highlight the selected button
    document.querySelectorAll('.size-option').forEach(function (btn) { btn.classList.remove('selected'); });
    // Find the clicked one
    var buttons = document.querySelectorAll('.size-option');
    if (size === 'small' && buttons[0]) buttons[0].classList.add('selected');
    if (size === 'large' && buttons[1]) buttons[1].classList.add('selected');

    // Collapse Step 1 to show as completed
    var step1 = document.getElementById('bookingStep1');
    if (step1) {
        step1.classList.remove('active');
        step1.classList.add('completed');
    }

    // Build the Acuity iframe URL
    // notHeader=1 hides the Sign Up / Login header links inside the embed
    var iframeSrc = ACUITY_BASE + '?owner=' + ACUITY_OWNER + '&notHeader=1';

    // Update the description text
    var descEl = document.getElementById('acuitySelectedType');
    if (size === 'small') {
        descEl.textContent = 'Selected: Up to 2,250 sq ft (from $159) — Choose your date and time below.';
    } else {
        descEl.textContent = 'Selected: 2,251\u20132,500 sq ft (from $189) — Choose your date and time below.';
    }

    // Inject or update the iframe
    var wrapper = document.getElementById('acuityIframeWrapper');
    wrapper.innerHTML = '<iframe src="' + iframeSrc + '" title="Schedule Appointment" width="100%" height="800" frameBorder="0" scrolling="yes" style="border:none; border-radius:12px;"></iframe>';

    // Show the Acuity section
    var embedSection = document.getElementById('acuityEmbed');
    embedSection.style.display = 'block';

    // Smooth scroll to the Acuity embed
    setTimeout(function () {
        var top = embedSection.getBoundingClientRect().top + window.pageYOffset - 100;
        window.scrollTo({ top: top, behavior: 'smooth' });
    }, 100);
}

function changeSize() {
    // Re-show Step 1 and hide Acuity
    var step1 = document.getElementById('bookingStep1');
    if (step1) {
        step1.classList.remove('completed');
        step1.classList.add('active');
    }
    document.querySelectorAll('.size-option').forEach(function (btn) { btn.classList.remove('selected'); });

    var embedSection = document.getElementById('acuityEmbed');
    embedSection.style.display = 'none';

    // Clear the iframe to stop it loading
    var wrapper = document.getElementById('acuityIframeWrapper');
    wrapper.innerHTML = '';

    // Scroll back to step 1
    setTimeout(function () {
        var top = step1.getBoundingClientRect().top + window.pageYOffset - 100;
        window.scrollTo({ top: top, behavior: 'smooth' });
    }, 50);
}

// ========== CONTACT FORM ==========
function handleContactSubmit(event) {
    event.preventDefault();
    var form = document.getElementById('contactForm');
    var submitBtn = document.getElementById('contactSubmitBtn');
    var successMsg = document.getElementById('contactSuccess');
    if (!form) return false;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending\u2026';

    var formData = new FormData(form);

    fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
    }).then(function (response) {
        if (response.ok) {
            form.style.display = 'none';
            if (successMsg) successMsg.style.display = 'block';
        } else {
            form.style.display = 'none';
            if (successMsg) successMsg.style.display = 'block';
        }
    }).catch(function () {
        form.style.display = 'none';
        if (successMsg) successMsg.style.display = 'block';
    });

    return false;
}