/* ============================================/* ============================================

   PDX Home Energy Score — JavaScript v2.0   PDX Home Energy Score — JavaScript

   Interactive Booking Flow + Stripe Demo   Lightweight, no dependencies

   ============================================ */   ============================================ */



// ========== BOOKING STATE ==========document.addEventListener('DOMContentLoaded', function () {

let bookingState = {

    size: null,    // ---------- STICKY HEADER SHADOW ----------

    basePrice: 0,    const header = document.getElementById('header');

    selectedDate: null,    let lastScroll = 0;

    selectedSlot: null,

    finalPrice: 0    window.addEventListener('scroll', function () {

};        const currentScroll = window.pageYOffset;

        if (currentScroll > 20) {

let currentMonth = new Date().getMonth();            header.classList.add('scrolled');

let currentYear = new Date().getFullYear();        } else {

            header.classList.remove('scrolled');

// ========== DOM READY ==========        }

document.addEventListener('DOMContentLoaded', function () {        lastScroll = currentScroll;

    }, { passive: true });

    // ---------- STICKY HEADER SHADOW ----------

    const header = document.getElementById('header');    // ---------- MOBILE NAV TOGGLE ----------

    window.addEventListener('scroll', function () {    const mobileToggle = document.getElementById('mobileToggle');

        if (window.pageYOffset > 20) {    const mainNav = document.getElementById('mainNav');

            header.classList.add('scrolled');

        } else {    if (mobileToggle) {

            header.classList.remove('scrolled');        mobileToggle.addEventListener('click', function () {

        }            mainNav.classList.toggle('active');

    }, { passive: true });            mobileToggle.classList.toggle('active');



    // ---------- MOBILE NAV TOGGLE ----------            // Animate hamburger to X

    const mobileToggle = document.getElementById('mobileToggle');            const spans = mobileToggle.querySelectorAll('span');

    const mainNav = document.getElementById('mainNav');            if (mobileToggle.classList.contains('active')) {

                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';

    if (mobileToggle) {                spans[1].style.opacity = '0';

        mobileToggle.addEventListener('click', function () {                spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';

            mainNav.classList.toggle('active');            } else {

            mobileToggle.classList.toggle('active');                spans[0].style.transform = '';

            const spans = mobileToggle.querySelectorAll('span');                spans[1].style.opacity = '';

            if (mobileToggle.classList.contains('active')) {                spans[2].style.transform = '';

                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';            }

                spans[1].style.opacity = '0';        });

                spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';    }

            } else {

                spans[0].style.transform = '';    // Close mobile nav on link click

                spans[1].style.opacity = '';    document.querySelectorAll('.nav-link').forEach(function (link) {

                spans[2].style.transform = '';        link.addEventListener('click', function () {

            }            mainNav.classList.remove('active');

        });            if (mobileToggle) {

    }                mobileToggle.classList.remove('active');

                const spans = mobileToggle.querySelectorAll('span');

    // Close mobile nav on link click                spans[0].style.transform = '';

    document.querySelectorAll('.nav-link, .btn-nav').forEach(function (link) {                spans[1].style.opacity = '';

        link.addEventListener('click', function () {                spans[2].style.transform = '';

            mainNav.classList.remove('active');            }

            if (mobileToggle) {        });

                mobileToggle.classList.remove('active');    });

                const spans = mobileToggle.querySelectorAll('span');

                spans[0].style.transform = '';    // ---------- SMOOTH SCROLL (with header offset) ----------

                spans[1].style.opacity = '';    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {

                spans[2].style.transform = '';        anchor.addEventListener('click', function (e) {

            }            const targetId = this.getAttribute('href');

        });            if (targetId === '#') return;

    });

            const target = document.querySelector(targetId);

    // ---------- SMOOTH SCROLL (with header offset) ----------            if (target) {

    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {                e.preventDefault();

        anchor.addEventListener('click', function (e) {                const headerHeight = header.offsetHeight;

            const targetId = this.getAttribute('href');                const targetPos = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;

            if (targetId === '#') return;                window.scrollTo({

            const target = document.querySelector(targetId);                    top: targetPos,

            if (target) {                    behavior: 'smooth'

                e.preventDefault();                });

                const headerHeight = header.offsetHeight;            }

                const targetPos = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;        });

                window.scrollTo({ top: targetPos, behavior: 'smooth' });    });

            }

        });    // ---------- SCROLL ANIMATIONS (Intersection Observer) ----------

    });    const fadeElements = document.querySelectorAll(

        '.badge-item, .price-card, .step-item, .payment-card, .faq-item, .addon-item'

    // ---------- SCROLL ANIMATIONS ----------    );

    const fadeElements = document.querySelectorAll(

        '.badge-item, .price-card, .step-item, .payment-card, .faq-item, .size-option'    if ('IntersectionObserver' in window) {

    );        const observer = new IntersectionObserver(function (entries) {

            entries.forEach(function (entry, index) {

    if ('IntersectionObserver' in window) {                if (entry.isIntersecting) {

        const observer = new IntersectionObserver(function (entries) {                    // Stagger the animation

            entries.forEach(function (entry) {                    const delay = Array.from(entry.target.parentElement.children)

                if (entry.isIntersecting) {                        .indexOf(entry.target) * 100;

                    const delay = Array.from(entry.target.parentElement.children)                    setTimeout(function () {

                        .indexOf(entry.target) * 100;                        entry.target.classList.add('fade-in', 'visible');

                    setTimeout(function () {                    }, delay);

                        entry.target.classList.add('fade-in', 'visible');                    observer.unobserve(entry.target);

                    }, delay);                }

                    observer.unobserve(entry.target);            });

                }        }, {

            });            threshold: 0.1,

        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });            rootMargin: '0px 0px -40px 0px'

        });

        fadeElements.forEach(function (el) {

            el.classList.add('fade-in');        fadeElements.forEach(function (el) {

            observer.observe(el);            el.classList.add('fade-in');

        });            observer.observe(el);

    }        });

    } else {

    // ---------- ACTIVE NAV HIGHLIGHTING ----------        // Fallback: just show everything

    const sections = document.querySelectorAll('section[id]');        fadeElements.forEach(function (el) {

    const navLinks = document.querySelectorAll('.nav-link:not(.btn-nav):not(.nav-phone)');            el.style.opacity = '1';

        });

    window.addEventListener('scroll', function () {    }

        let current = '';

        sections.forEach(function (section) {    // ---------- ACTIVE NAV HIGHLIGHTING ----------

            const sectionTop = section.offsetTop - 100;    const sections = document.querySelectorAll('section[id]');

            if (window.pageYOffset >= sectionTop) {    const navLinks = document.querySelectorAll('.nav-link:not(.btn-nav)');

                current = section.getAttribute('id');

            }    window.addEventListener('scroll', function () {

        });        let current = '';

        navLinks.forEach(function (link) {        sections.forEach(function (section) {

            link.style.color = '';            const sectionTop = section.offsetTop - 100;

            link.style.fontWeight = '';            if (window.pageYOffset >= sectionTop) {

            if (link.getAttribute('href') === '#' + current) {                current = section.getAttribute('id');

                link.style.color = '#1F4E79';            }

                link.style.fontWeight = '700';        });

            }

        });        navLinks.forEach(function (link) {

    }, { passive: true });            link.style.color = '';

            link.style.fontWeight = '';

    // ---------- INIT CALENDAR ----------            if (link.getAttribute('href') === '#' + current) {

    renderCalendar();                link.style.color = '#1F4E79';

});                link.style.fontWeight = '700';

            }

// ========== SIZE SELECTION (Step 1) ==========        });

function selectSize(btn) {    }, { passive: true });

    // Deselect all

    document.querySelectorAll('.size-option').forEach(function(el) {});

        el.classList.remove('selected');
    });
    btn.classList.add('selected');

    bookingState.size = btn.dataset.size;
    bookingState.basePrice = parseInt(btn.dataset.basePrice);

    // Move to step 2
    setTimeout(function() {
        showStep(2);
    }, 300);
}

// ========== SHOW BOOKING STEP ==========
function showStep(stepNum) {
    var steps = document.querySelectorAll('.booking-step');
    steps.forEach(function(step, idx) {
        step.classList.remove('active', 'completed');
        if (idx + 1 < stepNum) {
            step.classList.add('completed');
        } else if (idx + 1 === stepNum) {
            step.classList.add('active');
        }
    });
}

// ========== CALENDAR ==========
function renderCalendar() {
    var calMonth = document.getElementById('calMonth');
    var calDays = document.getElementById('calDays');
    if (!calMonth || !calDays) return;

    var monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];

    calMonth.textContent = monthNames[currentMonth] + ' ' + currentYear;
    calDays.innerHTML = '';

    var firstDay = new Date(currentYear, currentMonth, 1).getDay();
    var daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    var today = new Date();

    // Empty cells for days before 1st
    for (var i = 0; i < firstDay; i++) {
        var empty = document.createElement('div');
        empty.className = 'cal-day cal-day-empty';
        calDays.appendChild(empty);
    }

    // Day cells
    for (var d = 1; d <= daysInMonth; d++) {
        var dayEl = document.createElement('button');
        dayEl.className = 'cal-day';
        dayEl.textContent = d;

        var thisDate = new Date(currentYear, currentMonth, d);
        var isPast = thisDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
        var isToday = (d === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear());

        if (isPast) {
            dayEl.classList.add('cal-day-disabled');
        } else {
            // Make weekdays available (demo: skip Sundays for realism)
            if (thisDate.getDay() !== 0) {
                dayEl.classList.add('cal-day-available');
            }
            dayEl.setAttribute('data-date', currentYear + '-' + (currentMonth + 1) + '-' + d);
            dayEl.setAttribute('data-day-of-week', thisDate.getDay());
            dayEl.onclick = function() { selectDay(this); };
        }

        if (isToday) {
            dayEl.classList.add('cal-day-today');
        }

        calDays.appendChild(dayEl);
    }
}

function changeMonth(dir) {
    currentMonth += dir;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    renderCalendar();
}

function selectDay(el) {
    // Deselect all days
    document.querySelectorAll('.cal-day').forEach(function(d) {
        d.classList.remove('cal-day-selected');
    });
    el.classList.add('cal-day-selected');

    bookingState.selectedDate = el.getAttribute('data-date');
    var dayOfWeek = parseInt(el.getAttribute('data-day-of-week'));

    // Generate time slots based on day
    generateTimeSlots(dayOfWeek);
}

function generateTimeSlots(dayOfWeek) {
    var slotsContainer = document.getElementById('timeSlots');
    var pricingNote = document.getElementById('pricingNote');
    var pricingNoteText = document.getElementById('pricingNoteText');

    // Show pricing explanation
    if (pricingNote) {
        pricingNote.style.display = 'flex';
        pricingNoteText.textContent = 'Prices vary based on day and time. Weekday daytime slots offer the best rates.';
    }

    var basePrice = bookingState.basePrice || 159;
    var slots = [];

    if (dayOfWeek === 6) {
        // Saturday
        slots = [
            { time: '9:00 AM', price: basePrice + 20, tag: 'weekend', tagLabel: 'Sat' },
            { time: '10:00 AM', price: basePrice + 20, tag: 'weekend', tagLabel: 'Sat' },
            { time: '11:00 AM', price: basePrice + 20, tag: 'weekend', tagLabel: 'Sat' },
            { time: '1:00 PM', price: basePrice + 20, tag: 'weekend', tagLabel: 'Sat' },
            { time: '2:00 PM', price: basePrice + 20, tag: 'weekend', tagLabel: 'Sat' }
        ];
    } else {
        // Weekday
        slots = [
            { time: '9:00 AM', price: basePrice, tag: 'best-rate', tagLabel: 'Best Rate' },
            { time: '10:00 AM', price: basePrice, tag: 'best-rate', tagLabel: 'Best Rate' },
            { time: '11:00 AM', price: basePrice, tag: 'best-rate', tagLabel: 'Best Rate' },
            { time: '1:00 PM', price: basePrice, tag: 'best-rate', tagLabel: 'Best Rate' },
            { time: '2:00 PM', price: basePrice, tag: 'best-rate', tagLabel: 'Best Rate' },
            { time: '3:00 PM', price: basePrice, tag: 'best-rate', tagLabel: 'Best Rate' },
            { time: '5:00 PM', price: basePrice + 20, tag: 'evening', tagLabel: 'Evening' },
            { time: '6:00 PM', price: basePrice + 20, tag: 'evening', tagLabel: 'Evening' }
        ];
    }

    var html = '<div class="time-slot-list">';
    slots.forEach(function(slot) {
        html += '<button class="time-slot" onclick="selectSlot(this, ' + slot.price + ', \'' + slot.time + '\')">';
        html += '<span class="time-slot-time">' + slot.time;
        html += '<span class="time-slot-tag ' + slot.tag + '">' + slot.tagLabel + '</span>';
        html += '</span>';
        html += '<span class="time-slot-price">$' + slot.price + '</span>';
        html += '</button>';
    });
    html += '</div>';

    slotsContainer.innerHTML = html;
}

function selectSlot(el, price, time) {
    // Deselect all slots
    document.querySelectorAll('.time-slot').forEach(function(s) {
        s.classList.remove('selected');
    });
    el.classList.add('selected');

    bookingState.selectedSlot = time;
    bookingState.finalPrice = price;

    // Move to step 3
    setTimeout(function() {
        showStep(3);
        updateOrderSummary();
    }, 300);
}

function updateOrderSummary() {
    var sizeLabel = bookingState.size === 'small' ? 'Up to 2,250 sq ft' : '2,251 – 2,500 sq ft';

    var dateParts = bookingState.selectedDate.split('-');
    var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var dateLabel = monthNames[parseInt(dateParts[1]) - 1] + ' ' + dateParts[2] + ', ' + dateParts[0] + ' at ' + bookingState.selectedSlot;

    document.getElementById('summarySize').textContent = sizeLabel;
    document.getElementById('summaryTime').textContent = dateLabel;
    document.getElementById('summaryPrice').textContent = '$' + bookingState.finalPrice;
}

// ========== STRIPE DEMO ==========
function handleStripeDemo() {
    // In production, this would create a Stripe Checkout session
    // For demo purposes, show a toast notification
    var toast = document.getElementById('stripeToast');
    if (toast) {
        toast.classList.add('show');
        setTimeout(function() {
            toast.classList.remove('show');
        }, 5000);
    }

    // Attempt real Stripe Checkout redirect (test mode)
    // The publishable key is used client-side; the actual session would
    // be created by a server-side endpoint in production.
    try {
        var stripe = Stripe('pk_test_51SeKxiJoivhtUXw7DZW5HvmkdNGnFRodqNd1cnPmoZoY9C3zGZIfpXXQIYRajz5FGuJrQLKT27wdmR49jhoPfVoR00LYrpA2Pv');
        console.log('Stripe initialized (test mode). In production, this creates a checkout session server-side.');
        console.log('Booking summary:', {
            size: bookingState.size,
            date: bookingState.selectedDate,
            time: bookingState.selectedSlot,
            price: bookingState.finalPrice
        });
    } catch(e) {
        console.log('Stripe demo mode — no server-side session available.');
    }
}
