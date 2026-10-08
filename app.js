/**
 * YoklamaPilot — Ders & Devamsızlık Takip Uygulaması
 * İstanbul Üniversitesi-Cerrahpaşa Bilgisayar Mühendisliği (Güz 2026)
 */

const STORAGE_KEY = "yoklamapilot_state_v1";
const TOTAL_WEEKS = 14;

// 2026-2027 Güz Ders Programı & Resmi Bilgiler
const COURSES = [
  {
    id: "signal_proc",
    name: "Signal Processing",
    day: "Pazartesi",
    dayIndex: 1,
    time: "08:30 - 11:10",
    room: "K Blok: K-B07",
    instructor: "Doç. Dr. Pelin GÖRGEL",
    type: "Teori",
    threshold: 70,
    maxAbsence: 4,
    hours: 3
  },
  {
    id: "algo_analysis",
    name: "Algorithm Analysis",
    day: "Pazartesi",
    dayIndex: 1,
    time: "11:15 - 13:55",
    room: "K Blok: K-Z06",
    instructor: "Prof. Dr. Zeynep ORMAN",
    type: "Teori",
    threshold: 70,
    maxAbsence: 4,
    hours: 3
  },
  {
    id: "data_mining",
    name: "Veri Madenciliği",
    day: "Salı",
    dayIndex: 2,
    time: "08:30 - 11:10",
    room: "B Blok: Yazılım Lab. A",
    instructor: "Doç. Dr. Emel ARSLAN",
    type: "Teori",
    threshold: 70,
    maxAbsence: 4,
    hours: 3
  },
  {
    id: "os",
    name: "Operating Systems",
    day: "Salı",
    dayIndex: 2,
    time: "11:15 - 13:55",
    room: "A Blok: D-701",
    instructor: "Öğr. Gör. Enes ALTUNCU",
    type: "Teori",
    threshold: 70,
    maxAbsence: 4,
    hours: 3
  },
  {
    id: "ybs",
    name: "Yönetim Bilişim Sistemleri",
    day: "Çarşamba",
    dayIndex: 3,
    time: "12:10 - 13:55",
    room: "A Blok: D-701",
    instructor: "Dr. Öğr. Ü. Ebu Yusuf GÜVEN",
    type: "Teori",
    threshold: 70,
    maxAbsence: 4,
    hours: 2
  },
  {
    id: "comp_org_lab",
    name: "Bilgisayar Org. ve Tasarımı Lab.",
    day: "Perşembe",
    dayIndex: 4,
    time: "13:05 - 14:50",
    room: "B Blok: Yazılım Lab. A",
    instructor: "Dr. Öğr. Ü. Fatih KELEŞ",
    type: "Lab",
    threshold: 80,
    maxAbsence: 2,
    hours: 2
  },
  {
    id: "os_lab",
    name: "Operating Systems (Lab)",
    day: "Perşembe",
    dayIndex: 4,
    time: "14:55 - 16:40",
    room: "B Blok: Yazılım Lab. A",
    instructor: "Öğr. Gör. Enes ALTUNCU",
    type: "Lab",
    threshold: 80,
    maxAbsence: 2,
    hours: 2
  },
  {
    id: "dbms",
    name: "Veri Tabanı Yönetim Sistemleri",
    day: "Cuma",
    dayIndex: 5,
    time: "14:00 - 15:45",
    room: "K Blok: K-B07",
    instructor: "Doç. Dr. Atakan KURT",
    type: "Teori",
    threshold: 70,
    maxAbsence: 4,
    hours: 2
  },
  {
    id: "dbms_lab",
    name: "Veri Tabanı Yön. Sis. (Lab)",
    day: "Cuma",
    dayIndex: 5,
    time: "15:50 - 17:35",
    room: "K Blok: K-B07",
    instructor: "Doç. Dr. Atakan KURT",
    type: "Lab",
    threshold: 80,
    maxAbsence: 2,
    hours: 2
  }
];

// Dönem başlangıç tarihi: 14 Eylül 2026 Pazartesi
function getCurrentAcademicWeek() {
  const startDate = new Date(2026, 8, 14); // Ay: 8 = Eylül
  const now = new Date();
  const diffDays = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 1;
  const weekNum = Math.floor(diffDays / 7) + 1;
  return Math.min(Math.max(weekNum, 1), TOTAL_WEEKS);
}

// App State
let appState = {
  activeWeek: getCurrentAcademicWeek(),
  attendance: {}  // { [courseId]: { [weekNum]: "attended" | "absent" | "cancelled" | "unrecorded" } }
};

// Firebase Instances
let auth = null;
let db = null;
let currentUser = null;
let unsubscribeUserDoc = null;

// Initialize State
function initStore() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      appState = { ...appState, ...parsed };
      // Aktif haftayı bugünkü akademik haftaya eşitle
      if (!appState.activeWeek) {
        appState.activeWeek = getCurrentAcademicWeek();
      }
    } catch (e) {
      console.error("Kayıtlı veri yüklenemedi:", e);
    }
  }

  // Boş ders-hafta hücrelerini unrecorded ile doldur
  COURSES.forEach(course => {
    if (!appState.attendance[course.id]) {
      appState.attendance[course.id] = {};
    }
    for (let w = 1; w <= TOTAL_WEEKS; w++) {
      if (!appState.attendance[course.id][w]) {
        appState.attendance[course.id][w] = "unrecorded";
      }
    }
  });

  saveStore();
}

// Senkron Durum Rozeti Güncelleyici
function setSyncStatus(type, text) {
  const badge = document.getElementById("syncBadge");
  const label = document.getElementById("syncText");
  if (!badge || !label) return;

  badge.className = "sync-badge " + (type || "");
  label.textContent = text || "Yerel Mod";
}

// Kaydetme (Hem Yerel Hem Bulut)
function saveStore() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));

  // Eğer Google ile giriş yapılmışsa buluta senkronla
  if (currentUser && db) {
    setSyncStatus("syncing", "Kaydediliyor...");
    db.collection("users").doc(currentUser.uid).set({
      attendance: appState.attendance,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true })
    .then(() => {
      setSyncStatus("online", "Bulutla Senkron");
    })
    .catch(err => {
      console.error("Firestore kayıt hatası:", err);
      setSyncStatus("error", "Kayıt Hatası");
    });
  }
}

// Stats Calculation for a single course
function calculateCourseStats(courseId) {
  const course = COURSES.find(c => c.id === courseId);
  const records = appState.attendance[courseId] || {};

  let attended = 0;
  let absent = 0;
  let cancelled = 0;

  for (let w = 1; w <= TOTAL_WEEKS; w++) {
    const status = records[w] || "unrecorded";
    if (status === "attended") attended++;
    else if (status === "absent") absent++;
    else if (status === "cancelled") cancelled++;
  }

  const held = attended + absent; // Yapılan işlenen dersler
  const percentage = held === 0 ? 100 : Math.round((attended / held) * 1000) / 10;
  const remaining = course.maxAbsence - absent;

  let statusLevel = "safe";
  let statusText = `${remaining} Hak Kaldı`;

  if (remaining < 0) {
    statusLevel = "critical";
    statusText = "Devamsızlıktan Kaldı (DZ)";
  } else if (remaining === 0) {
    statusLevel = "critical";
    statusText = "Son Hak! (0 Hak)";
  } else if (remaining === 1) {
    statusLevel = "warning";
    statusText = "Kritik Sınırda (1 Hak)";
  }

  return {
    attended,
    absent,
    cancelled,
    held,
    percentage,
    remaining,
    statusLevel,
    statusText,
    maxAbsence: course.maxAbsence,
    threshold: course.threshold
  };
}

// Global Stats Calculation
function calculateGlobalStats() {
  let totalHeld = 0;
  let totalAttended = 0;
  let totalAbsent = 0;

  COURSES.forEach(c => {
    const s = calculateCourseStats(c.id);
    totalHeld += s.held;
    totalAttended += s.attended;
    totalAbsent += s.absent;
  });

  const totalPercentage = totalHeld === 0 ? 100 : Math.round((totalAttended / totalHeld) * 1000) / 10;

  return {
    totalHeld,
    totalAttended,
    totalAbsent,
    totalPercentage
  };
}

// UI: Render Everything
function renderApp() {
  renderOverviewStats();
  renderWeekTabs();
  renderActiveWeekCards();
  renderCourseSummaryCards();
  renderMatrixTable();
}

function renderOverviewStats() {
  const global = calculateGlobalStats();
  document.getElementById("statTotalHeld").textContent = `${global.totalHeld} ders`;
  document.getElementById("statAttended").textContent = `${global.totalAttended} ders`;
  document.getElementById("statAbsent").textContent = `${global.totalAbsent} ders`;
  document.getElementById("statPercentage").textContent = `%${global.totalPercentage}`;
}

function renderWeekTabs() {
  const container = document.getElementById("weekTabsContainer");
  container.innerHTML = "";

  for (let w = 1; w <= TOTAL_WEEKS; w++) {
    const btn = document.createElement("button");
    btn.className = `week-tab-btn ${appState.activeWeek === w ? "active" : ""}`;
    
    // O haftanın doluluk durumu
    let attendedCount = 0;
    let absentCount = 0;
    COURSES.forEach(c => {
      const st = appState.attendance[c.id][w];
      if (st === "attended") attendedCount++;
      if (st === "absent") absentCount++;
    });

    let statusHint = "Boş";
    if (attendedCount + absentCount > 0) {
      statusHint = `${attendedCount}/${COURSES.length} Girdi`;
    }

    btn.innerHTML = `
      <span class="week-tab-title">Hafta ${w}</span>
      <span class="week-tab-status">${statusHint}</span>
      ${w === getCurrentAcademicWeek() ? `<span class="week-tab-badge">ŞU AN</span>` : ""}
    `;

    btn.addEventListener("click", () => {
      appState.activeWeek = w;
      saveStore();
      renderApp();
    });

    container.appendChild(btn);
  }
}

function renderActiveWeekCards() {
  const container = document.getElementById("activeWeekCardsContainer");
  const title = document.getElementById("currentWeekTitle");
  title.textContent = `${appState.activeWeek}. Hafta Dersleri`;
  container.innerHTML = "";

  COURSES.forEach(course => {
    const currentStatus = appState.attendance[course.id][appState.activeWeek] || "unrecorded";
    const card = document.createElement("div");
    card.className = "lesson-card";

    const typeBadge = course.type === "Teori" 
      ? `<span class="badge badge-teori"><i class="ph ph-book-open"></i> Teori (%70)</span>`
      : `<span class="badge badge-lab"><i class="ph ph-flask"></i> Laboratuvar (%80)</span>`;

    card.innerHTML = `
      <div class="lesson-card-top">
        <div class="lesson-info">
          <span class="lesson-day-badge">${course.day} • ${course.time}</span>
          <h4 class="lesson-name">${course.name}</h4>
          <div class="lesson-meta">
            <span><i class="ph ph-map-pin"></i> ${course.room}</span>
            <span><i class="ph ph-user"></i> ${course.instructor}</span>
          </div>
        </div>
        ${typeBadge}
      </div>

      <div class="attendance-actions">
        <button class="att-btn ${currentStatus === 'attended' ? 'active-attended' : ''}" data-status="attended">
          <i class="ph ph-check"></i>
          <span>Girdim</span>
        </button>
        <button class="att-btn ${currentStatus === 'absent' ? 'active-absent' : ''}" data-status="absent">
          <i class="ph ph-x"></i>
          <span>Gitmedim</span>
        </button>
        <button class="att-btn ${currentStatus === 'cancelled' ? 'active-cancelled' : ''}" data-status="cancelled">
          <i class="ph ph-pause"></i>
          <span>İptal / Tatil</span>
        </button>
      </div>
    `;

    // Buton dinleyicileri
    const buttons = card.querySelectorAll(".att-btn");
    buttons.forEach(btn => {
      btn.addEventListener("click", () => {
        const targetStatus = btn.dataset.status;
        const newStatus = (currentStatus === targetStatus) ? "unrecorded" : targetStatus;
        updateAttendance(course.id, appState.activeWeek, newStatus);
      });
    });

    container.appendChild(card);
  });
}

function renderCourseSummaryCards() {
  const container = document.getElementById("courseCardsGrid");
  container.innerHTML = "";

  COURSES.forEach(course => {
    const stats = calculateCourseStats(course.id);
    const card = document.createElement("div");
    card.className = "course-summary-card";

    let progressColor = "var(--success)";
    if (stats.statusLevel === "warning") progressColor = "var(--warning)";
    if (stats.statusLevel === "critical") progressColor = "var(--danger)";

    card.innerHTML = `
      <div class="course-card-header">
        <div>
          <span class="lesson-day-badge">${course.day} • ${course.time}</span>
          <h4 class="course-name-title">${course.name}</h4>
        </div>
        <span class="course-limit-badge status-${stats.statusLevel}">
          ${stats.statusText}
        </span>
      </div>

      <div class="course-stats-row">
        <span class="course-percent" style="color: ${progressColor}">%${stats.percentage}</span>
        <span class="stat-label">Baraj: %${stats.threshold} (Maks ${stats.maxAbsence} Hafta)</span>
      </div>

      <div class="progress-track">
        <div class="progress-bar" style="width: ${Math.min(stats.percentage, 100)}%; background-color: ${progressColor};"></div>
      </div>

      <div class="course-breakdown">
        <span>Katılınan: <strong>${stats.attended}</strong> hafta</span>
        <span>Devamsız: <strong style="color: ${stats.absent > 0 ? 'var(--danger)' : 'inherit'}">${stats.absent}</strong> hafta</span>
        <span>İptal: <strong>${stats.cancelled}</strong></span>
      </div>
    `;

    container.appendChild(card);
  });
}

function renderMatrixTable() {
  const tbody = document.getElementById("matrixTableBody");
  tbody.innerHTML = "";

  COURSES.forEach(course => {
    const stats = calculateCourseStats(course.id);
    const tr = document.createElement("tr");

    let cellsHtml = `
      <td class="td-course-name">${course.name}</td>
      <td><span class="badge ${course.type === 'Teori' ? 'badge-teori' : 'badge-lab'}">${course.type}</span></td>
    `;

    for (let w = 1; w <= TOTAL_WEEKS; w++) {
      const status = appState.attendance[course.id][w] || "unrecorded";
      let icon = "·";
      let cellClass = "cell-unrecorded";

      if (status === "attended") {
        icon = "✓";
        cellClass = "cell-attended";
      } else if (status === "absent") {
        icon = "✗";
        cellClass = "cell-absent";
      } else if (status === "cancelled") {
        icon = "–";
        cellClass = "cell-cancelled";
      }

      cellsHtml += `
        <td class="matrix-cell ${cellClass}" data-course="${course.id}" data-week="${w}" title="${w}. Hafta: ${status}">
          ${icon}
        </td>
      `;
    }

    cellsHtml += `
      <td><strong>%${stats.percentage}</strong></td>
      <td>
        <span class="badge status-${stats.statusLevel}">
          ${stats.remaining} / ${course.maxAbsence}
        </span>
      </td>
    `;

    tr.innerHTML = cellsHtml;
    tbody.appendChild(tr);
  });

  // Matris hücrelerine tıklama ile durum döngüsü
  tbody.querySelectorAll(".matrix-cell").forEach(td => {
    td.addEventListener("click", () => {
      const cId = td.dataset.course;
      const week = parseInt(td.dataset.week, 10);
      const current = appState.attendance[cId][week] || "unrecorded";

      // Döngü: unrecorded -> attended -> absent -> cancelled -> unrecorded
      const cycle = {
        unrecorded: "attended",
        attended: "absent",
        absent: "cancelled",
        cancelled: "unrecorded"
      };

      const next = cycle[current] || "unrecorded";
      updateAttendance(cId, week, next);
    });
  });
}

// Attendance Update Handler
function updateAttendance(courseId, week, status) {
  if (!appState.attendance[courseId]) {
    appState.attendance[courseId] = {};
  }
  appState.attendance[courseId][week] = status;
  saveStore();
  renderApp();
}

// Batch Actions
document.getElementById("btnMarkWeekAttended").addEventListener("click", () => {
  const w = appState.activeWeek;
  COURSES.forEach(c => {
    appState.attendance[c.id][w] = "attended";
  });
  saveStore();
  renderApp();
  showToast(`${w}. haftadaki tüm dersler "Girdim" olarak işaretlendi.`);
});

document.getElementById("btnResetWeek").addEventListener("click", () => {
  const w = appState.activeWeek;
  if (confirm(`${w}. haftanın tüm kayıtlarını temizlemek istiyor musunuz?`)) {
    COURSES.forEach(c => {
      appState.attendance[c.id][w] = "unrecorded";
    });
    saveStore();
    renderApp();
    showToast(`${w}. hafta sıfırlandı.`);
  }
});

// JSON Export
document.getElementById("btnExport").addEventListener("click", () => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appState, null, 2));
  const dlAnchorElem = document.createElement("a");
  const dateStr = new Date().toISOString().slice(0, 10);
  dlAnchorElem.setAttribute("href", dataStr);
  dlAnchorElem.setAttribute("download", `YoklamaPilot_Yedek_${dateStr}.json`);
  dlAnchorElem.click();
  showToast("Yedek dosyası indirildi.");
});

// JSON Import
document.getElementById("btnImport").addEventListener("click", () => {
  document.getElementById("fileInput").click();
});

document.getElementById("fileInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const imported = JSON.parse(event.target.result);
      if (imported.attendance) {
        appState = imported;
        saveStore();
        renderApp();
        showToast("Yedek başarıyla yüklendi!");
      } else {
        alert("Geçersiz yedek dosyası!");
      }
    } catch (err) {
      alert("Dosya okunurken hata oluştu: " + err.message);
    }
  };
  reader.readAsText(file);
});

// Toast notification helper
function showToast(message) {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<i class="ph ph-info"></i> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.2s ease";
    setTimeout(() => toast.remove(), 200);
  }, 2500);
}

// ==========================================
// Firebase Entegrasyonu & Senkronizasyon
// ==========================================

function updateAuthUI(user) {
  const btnLogin = document.getElementById("btnLogin");
  const userProfile = document.getElementById("userProfile");
  const userName = document.getElementById("userName");

  if (user) {
    if (btnLogin) btnLogin.style.display = "none";
    if (userProfile) userProfile.style.display = "inline-flex";
    if (userName) userName.textContent = user.displayName || user.email || "Giriş Yapıldı";
  } else {
    if (btnLogin) btnLogin.style.display = "inline-flex";
    if (userProfile) userProfile.style.display = "none";
  }
}

function setupRealtimeSync(uid) {
  if (!db) return;
  setSyncStatus("syncing", "Bağlanıyor...");
  const userDocRef = db.collection("users").doc(uid);

  // Varsa önceki dinleyiciyi kapat
  if (unsubscribeUserDoc) unsubscribeUserDoc();

  unsubscribeUserDoc = userDocRef.onSnapshot(doc => {
    if (doc.exists) {
      const cloudData = doc.data();
      if (cloudData && cloudData.attendance) {
        // Buluttaki veriyi yerelle birleştir (cloud öncelikli)
        COURSES.forEach(course => {
          if (!appState.attendance[course.id]) appState.attendance[course.id] = {};
          for (let w = 1; w <= TOTAL_WEEKS; w++) {
            if (cloudData.attendance[course.id] && cloudData.attendance[course.id][w]) {
              appState.attendance[course.id][w] = cloudData.attendance[course.id][w];
            }
          }
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
        renderApp();
        setSyncStatus("online", "Bulutla Senkron");
      }
    } else {
      // Bulutta doküman yoksa yerel veriyi buluta yükle (otomatik ilk taşıma)
      userDocRef.set({
        attendance: appState.attendance,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }).then(() => {
        setSyncStatus("online", "Bulutla Senkron");
        showToast("Mevcut yoklamalarınız buluta aktarıldı!");
      }).catch(err => {
        console.error("İlk bulut yükleme hatası:", err);
        setSyncStatus("error", "Senkron Hatası");
      });
    }
  }, err => {
    console.error("Firestore dinleme hatası:", err);
    setSyncStatus("error", "Senkron Hatası");
  });
}

function initFirebase() {
  if (typeof firebase !== "undefined" && typeof firebaseConfig !== "undefined" && firebaseConfig.apiKey) {
    try {
      firebase.initializeApp(firebaseConfig);
      auth = firebase.auth();
      db = firebase.firestore();

      // Offline önbellekleme
      db.enablePersistence({ synchronizeTabs: true }).catch(err => {
        console.log("Firestore offline persistence bildirimi:", err.code);
      });

      auth.onAuthStateChanged(user => {
        currentUser = user;
        updateAuthUI(user);
        if (user) {
          setupRealtimeSync(user.uid);
          showToast(`Hoş geldin, ${user.displayName || "Kullanıcı"}!`);
        } else {
          if (unsubscribeUserDoc) {
            unsubscribeUserDoc();
            unsubscribeUserDoc = null;
          }
          setSyncStatus("local", "Yerel Mod");
        }
      });
    } catch (err) {
      console.warn("Firebase başlatılırken hata:", err);
      setSyncStatus("local", "Yerel Mod");
    }
  } else {
    setSyncStatus("local", "Yerel Mod");
  }
}

// Google Giriş & Çıkış Olayları
const btnLogin = document.getElementById("btnLogin");
if (btnLogin) {
  btnLogin.addEventListener("click", () => {
    if (!auth) {
      alert("Firebase henüz hazır değil!");
      return;
    }
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(error => {
      console.error("Giriş hatası:", error);
      if (error.code === "auth/popup-blocked" || error.code === "auth/popup-closed-by-user") {
        auth.signInWithRedirect(provider);
      } else {
        alert("Giriş yapılamadı: " + error.message);
      }
    });
  });
}

const btnLogout = document.getElementById("btnLogout");
if (btnLogout) {
  btnLogout.addEventListener("click", () => {
    if (auth && confirm("Oturumu kapatmak istiyor musunuz?")) {
      auth.signOut().then(() => {
        showToast("Çıkış yapıldı.");
      });
    }
  });
}

// Start
document.addEventListener("DOMContentLoaded", () => {
  initStore();
  renderApp();
  initFirebase();
});

