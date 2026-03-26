/* ============================================
   PDX Home Energy Score - JavaScript v2.1
   Interactive Booking Flow + Stripe Elements Demo
   ============================================ */

// ========== BOOKING STATE ==========
var bookingState = {
    size: null,
    basePrice: 0,
    selectedDate: null,
    selectedSlot: null,
    finalPrice: 0
};

var currentMonth = new Date().getMonth();
var currentYear = new Date().getFullYear();

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

    // ---------- RENDER INITIAL CALENDAR ----------
    renderCalendar();

}); // END DOMContentLoaded

// ========== BOOKING FLOW ==========
function showStep(step) {
    for (var i = 1; i <= 3; i++) {
        var el = document.getElementById('bookingStep' + i);
        if (!el) continue;
        el.classList.remove('active', 'completed');
        if (i < step) el.classList.add('completed');
        if (i === step) el.classList.add('active');
    }
    // Smooth scroll to the newly active step (with header offset)
    setTimeout(function () {
        var activeStep = document.getElementById('bookingStep' + step);
        if (activeStep) {
            var top = activeStep.getBoundingClientRect().top + window.pageYOffset - 100;
            window.scrollTo({ top: top, behavior: 'smooth' });
        }
    }, 50);
}

// Allow clicking a completed step header to go back to it
function stepHeaderClick(step) {
    var el = document.getElementById('bookingStep' + step);
    if (el && el.classList.contains('completed')) {
        showStep(step);
    }
}

function selectSize(btn) {
    document.querySelectorAll('.size-option').forEach(function (b) { b.classList.remove('selected'); });
    btn.classList.add('selected');
    bookingState.size = btn.getAttribute('data-size');
    bookingState.basePrice = parseInt(btn.getAttribute('data-base-price'), 10);

    // Update step 1 summary
    var label = bookingState.size === 'small' ? 'Up to 2,250 sq ft' : '2,251–2,500 sq ft';
    var s1 = document.getElementById('stepSummary1');
    if (s1) s1.textContent = label;

    setTimeout(function () { showStep(2); }, 300);
}

// ========== CALENDAR ==========
function renderCalendar() {
    var monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    var calMonthEl = document.getElementById('calMonth');
    if (calMonthEl) calMonthEl.textContent = monthNames[currentMonth] + ' ' + currentYear;

    var firstDay = new Date(currentYear, currentMonth, 1).getDay();
    var daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var calDays = document.getElementById('calDays');
    if (!calDays) return;
    var html = '';

    // Empty slots before first day
    for (var e = 0; e < firstDay; e++) {
        html += '<div class="cal-day cal-day-empty"></div>';
    }

    for (var d = 1; d <= daysInMonth; d++) {
        var date = new Date(currentYear, currentMonth, d);
        var dateStr = currentYear + '-' + String(currentMonth + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
        var dayOfWeek = date.getDay();

        var classes = 'cal-day';
        if (date < today) {
            classes += ' cal-day-disabled';
            html += '<div class="' + classes + '">' + d + '</div>';
        } else if (date.getTime() === today.getTime()) {
            classes += ' cal-day-today cal-day-available';
            html += '<button class="' + classes + '" onclick="selectDate(\'' + dateStr + '\', this)">' + d + '</button>';
        } else if (dayOfWeek === 0) {
            // Sundays disabled
            classes += ' cal-day-disabled';
            html += '<div class="' + classes + '">' + d + '</div>';
        } else {
            classes += ' cal-day-available';
            html += '<button class="' + classes + '" onclick="selectDate(\'' + dateStr + '\', this)">' + d + '</button>';
        }
    }

    calDays.innerHTML = html;
}

function changeMonth(dir) {
    currentMonth += dir;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    renderCalendar();
}

function selectDate(dateStr, el) {
    document.querySelectorAll('.cal-day').forEach(function (d) { d.classList.remove('cal-day-selected'); });
    el.classList.add('cal-day-selected');
    bookingState.selectedDate = dateStr;

    var note = document.getElementById('pricingNote');
    var noteText = document.getElementById('pricingNoteText');
    var dateParts = dateStr.split('-');
    var date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
    var dayOfWeek = date.getDay();

    if (dayOfWeek === 6) {
        if (note) note.style.display = 'flex';
        if (noteText) noteText.textContent = 'Weekend appointments have adjusted pricing.';
    } else {
        if (note) note.style.display = 'none';
    }

    renderTimeSlots(dateStr, dayOfWeek);
}

function renderTimeSlots(dateStr, dayOfWeek) {
    var slotsContainer = document.getElementById('timeSlots');
    if (!slotsContainer) return;

    var base = bookingState.basePrice;    var slots = [];

    if (dayOfWeek === 6) {
        // Saturday
        slots = [
            { time: '9:00 AM', price: base + 20, tag: 'weekend', tagLabel: 'Weekend' },
            { time: '10:00 AM', price: base + 20, tag: 'weekend', tagLabel: 'Weekend' },
            { time: '11:00 AM', price: base + 20, tag: 'weekend', tagLabel: 'Weekend' }
        ];
    } else {
        slots = [
            { time: '9:00 AM', price: base, tag: 'best-rate', tagLabel: 'Best Rate' },
            { time: '10:00 AM', price: base, tag: 'best-rate', tagLabel: 'Best Rate' },
            { time: '11:00 AM', price: base, tag: '', tagLabel: '' },
            { time: '1:00 PM', price: base, tag: '', tagLabel: '' },
            { time: '2:00 PM', price: base, tag: '', tagLabel: '' },
            { time: '4:00 PM', price: base + 10, tag: 'evening', tagLabel: 'Evening' },
            { time: '5:00 PM', price: base + 10, tag: 'evening', tagLabel: 'Evening' }
        ];
    }

    var html = '<div class="time-slot-list">';
    for (var i = 0; i < slots.length; i++) {
        var s = slots[i];
        var tagHtml = s.tag ? '<span class="time-slot-tag ' + s.tag + '">' + s.tagLabel + '</span>' : '';
        html += '<button class="time-slot" onclick="selectSlot(this,' + s.price + ',\'' + s.time + '\')">';
        html += '<span class="time-slot-time">' + s.time + tagHtml + '</span>';
        html += '<span class="time-slot-price">$' + s.price + '</span>';
        html += '</button>';
    }
    html += '</div>';
    slotsContainer.innerHTML = html;

    // On mobile (single column layout), scroll time slots into view
    if (window.innerWidth <= 968) {
        setTimeout(function () {
            slotsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    }

    // Brief highlight to draw attention to the time slot panel
    slotsContainer.style.transition = 'box-shadow 0.3s ease';
    slotsContainer.style.boxShadow = '0 0 0 2px #1F4E79';
    setTimeout(function () { slotsContainer.style.boxShadow = ''; }, 800);
}

function selectSlot(el, price, time) {
    document.querySelectorAll('.time-slot').forEach(function (s) { s.classList.remove('selected'); });
    el.classList.add('selected');
    bookingState.selectedSlot = time;
    bookingState.finalPrice = price;

    // Update step 2 summary
    var dateParts = bookingState.selectedDate.split('-');
    var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var dateShort = monthNames[parseInt(dateParts[1]) - 1] + ' ' + parseInt(dateParts[2]);
    var s2 = document.getElementById('stepSummary2');
    if (s2) s2.textContent = dateShort + ' at ' + time;

    setTimeout(function () {
        showStep(3);
        updateOrderSummary();
    }, 300);
}

function updateOrderSummary() {
    var sizeLabel = bookingState.size === 'small' ? 'Up to 2,250 sq ft' : '2,251 - 2,500 sq ft';
    var dateParts = bookingState.selectedDate.split('-');
    var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var dateLabel = monthNames[parseInt(dateParts[1]) - 1] + ' ' + dateParts[2] + ', ' + dateParts[0] + ' at ' + bookingState.selectedSlot;
    document.getElementById('summarySize').textContent = sizeLabel;
    document.getElementById('summaryTime').textContent = dateLabel;
    document.getElementById('summaryPrice').textContent = '$' + bookingState.finalPrice;
}

// ========== STRIPE ELEMENTS DEMO ==========
var _stripeInstance = null;
var _stripeElements = null;
var _cardNumberEl = null;
var _cardExpiryEl = null;
var _cardCvcEl = null;
var _stripeReady = false;

function openStripeDemo() {
    var price = (bookingState && bookingState.finalPrice) ? bookingState.finalPrice : 159;
    var priceEl = document.querySelector('.stripe-order-price');
    if (priceEl) priceEl.textContent = '$' + price + '.00';
    var submitBtn = document.getElementById('stripeSubmitBtn');
    if (submitBtn) submitBtn.textContent = 'Pay $' + price + '.00 \u2014 Test Mode';

    var overlay = document.getElementById('stripeModalOverlay');
    if (overlay) {
        overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    if (!_stripeReady) {
        try {
            _stripeInstance = Stripe('pk_test_51SeKxiJoivhtUXw7DZW5HvmkdNGnFRodqNd1cnPmoZoY9C3zGZIfpXXQIYRajz5FGuJrQLKT27wdmR49jhoPfVoR00LYrpA2Pv');
            _stripeElements = _stripeInstance.elements();
            var elemStyle = {
                base: {
                    fontSize: '16px',
                    color: '#2D2D2D',
                    fontFamily: 'Inter, -apple-system, sans-serif',
                    fontSmoothing: 'antialiased',
                    '::placeholder': { color: '#aab7c4' }
                },
                invalid: { color: '#e53e3e', iconColor: '#e53e3e' }
            };
            _cardNumberEl = _stripeElements.create('cardNumber', { style: elemStyle, showIcon: true });
            _cardExpiryEl = _stripeElements.create('cardExpiry', { style: elemStyle });
            _cardCvcEl    = _stripeElements.create('cardCvc',    { style: elemStyle });
            _cardNumberEl.mount('#stripe-card-element');
            _cardExpiryEl.mount('#stripe-expiry-element');
            _cardCvcEl.mount('#stripe-cvc-element');
            _cardNumberEl.on('change', function (e) {
                var errEl = document.getElementById('stripe-card-errors');
                if (errEl) errEl.textContent = (e.error) ? e.error.message : '';
            });
            _stripeReady = true;
        } catch (err) {
            console.error('Stripe init error:', err);
        }
    }
}

function closeStripeModal(event) {
    if (event && event.target.id !== 'stripeModalOverlay') return;
    _doCloseStripeModal();
}

function closeStripeModalBtn() {
    _doCloseStripeModal();
}

function _doCloseStripeModal() {
    var overlay = document.getElementById('stripeModalOverlay');
    if (overlay) {
        overlay.classList.remove('open');
        document.body.style.overflow = '';
    }
    var wrapper = document.getElementById('stripe-card-element-wrapper');
    var success = document.getElementById('stripe-success-msg');
    if (wrapper) wrapper.style.display = 'block';
    if (success) success.style.display = 'none';
    var submitBtn = document.getElementById('stripeSubmitBtn');
    var price = (bookingState && bookingState.finalPrice) ? bookingState.finalPrice : 159;
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Pay $' + price + '.00 \u2014 Test Mode';
    }
    var errEl = document.getElementById('stripe-card-errors');
    if (errEl) errEl.textContent = '';
}

async function submitStripeDemo() {
    if (!_stripeInstance || !_cardNumberEl) return;
    var submitBtn = document.getElementById('stripeSubmitBtn');
    var errEl = document.getElementById('stripe-card-errors');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing\u2026';
    if (errEl) errEl.textContent = '';

    try {
        var result = await _stripeInstance.createPaymentMethod({
            type: 'card',
            card: _cardNumberEl
        });
        if (result.error) {
            if (errEl) errEl.textContent = result.error.message;
            submitBtn.disabled = false;
            var price = (bookingState && bookingState.finalPrice) ? bookingState.finalPrice : 159;
            submitBtn.textContent = 'Pay $' + price + '.00 \u2014 Test Mode';
        } else {
            var wrapper = document.getElementById('stripe-card-element-wrapper');
            var success = document.getElementById('stripe-success-msg');
            if (wrapper) wrapper.style.display = 'none';
            if (success) success.style.display = 'block';
            console.log('Stripe test payment method created:', result.paymentMethod.id);
        }
    } catch (err) {
        if (errEl) errEl.textContent = 'An error occurred. Please try again.';
        submitBtn.disabled = false;
    }
}