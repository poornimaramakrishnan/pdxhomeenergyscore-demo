/* ============================================
   PDX Home Energy Score - JavaScript v3.0
   Dynamic Pricing + Custom Calendar + Acuity Embed
   ============================================ */

// ========== ACUITY CONFIG ==========
var ACUITY_OWNER = '37810233';
var ACUITY_BASE  = 'https://app.acuityscheduling.com/schedule.php';

// ========== PRICING RULES ==========
// Each Acuity appointment type has a fixed price.
// We create types for every tier and map dynamically.
//
// KEY:  "size|tier"  →  { id: AcuityTypeID, price: dollarAmount }
//
// TIERS:
//   base        = weekday 9am-3pm, booked ≥48hr ahead
//   offhours    = weekday before 9am or after 3pm, booked ≥48hr ahead
//   saturday    = Saturday, booked ≥48hr ahead
//   sunday      = Sunday, booked ≥48hr ahead
//   short24to48 = booked 24-48hr ahead (any time)
//   sameday     = booked <24hr ahead (any time)
//   holiday     = holidays (any time)

var ACUITY_TYPES = {
    // ── Small (up to 2,250 sq ft) ──
    'small|base':        { id: '86793971', price: 159 },
    'small|offhours':    { id: 'SMALL_OFFHOURS',    price: 179 },
    'small|saturday':    { id: 'SMALL_SATURDAY',     price: 179 },
    'small|sunday':      { id: 'SMALL_SUNDAY',       price: 199 },
    'small|short24to48': { id: 'SMALL_SHORT2448',    price: 179 },
    'small|sameday':     { id: 'SMALL_SAMEDAY',      price: 199 },
    'small|holiday':     { id: 'SMALL_HOLIDAY',      price: 259 },

    // ── Large (2,251 – 2,500 sq ft) ──
    'large|base':        { id: '86794016', price: 189 },
    'large|offhours':    { id: 'LARGE_OFFHOURS',    price: 209 },
    'large|saturday':    { id: 'LARGE_SATURDAY',     price: 209 },
    'large|sunday':      { id: 'LARGE_SUNDAY',       price: 229 },
    'large|short24to48': { id: 'LARGE_SHORT2448',    price: 209 },
    'large|sameday':     { id: 'LARGE_SAMEDAY',      price: 229 },
    'large|holiday':     { id: 'LARGE_HOLIDAY',      price: 289 }
};

// Holidays (month/day) — price is always the holiday tier
var HOLIDAYS = [
    { m: 5,  d: 26, name: 'Memorial Day' },    // approximate — update yearly
    { m: 7,  d: 4,  name: 'July 4th' },
    { m: 9,  d: 1,  name: 'Labor Day' },        // approximate — update yearly
    { m: 11, d: 27, name: 'Thanksgiving' },      // approximate — update yearly
    { m: 12, d: 24, name: 'Christmas Eve' },
    { m: 12, d: 25, name: 'Christmas Day' },
    { m: 12, d: 31, name: "New Year's Eve" },
    { m: 1,  d: 1,  name: "New Year's Day" }
];

// Business hours: 8:00 AM – 6:00 PM, 30-min slots
var SLOT_START = 8;   // 8:00 AM
var SLOT_END   = 18;  // last slot starts at 5:30 PM
var SLOT_STEP  = 30;  // minutes

// Peak hours (base pricing): 9:00 AM – 2:59 PM
var PEAK_START = 9;   // 9:00 AM
var PEAK_END   = 15;  // 3:00 PM (exclusive — 3:00 PM+ is off-hours)

// ========== STATE ==========
var selectedSize = null;     // 'small' or 'large'
var selectedDate = null;     // Date object
var selectedTime = null;     // '09:00', '09:30', etc.
var calendarMonth = null;    // Date object (1st of displayed month)

// ========== HELPERS ==========

function isHoliday(date) {
    var m = date.getMonth() + 1;
    var d = date.getDate();
    for (var i = 0; i < HOLIDAYS.length; i++) {
        if (HOLIDAYS[i].m === m && HOLIDAYS[i].d === d) return HOLIDAYS[i].name;
    }
    return false;
}

function getLeadTimeHours(date, timeStr) {
    var parts = timeStr.split(':');
    var target = new Date(date.getFullYear(), date.getMonth(), date.getDate(),
                          parseInt(parts[0], 10), parseInt(parts[1], 10), 0);
    var now = new Date();
    return (target.getTime() - now.getTime()) / (1000 * 60 * 60);
}

function getDayTier(date) {
    // Returns the tier for a whole day (used for calendar pricing display)
    if (isHoliday(date)) return 'holiday';
    var dow = date.getDay(); // 0=Sun, 6=Sat
    if (dow === 0) return 'sunday';
    if (dow === 6) return 'saturday';
    return 'base'; // weekday — off-hours distinction is at time level
}

function getSlotTier(date, timeStr) {
    // Full tier calculation for a specific date+time
    if (isHoliday(date)) return 'holiday';

    var leadHours = getLeadTimeHours(date, timeStr);
    if (leadHours < 24) return 'sameday';
    if (leadHours < 48) return 'short24to48';

    var dow = date.getDay();
    if (dow === 0) return 'sunday';
    if (dow === 6) return 'saturday';

    var hour = parseInt(timeStr.split(':')[0], 10);
    if (hour < PEAK_START || hour >= PEAK_END) return 'offhours';

    return 'base';
}

function getDayMinPrice(date, size) {
    // Cheapest possible price for a given day (used for calendar labels)
    var dayTier = getDayTier(date);
    if (dayTier === 'holiday')  return ACUITY_TYPES[size + '|holiday'].price;
    if (dayTier === 'sunday')   return ACUITY_TYPES[size + '|sunday'].price;
    if (dayTier === 'saturday') return ACUITY_TYPES[size + '|saturday'].price;
    // Weekday: check lead time
    var leadToMidDay = getLeadTimeHours(date, '12:00');
    if (leadToMidDay < 24) return ACUITY_TYPES[size + '|sameday'].price;
    if (leadToMidDay < 48) return ACUITY_TYPES[size + '|short24to48'].price;
    return ACUITY_TYPES[size + '|base'].price;
}

function getSlotPrice(date, timeStr, size) {
    var tier = getSlotTier(date, timeStr);
    return ACUITY_TYPES[size + '|' + tier].price;
}

function getAcuityTypeId(date, timeStr, size) {
    var tier = getSlotTier(date, timeStr);
    return ACUITY_TYPES[size + '|' + tier].id;
}

function getTierLabel(tier) {
    var labels = {
        'base': 'Best Rate',
        'offhours': 'Off-Hours',
        'saturday': 'Saturday',
        'sunday': 'Sunday',
        'short24to48': 'Short Notice',
        'sameday': 'Same Day',
        'holiday': 'Holiday'
    };
    return labels[tier] || tier;
}

function getTierClass(tier) {
    if (tier === 'base') return 'tier-best';
    if (tier === 'offhours' || tier === 'saturday') return 'tier-mid';
    if (tier === 'sunday' || tier === 'short24to48') return 'tier-high';
    if (tier === 'sameday' || tier === 'holiday') return 'tier-premium';
    return '';
}

function formatTime12(timeStr) {
    var parts = timeStr.split(':');
    var h = parseInt(parts[0], 10);
    var m = parts[1];
    var ampm = h >= 12 ? 'PM' : 'AM';
    var h12 = h > 12 ? h - 12 : (h === 0 ? 12 : h);
    return h12 + ':' + m + ' ' + ampm;
}

function isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth() === b.getMonth() &&
           a.getDate() === b.getDate();
}

var MONTH_NAMES = ['January','February','March','April','May','June',
                   'July','August','September','October','November','December'];
var DAY_HEADERS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

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


// ========== STEP 1: SELECT SIZE ==========

function selectSize(size) {
    selectedSize = size;
    selectedDate = null;
    selectedTime = null;

    document.querySelectorAll('.size-option').forEach(function (btn) { btn.classList.remove('selected'); });
    var buttons = document.querySelectorAll('.size-option');
    if (size === 'small' && buttons[0]) buttons[0].classList.add('selected');
    if (size === 'large' && buttons[1]) buttons[1].classList.add('selected');

    // Collapse step 1
    var step1 = document.getElementById('bookingStep1');
    if (step1) { step1.classList.remove('active'); step1.classList.add('completed'); }

    // Show step 2 (calendar)
    var step2 = document.getElementById('bookingStep2');
    if (step2) step2.style.display = 'block';

    // Initialize calendar to current month
    var now = new Date();
    calendarMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    renderCalendar();

    // Hide step 3 and Acuity embed
    var step3 = document.getElementById('bookingStep3');
    if (step3) step3.style.display = 'none';
    var acuity = document.getElementById('acuityEmbed');
    if (acuity) acuity.style.display = 'none';

    // Scroll to step 2
    setTimeout(function () {
        var top = step2.getBoundingClientRect().top + window.pageYOffset - 100;
        window.scrollTo({ top: top, behavior: 'smooth' });
    }, 100);
}

function changeSize() {
    selectedSize = null;
    selectedDate = null;
    selectedTime = null;

    var step1 = document.getElementById('bookingStep1');
    if (step1) { step1.classList.remove('completed'); step1.classList.add('active'); }
    document.querySelectorAll('.size-option').forEach(function (btn) { btn.classList.remove('selected'); });

    var step2 = document.getElementById('bookingStep2');
    if (step2) step2.style.display = 'none';
    var step3 = document.getElementById('bookingStep3');
    if (step3) step3.style.display = 'none';
    var acuity = document.getElementById('acuityEmbed');
    if (acuity) acuity.style.display = 'none';
    var wrapper = document.getElementById('acuityIframeWrapper');
    if (wrapper) wrapper.innerHTML = '';

    setTimeout(function () {
        var top = step1.getBoundingClientRect().top + window.pageYOffset - 100;
        window.scrollTo({ top: top, behavior: 'smooth' });
    }, 50);
}


// ========== STEP 2: CALENDAR ==========

function renderCalendar() {
    var cal = document.getElementById('pricingCalendar');
    if (!cal || !selectedSize) return;

    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var year = calendarMonth.getFullYear();
    var month = calendarMonth.getMonth();
    var firstDay = new Date(year, month, 1).getDay();
    var daysInMonth = new Date(year, month + 1, 0).getDate();

    // Header
    var html = '<div class="cal-header">';
    html += '<button class="cal-nav" onclick="calPrev()" aria-label="Previous month">&lsaquo;</button>';
    html += '<span class="cal-month-label">' + MONTH_NAMES[month] + ' ' + year + '</span>';
    html += '<button class="cal-nav" onclick="calNext()" aria-label="Next month">&rsaquo;</button>';
    html += '</div>';

    // Day headers
    html += '<div class="cal-grid">';
    for (var dh = 0; dh < 7; dh++) {
        html += '<div class="cal-day-header">' + DAY_HEADERS[dh] + '</div>';
    }

    // Empty cells for days before the 1st
    for (var e = 0; e < firstDay; e++) {
        html += '<div class="cal-cell cal-empty"></div>';
    }

    // Day cells
    for (var d = 1; d <= daysInMonth; d++) {
        var date = new Date(year, month, d);
        var isPast = date < today;
        var isSelected = selectedDate && isSameDay(date, selectedDate);
        var tier = getDayTier(date);
        var price = getDayMinPrice(date, selectedSize);
        var tierClass = getTierClass(tier);
        var holName = isHoliday(date);

        if (isPast) {
            html += '<div class="cal-cell cal-past">';
            html += '<span class="cal-day-num">' + d + '</span>';
            html += '</div>';
        } else {
            html += '<div class="cal-cell cal-available ' + tierClass + (isSelected ? ' cal-selected' : '') + '" ' +
                     'onclick="selectDate(' + year + ',' + month + ',' + d + ')" ' +
                     'role="button" tabindex="0" aria-label="' + MONTH_NAMES[month] + ' ' + d + ', $' + price + '">';
            html += '<span class="cal-day-num">' + d + '</span>';
            html += '<span class="cal-day-price">$' + price + '</span>';
            if (holName) {
                html += '<span class="cal-day-holiday" title="' + holName + '">\u2605</span>';
            }
            html += '</div>';
        }
    }

    html += '</div>'; // close cal-grid

    // Legend
    html += '<div class="cal-legend">';
    html += '<span class="cal-legend-item"><span class="cal-legend-dot tier-best"></span>Best Rate</span>';
    html += '<span class="cal-legend-item"><span class="cal-legend-dot tier-mid"></span>Weekend / Off-Hours</span>';
    html += '<span class="cal-legend-item"><span class="cal-legend-dot tier-high"></span>Short Notice</span>';
    html += '<span class="cal-legend-item"><span class="cal-legend-dot tier-premium"></span>Holiday / Same Day</span>';
    html += '</div>';

    cal.innerHTML = html;
}

function calPrev() {
    var now = new Date();
    var minMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    var prev = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
    if (prev >= minMonth) {
        calendarMonth = prev;
        renderCalendar();
    }
}

function calNext() {
    // Allow up to 3 months ahead
    var now = new Date();
    var maxMonth = new Date(now.getFullYear(), now.getMonth() + 3, 1);
    var next = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
    if (next <= maxMonth) {
        calendarMonth = next;
        renderCalendar();
    }
}

function selectDate(year, month, day) {
    selectedDate = new Date(year, month, day);
    selectedTime = null;
    renderCalendar(); // re-render to show selection
    renderTimeSlots();

    // Show step 3
    var step3 = document.getElementById('bookingStep3');
    if (step3) step3.style.display = 'block';

    // Hide Acuity embed
    var acuity = document.getElementById('acuityEmbed');
    if (acuity) acuity.style.display = 'none';
    var wrapper = document.getElementById('acuityIframeWrapper');
    if (wrapper) wrapper.innerHTML = '';

    setTimeout(function () {
        var top = step3.getBoundingClientRect().top + window.pageYOffset - 100;
        window.scrollTo({ top: top, behavior: 'smooth' });
    }, 100);
}


// ========== STEP 3: TIME SLOTS ==========

function renderTimeSlots() {
    var container = document.getElementById('timeSlots');
    if (!container || !selectedDate || !selectedSize) return;

    var now = new Date();
    var html = '';
    var dateStr = MONTH_NAMES[selectedDate.getMonth()] + ' ' + selectedDate.getDate() + ', ' + selectedDate.getFullYear();

    html += '<p class="time-slot-date">' + dateStr + '</p>';
    html += '<div class="time-slot-grid">';

    var hasSlots = false;

    for (var h = SLOT_START; h < SLOT_END; h++) {
        for (var m = 0; m < 60; m += SLOT_STEP) {
            var timeStr = (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
            var slotDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), h, m, 0);

            // Skip slots in the past
            if (slotDate <= now) continue;

            var tier = getSlotTier(selectedDate, timeStr);
            var price = getSlotPrice(selectedDate, timeStr, selectedSize);
            var tierClass = getTierClass(tier);
            var tierLabel = getTierLabel(tier);
            var isSelected = selectedTime === timeStr;

            html += '<button class="time-slot ' + tierClass + (isSelected ? ' time-slot-selected' : '') + '" ' +
                     'onclick="selectTime(\'' + timeStr + '\')">' +
                     '<span class="time-slot-time">' + formatTime12(timeStr) + '</span>' +
                     '<span class="time-slot-price">$' + price + '</span>' +
                     '<span class="time-slot-tier">' + tierLabel + '</span>' +
                     '</button>';
            hasSlots = true;
        }
    }

    if (!hasSlots) {
        html += '<p class="time-slot-none">No available slots for this date. Please choose another day.</p>';
    }

    html += '</div>';
    container.innerHTML = html;
}

function selectTime(timeStr) {
    selectedTime = timeStr;
    renderTimeSlots(); // re-render to highlight
    loadAcuityEmbed();
}

function changeDate() {
    selectedDate = null;
    selectedTime = null;

    var step3 = document.getElementById('bookingStep3');
    if (step3) step3.style.display = 'none';
    var acuity = document.getElementById('acuityEmbed');
    if (acuity) acuity.style.display = 'none';
    var wrapper = document.getElementById('acuityIframeWrapper');
    if (wrapper) wrapper.innerHTML = '';

    renderCalendar();

    var step2 = document.getElementById('bookingStep2');
    setTimeout(function () {
        var top = step2.getBoundingClientRect().top + window.pageYOffset - 100;
        window.scrollTo({ top: top, behavior: 'smooth' });
    }, 50);
}


// ========== STEP 4: ACUITY EMBED ==========

function loadAcuityEmbed() {
    if (!selectedSize || !selectedDate || !selectedTime) return;

    var typeId = getAcuityTypeId(selectedDate, selectedTime, selectedSize);
    var price  = getSlotPrice(selectedDate, selectedTime, selectedSize);
    var tier   = getSlotTier(selectedDate, selectedTime);
    var tierLabel = getTierLabel(tier);
    var iframeSrc = ACUITY_BASE + '?owner=' + ACUITY_OWNER + '&appointmentType=' + typeId + '&notHeader=1';

    // Build date string for Acuity (pre-select the date)
    var mm = selectedDate.getMonth() + 1;
    var dd = selectedDate.getDate();
    var yyyy = selectedDate.getFullYear();
    var dateParam = yyyy + '-' + (mm < 10 ? '0' : '') + mm + '-' + (dd < 10 ? '0' : '') + dd;
    iframeSrc += '&date=' + dateParam;

    // Description
    var sizeLabel = selectedSize === 'small' ? 'Up to 2,250 sq ft' : '2,251\u20132,500 sq ft';
    var dateLabel = MONTH_NAMES[selectedDate.getMonth()] + ' ' + selectedDate.getDate() + ', ' + selectedDate.getFullYear();
    var timeLabel = formatTime12(selectedTime);

    var descEl = document.getElementById('acuitySelectedType');
    if (descEl) {
        descEl.textContent = sizeLabel + ' \u2022 ' + dateLabel + ' at ' + timeLabel + ' \u2022 $' + price + ' (' + tierLabel + ')';
    }

    // Inject iframe
    var wrapper = document.getElementById('acuityIframeWrapper');
    if (wrapper) {
        wrapper.innerHTML = '<iframe src="' + iframeSrc + '" title="Schedule Appointment" width="100%" height="800" frameBorder="0" scrolling="yes" style="border:none; border-radius:12px;"></iframe>';
    }

    // Show Acuity section
    var embedSection = document.getElementById('acuityEmbed');
    if (embedSection) embedSection.style.display = 'block';

    setTimeout(function () {
        var top = embedSection.getBoundingClientRect().top + window.pageYOffset - 100;
        window.scrollTo({ top: top, behavior: 'smooth' });
    }, 100);
}

function changeTime() {
    selectedTime = null;
    var acuity = document.getElementById('acuityEmbed');
    if (acuity) acuity.style.display = 'none';
    var wrapper = document.getElementById('acuityIframeWrapper');
    if (wrapper) wrapper.innerHTML = '';

    var step3 = document.getElementById('bookingStep3');
    setTimeout(function () {
        var top = step3.getBoundingClientRect().top + window.pageYOffset - 100;
        window.scrollTo({ top: top, behavior: 'smooth' });
    }, 50);
}


// ========== ACUITY BOOKING CONFIRMATION ==========
(function () {
    function ensureConfirmationBanner() {
        if (document.getElementById('acuityConfirmBanner')) return;
        var banner = document.createElement('div');
        banner.id = 'acuityConfirmBanner';
        banner.setAttribute('role', 'status');
        banner.setAttribute('aria-live', 'polite');
        banner.innerHTML =
            '<div class="acuity-confirm-inner">' +
              '<div class="acuity-confirm-icon">&#10003;</div>' +
              '<h2 class="acuity-confirm-title">You\'re All Set!</h2>' +
              '<p class="acuity-confirm-body">' +
                'Your energy score appointment is confirmed. ' +
                'Check your email for details and a calendar invite.' +
              '</p>' +
              '<p class="acuity-confirm-contact">' +
                'Questions? Call <a href="tel:5032906958">(503) 290-6958</a> ' +
                'or email <a href="mailto:pdxhousing@icloud.com">pdxhousing@icloud.com</a>' +
              '</p>' +
            '</div>';
        document.body.appendChild(banner);
    }

    function showConfirmationBanner() {
        ensureConfirmationBanner();
        var banner = document.getElementById('acuityConfirmBanner');
        banner.classList.add('visible');
        setTimeout(function () {
            banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
        var embedSection = document.getElementById('acuityEmbed');
        if (embedSection) embedSection.style.display = 'none';
    }

    window.addEventListener('message', function (e) {
        if (!e.origin || e.origin.indexOf('acuityscheduling.com') === -1) return;
        var data = e.data;
        var confirmed = false;
        if (typeof data === 'object' && data !== null) {
            var action = (data.action || data.type || data.event || '').toLowerCase();
            if (action === 'confirm' || action === 'appointment-confirmed' ||
                action === 'booked' || action === 'complete' || action === 'success') {
                confirmed = true;
            }
        } else if (typeof data === 'string') {
            var s = data.toLowerCase();
            if (s === 'confirm' || s === 'booked' || s === 'complete' || s === 'success') {
                confirmed = true;
            }
        }
        if (confirmed) showConfirmationBanner();
    });
})();


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
        form.style.display = 'none';
        if (successMsg) successMsg.style.display = 'block';
    }).catch(function () {
        form.style.display = 'none';
        if (successMsg) successMsg.style.display = 'block';
    });

    return false;
}