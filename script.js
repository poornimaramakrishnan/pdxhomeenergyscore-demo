/* ============================================
   PDX Home Energy Score - JavaScript v3.0
   Dynamic Pricing + Custom Calendar + Acuity Embed
   ============================================ */

// ========== ACUITY CONFIG ==========
var ACUITY_OWNER = '37810233';
var ACUITY_BASE  = 'https://app.acuityscheduling.com/schedule.php';

// ========== PRICING RULES ==========
// New simplified pricing model — single size category (up to 2,250 sq ft).
// Base prices vary by day type and time-of-day category.
// Surcharges are additive based on lead time.
//
// PRICING MATRIX (48+ hours notice):
//   Weekday Normal (9am-3pm):        $159
//   Weekday After Hours (3:30pm-7pm): $179
//   Weekend Normal (9am-3pm):         $199
//   Weekend After Hours (3:30pm-7pm): $209
//
// SURCHARGES (added to base):
//   Priority Notice (25-48 hours): +$30
//   Short Notice (within 24 hours): +$60
//
// FIXED TIME SLOTS:
//   Normal:      9:00 AM, 12:15 PM, 3:00 PM
//   After Hours: 4:30 PM, 6:30 PM

// Acuity appointment type IDs — one per unique price point
var ACUITY_TYPES = {
    // ── Weekday Normal (9am-3pm) ──
    'wd_normal':              { id: '91186136', price: 159 },
    'wd_normal_priority':     { id: '91186335', price: 189 },   // 159 + 30
    'wd_normal_short':        { id: '91186606', price: 219 },   // 159 + 60

    // ── Weekday After Hours (3:30pm-7pm) ──
    'wd_afterhours':          { id: '91186204', price: 179 },
    'wd_afterhours_priority': { id: '91186335', price: 209 },   // 179 + 30
    'wd_afterhours_short':    { id: '91186606', price: 239 },   // 179 + 60

    // ── Weekend Normal (9am-3pm) ──
    'we_normal':              { id: '91186244', price: 199 },
    'we_normal_priority':     { id: '91186367', price: 229 },   // 199 + 30
    'we_normal_short':        { id: '91191641', price: 259 },   // 199 + 60

    // ── Weekend After Hours (3:30pm-7pm) ──
    'we_afterhours':          { id: '91186269', price: 209 },
    'we_afterhours_priority': { id: '91186367', price: 239 },   // 209 + 30
    'we_afterhours_short':    { id: '91191641', price: 269 },   // 209 + 60

    // ── Holiday ──
    'holiday_normal':         { id: '91191874', price: 219 },
    'holiday_normal_priority': { id: '91193034', price: 249 },  // 219 + 30
    'holiday_normal_short':   { id: '91192042', price: 279 },   // 219 + 60
    'holiday_afterhours':     { id: '91193082', price: 239 },
    'holiday_afterhours_priority': { id: '91193127', price: 269 }, // 239 + 30
    'holiday_afterhours_short': { id: '91193105', price: 299 }  // 239 + 60
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

// Fixed time slots (no more 30-min intervals)
var NORMAL_SLOTS     = ['09:00', '12:15', '15:00'];       // 9 AM, 12:15 PM, 3 PM
var AFTERHOURS_SLOTS = ['16:30', '18:30'];                 // 4:30 PM, 6:30 PM
var ALL_SLOTS        = NORMAL_SLOTS.concat(AFTERHOURS_SLOTS);

// Peak hours boundary: Normal = 9am–3pm, After Hours = 3:30pm–7pm
var PEAK_END_HOUR = 15;  // slots at 15:00 (3 PM) and before are "normal"

// ========== STATE ==========
var selectedSize = 'small';  // single size category — always 'small'
var selectedDate = null;     // Date object
var selectedTime = null;     // '09:00', '12:15', etc.
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
    // Returns the broad tier for a whole day (used for calendar pricing display)
    if (isHoliday(date)) return 'holiday';
    var dow = date.getDay(); // 0=Sun, 6=Sat
    if (dow === 0 || dow === 6) return 'weekend';
    return 'weekday';
}

function isAfterHoursSlot(timeStr) {
    var hour = parseInt(timeStr.split(':')[0], 10);
    return hour >= 16; // 4:30 PM and 6:30 PM are after hours
}

function getSlotTierKey(date, timeStr) {
    // Returns the ACUITY_TYPES key for a given date+time
    var leadHours = getLeadTimeHours(date, timeStr);
    var isHol = isHoliday(date);
    var dow = date.getDay();
    var isWeekend = (dow === 0 || dow === 6);
    var isAfter = isAfterHoursSlot(timeStr);

    // Determine day+time base
    var base = '';
    if (isHol) {
        base = isAfter ? 'holiday_afterhours' : 'holiday_normal';
    } else if (isWeekend) {
        base = isAfter ? 'we_afterhours' : 'we_normal';
    } else {
        base = isAfter ? 'wd_afterhours' : 'wd_normal';
    }

    // Determine lead-time surcharge suffix
    if (leadHours < 24) return base + '_short';
    if (leadHours < 48) return base + '_priority';
    return base;
}

function getDayMinPrice(date) {
    // Cheapest possible price for a given day (used for calendar labels)
    // The cheapest slot on any day is the normal-hours slot with best lead time
    var leadToMidDay = getLeadTimeHours(date, '12:00');
    var isHol = isHoliday(date);
    var dow = date.getDay();
    var isWeekend = (dow === 0 || dow === 6);

    var base = '';
    if (isHol) {
        base = 'holiday_normal';
    } else if (isWeekend) {
        base = 'we_normal';
    } else {
        base = 'wd_normal';
    }

    if (leadToMidDay < 24) return ACUITY_TYPES[base + '_short'].price;
    if (leadToMidDay < 48) return ACUITY_TYPES[base + '_priority'].price;
    return ACUITY_TYPES[base].price;
}

function getSlotPrice(date, timeStr) {
    var key = getSlotTierKey(date, timeStr);
    return ACUITY_TYPES[key].price;
}

function getAcuityTypeId(date, timeStr) {
    var key = getSlotTierKey(date, timeStr);
    return ACUITY_TYPES[key].id;
}

function getSlotTier(date, timeStr) {
    // Returns a human-readable tier name for display
    var leadHours = getLeadTimeHours(date, timeStr);
    var isHol = isHoliday(date);
    var dow = date.getDay();
    var isWeekend = (dow === 0 || dow === 6);
    var isAfter = isAfterHoursSlot(timeStr);

    if (leadHours < 24) return 'short_notice';
    if (leadHours < 48) return 'priority';
    if (isHol) return isAfter ? 'holiday_afterhours' : 'holiday';
    if (isWeekend) return isAfter ? 'weekend_afterhours' : 'weekend';
    return isAfter ? 'afterhours' : 'base';
}

function getTierLabel(tier) {
    var labels = {
        'base': 'Best Rate',
        'afterhours': 'After Hours',
        'weekend': 'Weekend',
        'weekend_afterhours': 'Weekend After Hours',
        'priority': 'Priority (25–48 hrs)',
        'short_notice': 'Short Notice (<24 hrs)',
        'holiday': 'Holiday',
        'holiday_afterhours': 'Holiday After Hours'
    };
    return labels[tier] || tier;
}

function getTierClass(tier) {
    if (tier === 'base') return 'tier-best';
    if (tier === 'afterhours' || tier === 'weekend' || tier === 'weekend_afterhours') return 'tier-mid';
    if (tier === 'priority') return 'tier-high';
    if (tier === 'short_notice' || tier === 'holiday' || tier === 'holiday_afterhours') return 'tier-premium';
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

    // ---------- AUTO-INITIALIZE CALENDAR ----------
    // No size selection needed — auto-render calendar on page load
    var now = new Date();
    calendarMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    renderCalendar();

}); // END DOMContentLoaded


// ========== CALENDAR ==========

function renderCalendar() {
    var cal = document.getElementById('pricingCalendar');
    if (!cal) return;

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
        var dayType = getDayTier(date);
        var price = getDayMinPrice(date);
        var holName = isHoliday(date);

        // Map day type to tier class for calendar coloring
        var calTierClass = 'tier-best';
        if (dayType === 'weekend') calTierClass = 'tier-mid';
        if (dayType === 'holiday') calTierClass = 'tier-premium';
        // Check if lead-time surcharge applies to the day
        var leadToMidDay = getLeadTimeHours(date, '12:00');
        if (leadToMidDay < 48) calTierClass = 'tier-high';
        if (leadToMidDay < 24) calTierClass = 'tier-premium';

        if (isPast) {
            html += '<div class="cal-cell cal-past">';
            html += '<span class="cal-day-num">' + d + '</span>';
            html += '</div>';
        } else {
            html += '<div class="cal-cell cal-available ' + calTierClass + (isSelected ? ' cal-selected' : '') + '" ' +
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
    html += '<span class="cal-legend-item"><span class="cal-legend-dot tier-mid"></span>Weekend / After Hours</span>';
    html += '<span class="cal-legend-item"><span class="cal-legend-dot tier-high"></span>Priority Notice (25–48 hrs)</span>';
    html += '<span class="cal-legend-item"><span class="cal-legend-dot tier-premium"></span>Short Notice / Holiday</span>';
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


// ========== TIME SLOTS ==========

function renderTimeSlots() {
    var container = document.getElementById('timeSlots');
    if (!container || !selectedDate) return;

    var now = new Date();
    var html = '';
    var dateStr = MONTH_NAMES[selectedDate.getMonth()] + ' ' + selectedDate.getDate() + ', ' + selectedDate.getFullYear();

    html += '<p class="time-slot-date">' + dateStr + '</p>';
    html += '<div class="time-slot-grid">';

    var hasSlots = false;

    for (var i = 0; i < ALL_SLOTS.length; i++) {
        var timeStr = ALL_SLOTS[i];
        var parts = timeStr.split(':');
        var slotDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(),
                                parseInt(parts[0], 10), parseInt(parts[1], 10), 0);

        // Skip slots in the past
        if (slotDate <= now) continue;

        var tier = getSlotTier(selectedDate, timeStr);
        var price = getSlotPrice(selectedDate, timeStr);
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

    if (!hasSlots) {
        html += '<p class="time-slot-none">No available slots for this date. Please choose another day.</p>';
    }

    html += '</div>';

    // "Request a Custom Time" collapsible section
    html += '<div class="custom-time-section">';
    html += '<button class="custom-time-toggle" onclick="toggleCustomTimeForm()" type="button">';
    html += '<span class="custom-time-toggle-icon" id="customTimeIcon">+</span> ';
    html += 'Don\u2019t see a time that works? Request a custom slot';
    html += '</button>';
    html += '<div class="custom-time-form-wrapper" id="customTimeFormWrapper" style="display:none;">';
    html += '<form class="custom-time-form" id="customTimeForm" onsubmit="return handleCustomTimeSubmit(event)">';
    html += '<input type="hidden" name="_subject" value="Custom Time Request \u2013 PDX Home Energy Score">';
    html += '<input type="hidden" name="request_type" value="Custom Time Slot Request">';
    html += '<input type="hidden" name="requested_date" value="' + dateStr + '">';
    html += '<div class="custom-time-form-grid">';
    html += '<div class="custom-time-field">';
    html += '<label for="ctName">Name</label>';
    html += '<input type="text" id="ctName" name="name" required placeholder="Your name">';
    html += '</div>';
    html += '<div class="custom-time-field">';
    html += '<label for="ctEmail">Email</label>';
    html += '<input type="email" id="ctEmail" name="email" required placeholder="you@example.com">';
    html += '</div>';
    html += '<div class="custom-time-field">';
    html += '<label for="ctPhone">Phone <span style="font-weight:400;color:#999;">(optional)</span></label>';
    html += '<input type="tel" id="ctPhone" name="phone" placeholder="(503) 555-1234">';
    html += '</div>';
    html += '<div class="custom-time-field">';
    html += '<label for="ctTime">Preferred Time</label>';
    html += '<input type="text" id="ctTime" name="preferred_time" required placeholder="e.g. 7:30 AM, early afternoon">';
    html += '</div>';
    html += '</div>';
    html += '<div class="custom-time-field" style="margin-top:4px;">';
    html += '<label for="ctNotes">Notes <span style="font-weight:400;color:#999;">(optional)</span></label>';
    html += '<textarea id="ctNotes" name="notes" rows="2" placeholder="Any additional details or scheduling preferences"></textarea>';
    html += '</div>';
    html += '<p class="custom-time-date-badge">';
    html += '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1F4E79" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>';
    html += ' Requesting for <strong>' + dateStr + '</strong>';
    html += '</p>';
    html += '<button type="submit" class="btn btn-primary custom-time-submit" id="ctSubmitBtn">Send Request</button>';
    html += '</form>';
    html += '<div class="custom-time-success" id="customTimeSuccess" style="display:none;">';
    html += '<div class="custom-time-success-icon">\u2713</div>';
    html += '<p><strong>Request sent!</strong> We\u2019ll get back to you shortly to confirm your custom time slot.</p>';
    html += '</div>';
    html += '</div>';
    html += '</div>';

    container.innerHTML = html;
}

/* ----------  Custom Time Request helpers  ---------- */

function toggleCustomTimeForm() {
    var wrapper = document.getElementById('customTimeFormWrapper');
    var icon = document.getElementById('customTimeIcon');
    if (!wrapper) return;
    if (wrapper.style.display === 'none') {
        wrapper.style.display = 'block';
        if (icon) icon.textContent = '\u2212'; // minus sign
    } else {
        wrapper.style.display = 'none';
        if (icon) icon.textContent = '+';
    }
}

function handleCustomTimeSubmit(e) {
    e.preventDefault();
    var form = document.getElementById('customTimeForm');
    var btn = document.getElementById('ctSubmitBtn');
    if (!form) return false;

    btn.disabled = true;
    btn.textContent = 'Sending\u2026';

    var data = new FormData(form);

    fetch('https://formspree.io/f/xdkozpqr', {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' }
    }).then(function(response) {
        if (response.ok) {
            form.style.display = 'none';
            var successEl = document.getElementById('customTimeSuccess');
            if (successEl) successEl.style.display = 'flex';
        } else {
            btn.disabled = false;
            btn.textContent = 'Send Request';
            alert('Something went wrong. Please try again or contact us directly.');
        }
    }).catch(function() {
        btn.disabled = false;
        btn.textContent = 'Send Request';
        alert('Network error. Please check your connection and try again.');
    });

    return false;
}

/* ---------------------------------------------------- */

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
    if (!selectedDate || !selectedTime) return;

    var typeId = getAcuityTypeId(selectedDate, selectedTime);
    var price  = getSlotPrice(selectedDate, selectedTime);
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
    var dateLabel = MONTH_NAMES[selectedDate.getMonth()] + ' ' + selectedDate.getDate() + ', ' + selectedDate.getFullYear();
    var timeLabel = formatTime12(selectedTime);

    var descEl = document.getElementById('acuitySelectedType');
    if (descEl) {
        descEl.textContent = dateLabel + ' at ' + timeLabel + ' \u2022 $' + price + ' (' + tierLabel + ')';
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