/* ============================================
   PDX Home Energy Score - JavaScript v3.2
   Dynamic Pricing + Custom Calendar + Acuity Embed
   City selector (Hillsboro = dedicated +$50 appointment types)
   ============================================ */

// ========== ACUITY CONFIG ==========
var ACUITY_OWNER = '37810233';
var ACUITY_BASE  = 'https://app.acuityscheduling.com/schedule.php';

// ========== PRICING RULES ==========
// Single tier: Up to 2,500 sq ft.
// Hillsboro has dedicated appointment types with +$50 baked into the price.
//
// PRICING MATRIX (48+ hours notice):
//   Weekday Normal (9am-3pm):            $159  ($209 Hillsboro)
//   Weekday After Hours (4:30pm+):       $179  ($229 Hillsboro)
//   Saturday Normal (9am-3pm):           $179  ($229 Hillsboro)
//   Saturday After Hours (4:30pm+):      $209  ($259 Hillsboro)
//   Sunday Normal (9am-3pm):             $199  ($249 Hillsboro)
//   Sunday After Hours (4:30pm+):        $209  ($259 Hillsboro)
//   Holiday:                              $219  ($269 Hillsboro)
//
// SURCHARGES (added to base):
//   Priority Notice (25-48 hours): +$20
//   Short Notice (within 24 hours): +$40
//
// FIXED TIME SLOTS:
//   Normal:      9:00 AM, 12:15 PM, 3:00 PM
//   After Hours: 4:30 PM, 6:30 PM

// City surcharge amounts (for display purposes only — Hillsboro routes to dedicated types)
var CITY_SURCHARGE = {
    'portland':  0,
    'salem':     0,
    'hillsboro': 50
};

// Display labels for each city key (Portland covers Milwaukie too)
var CITY_LABELS = {
    'portland':  'Portland & Milwaukie',
    'salem':     'Salem',
    'hillsboro': 'Hillsboro'
};

// Acuity appointment type IDs — Portland / Milwaukie / Salem (up to 2,500 sq ft)
var ACUITY_TYPES = {
    // ── Weekday Normal (9am-3pm) ──
    'wd_normal':              { id: '91186136', price: 159 },
    'wd_normal_priority':     { id: '91186204', price: 179 },   // +20
    'wd_normal_short':        { id: '91186244', price: 199 },   // +40

    // ── Weekday After Hours (4:30pm+) ──
    'wd_afterhours':          { id: '91186284', price: 179 },
    'wd_afterhours_priority': { id: '91186335', price: 199 },   // +20
    'wd_afterhours_short':    { id: '91186606', price: 219 },   // +40

    // ── Saturday Normal (9am-3pm) — same rate as weekday after-hours ──
    'sat_normal':             { id: '91186284', price: 179 },
    'sat_normal_priority':    { id: '91186335', price: 199 },   // +20
    'sat_normal_short':       { id: '91186606', price: 219 },   // +40

    // ── Saturday After Hours (4:30pm+) — Weekend After Hours tier ──
    'sat_afterhours':         { id: '91337692', price: 209 },
    'sat_afterhours_priority':{ id: '91337762', price: 229 },   // +20
    'sat_afterhours_short':   { id: '91337786', price: 249 },   // +40

    // ── Sunday Normal (9am-3pm) ──
    'sun_normal':             { id: '91191874', price: 199 },
    'sun_normal_priority':    { id: '91193034', price: 219 },   // +20
    'sun_normal_short':       { id: '91192042', price: 239 },   // +40

    // ── Sunday After Hours (4:30pm+) — Weekend After Hours tier ──
    'sun_afterhours':         { id: '91337692', price: 209 },
    'sun_afterhours_priority':{ id: '91337762', price: 229 },   // +20
    'sun_afterhours_short':   { id: '91337786', price: 249 },   // +40

    // ── Holiday ──
    'holiday_normal':              { id: '91186164', price: 219 },
    'holiday_normal_priority':     { id: '91186221', price: 239 },   // +20
    'holiday_normal_short':        { id: '91186269', price: 259 },   // +40
    'holiday_afterhours':          { id: '91186164', price: 219 },
    'holiday_afterhours_priority': { id: '91186221', price: 239 },   // +20
    'holiday_afterhours_short':    { id: '91186269', price: 259 }    // +40
};

// Acuity appointment type IDs — Hillsboro only (+$50 baked into each price)
var ACUITY_TYPES_HILLSBORO = {
    // ── Weekday Normal (9am-3pm) ──
    'wd_normal':              { id: '91306360', price: 209 },
    'wd_normal_priority':     { id: '91306429', price: 229 },   // +20
    'wd_normal_short':        { id: '91306474', price: 249 },   // +40

    // ── Weekday After Hours (4:30pm+) ──
    'wd_afterhours':          { id: '91306524', price: 229 },
    'wd_afterhours_priority': { id: '91309456', price: 249 },   // +20
    'wd_afterhours_short':    { id: '91309499', price: 269 },   // +40

    // ── Saturday Normal (9am-3pm) — same rate as weekday after-hours ──
    'sat_normal':             { id: '91306524', price: 229 },
    'sat_normal_priority':    { id: '91309456', price: 249 },   // +20
    'sat_normal_short':       { id: '91309499', price: 269 },   // +40

    // ── Saturday After Hours (4:30pm+) — Weekend After Hours tier ──
    'sat_afterhours':         { id: '91337892', price: 259 },
    'sat_afterhours_priority':{ id: '91337939', price: 279 },   // +20
    'sat_afterhours_short':   { id: '91337989', price: 299 },   // +40

    // ── Sunday Normal (9am-3pm) ──
    'sun_normal':             { id: '91307199', price: 249 },
    'sun_normal_priority':    { id: '91307241', price: 269 },   // +20
    'sun_normal_short':       { id: '91307281', price: 289 },   // +40

    // ── Sunday After Hours (4:30pm+) — Weekend After Hours tier ──
    'sun_afterhours':         { id: '91337892', price: 259 },
    'sun_afterhours_priority':{ id: '91337939', price: 279 },   // +20
    'sun_afterhours_short':   { id: '91337989', price: 299 },   // +40

    // ── Holiday ──
    'holiday_normal':              { id: '91309647', price: 269 },
    'holiday_normal_priority':     { id: '91309661', price: 289 },   // +20
    'holiday_normal_short':        { id: '91309705', price: 309 },   // +40
    'holiday_afterhours':          { id: '91309647', price: 269 },
    'holiday_afterhours_priority': { id: '91309661', price: 289 },   // +20
    'holiday_afterhours_short':    { id: '91309705', price: 309 }    // +40
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
var selectedCity = 'portland';   // 'portland', 'milwaukie', 'salem', 'hillsboro'
var selectedDate = null;        // Date object
var selectedTime = null;        // '09:00', '12:15', etc.
var calendarMonth = null;       // Date object (1st of displayed month)

// ========== HELPERS ==========

function getCitySurcharge() {
    return CITY_SURCHARGE[selectedCity] || 0;
}

function isHoliday(date) {
    var m = date.getMonth() + 1;
    var d = date.getDate();
    for (var i = 0; i < HOLIDAYS.length; i++) {
        if (HOLIDAYS[i].m === m) {
            if (HOLIDAYS[i].d === d) return HOLIDAYS[i].name;
        }
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
    var isSat = (dow === 6);
    var isSun = (dow === 0);
    var isAfter = isAfterHoursSlot(timeStr);

    // Determine day+time base
    var base = '';
    if (isHol) {
        base = isAfter ? 'holiday_afterhours' : 'holiday_normal';
    } else if (isSun) {
        base = isAfter ? 'sun_afterhours' : 'sun_normal';
    } else if (isSat) {
        base = isAfter ? 'sat_afterhours' : 'sat_normal';
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
    var surcharge = getCitySurcharge();
    var leadToMidDay = getLeadTimeHours(date, '12:00');
    var isHol = isHoliday(date);
    var dow = date.getDay();
    var isSat = (dow === 6);
    var isSun = (dow === 0);

    var base = '';
    if (isHol) {
        base = 'holiday_normal';
    } else if (isSun) {
        base = 'sun_normal';
    } else if (isSat) {
        base = 'sat_normal';
    } else {
        base = 'wd_normal';
    }

    var key = base;
    if (leadToMidDay < 24) key = base + '_short';
    else if (leadToMidDay < 48) key = base + '_priority';
    // Hillsboro: prices are baked into dedicated appointment types — no surcharge add-on needed
    if (selectedCity === 'hillsboro') {
        return ACUITY_TYPES_HILLSBORO[key].price;
    }
    return ACUITY_TYPES[key].price + surcharge;
}

function getSlotPrice(date, timeStr) {
    var key = getSlotTierKey(date, timeStr);
    // Hillsboro: prices are baked into dedicated appointment types — no surcharge add-on needed
    if (selectedCity === 'hillsboro') {
        return ACUITY_TYPES_HILLSBORO[key].price;
    }
    return ACUITY_TYPES[key].price + getCitySurcharge();
}

function getAcuityTypeId(date, timeStr) {
    var key = getSlotTierKey(date, timeStr);
    // Hillsboro: use dedicated appointment types with +$50 baked in
    if (selectedCity === 'hillsboro') {
        return ACUITY_TYPES_HILLSBORO[key].id;
    }
    return ACUITY_TYPES[key].id;
}

function getSlotTier(date, timeStr) {
    // Returns a human-readable tier name for display
    var leadHours = getLeadTimeHours(date, timeStr);
    var isHol = isHoliday(date);
    var dow = date.getDay();
    var isSat = (dow === 6);
    var isSun = (dow === 0);
    var isAfter = isAfterHoursSlot(timeStr);

    if (leadHours < 24) return 'short_notice';
    if (leadHours < 48) return 'priority';
    if (isHol) return isAfter ? 'holiday_afterhours' : 'holiday';
    if (isSun) return isAfter ? 'sunday_afterhours' : 'sunday';
    if (isSat) return isAfter ? 'saturday_afterhours' : 'saturday';
    return isAfter ? 'afterhours' : 'base';
}

function getTierLabel(tier) {
    var labels = {
        'base': 'Best Rate',
        'afterhours': 'After Hours',
        'saturday': 'Saturday',
        'saturday_afterhours': 'Saturday After Hours',
        'sunday': 'Sunday',
        'sunday_afterhours': 'Sunday After Hours',
        'priority': 'Priority (25–48 hrs)',
        'short_notice': 'Short Notice (<24 hrs)',
        'holiday': 'Holiday',
        'holiday_afterhours': 'Holiday After Hours'
    };
    return labels[tier] || tier;
}

function getTierClass(tier) {
    if (tier === 'base') return 'tier-best';
    if (tier === 'afterhours' || tier === 'saturday' || tier === 'saturday_afterhours' ||
        tier === 'sunday' || tier === 'sunday_afterhours') return 'tier-mid';
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
    if (a.getFullYear() !== b.getFullYear()) return false;
    if (a.getMonth() !== b.getMonth()) return false;
    return a.getDate() === b.getDate();
}

var MONTH_NAMES = ['January','February','March','April','May','June',
                   'July','August','September','October','November','December'];
var DAY_HEADERS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function formatDateISO(date) {
    var y = date.getFullYear();
    var m = date.getMonth() + 1;
    var d = date.getDate();
    return y + '-' + (m < 10 ? '0' : '') + m + '-' + (d < 10 ? '0' : '') + d;
}

function getDateInputMin() {
    return formatDateISO(new Date());
}

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
    // Calendar will be rendered after user confirms city (Step 1)
    var now = new Date();
    calendarMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // ---------- BIND CITY OPTION BUTTONS ----------
    document.querySelectorAll('.city-option').forEach(function(btn) {
        btn.addEventListener('click', function() {
            selectCity(this.getAttribute('data-city'));
        });
    });

    // ---------- BIND CONTINUE / CHANGE BUTTONS ----------
    var continueBtn = document.getElementById('continueToCalendar');
    if (continueBtn) continueBtn.addEventListener('click', confirmCity);

    var changeCityBtn = document.getElementById('changeCityBtn');
    if (changeCityBtn) changeCityBtn.addEventListener('click', changeCity);

    var changeDateBtn = document.getElementById('changeDateBtn');
    if (changeDateBtn) changeDateBtn.addEventListener('click', changeDate);

    var changeTimeBtn = document.getElementById('changeTimeBtn');
    if (changeTimeBtn) changeTimeBtn.addEventListener('click', changeTime);

}); // END DOMContentLoaded


// ========== CITY SELECTION (STEP 1) ==========

function selectCity(city) {
    selectedCity = city;
    // Update button states
    var btns = document.querySelectorAll('.city-option');
    btns.forEach(function(btn) {
        btn.classList.toggle('selected', btn.getAttribute('data-city') === city);
    });
    // Show/hide Hillsboro notice
    var notice = document.getElementById('hillsboroNotice');
    if (notice) notice.style.display = city === 'hillsboro' ? 'flex' : 'none';
}

function confirmCity() {
    // Hide step 1, show step 2 (calendar)
    var step1 = document.getElementById('bookingStep1');
    var step2 = document.getElementById('bookingStep2');
    if (step1) step1.style.display = 'none';
    if (step2) step2.style.display = 'block';

    // Update city chip in step 2 header
    var cityLabel = CITY_LABELS[selectedCity] || selectedCity;
    var pinSvg = '<svg class="chip-pin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>';
    var chip2 = document.getElementById('selectedCityChip2');
    if (chip2) {
        chip2.innerHTML = pinSvg + ' ' + cityLabel;
        chip2.className = 'selected-city-chip' + (selectedCity === 'hillsboro' ? ' is-hillsboro' : '');
    }
    // Show/hide persistent Hillsboro notice in step 2
    var notice2 = document.getElementById('hillsboroNoticePersistent2');
    if (notice2) notice2.style.display = selectedCity === 'hillsboro' ? 'flex' : 'none';

    // Reset date/time
    selectedDate = null;
    selectedTime = null;

    // Render the calendar with correct pricing
    renderCalendar();

    setTimeout(function () {
        var top = step2.getBoundingClientRect().top + window.pageYOffset - 100;
        window.scrollTo({ top: top, behavior: 'smooth' });
    }, 100);
}

function changeCity() {
    // Go back to step 1
    selectedDate = null;
    selectedTime = null;

    var step1 = document.getElementById('bookingStep1');
    var step2 = document.getElementById('bookingStep2');
    var step3 = document.getElementById('bookingStep3');
    var acuity = document.getElementById('acuityEmbed');
    var wrapper = document.getElementById('acuityIframeWrapper');

    if (step1) step1.style.display = 'block';
    if (step2) step2.style.display = 'none';
    if (step3) step3.style.display = 'none';
    if (acuity) acuity.style.display = 'none';
    if (wrapper) wrapper.innerHTML = '';

    // Clear city chips and persistent notices
    var chip2 = document.getElementById('selectedCityChip2');
    if (chip2) { chip2.innerHTML = ''; chip2.className = 'selected-city-chip'; }
    var chip3 = document.getElementById('selectedCityChip3');
    if (chip3) { chip3.innerHTML = ''; chip3.className = 'selected-city-chip'; }
    var notice2 = document.getElementById('hillsboroNoticePersistent2');
    if (notice2) notice2.style.display = 'none';
    var notice3 = document.getElementById('hillsboroNoticePersistent3');
    if (notice3) notice3.style.display = 'none';

    setTimeout(function () {
        var top = step1.getBoundingClientRect().top + window.pageYOffset - 100;
        window.scrollTo({ top: top, behavior: 'smooth' });
    }, 50);
}


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
    html += '<button class="cal-nav" onclick="calPrev()" aria-label="Previous month">\u2039</button>';
    html += '<span class="cal-month-label">' + MONTH_NAMES[month] + ' ' + year + '</span>';
    html += '<button class="cal-nav" onclick="calNext()" aria-label="Next month">\u203A</button>';
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
        var isSelected = false;
        if (selectedDate) { isSelected = isSameDay(date, selectedDate); }
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

    // Update city chip and persistent Hillsboro notice in step 3 header
    var cityLabel = CITY_LABELS[selectedCity] || selectedCity;
    var pinSvg = '<svg class="chip-pin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>';
    var chip3 = document.getElementById('selectedCityChip3');
    if (chip3) {
        chip3.innerHTML = pinSvg + ' ' + cityLabel;
        chip3.className = 'selected-city-chip' + (selectedCity === 'hillsboro' ? ' is-hillsboro' : '');
    }
    var notice3 = document.getElementById('hillsboroNoticePersistent3');
    if (notice3) notice3.style.display = selectedCity === 'hillsboro' ? 'flex' : 'none';
    // Hide notice2 (step 2) so the message only appears once — in the more focused step 3 spot
    var notice2 = document.getElementById('hillsboroNoticePersistent2');
    if (notice2) notice2.style.display = 'none';

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
    html += '<label for="ctDate">Preferred Date</label>';
    var minDate = getDateInputMin();
    html += '<input type="date" id="ctDate" name="requested_date" required value="' + formatDateISO(selectedDate) + '" min="' + minDate + '">';
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

    // Re-show Hillsboro notice in step 2 (was hidden when step 3 appeared)
    var notice2 = document.getElementById('hillsboroNoticePersistent2');
    if (notice2) notice2.style.display = selectedCity === 'hillsboro' ? 'flex' : 'none';
    // Hide notice3 since step 3 is hidden
    var notice3 = document.getElementById('hillsboroNoticePersistent3');
    if (notice3) notice3.style.display = 'none';

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
    var iframeSrc = ACUITY_BASE + '?owner=' + ACUITY_OWNER + '\x26appointmentType=' + typeId + '\x26notHeader=1';

    // Build date string for Acuity (pre-select the date)
    var mm = selectedDate.getMonth() + 1;
    var dd = selectedDate.getDate();
    var yyyy = selectedDate.getFullYear();
    var dateParam = yyyy + '-' + (mm < 10 ? '0' : '') + mm + '-' + (dd < 10 ? '0' : '') + dd;
    iframeSrc += '\x26date=' + dateParam;

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
              '<div class="acuity-confirm-icon">\u2713</div>' +
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
        if (typeof data === 'object') {
            if (data !== null) {
                var action = (data.action || data.type || data.event || '').toLowerCase();
                if (action === 'confirm' || action === 'appointment-confirmed' ||
                    action === 'booked' || action === 'complete' || action === 'success') {
                    confirmed = true;
                }
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