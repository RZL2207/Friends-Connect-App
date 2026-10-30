const API_URL = 'http://localhost:4000/api';
let socket = null;

// Auth State
let currentUser = null;
let authToken = localStorage.getItem('fc_token') || null;
let currentCallRoomId = null;
let currentTicketId = null;
let isAudioMuted = false;

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  const savedUser = localStorage.getItem('fc_user');
  if (savedUser && authToken) {
    try {
      currentUser = JSON.parse(savedUser);
    } catch (e) {
      currentUser = null;
    }
  }

  checkAuthState();
  initSocket();
});

// Manage Screen Visibility based on Authentication
function checkAuthState() {
  const loginSection = document.getElementById('login-section');
  const dashboardContainer = document.getElementById('dashboard-container');
  const logoutBtn = document.getElementById('logout-btn');
  const userStatusPill = document.getElementById('user-status-pill');
  const userNameEl = document.getElementById('active-user-name');

  if (currentUser) {
    if (loginSection) loginSection.classList.add('hidden');
    if (dashboardContainer) dashboardContainer.classList.remove('hidden');
    if (logoutBtn) logoutBtn.classList.remove('hidden');

    if (userNameEl) {
      userNameEl.innerText = `${currentUser.name} (${currentUser.role})`;
    }

    // Auto-switch to relevant tab based on user's role
    if (currentUser.role === 'SUPER_ADMIN') {
      switchTab('admin-tab');
    } else if (currentUser.role === 'ORGANIZATION') {
      switchTab('org-tab');
    } else if (currentUser.role === 'SUPPORT_AGENT') {
      switchTab('support-tab');
    } else {
      switchTab('user-tab');
    }

    loadEvents();
    loadCelebrities();
    loadAdminStats();
    loadAdminUsers();
    loadOrgEvents();
    loadSupportDesk();
  } else {
    if (loginSection) loginSection.classList.remove('hidden');
    if (dashboardContainer) dashboardContainer.classList.add('hidden');
    if (logoutBtn) logoutBtn.classList.add('hidden');
    if (userNameEl) userNameEl.innerText = 'Not Logged In';
  }
}

// -------------------------------------------------------------
// AUTHENTICATION & LOGIN HANDLERS
// -------------------------------------------------------------
let pendingPhone = '';

async function requestLoginOtp() {
  const phoneInput = document.getElementById('login-phone');
  let rawPhone = phoneInput.value.trim();

  if (!rawPhone) {
    alert('Please enter your mobile phone number.');
    return;
  }

  // Normalize phone format
  if (!rawPhone.startsWith('+')) {
    rawPhone = '+91' + rawPhone.replace(/\D/g, '');
  }

  pendingPhone = rawPhone;
  const btn = document.getElementById('send-otp-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Sending OTP...';

  try {
    const res = await fetch(`${API_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: pendingPhone })
    });
    const data = await res.json();

    if (data.success) {
      document.getElementById('otp-sent-phone').innerText = pendingPhone;
      document.getElementById('phone-input-step').classList.add('hidden');
      document.getElementById('otp-input-step').classList.remove('hidden');
      document.getElementById('login-otp').focus();
    } else {
      alert(data.message || 'Failed to send OTP');
    }
  } catch (err) {
    alert('Server unreachable. Ensure backend is running.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-paper-plane mr-1"></i> Send One-Time Password (OTP)';
  }
}

function backToPhoneStep() {
  document.getElementById('phone-input-step').classList.remove('hidden');
  document.getElementById('otp-input-step').classList.add('hidden');
}

async function submitVerifyOtp() {
  const otp = document.getElementById('login-otp').value.trim();
  const role = document.getElementById('login-role').value;

  if (!otp || otp.length < 4) {
    alert('Please enter the 6-digit OTP');
    return;
  }

  const btn = document.getElementById('verify-otp-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Verifying...';

  try {
    const res = await fetch(`${API_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: pendingPhone,
        otp,
        role
      })
    });
    const data = await res.json();

    if (data.success) {
      currentUser = data.user;
      authToken = data.token;
      localStorage.setItem('fc_user', JSON.stringify(currentUser));
      localStorage.setItem('fc_token', authToken);

      checkAuthState();
    } else {
      alert(data.message || 'Invalid OTP code');
    }
  } catch (err) {
    alert('Verification request failed');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-lock-open mr-1"></i> Verify & Enter';
  }
}

// 1-Click Fast Login for Testing Different Roles
async function quickLogin(phone, role) {
  pendingPhone = phone;
  try {
    // Send OTP
    await fetch(`${API_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });

    // Verify automatically with test OTP 123456
    const res = await fetch(`${API_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone,
        otp: '123456',
        role
      })
    });
    const data = await res.json();
    if (data.success) {
      currentUser = data.user;
      authToken = data.token;
      localStorage.setItem('fc_user', JSON.stringify(currentUser));
      localStorage.setItem('fc_token', authToken);

      checkAuthState();
    }
  } catch (err) {
    alert('Quick login failed');
  }
}

function logoutUser() {
  currentUser = null;
  authToken = null;
  localStorage.removeItem('fc_user');
  localStorage.removeItem('fc_token');
  if (socket) socket.emit('leave_match_queue');
  resetMatchUi();
  checkAuthState();
}


// Switch Dashboard Tabs
function switchTab(tabId) {
  const tabs = ['user-tab', 'org-tab', 'support-tab', 'admin-tab'];
  tabs.forEach(t => {
    const el = document.getElementById(t);
    const navEl = document.getElementById(`nav-${t}`);
    if (el && navEl) {
      if (t === tabId) {
        el.classList.remove('hidden');
        navEl.className = 'px-3 py-1.5 rounded-lg active-nav transition';
      } else {
        el.classList.add('hidden');
        navEl.className = 'px-3 py-1.5 rounded-lg text-slate-300 hover:text-white transition';
      }
    }
  });

  if (tabId === 'admin-tab') {
    loadAdminStats();
    loadAdminUsers();
  } else if (tabId === 'org-tab') {
    loadOrgEvents();
  } else if (tabId === 'support-tab') {
    loadSupportDesk();
  }
}

// -------------------------------------------------------------
// WEBSOCKET & RANDOM AUDIO MATCHMAKING
// -------------------------------------------------------------
function initSocket() {
  socket = io('http://localhost:4000');

  socket.on('connect', () => {
    console.log('[Socket] Connected to server:', socket.id);
  });

  socket.on('queue_waiting', (data) => {
    document.getElementById('match-idle-state').classList.add('hidden');
    document.getElementById('match-searching-state').classList.remove('hidden');
    document.getElementById('match-connected-state').classList.add('hidden');
  });

  socket.on('match_found', (data) => {
    currentCallRoomId = data.roomId;
    document.getElementById('match-idle-state').classList.add('hidden');
    document.getElementById('match-searching-state').classList.add('hidden');
    document.getElementById('match-connected-state').classList.remove('hidden');

    document.getElementById('matched-peer-name').innerText = data.peer.name;
    document.getElementById('matched-peer-avatar').src = data.peer.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';

    playNotificationSound();
  });

  socket.on('call_ended', () => {
    alert('Call ended by peer or timed out.');
    resetMatchUi();
  });

  socket.on('support_incoming_call', (data) => {
    const queueEl = document.getElementById('support-calls-queue');
    if (queueEl) {
      queueEl.innerHTML = `
        <div class="p-3 bg-indigo-950/60 border border-indigo-500/50 rounded-xl flex items-center justify-between">
          <div>
            <p class="font-bold text-xs text-white">Incoming Support Call</p>
            <p class="text-[10px] text-slate-400">Caller: ${data.userId}</p>
          </div>
          <button onclick="acceptSupportCall('${data.roomId}')" class="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-lg font-medium">
            Answer
          </button>
        </div>
      `;
    }
  });
}

function startMatchmaking() {
  if (!socket) return;
  socket.emit('join_match_queue', { userId: currentUser.id });
  document.getElementById('match-idle-state').classList.add('hidden');
  document.getElementById('match-searching-state').classList.remove('hidden');
}

function cancelMatchmaking() {
  if (socket) socket.emit('leave_match_queue');
  resetMatchUi();
}

function endCall() {
  if (socket) socket.emit('end_random_call');
  resetMatchUi();
}

function nextMatch() {
  if (socket) socket.emit('end_random_call');
  setTimeout(() => {
    startMatchmaking();
  }, 400);
}

function toggleMute() {
  isAudioMuted = !isAudioMuted;
  const btn = document.getElementById('mute-btn');
  if (isAudioMuted) {
    btn.className = 'p-3 bg-red-600 hover:bg-red-500 rounded-full text-white text-xs';
    btn.innerHTML = '<i class="fa-solid fa-microphone-slash"></i>';
  } else {
    btn.className = 'p-3 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-300 text-xs';
    btn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
  }
}

function resetMatchUi() {
  currentCallRoomId = null;
  document.getElementById('match-idle-state').classList.remove('hidden');
  document.getElementById('match-searching-state').classList.add('hidden');
  document.getElementById('match-connected-state').classList.add('hidden');
}

function playNotificationSound() {
  // Beep tone using AudioContext
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch (e) {}
}

// -------------------------------------------------------------
// EVENTS & GEO-LOCATION TICKETING
// -------------------------------------------------------------
async function loadEvents() {
  const radius = document.getElementById('event-radius').value || 50;
  // Default coordinates: Kochi (9.9312, 76.2673)
  try {
    const res = await fetch(`${API_URL}/events?lat=9.9312&lng=76.2673&radius=${radius}`);
    const data = await res.json();
    const container = document.getElementById('events-container');
    container.innerHTML = '';

    if (data.events.length === 0) {
      container.innerHTML = '<p class="col-span-2 text-xs text-slate-500 py-4">No events found in this radius.</p>';
      return;
    }

    data.events.forEach(event => {
      const card = document.createElement('div');
      card.className = 'bg-slate-950 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition flex flex-col justify-between';
      card.innerHTML = `
        <img src="${event.bannerUrl}" class="w-full h-28 object-cover">
        <div class="p-3.5 flex-1 flex flex-col justify-between space-y-2">
          <div>
            <div class="flex items-center justify-between text-[10px] text-purple-400 font-semibold mb-1">
              <span>${event.category}</span>
              <span class="text-slate-400"><i class="fa-solid fa-location-crosshairs mr-1"></i>${event.distanceKm} km away</span>
            </div>
            <h4 class="font-bold text-xs text-white line-clamp-1">${event.title}</h4>
            <p class="text-[11px] text-slate-400 mt-1 line-clamp-2">${event.venue}</p>
          </div>
          <div class="flex items-center justify-between pt-2 border-t border-slate-900">
            <div>
              <span class="text-[10px] text-slate-500 block">Entry Pass</span>
              <span class="text-sm font-bold text-white">₹ ${event.ticketPrice}</span>
            </div>
            <button onclick="bookTicket('${event.id}', '${event.title}', ${event.ticketPrice})" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/30 transition">
              Book Ticket
            </button>
          </div>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.error('Failed to load events:', err);
  }
}

async function bookTicket(eventId, title, price) {
  const confirmBook = confirm(`Confirm booking for "${title}" for ₹${price}?`);
  if (!confirmBook) return;

  try {
    const res = await fetch(`${API_URL}/events/${eventId}/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.id, quantity: 1 })
    });
    const data = await res.json();
    if (data.success) {
      alert(`🎉 Ticket Booked Successfully!\n\nYour Entry QR Token: ${data.booking.qrCodeToken}\nShow this at the venue gate for check-in.`);
      loadEvents();
    } else {
      alert(`Booking Failed: ${data.message}`);
    }
  } catch (err) {
    alert('Error connecting to booking service');
  }
}

// -------------------------------------------------------------
// CELEBRITIES & VIP CALLS
// -------------------------------------------------------------
async function loadCelebrities() {
  try {
    const res = await fetch(`${API_URL}/celebrities`);
    const data = await res.json();
    const container = document.getElementById('celebrities-container');
    container.innerHTML = '';

    data.celebrities.forEach(celeb => {
      const p = celeb.celebrityProfile || {};
      const card = document.createElement('div');
      card.className = 'bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3';
      card.innerHTML = `
        <div class="flex items-center space-x-3">
          <img src="${celeb.avatarUrl}" class="w-12 h-12 rounded-full object-cover border-2 border-amber-500/50">
          <div>
            <div class="flex items-center space-x-1">
              <h4 class="font-bold text-xs text-white">${celeb.name}</h4>
              <i class="fa-solid fa-circle-check text-amber-400 text-[10px]"></i>
            </div>
            <p class="text-[10px] text-amber-400">${p.title || 'Creator'}</p>
            <span class="inline-flex items-center text-[9px] ${p.isOnlineForCalls ? 'text-emerald-400' : 'text-slate-500'}">
              <span class="w-1.5 h-1.5 rounded-full ${p.isOnlineForCalls ? 'bg-emerald-400' : 'bg-slate-500'} mr-1"></span>
              ${p.isOnlineForCalls ? 'Online for calls' : 'Offline'}
            </span>
          </div>
        </div>
        <p class="text-[11px] text-slate-400 line-clamp-2">${p.bio || ''}</p>
        <div class="flex space-x-2 pt-2">
          <button onclick="requestCelebCall('${celeb.id}', 'CELEBRITY_AUDIO')" class="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[11px] font-medium transition">
            <i class="fa-solid fa-phone text-indigo-400 mr-1"></i> Audio (₹${p.audioRatePerMin}/m)
          </button>
          <button onclick="requestCelebCall('${celeb.id}', 'CELEBRITY_VIDEO')" class="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-medium transition">
            <i class="fa-solid fa-video mr-1"></i> Video (₹${p.videoRatePerMin}/m)
          </button>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.error('Failed to load celebrities:', err);
  }
}

async function requestCelebCall(celebId, type) {
  try {
    const res = await fetch(`${API_URL}/celebrities/${celebId}/request-call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.id, callType: type })
    });
    const data = await res.json();
    if (data.success) {
      alert(`📞 Calling Celebrity...\nSession Room: ${data.callSession.roomName}\nRinging celebrity device now.`);
    } else {
      alert(data.message);
    }
  } catch (err) {
    alert('Failed to place celebrity call');
  }
}

// -------------------------------------------------------------
// CUSTOMER SUPPORT DESK
// -------------------------------------------------------------
async function loadSupportDesk() {
  try {
    // Load ticket for current user
    const res = await fetch(`${API_URL}/support/ticket`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.id })
    });
    const data = await res.json();
    if (data.success) {
      currentTicketId = data.ticket.id;
      renderSupportMessages(data.ticket.messages);
    }
  } catch (err) {
    console.error('Support load failed:', err);
  }
}

function renderSupportMessages(messages) {
  const container = document.getElementById('support-messages-container');
  if (!container) return;
  container.innerHTML = '';

  messages.forEach(msg => {
    const isMe = msg.senderId === currentUser.id;
    const msgEl = document.createElement('div');
    msgEl.className = `flex flex-col ${isMe ? 'items-end' : 'items-start'}`;
    msgEl.innerHTML = `
      <span class="text-[9px] text-slate-500 mb-0.5">${msg.senderName} (${msg.senderRole})</span>
      <div class="px-3 py-2 rounded-xl max-w-sm ${isMe ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-200'}">
        ${msg.text}
      </div>
    `;
    container.appendChild(msgEl);
  });
  container.scrollTop = container.scrollHeight;
}

async function sendSupportReply() {
  const input = document.getElementById('support-input');
  const text = input.value.trim();
  if (!text || !currentTicketId) return;

  try {
    const res = await fetch(`${API_URL}/support/ticket/${currentTicketId}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderId: currentUser.id, text })
    });
    const data = await res.json();
    if (data.success) {
      input.value = '';
      renderSupportMessages(data.ticket.messages);
    }
  } catch (err) {
    alert('Message failed to send');
  }
}

async function requestSupportCall() {
  try {
    const res = await fetch(`${API_URL}/support/call/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.id })
    });
    const data = await res.json();
    if (data.success) {
      alert(`📞 In-App Support Call Dialed!\nConnecting you to Support Desk Agent (${data.agent.name}). Room: ${data.callSession.roomName}`);
      if (socket) {
        socket.emit('support_call_start', { userId: currentUser.id });
      }
    }
  } catch (err) {
    alert('Support call routing failed');
  }
}

function acceptSupportCall(roomId) {
  if (socket) {
    socket.emit('support_call_answer', { roomId, agentId: 'usr_support_1' });
    alert(`Connected to voice call in room: ${roomId}`);
  }
}

// -------------------------------------------------------------
// ORGANIZER PORTAL
// -------------------------------------------------------------
async function loadOrgEvents() {
  try {
    const res = await fetch(`${API_URL}/events`);
    const data = await res.json();
    const list = document.getElementById('org-events-list');
    list.innerHTML = '';

    data.events.forEach(evt => {
      const item = document.createElement('div');
      item.className = 'p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs';
      item.innerHTML = `
        <div>
          <h4 class="font-bold text-white">${evt.title}</h4>
          <p class="text-[11px] text-slate-400">${evt.venue} • ₹${evt.ticketPrice}</p>
          <span class="text-[10px] text-indigo-400">${evt.bookedTickets} / ${evt.totalTickets} Tickets Sold</span>
        </div>
        <span class="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px]">
          Published
        </span>
      `;
      list.appendChild(item);
    });
  } catch (err) {}
}

async function submitNewEvent() {
  const title = document.getElementById('new-evt-title').value;
  const category = document.getElementById('new-evt-cat').value;
  const price = document.getElementById('new-evt-price').value;
  const venue = document.getElementById('new-evt-venue').value;
  const lat = document.getElementById('new-evt-lat').value;
  const lng = document.getElementById('new-evt-lng').value;
  const dateTime = document.getElementById('new-evt-date').value || new Date().toISOString();
  const capacity = document.getElementById('new-evt-capacity').value;

  if (!title || !venue || !price) {
    alert('Please fill in title, venue, and ticket price.');
    return;
  }

  try {
    const res = await fetch(`${API_URL}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orgId: 'usr_org_1',
        title,
        category,
        ticketPrice: price,
        venue,
        latitude: lat,
        longitude: lng,
        dateTime,
        totalTickets: capacity
      })
    });
    const data = await res.json();
    if (data.success) {
      alert('Event published successfully!');
      document.getElementById('create-event-modal').classList.add('hidden');
      loadOrgEvents();
      loadEvents();
    }
  } catch (err) {
    alert('Failed to publish event');
  }
}

async function validateTicketQr() {
  const qrInput = document.getElementById('qr-input').value.trim();
  const resultBox = document.getElementById('qr-result-box');
  if (!qrInput) return;

  try {
    const res = await fetch(`${API_URL}/events/tickets/check-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrCodeToken: qrInput })
    });
    const data = await res.json();
    resultBox.classList.remove('hidden');

    if (data.success) {
      resultBox.className = 'p-3 rounded-lg border text-xs bg-emerald-950/60 border-emerald-500/50 text-emerald-300';
      resultBox.innerHTML = `
        <i class="fa-solid fa-circle-check mr-1"></i>
        <strong>VALID ENTRY PASS</strong><br>
        Attendee: ${data.ticket.userName}<br>
        Event: ${data.ticket.eventTitle} (Qty: ${data.ticket.quantity})
      `;
    } else {
      resultBox.className = 'p-3 rounded-lg border text-xs bg-red-950/60 border-red-500/50 text-red-300';
      resultBox.innerHTML = `<i class="fa-solid fa-circle-xmark mr-1"></i> ${data.message}`;
    }
  } catch (err) {
    alert('Validation error');
  }
}

// -------------------------------------------------------------
// SUPER ADMIN DASHBOARD
// -------------------------------------------------------------
async function loadAdminStats() {
  try {
    const res = await fetch(`${API_URL}/admin/stats`);
    const data = await res.json();
    if (data.success) {
      document.getElementById('stat-total-users').innerText = data.stats.totalUsers;
      document.getElementById('stat-total-events').innerText = data.stats.totalEvents;
      document.getElementById('stat-total-revenue').innerText = `₹ ${data.stats.totalTicketRevenue}`;
      document.getElementById('stat-total-calls').innerText = data.stats.totalCallsLogged;
    }
  } catch (err) {}
}

let allAdminUsers = [];

async function loadAdminUsers() {
  try {
    const res = await fetch(`${API_URL}/admin/users`);
    const data = await res.json();
    if (data.success) {
      allAdminUsers = data.users;
      renderAdminUsers(allAdminUsers);
    }
  } catch (err) {}
}

function renderAdminUsers(users) {
  const tbody = document.getElementById('admin-users-table');
  tbody.innerHTML = '';

  users.forEach(u => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-900/60 transition';
    tr.innerHTML = `
      <td class="py-3 px-4 flex items-center space-x-2">
        <img src="${u.avatarUrl}" class="w-7 h-7 rounded-full">
        <span class="font-medium text-white">${u.name}</span>
      </td>
      <td class="py-3 px-4">
        <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">${u.role}</span>
      </td>
      <td class="py-3 px-4 text-slate-400">${u.phone}</td>
      <td class="py-3 px-4">
        <span class="px-2 py-0.5 rounded text-[10px] font-semibold ${u.isBlocked ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}">
          ${u.isBlocked ? 'BLOCKED' : 'ACTIVE'}
        </span>
      </td>
      <td class="py-3 px-4 text-right">
        <button onclick="toggleUserBlock('${u.id}')" class="px-3 py-1 rounded text-[11px] font-medium transition ${u.isBlocked ? 'bg-emerald-700 hover:bg-emerald-600 text-white' : 'bg-red-800/80 hover:bg-red-700 text-white'}">
          ${u.isBlocked ? 'Unblock' : 'Block User'}
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function filterAdminUsers() {
  const query = document.getElementById('admin-search-user').value.toLowerCase();
  const filtered = allAdminUsers.filter(u =>
    u.name.toLowerCase().includes(query) ||
    u.phone.includes(query) ||
    u.role.toLowerCase().includes(query)
  );
  renderAdminUsers(filtered);
}

async function toggleUserBlock(userId) {
  try {
    const res = await fetch(`${API_URL}/admin/users/${userId}/toggle-block`, {
      method: 'POST'
    });
    const data = await res.json();
    if (data.success) {
      loadAdminUsers();
      loadAdminStats();
    }
  } catch (err) {
    alert('Failed to modify user status');
  }
}
