// Basit karakter katalog SPA'sı
// Not: Karakterler şimdilik sadece localStorage'da tutuluyor (tarayıcı bazlı).

let users = [];
let projects = [];

// Toast bildirimleri
function showToast(message, type = "info", duration = 3000) {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    const icons = {
        success: "✓",
        error: "✕",
        info: "ℹ",
        warning: "⚠"
    };

    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span class="toast-content">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;

    container.appendChild(toast);

    // Otomatik kaldır
    if (duration > 0) {
        setTimeout(() => {
            toast.classList.add("slide-out");
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
}

let currentUser = null;
let currentProjectId = null;
let currentCharacterId = null;
let currentCharacter = null;
let previousScreen = null; // Modal açılmadan önce hangi ekrandaydık
let isNavigating = false; // URL değişikliği sırasında infinite loop'u önlemek için

// Backend endpoints (Render'da host edilmiş)
const BACKEND_BASE_URL = "https://character-backend-buw3.onrender.com";
const BACKEND_UPLOAD_URL = `${BACKEND_BASE_URL}/upload`;
const BACKEND_PROJECTS_URL = `${BACKEND_BASE_URL}/api/projects`;

function getCharactersUrl(projectId) {
    return `${BACKEND_BASE_URL}/api/projects/${projectId}/characters`;
}

// DOM referansları (DOM yüklendikten sonra alınacak)
let loginScreen, mainScreen, characterDetailScreen;
let loginForm, usernameInput, passwordInput, loginErrorEl;

// Bu referanslar initializeEventListeners içinde alınacak
let currentUserInfoEl, logoutBtn, usersManagementBtn, themeToggleBtn, blurToggleBtn, chatToggleBtn;
let chatPanel, chatMessages, chatMessageInput, chatSendBtn, chatCloseBtn;
let chatPollInterval = null;

// Yeni layout DOM referansları (initializeEventListeners içinde alınacak)
let projectListEl, addProjectBtn, charactersSidebarSection, sidebarProjectTitle;
let characterSearchInput, addCharacterSidebarBtn, characterFiltersEl, charactersSidebarList;
let characterDetailPanel, emptyState, characterDetailContent;
let detailMainImage, detailFullName, detailMeta, detailProjectBadge;
let traitsDisplay, traitsEdit, traitsTextarea, editTraitsBtn;
let addImageBtnPanel, tagFiltersEl, characterImagesGrid;

// Senaryo Editor referansları
let scenarioBtn, scenarioScreen, scenarioBackBtn, scenarioProjectTitle;
let addChapterBtn, addPartBtn, scenarioOutlineList, scenarioCanvas, scenarioPropertiesContent;
let resetViewBtn;

// İlişki Editor referansları
let relationshipBtn, relationshipScreen, relationshipBackBtn, relationshipProjectTitle;
let addRelationshipCharacterBtn, addRelationshipGroupBtn, addRelationshipBtn;
let relationshipCharactersList, relationshipGroupsList;
let relationshipCanvas, relationshipPropertiesContent;
let resetRelationshipViewBtn;
let relationshipCharacterModal, relationshipCharacterModalBackdrop, relationshipCharacterForm, relationshipCharacterNameInput;
let relationshipGroupModal, relationshipGroupModalBackdrop, relationshipGroupForm, relationshipGroupNameInput;
let discardRelationshipCharacterBtn, discardRelationshipGroupBtn;

// Eski referanslar (geriye dönük uyumluluk için)
let currentProjectTitleEl, addCharacterBtn, charactersContainer;

// Proje modal
const projectModal = document.getElementById("project-modal");
const projectModalBackdrop = document.getElementById("project-modal-backdrop");
const projectForm = document.getElementById("project-form");
const projectModalTitle = document.getElementById("project-modal-title");
const projectNameInput = document.getElementById("project-name");
const projectDescriptionInput = document.getElementById("project-description");
const discardProjectBtn = document.getElementById("discard-project-btn");
let editingProjectId = null;

// Modal
const characterModal = document.getElementById("character-modal");
const characterModalBackdrop = document.getElementById("character-modal-backdrop");
const characterForm = document.getElementById("character-form");
const characterModalTitle = document.getElementById("character-modal-title");

const charFirstNameInput = document.getElementById("char-first-name");
const charLastNameInput = document.getElementById("char-last-name");
const charTraitsInput = document.getElementById("char-traits");
const charZodiacInput = document.getElementById("char-zodiac");
const charAgeInput = document.getElementById("char-age");
const charImageInput = document.getElementById("char-image");
const charImagePreviewWrapper = document.getElementById("char-image-preview-wrapper");
const charImagePreview = document.getElementById("char-image-preview");

const discardCharacterBtn = document.getElementById("discard-character-btn");

// Karakter detay ekranı
const backToListBtn = document.getElementById("back-to-list-btn");
const editCharacterBtn = document.getElementById("edit-character-btn");
const logoutBtn2 = document.getElementById("logout-btn-2");
const characterDetailName = document.getElementById("character-detail-name");
const characterDetailFullName = document.getElementById("character-detail-full-name");
const characterDetailMeta = document.getElementById("character-detail-meta");
const characterDetailTraits = document.getElementById("character-detail-traits");
const characterDetailMainImage = document.getElementById("character-detail-main-image");
// characterImagesGrid artık initializeEventListeners içinde alınıyor (satır 67'de let olarak tanımlı)
const addImageBtn = document.getElementById("add-image-btn");

// Resim modal
const imageModal = document.getElementById("image-modal");
const imageModalBackdrop = document.getElementById("image-modal-backdrop");
const imageForm = document.getElementById("image-form");
const imageModalTitle = document.getElementById("image-modal-title");
const imageTitleInput = document.getElementById("image-title");
const imageDescriptionInput = document.getElementById("image-description");
const imagePositivePromptInput = document.getElementById("image-positive-prompt");
const imageNegativePromptInput = document.getElementById("image-negative-prompt");
const imageTagsInput = document.getElementById("image-tags");
const imageFileInput = document.getElementById("image-file");
const imagePreviewWrapper = document.getElementById("image-preview-wrapper");
const imagePreview = document.getElementById("image-preview");
const discardImageBtn = document.getElementById("discard-image-btn");

// Resim görüntüleme modal
const imageViewModal = document.getElementById("image-view-modal");
const imageViewModalBackdrop = document.getElementById("image-view-modal-backdrop");
const closeImageViewBtn = document.getElementById("close-image-view-btn");
const imageViewLarge = document.getElementById("image-view-large");
const imageViewTitle = document.getElementById("image-view-title");
const imageViewDescription = document.getElementById("image-view-description");
const imageViewTags = document.getElementById("image-view-tags");
const imageViewPrompts = document.getElementById("image-view-prompts");
const deleteImageFromViewBtn = document.getElementById("delete-image-from-view-btn");
const reorderImagesInViewBtn = document.getElementById("reorder-images-in-view-btn");
let isReorderMode = false; // Slide view'da sıralama modu

let editingImageId = null;
let editingCharacterId = null;

// Kullanıcı yönetimi
const usersManagementScreen = document.getElementById("users-management-screen");
const backToMainBtn = document.getElementById("back-to-main-btn");
const logoutBtn3 = document.getElementById("logout-btn-3");
const addUserBtn = document.getElementById("add-user-btn");
const usersList = document.getElementById("users-list");
const userModal = document.getElementById("user-modal");
const userModalBackdrop = document.getElementById("user-modal-backdrop");
const userForm = document.getElementById("user-form");
const userModalTitle = document.getElementById("user-modal-title");
const userUsernameInput = document.getElementById("user-username");
const userPasswordInput = document.getElementById("user-password");
const userRoleInput = document.getElementById("user-role");
const userProjectsInput = document.getElementById("user-projects");
const discardUserBtn = document.getElementById("discard-user-btn");
let editingUserId = null;

// --- Yardımcılar ---

// Base path'i bir kez tespit et ve cache'le
let cachedBasePath = null;

function getBasePath() {
    if (cachedBasePath !== null) {
        return cachedBasePath;
    }
    
    // GitHub Pages için base path'i tespit et
    const href = window.location.href;
    const pathname = window.location.pathname;
    
    // Bilinen route'lar (bunlar base path değil)
    const knownRoutes = ['login', 'projects', 'data', 'index.html', '404.html'];
    
    // Yöntem 1: href'den repo adını çıkar (github.io/repo-name/...)
    const repoMatch = href.match(/github\.io\/([^\/]+)/);
    if (repoMatch && repoMatch[1] && !knownRoutes.includes(repoMatch[1])) {
        cachedBasePath = '/' + repoMatch[1];
        return cachedBasePath;
    }
    
    // Yöntem 2: pathname'den ilk segment'i al (eğer route değilse)
    const parts = pathname.split('/').filter(p => p && p !== 'index.html' && p !== '404.html');
    if (parts.length > 0 && !knownRoutes.includes(parts[0])) {
        // İlk segment'i kontrol et - eğer route değilse repo adı olabilir
        // Ama önce href'den kontrol et
        if (href.includes('/' + parts[0] + '/') && parts[0].length > 3) {
            cachedBasePath = '/' + parts[0];
            return cachedBasePath;
        }
    }
    
    // Yöntem 3: Sabit repo adı (fallback)
    // Eğer yukarıdaki yöntemler çalışmazsa, repo adını buraya yazın
    const repoName = 'VisualNovel-Character-Gallery';
    if (href.includes('github.io') && href.includes(repoName)) {
        cachedBasePath = '/' + repoName;
        return cachedBasePath;
    }
    
    // Base path yok (root'ta çalışıyor)
    cachedBasePath = '';
    return cachedBasePath;
}

async function loadJSON(path) {
    const basePath = getBasePath();
    
    // Path'i normalize et (başında "/" varsa kaldır)
    const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
    
    // Denenecek path'leri oluştur (öncelik sırasına göre)
    const pathsToTry = [];
    
    // 1. Base path ile (eğer varsa)
    if (basePath) {
        pathsToTry.push(basePath + '/' + normalizedPath);
    }
    
    // 2. Base path olmadan
    pathsToTry.push(normalizedPath);
    
    // 3. Sabit repo adı ile (fallback)
    if (basePath !== '/VisualNovel-Character-Gallery') {
        pathsToTry.push('/VisualNovel-Character-Gallery/' + normalizedPath);
    }
    
    // Her path'i sırayla dene
    let lastError = null;
    for (const tryPath of pathsToTry) {
        try {
            const response = await fetch(tryPath);
            if (response.ok) {
                return await response.json();
            } else {
                lastError = new Error("HTTP " + response.status);
                console.log(`Path başarısız (${response.status}): ${tryPath}, bir sonrakini deniyor...`);
            }
        } catch (err) {
            lastError = err;
            console.log(`Path hatası: ${tryPath}, bir sonrakini deniyor...`);
        }
    }
    
    // Tüm path'ler denendi, hata fırlat
    const error = new Error("HTTP 404 - Tüm path'ler denendi: " + pathsToTry.join(', '));
    console.error("loadJSON hatası:", error, "Denenen path'ler:", pathsToTry);
    throw error;
}

// Karakterleri backend'den yükle
async function loadCharacters(projectId) {
    if (!projectId) return [];
    try {
        const response = await fetch(getCharactersUrl(projectId));
        if (!response.ok) throw new Error("Karakterler yüklenemedi");
        return await response.json();
    } catch (err) {
        console.error("Karakterler yüklenirken hata:", err);
        return [];
    }
}

// Karakterleri backend'e kaydet
async function saveCharacters(projectId, characters) {
    if (!projectId) return;
    try {
        // Tüm karakterleri backend'e gönder (her karakter için ayrı POST yerine, tüm listeyi güncelle)
        // Önce mevcut karakterleri al, sonra yeni eklenenleri POST et
        // Basit yaklaşım: Her karakter için ayrı POST (yeni karakterler için)
        // Güncelleme için PUT kullanılacak
    } catch (err) {
        console.error("Karakterler kaydedilirken hata:", err);
    }
}

function generateId() {
    return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}

// --- Giriş / Çıkış ---

async function handleLoginSubmit(event) {
    event.preventDefault();
    
    // DOM referanslarını kontrol et ve al
    if (!loginErrorEl) loginErrorEl = document.getElementById("login-error");
    if (!usernameInput) usernameInput = document.getElementById("username");
    if (!passwordInput) passwordInput = document.getElementById("password");
    
    if (loginErrorEl) loginErrorEl.textContent = "";

    const username = usernameInput ? usernameInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value : "";

    if (!username || !password) {
        if (loginErrorEl) loginErrorEl.textContent = "Kullanıcı adı ve şifre gerekli.";
        return;
    }

    if (!users || users.length === 0) {
        if (loginErrorEl) loginErrorEl.textContent = "Kullanıcı verileri yüklenemedi. Sayfayı yenileyin.";
        console.error("users array boş!");
        return;
    }

    const user = users.find((u) => u.username === username && u.password === password);

    if (!user) {
        if (loginErrorEl) loginErrorEl.textContent = "Kullanıcı adı veya şifre hatalı.";
        return;
    }

    currentUser = user;
    
    // Chat butonunu güncelle
    updateChatButtonVisibility();

    // Session'ı localStorage'a kaydet
    localStorage.setItem("currentUser", JSON.stringify({
        username: user.username,
        role: user.role,
        projects: user.projects
    }));

    // DOM referanslarını al
    if (!loginScreen) loginScreen = document.getElementById("login-screen");
    if (!mainScreen) mainScreen = document.getElementById("main-screen");
    if (!currentUserInfoEl) currentUserInfoEl = document.getElementById("current-user-info");
    if (!usersManagementBtn) usersManagementBtn = document.getElementById("users-management-btn");
    if (!currentProjectTitleEl) currentProjectTitleEl = document.getElementById("current-project-title");
    if (!charactersContainer) charactersContainer = document.getElementById("characters-container");
    if (!addCharacterBtn) addCharacterBtn = document.getElementById("add-character-btn");

    // Ekran geçişi
    if (loginScreen) loginScreen.classList.add("hidden");
    if (mainScreen) mainScreen.classList.remove("hidden");

    // Kullanıcı bilgisi
    if (currentUserInfoEl) {
    currentUserInfoEl.textContent = `${currentUser.username} (${currentUser.role})`;
    } else {
        console.warn("current-user-info element bulunamadı!");
    }

    // Admin ise kullanıcı yönetimi butonunu göster
    if (currentUser.role === "admin" && usersManagementBtn) {
        usersManagementBtn.style.display = "block";
    } else if (usersManagementBtn) {
        usersManagementBtn.style.display = "none";
    }

    // Projeleri backend'den yükle
    await loadProjectsFromBackend();
    currentProjectId = null;
    
    // Eski referanslar (geriye dönük uyumluluk)
    if (currentProjectTitleEl) currentProjectTitleEl.textContent = "Proje Seçilmedi";
    if (charactersContainer) charactersContainer.innerHTML = "";
    if (addCharacterBtn) addCharacterBtn.disabled = true;
    
    // Yeni layout için
    showEmptyState();
    
    // URL'yi güncelle
    updateURL("/projects");
}

function handleLogout() {
    currentUser = null;
    currentProjectId = null;
    currentCharacterId = null;

    // Session'ı temizle
    localStorage.removeItem("currentUser");
    
    // URL'yi güncelle
    updateURL("/login", true);

    // DOM referanslarını al
    if (!loginForm) loginForm = document.getElementById("login-form");
    if (!loginErrorEl) loginErrorEl = document.getElementById("login-error");
    if (!mainScreen) mainScreen = document.getElementById("main-screen");
    if (!loginScreen) loginScreen = document.getElementById("login-screen");
    if (!characterDetailScreen) characterDetailScreen = document.getElementById("character-detail-screen");
    if (!usersManagementScreen) usersManagementScreen = document.getElementById("users-management-screen");

    // Formu temizle
    if (loginForm) loginForm.reset();
    if (loginErrorEl) loginErrorEl.textContent = "";

    // Ekran geçişi
    if (mainScreen) mainScreen.classList.add("hidden");
    if (characterDetailScreen) characterDetailScreen.classList.add("hidden");
    if (usersManagementScreen) usersManagementScreen.classList.add("hidden");
    if (loginScreen) loginScreen.classList.remove("hidden");
}

// --- Projeler ---

async function loadProjectsFromBackend() {
    // Loading göster
    if (projectListEl) {
        projectListEl.innerHTML = '<li class="loading-overlay" style="list-style: none;"><div class="loading-content"><div class="loading-spinner"></div><span>Projeler yükleniyor...</span></div></li>';
    }
    
    try {
        // Önce backend'in çalışıp çalışmadığını kontrol et
        try {
            const healthController = new AbortController();
            const healthTimeout = setTimeout(() => healthController.abort(), 5000);
            const healthCheck = await fetch(`${BACKEND_BASE_URL}/health`, {
                signal: healthController.signal
            });
            clearTimeout(healthTimeout);
            if (!healthCheck.ok) {
                throw new Error("Backend sağlık kontrolü başarısız");
            }
            console.log("Backend çalışıyor");
        } catch (healthErr) {
            console.warn("Backend health check başarısız, yine de devam ediliyor:", healthErr);
        }
        
        // Timeout ile fetch (15 saniye - Render free tier uyku modu için)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        console.log("Projeler yükleniyor:", BACKEND_PROJECTS_URL);
        const response = await fetch(BACKEND_PROJECTS_URL, {
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error("Projeler yüklenemedi - Response:", response.status, errorText);
            throw new Error(`Projeler yüklenemedi: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Eğer data bir array değilse, hata ver
        if (!Array.isArray(data)) {
            console.error("Beklenmeyen veri formatı:", data);
            throw new Error("Backend'den geçersiz veri formatı alındı");
        }
        
        projects = data;
        console.log("Projeler yüklendi:", projects.length, "proje");
        
        if (projectListEl) {
            await renderProjects();
        }
    } catch (err) {
        console.error("Projeler yüklenirken hata:", err);
        
        let errorMessage = "Projeler yüklenemedi";
        
        if (err.name === 'AbortError' || err.name === 'TimeoutError') {
            errorMessage = "Backend yanıt vermedi. Render free tier'da uyku modunda olabilir. Lütfen birkaç saniye bekleyip tekrar deneyin.";
            console.error("Timeout: Backend yanıt vermedi");
        } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
            errorMessage = "Ağ hatası. Backend'e bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.";
        } else {
            errorMessage = err.message || "Bilinmeyen bir hata oluştu";
        }
        
        if (projectListEl) {
            projectListEl.innerHTML = `
                <li style="color: var(--danger); padding: 12px; list-style: none;">
                    <div style="margin-bottom: 8px;">${errorMessage}</div>
                    <button onclick="location.reload()" style="padding: 6px 12px; background: var(--accent); color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Sayfayı Yenile
                    </button>
                </li>
            `;
        }
        
        if (typeof showToast === 'function') {
            showToast(errorMessage, "error");
        } else {
            alert(errorMessage);
        }
        
        // Fallback: Boş proje listesi
        projects = [];
    }
}

async function renderProjects() {
    if (!projectListEl) {
        console.error("projectListEl bulunamadı");
        return;
    }
    
    projectListEl.innerHTML = "";

    if (!currentUser) {
        console.error("currentUser bulunamadı");
        return;
    }
    
    console.log("renderProjects: Toplam proje sayısı:", projects.length, "Kullanıcı:", currentUser.username, "Rol:", currentUser.role);

    // Admin ise "Proje Ekle" butonunu göster
    if (currentUser.role === "admin") {
        addProjectBtn.style.display = "block";
    } else {
        addProjectBtn.style.display = "none";
    }

    // Admin ise tüm projeleri göster, değilse sadece atanmış projeleri göster
    let userProjects;
    if (currentUser.role === "admin") {
        // Admin tüm projeleri görebilir
        userProjects = projects;
    } else {
    const userProjectIds = currentUser.projects || [];
        userProjects = projects.filter((p) => userProjectIds.includes(p.id));
    }

    if (userProjects.length === 0) {
        const emptyMsg = document.createElement("div");
        emptyMsg.textContent = currentUser.role === "admin" 
            ? "Henüz proje yok. Yeni proje ekleyin." 
            : "Bu kullanıcıya atanmış proje yok.";
        emptyMsg.style.fontSize = "13px";
        emptyMsg.style.color = "var(--text-muted)";
        emptyMsg.style.padding = "12px";
        projectListEl.appendChild(emptyMsg);
        return;
    }

    // Karakter sayılarını yükle (paralel olarak, hata durumunda da devam et)
    const projectCharacterCounts = {};
    const characterCountPromises = userProjects.map(async (project) => {
        try {
            const response = await fetch(getCharactersUrl(project.id));
            if (response.ok) {
                const characters = await response.json();
                projectCharacterCounts[project.id] = Array.isArray(characters) ? characters.length : 0;
            } else {
                // 404 veya diğer hatalar için 0 olarak işaretle
                projectCharacterCounts[project.id] = 0;
            }
        } catch (err) {
            // Hata durumunda da devam et, sadece 0 olarak işaretle
            projectCharacterCounts[project.id] = 0;
        }
    });
    
    // Tüm karakter sayıları yüklenene kadar bekle (hata olsa bile devam et)
    try {
        await Promise.allSettled(characterCountPromises);
    } catch (err) {
        console.warn("Karakter sayıları yüklenirken bazı hatalar oluştu:", err);
    }

    userProjects.forEach((project) => {
        const accordionItem = document.createElement("div");
        accordionItem.className = "project-accordion-item";
        if (project.id === currentProjectId) {
            accordionItem.classList.add("active", "expanded");
        }

        const header = document.createElement("div");
        header.className = "project-accordion-header";

        const titleDiv = document.createElement("div");
        titleDiv.className = "project-accordion-title";

        const nameSpan = document.createElement("span");
        nameSpan.textContent = project.name;
        nameSpan.style.fontWeight = "500";

        const badge = document.createElement("span");
        badge.className = "project-badge-count";
        badge.textContent = `${projectCharacterCounts[project.id] || 0} karakter`;

        titleDiv.appendChild(nameSpan);
        titleDiv.appendChild(badge);

        // Admin için menü butonu
        if (currentUser.role === "admin") {
            const menuBtn = document.createElement("button");
            menuBtn.className = "project-menu-btn";
            menuBtn.textContent = "⋯";
            menuBtn.title = "Proje menüsü";
            menuBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                openProjectMenu(project, menuBtn);
            });
            header.appendChild(menuBtn);
        }

        header.appendChild(titleDiv);

        // Accordion içeriği
        const content = document.createElement("div");
        content.className = "project-accordion-content";

        header.addEventListener("click", () => {
            const isExpanded = accordionItem.classList.contains("expanded");
            
            // Tüm accordion'ları kapat
            document.querySelectorAll(".project-accordion-item").forEach(item => {
                item.classList.remove("expanded", "active");
            });

            if (!isExpanded) {
                accordionItem.classList.add("expanded", "active");
            currentProjectId = project.id;
                sidebarProjectTitle.textContent = project.name;
                charactersSidebarSection.classList.remove("hidden");
                
                // Senaryo butonunu göster (admin için)
                if (scenarioBtn && currentUser && currentUser.role === "admin") {
                    scenarioBtn.style.display = "block";
                } else if (scenarioBtn) {
                    scenarioBtn.style.display = "none";
                }
                
                // İlişki butonunu göster (admin için)
                if (relationshipBtn && currentUser && currentUser.role === "admin") {
                    relationshipBtn.style.display = "block";
                } else if (relationshipBtn) {
                    relationshipBtn.style.display = "none";
                }
                
                // "Karakter Ekle" butonunu göster (admin ise)
                if (addCharacterSidebarBtn && currentUser) {
                    addCharacterSidebarBtn.style.display = currentUser.role === "admin" ? "block" : "none";
                }
                
                renderCharactersSidebar();
            } else {
                currentProjectId = null;
                charactersSidebarSection.classList.add("hidden");
                showEmptyState();
            }
        });

        accordionItem.appendChild(header);
        accordionItem.appendChild(content);
        projectListEl.appendChild(accordionItem);
    });
}

// Proje menüsü (admin için)
function openProjectMenu(project, button) {
    const menu = document.createElement("div");
    menu.style.position = "absolute";
    menu.style.background = "var(--bg-elevated)";
    menu.style.border = "1px solid var(--border-soft)";
    menu.style.borderRadius = "var(--radius-md)";
    menu.style.padding = "8px";
    menu.style.zIndex = "1000";
    menu.style.minWidth = "150px";
    menu.style.boxShadow = "var(--shadow-soft)";

    const editBtn = document.createElement("button");
    editBtn.textContent = "Proje Ayarları";
    editBtn.style.width = "100%";
    editBtn.style.textAlign = "left";
    editBtn.style.padding = "6px 10px";
    editBtn.style.background = "transparent";
    editBtn.style.border = "none";
    editBtn.style.color = "var(--text)";
    editBtn.style.cursor = "pointer";
    editBtn.style.borderRadius = "4px";
    editBtn.addEventListener("click", () => {
        openProjectModal(project);
        menu.remove();
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Sil";
    deleteBtn.style.width = "100%";
    deleteBtn.style.textAlign = "left";
    deleteBtn.style.padding = "6px 10px";
    deleteBtn.style.background = "transparent";
    deleteBtn.style.border = "none";
    deleteBtn.style.color = "var(--danger)";
    deleteBtn.style.cursor = "pointer";
    deleteBtn.style.borderRadius = "4px";
    deleteBtn.addEventListener("click", async () => {
        if (confirm(`"${project.name}" projesini silmek istediğinize emin misiniz?`)) {
            await deleteProject(project.id);
        }
        menu.remove();
    });

    menu.appendChild(editBtn);
    menu.appendChild(deleteBtn);

    const rect = button.getBoundingClientRect();
    menu.style.top = `${rect.bottom + 4}px`;
    menu.style.left = `${rect.left}px`;

    document.body.appendChild(menu);

    setTimeout(() => {
        document.addEventListener("click", function closeMenu(e) {
            if (!menu.contains(e.target) && e.target !== button) {
                menu.remove();
                document.removeEventListener("click", closeMenu);
            }
        });
    }, 0);
}

async function onProjectSelected(project) {
    currentProjectId = project.id;
    
    // URL'yi güncelle
    updateURL(`/projects/${project.id}`);
    
    currentProjectTitleEl.textContent = project.name;
    
    // Proje açıklamasını göster (varsa)
    let projectDesc = document.getElementById("current-project-description");
    if (!projectDesc) {
        projectDesc = document.createElement("p");
        projectDesc.id = "current-project-description";
        projectDesc.style.margin = "4px 0 0";
        projectDesc.style.fontSize = "13px";
        projectDesc.style.color = "var(--text-muted)";
        currentProjectTitleEl.parentElement.appendChild(projectDesc);
    }
    projectDesc.textContent = project.description || "";
    projectDesc.style.display = project.description ? "block" : "none";

    // Admin ise "Karakter Ekle" aktif, değilse pasif (sadece görüntüleme)
    addCharacterBtn.disabled = currentUser.role !== "admin";

    await renderCharacters();
}

// --- Proje Yönetimi (Admin) ---

function openProjectModal(project = null) {
    editingProjectId = project ? project.id : null;
    projectModalTitle.textContent = project ? "Proje Düzenle" : "Yeni Proje";
    projectNameInput.value = project ? project.name : "";
    projectDescriptionInput.value = project ? (project.description || "") : "";
    projectModal.classList.remove("hidden");
}

function closeProjectModal() {
    projectModal.classList.add("hidden");
    editingProjectId = null;
    projectForm.reset();
}

async function handleProjectFormSubmit(event) {
    event.preventDefault();

    const name = projectNameInput.value.trim();
    const description = projectDescriptionInput.value.trim();
    
    if (!name) {
        alert("Proje adı gerekli.");
        return;
    }

    const submitBtn = projectForm.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add("loading");
        submitBtn.textContent = "Kaydediliyor...";
    }

    try {
        if (editingProjectId) {
            // Güncelle
            const response = await fetch(`${BACKEND_PROJECTS_URL}/${editingProjectId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, description })
            });

            if (!response.ok) throw new Error("Proje güncellenemedi");
        } else {
            // Yeni proje oluştur
            const response = await fetch(BACKEND_PROJECTS_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, description })
            });

            if (!response.ok) throw new Error("Proje oluşturulamadı");
        }

        closeProjectModal();
        
        // Projeleri yeniden yükle ve render et
        await loadProjectsFromBackend();
        
        showToast("Proje kaydedildi", "success");
    } catch (err) {
        console.error("Proje kaydedilirken hata:", err);
        showToast("Proje kaydedilemedi: " + err.message, "error");
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.classList.remove("loading");
            submitBtn.textContent = "Save";
        }
    }
}

async function deleteProject(projectId) {
    if (!confirm("Bu projeyi silmek istediğinize emin misiniz? Projeye ait tüm karakterler de silinecektir.")) {
        return;
    }

    // Loading toast göster
    const loadingToast = showToast("Proje siliniyor...", "info", 0); // 0 = süresiz

    try {
        const response = await fetch(`${BACKEND_PROJECTS_URL}/${projectId}`, {
            method: "DELETE"
        });

        if (!response.ok) throw new Error("Proje silinemedi");

        // Eğer silinen proje seçiliyse, seçimi temizle
        if (currentProjectId === projectId) {
            currentProjectId = null;
            currentProjectTitleEl.textContent = "Proje Seçilmedi";
            charactersContainer.innerHTML = "";
            addCharacterBtn.disabled = true;
        }

        await loadProjectsFromBackend();
        showToast("Proje silindi", "success");
    } catch (err) {
        console.error("Proje silinirken hata:", err);
        showToast("Proje silinemedi: " + err.message, "error");
    }
}

// --- Karakterler ---

// Sol sütunda karakter listesi
let isRenderingCharacters = false;
async function renderCharactersSidebar() {
    // Eğer zaten render işlemi devam ediyorsa, bekle
    if (isRenderingCharacters) {
        return;
    }
    
    isRenderingCharacters = true;
    
    try {
        // DOM referanslarını kontrol et
        if (!charactersSidebarList) charactersSidebarList = document.getElementById("characters-sidebar-list");
        if (!charactersSidebarList) {
            console.error("characters-sidebar-list element bulunamadı!");
            return;
        }
        
        // Önce tüm içeriği temizle
        charactersSidebarList.innerHTML = "";

    if (!currentProjectId) {
        return;
    }

    // Loading göster
    const loadingEl = document.createElement("li");
    loadingEl.innerHTML = '<div style="padding: 12px; text-align: center; color: var(--text-muted);">Yükleniyor...</div>';
    charactersSidebarList.appendChild(loadingEl);

    const characters = await loadCharacters(currentProjectId);
    
    // Loading'i kaldır
    loadingEl.remove();

    if (!characters.length) {
        const emptyMsg = document.createElement("li");
        emptyMsg.innerHTML = '<div style="padding: 12px; text-align: center; color: var(--text-muted); font-size: 13px;">Bu projede henüz karakter yok.</div>';
        charactersSidebarList.appendChild(emptyMsg);
        return;
    }

    // Arama filtresi uygula
    const searchTerm = characterSearchInput ? characterSearchInput.value.toLowerCase() : "";
    const filteredCharacters = characters.filter(char => {
        if (!searchTerm) return true;
        const fullName = `${char.firstName} ${char.lastName}`.toLowerCase();
        const traits = (char.traits || "").toLowerCase();
        return fullName.includes(searchTerm) || traits.includes(searchTerm);
    });

    filteredCharacters.forEach((char) => {
        const item = document.createElement("li");
        item.className = "character-sidebar-item";
        if (char.id === currentCharacterId) {
            item.classList.add("active");
        }

        // Avatar
        const avatar = document.createElement("img");
        avatar.className = "character-sidebar-avatar";
        avatar.alt = `${char.firstName} ${char.lastName}`;
        const imageUrl = char.mainImageUrl || char.imageUrl;
        if (imageUrl) {
            avatar.src = imageUrl;
        } else {
            avatar.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Crect fill='%2320202a' width='32' height='32'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23a0a0b3' font-size='12'%3E👤%3C/text%3E%3C/svg%3E";
        }

        // Bilgi
        const info = document.createElement("div");
        info.className = "character-sidebar-info";

        const name = document.createElement("div");
        name.className = "character-sidebar-name";
        name.textContent = `${char.firstName} ${char.lastName}`;

        const meta = document.createElement("div");
        meta.className = "character-sidebar-meta";
        if (char.zodiac) {
            const zodiacSpan = document.createElement("span");
            zodiacSpan.textContent = `♈ ${char.zodiac}`;
            meta.appendChild(zodiacSpan);
        }
        if (char.age) {
            const ageSpan = document.createElement("span");
            ageSpan.textContent = `${char.age} yaş`;
            meta.appendChild(ageSpan);
        }

        info.appendChild(name);
        info.appendChild(meta);

        // Aksiyon butonları (hover'da görünür)
        const actions = document.createElement("div");
        actions.className = "character-item-actions";
        
        if (currentUser.role === "admin") {
            const editBtn = document.createElement("button");
            editBtn.className = "character-item-action-btn";
            editBtn.textContent = "✎";
            editBtn.title = "Düzenle";
            editBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                openCharacterEditMode(char);
            });

            const deleteBtn = document.createElement("button");
            deleteBtn.className = "character-item-action-btn";
            deleteBtn.textContent = "×";
            deleteBtn.title = "Sil";
            deleteBtn.style.color = "var(--danger)";
            deleteBtn.addEventListener("click", async (e) => {
                e.stopPropagation();
                if (confirm(`"${char.firstName} ${char.lastName}" karakterini silmek istediğinize emin misiniz?`)) {
                    if (!currentProjectId) {
                        alert("Proje seçilmedi. Karakter silinemez.");
                        return;
                    }
                    await deleteCharacter(currentProjectId, char.id);
                }
            });

            actions.appendChild(editBtn);
            actions.appendChild(deleteBtn);
        }

        item.appendChild(avatar);
        item.appendChild(info);
        item.appendChild(actions);

        item.addEventListener("click", () => {
            currentCharacterId = char.id;
            showCharacterDetail(char);
            // Aktif item'ı güncelle
            document.querySelectorAll(".character-sidebar-item").forEach(li => {
                li.classList.remove("active");
            });
            item.classList.add("active");
        });

        charactersSidebarList.appendChild(item);
    });
    } finally {
        isRenderingCharacters = false;
    }
}

// Sağ panelde karakter detayı göster
async function showCharacterDetail(character) {
    console.log("showCharacterDetail çağrıldı:", character);
    
    currentCharacterId = character.id;
    currentCharacter = character;
    
    // URL'yi güncelle
    if (currentProjectId) {
        updateURL(`/projects/${currentProjectId}/characters/${character.id}`);
    }
    
    // DOM referanslarını kontrol et ve al
    if (!characterDetailContent) characterDetailContent = document.getElementById("character-detail-content");
    if (!emptyState) emptyState = document.getElementById("empty-state");
    if (!detailMainImage) detailMainImage = document.getElementById("detail-main-image");
    if (!detailFullName) detailFullName = document.getElementById("detail-full-name");
    if (!detailMeta) detailMeta = document.getElementById("detail-meta");
    if (!detailProjectBadge) detailProjectBadge = document.getElementById("detail-project-badge");
    if (!traitsDisplay) traitsDisplay = document.getElementById("traits-display");
    if (!editTraitsBtn) editTraitsBtn = document.getElementById("edit-traits-btn");
    if (!addImageBtnPanel) addImageBtnPanel = document.getElementById("add-image-btn-panel");
    
    if (!characterDetailContent || !emptyState) {
        console.error("❌ character-detail-content veya empty-state element bulunamadı!");
        console.log("characterDetailContent:", characterDetailContent);
        console.log("emptyState:", emptyState);
        return;
    }

    console.log("✅ DOM referansları bulundu, içerik gösteriliyor...");
    emptyState.classList.add("hidden");
    characterDetailContent.classList.remove("hidden");

    // Hero alanı
    const imageUrl = character.mainImageUrl || character.imageUrl;
    if (detailMainImage) {
        if (imageUrl) {
            detailMainImage.src = imageUrl;
            detailMainImage.style.display = "block";
        } else {
            detailMainImage.style.display = "none";
        }
    }

    if (detailFullName) {
        detailFullName.textContent = `${character.firstName} ${character.lastName}`;
    }

    if (detailMeta) {
        detailMeta.innerHTML = "";
        if (character.age) {
            const ageItem = document.createElement("div");
            ageItem.className = "character-meta-item";
            ageItem.textContent = `${character.age} yaş`;
            detailMeta.appendChild(ageItem);
        }
        if (character.zodiac) {
            const zodiacItem = document.createElement("div");
            zodiacItem.className = "character-meta-item";
            zodiacItem.textContent = `♈ ${character.zodiac}`;
            detailMeta.appendChild(zodiacItem);
        }
    }

    // Proje badge
    const project = projects.find(p => p.id === character.projectId);
    if (detailProjectBadge && project) {
        detailProjectBadge.textContent = project.name;
        detailProjectBadge.style.display = "inline-block";
    } else if (detailProjectBadge) {
        detailProjectBadge.style.display = "none";
    }

    // Traits
    if (traitsDisplay) {
        const traitsText = character.traits || "Karakteristik özellikler belirtilmemiş.";
        traitsDisplay.textContent = traitsText;
    }

    // Admin butonları
    if (editTraitsBtn) {
        editTraitsBtn.style.display = currentUser.role === "admin" ? "block" : "none";
        editTraitsBtn.textContent = "Düzenle";
    }
    if (addImageBtnPanel) {
        addImageBtnPanel.style.display = currentUser.role === "admin" ? "block" : "none";
    }
    
    // Traits düzenleme modunu sıfırla
    isEditingTraits = false;
    if (traitsDisplay && traitsEdit) {
        traitsDisplay.classList.remove("hidden");
        traitsEdit.classList.add("hidden");
    }

    // Resim kataloğunu yükle
    await renderCharacterImagesPanel(character.id);
}

// Inline edit modu
function openCharacterEditMode(character) {
    // Bu fonksiyon karakter detay panelini edit moduna alır
    // Şimdilik modal kullanıyoruz, ileride inline edit eklenebilir
    openCharacterModal(character);
}

// Traits düzenleme handler
let isEditingTraits = false;
async function handleTraitsEdit() {
    if (!currentCharacter || !currentProjectId) return;
    
    if (!isEditingTraits) {
        // Düzenleme moduna geç
        if (traitsDisplay && traitsEdit) {
            traitsDisplay.classList.add("hidden");
            traitsEdit.classList.remove("hidden");
            if (traitsTextarea) {
                traitsTextarea.value = currentCharacter.traits || "";
            }
            if (editTraitsBtn) {
                editTraitsBtn.textContent = "Kaydet";
            }
            isEditingTraits = true;
        }
    } else {
        // Kaydet
        if (traitsTextarea && currentCharacter && currentProjectId) {
            try {
                const updatedCharacter = { ...currentCharacter, traits: traitsTextarea.value };
                const response = await fetch(`${getCharactersUrl(currentProjectId)}/${currentCharacter.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(updatedCharacter)
                });
                if (response.ok) {
                    currentCharacter = updatedCharacter;
                    if (traitsDisplay) {
                        traitsDisplay.textContent = updatedCharacter.traits || "";
                    }
                    if (traitsDisplay && traitsEdit) {
                        traitsDisplay.classList.remove("hidden");
                        traitsEdit.classList.add("hidden");
                    }
                    if (editTraitsBtn) {
                        editTraitsBtn.textContent = "Düzenle";
                    }
                    isEditingTraits = false;
                    showToast("Karakteristik özellikler güncellendi", "success");
                } else {
                    throw new Error("Güncelleme başarısız");
                }
            } catch (err) {
                console.error("Traits güncellenirken hata:", err);
                showToast("Güncelleme başarısız: " + err.message, "error");
            }
        }
    }
}

// Boş durum göster
function showEmptyState() {
    // DOM referanslarını kontrol et
    if (!emptyState) emptyState = document.getElementById("empty-state");
    if (!characterDetailContent) characterDetailContent = document.getElementById("character-detail-content");
    
    if (!emptyState || !characterDetailContent) {
        console.warn("showEmptyState: emptyState veya characterDetailContent bulunamadı!");
        return;
    }
    emptyState.classList.remove("hidden");
    characterDetailContent.classList.add("hidden");
    currentCharacterId = null;
}

async function renderCharacters() {
    // Eski layout için (charactersContainer varsa)
    if (charactersContainer) {
    charactersContainer.innerHTML = "";

    if (!currentProjectId) {
        const info = document.createElement("p");
        info.textContent = "Soldan bir proje seçin.";
        info.style.color = "#a0a0b3";
        info.style.fontSize = "14px";
        charactersContainer.appendChild(info);
            return;
        }
    } else {
        // Yeni layout kullanılıyor, renderCharactersSidebar çağrılmalı
        if (currentProjectId) {
            await renderCharactersSidebar();
        }
        return;
    }

    // Loading göster
    const loadingEl = document.createElement("div");
    loadingEl.className = "loading-overlay";
    loadingEl.innerHTML = '<div class="loading-content"><div class="loading-spinner"></div><span>Karakterler yükleniyor...</span></div>';
    charactersContainer.appendChild(loadingEl);

    const characters = await loadCharacters(currentProjectId);
    
    // Loading'i kaldır
    loadingEl.remove();

    if (!characters.length) {
        const info = document.createElement("p");
        info.textContent = "Bu projede henüz karakter yok.";
        info.style.color = "#a0a0b3";
        info.style.fontSize = "14px";
        charactersContainer.appendChild(info);
        return;
    }

    characters.forEach((ch) => {
        const card = document.createElement("div");
        card.className = "character-card";

        // Görsel - önce mainImageUrl'e bak, yoksa imageUrl'e bak
        const imageWrapper = document.createElement("div");
        imageWrapper.className = "character-image-wrapper";

        // mainImageId varsa mainImageUrl kullan, yoksa imageUrl kullan
        const imageUrl = ch.mainImageUrl || ch.imageUrl;

        if (imageUrl) {
            const img = document.createElement("img");
            img.alt = `${ch.firstName} ${ch.lastName}`;
            img.loading = "lazy"; // Lazy loading
            img.style.backgroundColor = "var(--bg-soft)";
            
            // Lazy loading için Intersection Observer kullan
            if ("IntersectionObserver" in window) {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const imgEl = entry.target;
                            imgEl.src = imgEl.dataset.src || imageUrl;
                            imgEl.classList.add("loaded");
                            observer.unobserve(imgEl);
                        }
                    });
                }, { rootMargin: "50px" });
                
                img.dataset.src = imageUrl;
                observer.observe(img);
            } else {
                // Fallback: Eski tarayıcılar için direkt yükle
                img.src = imageUrl;
            }
            
            imageWrapper.appendChild(img);
        } else {
            const placeholder = document.createElement("div");
            placeholder.className = "character-placeholder";
            placeholder.textContent = "Görsel yok";
            imageWrapper.appendChild(placeholder);
        }

        // Metin
        const nameEl = document.createElement("div");
        nameEl.className = "character-name";
        nameEl.textContent = `${ch.firstName} ${ch.lastName}`;

        const metaEl = document.createElement("div");
        metaEl.className = "character-meta";

        const metaParts = [];
        if (ch.age) metaParts.push(`${ch.age} yaş`);
        if (ch.zodiac) metaParts.push(`Burç: ${ch.zodiac}`);
        metaEl.textContent = metaParts.join(" • ");

        const traitsEl = document.createElement("div");
        traitsEl.className = "character-traits";
        traitsEl.textContent = ch.traits || "";

        card.appendChild(imageWrapper);
        card.appendChild(nameEl);
        card.appendChild(metaEl);
        card.appendChild(traitsEl);

        // Aksiyonlar
            const actions = document.createElement("div");
            actions.className = "character-actions";

        // Detay butonu (herkes için)
        const detailBtn = document.createElement("button");
        detailBtn.className = "btn subtle";
        detailBtn.textContent = "Detay";
        detailBtn.addEventListener("click", () => {
            openCharacterDetail(ch);
        });
        actions.appendChild(detailBtn);

        // Admin aksiyonları
        if (currentUser.role === "admin") {
            const editBtn = document.createElement("button");
            editBtn.className = "btn subtle";
            editBtn.textContent = "Düzenle";
            editBtn.addEventListener("click", () => {
                openCharacterModal(ch);
            });
            actions.appendChild(editBtn);

            const deleteBtn = document.createElement("button");
            deleteBtn.className = "btn subtle";
            deleteBtn.textContent = "Sil";
            deleteBtn.addEventListener("click", () => {
                if (!confirm("Bu karakteri silmek istediğinize emin misiniz?")) return;
                deleteCharacter(currentProjectId, ch.id);
            });
            actions.appendChild(deleteBtn);
        }

        card.appendChild(actions);

        charactersContainer.appendChild(card);
    });
}

async function deleteCharacter(projectId, characterId) {
    if (!projectId || !characterId) {
        console.error("deleteCharacter: projectId veya characterId eksik", { projectId, characterId });
        alert("Karakter silinemedi: Proje veya karakter ID'si eksik.");
        return;
    }
    
    // Loading toast göster
    const loadingToast = showToast("Karakter siliniyor...", "info", 0); // 0 = süresiz
    
    try {
        const url = `${getCharactersUrl(projectId)}/${characterId}`;
        console.log("Karakter siliniyor:", url);
        
        const response = await fetch(url, {
            method: "DELETE"
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Karakter silme hatası:", response.status, errorText);
            throw new Error(`Karakter silinemedi: ${response.status} ${response.statusText}`);
        }

        showToast("Karakter silindi", "success");
        
        // Yeni layout için karakter listesini yenile
        if (currentProjectId) {
            await renderCharactersSidebar();
        }
        // Eski layout için de yenile (geriye dönük uyumluluk)
        await renderCharacters();
    } catch (err) {
        console.error("Karakter silinirken hata:", err);
        showToast("Karakter silinemedi: " + err.message, "error");
    }
}

// --- Modal (Karakter Ekle) ---

function openCharacterModal(character = null) {
    if (!currentProjectId) return;
    
    // Hangi ekrandan açıldığını kaydet (modal açılmadan önce)
    if (characterDetailScreen && !characterDetailScreen.classList.contains("hidden")) {
        previousScreen = "characterDetail";
        // Karakter detay ekranını gizle (modal açılırken)
        characterDetailScreen.classList.add("hidden");
    } else {
        previousScreen = "main";
        // Main screen'i gizle (modal açılırken)
        mainScreen.classList.add("hidden");
    }
    
    editingCharacterId = character ? character.id : null;
    characterModalTitle.textContent = character ? "Karakter Düzenle" : "Yeni Karakter";
    
    if (character) {
        charFirstNameInput.value = character.firstName || "";
        charLastNameInput.value = character.lastName || "";
        charTraitsInput.value = character.traits || "";
        charZodiacInput.value = character.zodiac || "";
        charAgeInput.value = character.age || "";
        // Ana görsel önizlemesi (eğer varsa)
        if (character.imageUrl || character.mainImageUrl) {
            charImagePreview.src = character.mainImageUrl || character.imageUrl;
            charImagePreviewWrapper.style.display = "block";
        } else {
            clearImagePreview();
        }
    } else {
    characterForm.reset();
    clearImagePreview();
    }
    
    characterModal.classList.remove("hidden");
}

function closeCharacterModal() {
    characterModal.classList.add("hidden");
    editingCharacterId = null;
    characterForm.reset();
    clearImagePreview();
    
    // Önceki ekrana geri dön
    if (previousScreen === "characterDetail") {
        // Karakter detay ekranına geri dön
        mainScreen.classList.add("hidden");
        characterDetailScreen.classList.remove("hidden");
    } else {
        // Main screen'e geri dön
        characterDetailScreen.classList.add("hidden");
        mainScreen.classList.remove("hidden");
    }
    previousScreen = null;
}

function clearImagePreview() {
    charImagePreviewWrapper.style.display = "none";
    charImagePreview.src = "";
}

// Save sırasında, dosya varsa backend'e upload edip dönen URL'yi saklıyoruz
async function handleCharacterFormSubmit(event) {
    event.preventDefault();

    if (!currentProjectId) {
        alert("Önce bir proje seçmelisiniz.");
        return;
    }

    const firstName = charFirstNameInput.value.trim();
    const lastName = charLastNameInput.value.trim();
    const traits = charTraitsInput.value.trim();
    const zodiac = charZodiacInput.value.trim();
    const ageRaw = charAgeInput.value;
    const age = ageRaw ? parseInt(ageRaw, 10) : null;
    const file = charImageInput.files[0] || null;

    if (!firstName || !lastName) {
        alert("İsim ve soyisim zorunludur.");
        return;
    }

    // Aynı isim/soyisim kontrolü (düzenleme hariç)
    if (!editingCharacterId) {
        const existingCharacters = await loadCharacters(currentProjectId);
        const duplicate = existingCharacters.find(
            ch => ch.firstName.toLowerCase() === firstName.toLowerCase() && 
                  ch.lastName.toLowerCase() === lastName.toLowerCase()
        );
        if (duplicate) {
            alert("Bu isim ve soyisimde bir karakter zaten mevcut.");
            return;
        }
    }

    // Karakter objesi (imageUrl daha sonra dolacak)
    const baseCharacter = {
        id: editingCharacterId || generateId(),
        firstName,
        lastName,
        traits,
        zodiac,
        age,
        imageUrl: null
    };

    // Dosya yoksa direkt kaydet
    if (!file) {
        saveNewCharacter(baseCharacter);
        return;
    }

    // Butonu disable ederek iki kere tıklamayı engelle
    const submitBtn = characterForm.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add("loading");
        submitBtn.textContent = "Kaydediliyor...";
    }

    // Dosyayı backend'e POST et
    const formData = new FormData();
    formData.append("file", file);

    fetch(BACKEND_UPLOAD_URL, {
        method: "POST",
        body: formData
    })
        .then((res) => {
            if (!res.ok) {
                throw new Error(`Upload başarısız: ${res.status} ${res.statusText}`);
            }
            return res.json();
        })
        .then((data) => {
            if (!data || !data.url) {
                throw new Error("Backend yanıtında url yok");
            }
            baseCharacter.imageUrl = data.url;
        saveNewCharacter(baseCharacter);
        })
        .catch((err) => {
            console.error("Upload hatası:", err);
            console.error("Backend URL:", BACKEND_UPLOAD_URL);
            alert(`Görsel yüklenirken hata oluştu: ${err.message}\n\nBackend URL: ${BACKEND_UPLOAD_URL}\n\nKarakter görselsiz kaydedilecek.`);
        saveNewCharacter(baseCharacter);
        })
        .finally(() => {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.classList.remove("loading");
                submitBtn.textContent = "Save";
            }
        });
}

async function saveNewCharacter(character) {
    try {
        let response;
        if (editingCharacterId) {
            // Güncelle
            response = await fetch(`${getCharactersUrl(currentProjectId)}/${editingCharacterId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(character)
            });
        } else {
            // Yeni karakter
            response = await fetch(getCharactersUrl(currentProjectId), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(character)
            });
        }

        if (!response.ok) throw new Error("Karakter kaydedilemedi");

        const savedCharacter = await response.json();
    closeCharacterModal();
        await renderCharacters();
        
        // Eğer detay ekranı açıksa, güncelle
        if (currentCharacterId && currentCharacterId === savedCharacter.id) {
            await openCharacterDetail(savedCharacter);
        }
    } catch (err) {
        console.error("Karakter kaydedilirken hata:", err);
        alert("Karakter kaydedilemedi: " + err.message);
    }
}

// Resim seçilince önizleme (lokalde)
function handleImageChange() {
    const file = charImageInput.files[0];
    if (!file) {
        clearImagePreview();
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        charImagePreview.src = e.target.result;
        charImagePreviewWrapper.style.display = "block";
    };
    reader.readAsDataURL(file);
}

// --- Başlatma ---

// URL Routing sistemi
function updateURL(path = null, replace = false) {
    if (isNavigating) return;
    
    // GitHub Pages base path'i tespit et
    const pathname = window.location.pathname;
    let basePath = '';
    if (pathname !== '/' && pathname.length > 1) {
        const parts = pathname.split('/').filter(p => p);
        if (parts.length > 0 && parts[0] !== 'index.html') {
            basePath = '/' + parts[0];
        }
    }
    
    if (!path) {
        // Mevcut state'e göre URL oluştur
        if (!currentUser) {
            path = "/login";
        } else if (currentCharacterId && currentProjectId) {
            path = `/projects/${currentProjectId}/characters/${currentCharacterId}`;
        } else if (currentProjectId) {
            path = `/projects/${currentProjectId}`;
        } else {
            path = "/projects";
        }
    }
    
    // Base path'i ekle
    const fullPath = basePath + path;
    
    if (replace) {
        history.replaceState({ path: fullPath }, "", fullPath);
    } else {
        history.pushState({ path: fullPath }, "", fullPath);
    }
}

function parseRoute() {
    const path = window.location.pathname;
    const parts = path.split("/").filter(p => p && p !== "index.html");
    
    // Base path'i atla (eğer varsa)
    if (parts.length > 0 && parts[0] === "VisualNovel-Character-Gallery") {
        parts.shift();
    }
    
    if (parts.length === 0 || parts[0] === "login") {
        return { route: "login" };
    } else if (parts[0] === "projects") {
        if (parts.length >= 2) {
            const projectId = parts[1];
            if (parts.length >= 4 && parts[2] === "characters") {
                const characterId = parts[3];
                return { route: "character", projectId, characterId };
            }
            return { route: "project", projectId };
        }
        return { route: "projects" };
    }
    return { route: "login" };
}

async function navigateToRoute(routeData) {
    if (isNavigating) return;
    isNavigating = true;
    
    try {
        // DOM referanslarını kontrol et
        if (!loginScreen) loginScreen = document.getElementById("login-screen");
        if (!mainScreen) mainScreen = document.getElementById("main-screen");
        if (!currentUserInfoEl) currentUserInfoEl = document.getElementById("current-user-info");
        if (!usersManagementBtn) usersManagementBtn = document.getElementById("users-management-btn");
        
        if (routeData.route === "login") {
            // Login ekranına dön
            if (loginScreen) loginScreen.classList.remove("hidden");
            if (mainScreen) mainScreen.classList.add("hidden");
            currentUser = null;
            currentProjectId = null;
            currentCharacterId = null;
            localStorage.removeItem("currentUser");
        } else if (routeData.route === "projects") {
            // Proje listesi
            if (!currentUser) {
                // Kullanıcı giriş yapmamış, login'e yönlendir
                updateURL("/login", true);
                navigateToRoute({ route: "login" });
                return;
            }
            if (loginScreen) loginScreen.classList.add("hidden");
            if (mainScreen) mainScreen.classList.remove("hidden");
            if (currentUserInfoEl) {
                currentUserInfoEl.textContent = `${currentUser.username} (${currentUser.role})`;
            }
            if (currentUser.role === "admin" && usersManagementBtn) {
                usersManagementBtn.style.display = "block";
            }
            currentProjectId = null;
            currentCharacterId = null;
            showEmptyState();
            await loadProjectsFromBackend();
        } else if (routeData.route === "project" && routeData.projectId) {
            // Proje detayı
            if (!currentUser) {
                updateURL("/login", true);
                navigateToRoute({ route: "login" });
                return;
            }
            if (loginScreen) loginScreen.classList.add("hidden");
            if (mainScreen) mainScreen.classList.remove("hidden");
            if (currentUserInfoEl) {
                currentUserInfoEl.textContent = `${currentUser.username} (${currentUser.role})`;
            }
            if (currentUser.role === "admin" && usersManagementBtn) {
                usersManagementBtn.style.display = "block";
            }
            currentProjectId = routeData.projectId;
            currentCharacterId = null;
            await loadProjectsFromBackend();
            const project = projects.find(p => p.id === routeData.projectId);
            if (project) {
                await onProjectSelected(project);
            }
            showEmptyState();
        } else if (routeData.route === "character" && routeData.projectId && routeData.characterId) {
            // Karakter detayı
            if (!currentUser) {
                updateURL("/login", true);
                navigateToRoute({ route: "login" });
                return;
            }
            if (loginScreen) loginScreen.classList.add("hidden");
            if (mainScreen) mainScreen.classList.remove("hidden");
            if (currentUserInfoEl) {
                currentUserInfoEl.textContent = `${currentUser.username} (${currentUser.role})`;
            }
            if (currentUser.role === "admin" && usersManagementBtn) {
                usersManagementBtn.style.display = "block";
            }
            currentProjectId = routeData.projectId;
            currentCharacterId = routeData.characterId;
            await loadProjectsFromBackend();
            const project = projects.find(p => p.id === routeData.projectId);
            if (project) {
                await onProjectSelected(project);
                // Karakteri yükle
                try {
                    const response = await fetch(`${BACKEND_BASE_URL}/api/projects/${routeData.projectId}/characters/${routeData.characterId}`);
                    if (response.ok) {
                        const character = await response.json();
                        await showCharacterDetail(character);
                    }
                } catch (err) {
                    console.error("Karakter yüklenirken hata:", err);
                }
            }
        }
    } finally {
        isNavigating = false;
    }
}

function init() {
    // Önce localStorage'dan session kontrolü yap
    // Not: initTheme ve initBlur artık initializeEventListeners içinde çağrılıyor
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
        try {
            const userData = JSON.parse(savedUser);
            // users.json'dan tam kullanıcı bilgisini al
            loadJSON("data/users.json")
                .then(usersData => {
                    users = usersData;
                    const user = users.find(u => u.username === userData.username);
                    if (user) {
                        currentUser = user;
                        initializeEventListeners();
                        
                        // URL'den route'u oku ve restore et
                        const routeData = parseRoute();
                        if (routeData.route === "login") {
                            // URL login ise ama kullanıcı giriş yapmış, projects'e yönlendir
                            updateURL("/projects", true);
                            navigateToRoute({ route: "projects" });
                        } else {
                            // URL'deki route'a git
                            navigateToRoute(routeData);
                        }
                    } else {
                        // Kullanıcı bulunamadı, login'e yönlendir
                        updateURL("/login", true);
                        initializeApp();
                    }
                })
                .catch(() => {
                    updateURL("/login", true);
                    initializeApp();
                });
            return;
        } catch (err) {
            console.error("Session yüklenirken hata:", err);
            updateURL("/login", true);
        }
    } else {
        // Session yok, login ekranına git
        updateURL("/login", true);
    }
    initializeApp();
}

function initializeApp() {
    // users JSON'unu yükle, projects backend'den gelecek
    Promise.all([loadJSON("data/users.json"), fetch(BACKEND_PROJECTS_URL).then(res => res.json())])
        .then(([usersData, projectsData]) => {
            users = usersData;
            projects = projectsData;
            
            initializeEventListeners();
        })
        .catch((err) => {
            console.error("Başlangıç verileri yüklenemedi:", err);
            alert("Veri dosyaları (users.json / projects.json) yüklenemedi. Konsolu kontrol edin.");
        });
}

// Tema yönetimi
function initTheme() {
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    updateThemeButton(savedTheme);
}

function toggleTheme() {
    console.log("toggleTheme çağrıldı");
    const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    console.log(`Tema değişiyor: ${currentTheme} -> ${newTheme}`);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    updateThemeButton(newTheme);
    showToast(`Tema ${newTheme === "dark" ? "Karanlık" : "Aydınlık"} moduna geçirildi`, "info", 2000);
}

function updateThemeButton(theme) {
    if (themeToggleBtn) {
        themeToggleBtn.textContent = theme === "dark" ? "🌙" : "☀️";
    }
}

// Blur yönetimi
function initBlur() {
    const savedBlur = localStorage.getItem("blurImages") === "true";
    document.body.classList.toggle("blur-images", savedBlur);
    updateBlurButton(savedBlur);
}

function toggleBlur() {
    console.log("toggleBlur çağrıldı");
    const isBlurred = document.body.classList.contains("blur-images");
    const newBlurState = !isBlurred;
    console.log(`Blur durumu değişiyor: ${isBlurred} -> ${newBlurState}`);
    document.body.classList.toggle("blur-images", newBlurState);
    localStorage.setItem("blurImages", newBlurState.toString());
    updateBlurButton(newBlurState);
    showToast(`Görseller ${newBlurState ? "bulanıklaştırıldı" : "netleştirildi"}`, "info", 2000);
}

function updateBlurButton(isBlurred) {
    if (blurToggleBtn) {
        blurToggleBtn.textContent = isBlurred ? "👁️‍🗨️" : "👁️";
        blurToggleBtn.title = isBlurred ? "Görselleri Netleştir" : "Görselleri Bulanıklaştır";
    }
}

// Chat fonksiyonları (initializeEventListeners'tan önce tanımlanmalı)
function toggleChatPanel() {
    if (!chatPanel) return;
    
    if (chatPanel.classList.contains("hidden")) {
        openChatPanel();
    } else {
        closeChatPanel();
    }
}

function openChatPanel() {
    if (!chatPanel) return;
    
    chatPanel.classList.remove("hidden");
    loadChatMessages();
    
    // Auto-refresh başlat (her 3 saniyede bir)
    if (chatPollInterval) {
        clearInterval(chatPollInterval);
    }
    chatPollInterval = setInterval(() => {
        loadChatMessages();
    }, 3000);
    
    // Input'a focus
    if (chatMessageInput) {
        setTimeout(() => chatMessageInput.focus(), 100);
    }
    
    // Chat açıldığında bildirimi kaldır
    setTimeout(() => {
        if (chatMessages) {
            const messages = Array.from(chatMessages.querySelectorAll(".chat-message"));
            if (messages.length > 0) {
                const lastMsg = messages[messages.length - 1];
                const lastMessageId = lastMsg.dataset.messageId;
                if (lastMessageId) {
                    localStorage.setItem("lastReadChatMessageId", lastMessageId);
                }
            }
        }
        updateChatNotification();
    }, 500);
}

function closeChatPanel() {
    if (!chatPanel) return;
    
    chatPanel.classList.add("hidden");
    
    // Auto-refresh durdur
    if (chatPollInterval) {
        clearInterval(chatPollInterval);
        chatPollInterval = null;
    }
}

async function loadChatMessages() {
    if (!chatMessages || !currentUser || currentUser.role !== "admin") return;
    
    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/chat/messages`);
        if (!response.ok) throw new Error("Mesajlar yüklenemedi");
        
        const messages = await response.json();
        renderChatMessages(messages);
    } catch (err) {
        console.error("Chat mesajları yüklenirken hata:", err);
    }
}

function renderChatMessages(messages) {
    if (!chatMessages) return;
    
    chatMessages.innerHTML = "";
    
    if (messages.length === 0) {
        const emptyMsg = document.createElement("div");
        emptyMsg.className = "chat-empty";
        emptyMsg.textContent = "Henüz mesaj yok. İlk mesajı siz gönderin!";
        chatMessages.appendChild(emptyMsg);
        localStorage.setItem("lastReadChatMessageId", "");
        updateChatNotification();
        return;
    }
    
    // Son okunan mesaj ID'sini al
    const lastReadId = localStorage.getItem("lastReadChatMessageId") || "";
    let lastReadIndex = -1;
    
    // Son okunan mesajın index'ini bul
    if (lastReadId) {
        lastReadIndex = messages.findIndex(msg => msg.id === lastReadId);
    }
    
    messages.forEach((msg, index) => {
        const messageEl = document.createElement("div");
        messageEl.className = "chat-message";
        if (msg.userId === currentUser.username || msg.userId === currentUser.id) {
            messageEl.classList.add("own-message");
        }
        
        // Mesaj ID'sini sakla
        if (msg.id) {
            messageEl.dataset.messageId = msg.id;
        }
        
        const time = new Date(msg.createdAt);
        const timeStr = time.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
        
        messageEl.innerHTML = `
            <div class="chat-message-header">
                <span class="chat-message-username">${escapeHtml(msg.username)}</span>
                <span class="chat-message-time">${timeStr}</span>
            </div>
            <div class="chat-message-content">${escapeHtml(msg.message)}</div>
        `;
        
        chatMessages.appendChild(messageEl);
    });
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Chat paneli açıksa, son mesajı okunmuş olarak işaretle
    if (chatPanel && !chatPanel.classList.contains("hidden")) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.id) {
            localStorage.setItem("lastReadChatMessageId", lastMessage.id);
        }
        updateChatNotification();
    } else {
        // Chat paneli kapalıysa, okunmamış mesaj var mı kontrol et
        updateChatNotification(messages, lastReadId);
    }
}

function updateChatNotification(messages = null, lastReadId = null) {
    if (!chatToggleBtn || !currentUser || currentUser.role !== "admin") return;
    
    // Eğer mesajlar verilmemişse, yükle
    if (!messages) {
        lastReadId = localStorage.getItem("lastReadChatMessageId") || "";
        fetch(`${BACKEND_BASE_URL}/api/chat/messages`)
            .then(res => res.json())
            .then(msgs => {
                checkUnreadMessages(msgs, lastReadId);
            })
            .catch(err => console.error("Chat mesajları kontrol edilemedi:", err));
        return;
    }
    
    checkUnreadMessages(messages, lastReadId || localStorage.getItem("lastReadChatMessageId") || "");
}

function checkUnreadMessages(messages, lastReadId) {
    if (!chatToggleBtn || messages.length === 0) {
        chatToggleBtn.classList.remove("has-notification");
        return;
    }
    
    // Son mesajın ID'sini kontrol et
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.id && lastMessage.id !== lastReadId) {
        // Okunmamış mesaj var
        chatToggleBtn.classList.add("has-notification");
    } else {
        // Tüm mesajlar okunmuş
        chatToggleBtn.classList.remove("has-notification");
    }
}

async function sendChatMessage() {
    if (!chatMessageInput || !currentUser || currentUser.role !== "admin") return;
    
    const message = chatMessageInput.value.trim();
    if (!message) return;
    
    // Butonu disable et
    if (chatSendBtn) {
        chatSendBtn.disabled = true;
        chatSendBtn.textContent = "Gönderiliyor...";
    }
    
    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/chat/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId: currentUser.id || currentUser.username,
                username: currentUser.username,
                message: message
            })
        });
        
        if (!response.ok) throw new Error("Mesaj gönderilemedi");
        
        // Input'u temizle
        chatMessageInput.value = "";
        
        // Mesajları yenile
        await loadChatMessages();
        
        // Bildirimi güncelle
        updateChatNotification();
    } catch (err) {
        console.error("Mesaj gönderilirken hata:", err);
        showToast("Mesaj gönderilemedi: " + err.message, "error");
    } finally {
        if (chatSendBtn) {
            chatSendBtn.disabled = false;
            chatSendBtn.textContent = "Gönder";
        }
    }
}

// HTML escape helper
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function updateChatButtonVisibility() {
    if (chatToggleBtn) {
        if (currentUser && currentUser.role === "admin") {
            chatToggleBtn.style.display = "block";
        } else {
            chatToggleBtn.style.display = "none";
            // Eğer chat açıksa kapat
            if (chatPanel && !chatPanel.classList.contains("hidden")) {
                closeChatPanel();
            }
        }
    }
}

function initializeEventListeners() {
    // DOM referanslarını al
    loginScreen = document.getElementById("login-screen");
    mainScreen = document.getElementById("main-screen");
    characterDetailScreen = document.getElementById("character-detail-screen");
    loginForm = document.getElementById("login-form");
    usernameInput = document.getElementById("username");
    passwordInput = document.getElementById("password");
    loginErrorEl = document.getElementById("login-error");
    
    // Topbar referansları
    currentUserInfoEl = document.getElementById("current-user-info");
    logoutBtn = document.getElementById("logout-btn");
    usersManagementBtn = document.getElementById("users-management-btn");
    themeToggleBtn = document.getElementById("theme-toggle-btn");
    blurToggleBtn = document.getElementById("blur-toggle-btn");
    chatToggleBtn = document.getElementById("chat-toggle-btn");
    
    // Chat panel DOM referansları
    chatPanel = document.getElementById("chat-panel");
    chatMessages = document.getElementById("chat-messages");
    chatMessageInput = document.getElementById("chat-message-input");
    chatSendBtn = document.getElementById("chat-send-btn");
    chatCloseBtn = document.getElementById("chat-close-btn");
    
    // Yeni layout DOM referansları
    projectListEl = document.getElementById("project-list");
    addProjectBtn = document.getElementById("add-project-btn");
    charactersSidebarSection = document.getElementById("characters-sidebar-section");
    sidebarProjectTitle = document.getElementById("sidebar-project-title");
    characterSearchInput = document.getElementById("character-search-input");
    addCharacterSidebarBtn = document.getElementById("add-character-sidebar-btn");
    characterFiltersEl = document.getElementById("character-filters");
    charactersSidebarList = document.getElementById("characters-sidebar-list");
    characterDetailPanel = document.getElementById("character-detail-panel");
    emptyState = document.getElementById("empty-state");
    characterDetailContent = document.getElementById("character-detail-content");
    detailMainImage = document.getElementById("detail-main-image");
    detailFullName = document.getElementById("detail-full-name");
    detailMeta = document.getElementById("detail-meta");
    detailProjectBadge = document.getElementById("detail-project-badge");
    traitsDisplay = document.getElementById("traits-display");
    traitsEdit = document.getElementById("traits-edit");
    traitsTextarea = document.getElementById("traits-textarea");
    editTraitsBtn = document.getElementById("edit-traits-btn");
    addImageBtnPanel = document.getElementById("add-image-btn-panel");
    tagFiltersEl = document.getElementById("tag-filters");
    characterImagesGrid = document.getElementById("character-images-grid");
    
    // Senaryo Editor referansları
    scenarioBtn = document.getElementById("scenario-btn");
    scenarioScreen = document.getElementById("scenario-screen");
    scenarioBackBtn = document.getElementById("scenario-back-btn");
    scenarioProjectTitle = document.getElementById("scenario-project-title");
    addChapterBtn = document.getElementById("add-chapter-btn");
    addPartBtn = document.getElementById("add-part-btn");
    scenarioOutlineList = document.getElementById("scenario-outline-list");
    scenarioCanvas = document.getElementById("scenario-canvas");
    scenarioPropertiesContent = document.getElementById("scenario-properties-content");
    resetViewBtn = document.getElementById("reset-view-btn");
    
    // İlişki Editor referansları
    relationshipBtn = document.getElementById("relationship-btn");
    relationshipScreen = document.getElementById("relationship-screen");
    relationshipBackBtn = document.getElementById("relationship-back-btn");
    relationshipProjectTitle = document.getElementById("relationship-project-title");
    addRelationshipCharacterBtn = document.getElementById("add-relationship-character-btn");
    addRelationshipGroupBtn = document.getElementById("add-relationship-group-btn");
    addRelationshipBtn = document.getElementById("add-relationship-btn");
    resetRelationshipViewBtn = document.getElementById("reset-relationship-view-btn");
    relationshipCharactersList = document.getElementById("relationship-characters-list");
    relationshipGroupsList = document.getElementById("relationship-groups-list");
    relationshipCanvas = document.getElementById("relationship-canvas");
    relationshipPropertiesContent = document.getElementById("relationship-properties-content");
    
    // İlişki modal referansları
    relationshipCharacterModal = document.getElementById("relationship-character-modal");
    relationshipCharacterModalBackdrop = document.getElementById("relationship-character-modal-backdrop");
    relationshipCharacterForm = document.getElementById("relationship-character-form");
    relationshipCharacterNameInput = document.getElementById("relationship-character-name");
    discardRelationshipCharacterBtn = document.getElementById("discard-relationship-character-btn");
    
    relationshipGroupModal = document.getElementById("relationship-group-modal");
    relationshipGroupModalBackdrop = document.getElementById("relationship-group-modal-backdrop");
    relationshipGroupForm = document.getElementById("relationship-group-form");
    relationshipGroupNameInput = document.getElementById("relationship-group-name");
    discardRelationshipGroupBtn = document.getElementById("discard-relationship-group-btn");
    
    // Eski referanslar (geriye dönük uyumluluk için)
    currentProjectTitleEl = document.getElementById("current-project-title");
    addCharacterBtn = document.getElementById("add-character-btn");
    charactersContainer = document.getElementById("characters-container");
    
    // Tema ve blur'ı başlat (butonlar alındıktan sonra)
    initTheme();
    initBlur();
    
    // Blur toggle
    if (blurToggleBtn) {
        console.log("blurToggleBtn bulundu, event listener ekleniyor");
        blurToggleBtn.addEventListener("click", toggleBlur);
    } else {
        console.warn("blur-toggle-btn bulunamadı!");
    }
    
    // Tema toggle
    if (themeToggleBtn) {
        console.log("themeToggleBtn bulundu, event listener ekleniyor");
        themeToggleBtn.addEventListener("click", toggleTheme);
    } else {
        console.warn("theme-toggle-btn bulunamadı!");
    }
    
    // Popstate event listener (geri/ileri butonları için)
    window.addEventListener("popstate", (e) => {
        const routeData = parseRoute();
        navigateToRoute(routeData);
    });
    
    // Chat butonları
    if (chatToggleBtn) {
        chatToggleBtn.addEventListener("click", toggleChatPanel);
    }
    if (chatCloseBtn) {
        chatCloseBtn.addEventListener("click", closeChatPanel);
    }
    if (chatSendBtn) {
        chatSendBtn.addEventListener("click", sendChatMessage);
    }
    if (chatMessageInput) {
        chatMessageInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                sendChatMessage();
            }
        });
    }
    
    // Admin ise chat butonunu göster
    updateChatButtonVisibility();
    
    // Chat bildirimini kontrol et (her 5 saniyede bir)
    if (currentUser && currentUser.role === "admin") {
        setInterval(() => {
            updateChatNotification();
        }, 5000);
    }

            // Event listeners
    if (loginForm) {
            loginForm.addEventListener("submit", handleLoginSubmit);
    } else {
        console.error("loginForm bulunamadı! HTML'de login-form id'li element var mı kontrol edin.");
    }
    if (logoutBtn) {
            logoutBtn.addEventListener("click", handleLogout);
    }

            if (addCharacterBtn) {
            addCharacterBtn.addEventListener("click", openCharacterModal);
            }
            if (discardCharacterBtn) {
            discardCharacterBtn.addEventListener("click", closeCharacterModal);
            }
            if (characterModalBackdrop) {
            characterModalBackdrop.addEventListener("click", closeCharacterModal);
            }
            if (characterForm) {
            characterForm.addEventListener("submit", handleCharacterFormSubmit);
            }
            if (charImageInput) {
            charImageInput.addEventListener("change", handleImageChange);
            }

            // Proje yönetimi
            if (addProjectBtn) {
                addProjectBtn.addEventListener("click", () => openProjectModal());
            }
            if (discardProjectBtn) {
                discardProjectBtn.addEventListener("click", closeProjectModal);
            }
            if (projectModalBackdrop) {
                projectModalBackdrop.addEventListener("click", closeProjectModal);
            }
            if (projectForm) {
                projectForm.addEventListener("submit", handleProjectFormSubmit);
            }

            // Kullanıcı yönetimi
            if (usersManagementBtn) {
                usersManagementBtn.addEventListener("click", openUsersManagement);
            }
            if (backToMainBtn) {
                backToMainBtn.addEventListener("click", () => {
                    usersManagementScreen.classList.add("hidden");
                    mainScreen.classList.remove("hidden");
                });
            }
            if (logoutBtn3) {
                logoutBtn3.addEventListener("click", handleLogout);
            }
            if (addUserBtn) {
                addUserBtn.addEventListener("click", () => openUserModal());
            }
            if (discardUserBtn) {
                discardUserBtn.addEventListener("click", closeUserModal);
            }
            if (userModalBackdrop) {
                userModalBackdrop.addEventListener("click", closeUserModal);
            }
            if (userForm) {
                userForm.addEventListener("submit", handleUserFormSubmit);
            }

            // Senaryo butonu
            if (scenarioBtn) {
                scenarioBtn.addEventListener("click", openScenarioScreen);
            }
            if (scenarioBackBtn) {
                scenarioBackBtn.addEventListener("click", closeScenarioScreen);
            }
            if (addChapterBtn) {
                addChapterBtn.addEventListener("click", addChapter);
            }
            if (addPartBtn) {
                addPartBtn.addEventListener("click", addPart);
            }
            if (resetViewBtn) {
                resetViewBtn.addEventListener("click", resetCanvasView);
            }
            
            // İlişki Editor event listeners
            if (relationshipBtn) {
                relationshipBtn.addEventListener("click", openRelationshipScreen);
            }
            if (relationshipBackBtn) {
                relationshipBackBtn.addEventListener("click", closeRelationshipScreen);
            }
            if (addRelationshipCharacterBtn) {
                addRelationshipCharacterBtn.addEventListener("click", openRelationshipCharacterModal);
            }
            if (addRelationshipGroupBtn) {
                addRelationshipGroupBtn.addEventListener("click", openRelationshipGroupModal);
            }
            if (addRelationshipBtn) {
                addRelationshipBtn.addEventListener("click", () => {
                    if (isAddingRelationship) {
                        // Eğer zaten ilişki ekleme modundaysa iptal et
                        cancelAddingRelationship();
                    } else {
                        startAddingRelationship();
                    }
                });
            }
            if (resetRelationshipViewBtn) {
                resetRelationshipViewBtn.addEventListener("click", resetRelationshipCanvasView);
            }
            
            // İlişki modal event listeners
            if (relationshipCharacterForm) {
                relationshipCharacterForm.addEventListener("submit", handleRelationshipCharacterFormSubmit);
            }
            if (discardRelationshipCharacterBtn) {
                discardRelationshipCharacterBtn.addEventListener("click", closeRelationshipCharacterModal);
            }
            if (relationshipCharacterModalBackdrop) {
                relationshipCharacterModalBackdrop.addEventListener("click", closeRelationshipCharacterModal);
            }
            
            if (relationshipGroupForm) {
                relationshipGroupForm.addEventListener("submit", handleRelationshipGroupFormSubmit);
            }
            if (discardRelationshipGroupBtn) {
                discardRelationshipGroupBtn.addEventListener("click", closeRelationshipGroupModal);
            }
            if (relationshipGroupModalBackdrop) {
                relationshipGroupModalBackdrop.addEventListener("click", closeRelationshipGroupModal);
            }
            
            // Yeni layout butonları
            if (addCharacterSidebarBtn) {
                addCharacterSidebarBtn.addEventListener("click", () => {
                    if (currentProjectId) {
                        openCharacterModal();
                    }
                });
            }
            if (characterSearchInput) {
                let searchTimeout = null;
                characterSearchInput.addEventListener("input", () => {
                    // Debounce: 300ms bekle, sonra render et
                    if (searchTimeout) {
                        clearTimeout(searchTimeout);
                    }
                    searchTimeout = setTimeout(() => {
                        // Arama yapıldığında karakter listesini yeniden render et
                        if (currentProjectId) {
                            renderCharactersSidebar();
                        }
                    }, 300);
                });
            }
            if (editTraitsBtn) {
                editTraitsBtn.addEventListener("click", handleTraitsEdit);
            }
            if (addImageBtnPanel) {
                addImageBtnPanel.addEventListener("click", () => {
                    if (currentCharacterId) {
                        openImageModal();
                    }
                });
            }
            
            // Karakter detay ekranı
            if (backToListBtn) {
                backToListBtn.addEventListener("click", () => {
                    characterDetailScreen.classList.add("hidden");
                    mainScreen.classList.remove("hidden");
                    currentCharacterId = null;
                    currentCharacter = null;
                });
            }
            if (editCharacterBtn) {
                editCharacterBtn.addEventListener("click", () => {
                    if (currentCharacter) {
                        openCharacterModal(currentCharacter);
                    }
                });
            }
            if (logoutBtn2) {
                logoutBtn2.addEventListener("click", handleLogout);
            }
            if (addImageBtn) {
                addImageBtn.addEventListener("click", () => openImageModal());
            }
            if (discardImageBtn) {
                discardImageBtn.addEventListener("click", closeImageModal);
            }
            if (imageModalBackdrop) {
                imageModalBackdrop.addEventListener("click", closeImageModal);
            }
            if (imageForm) {
                imageForm.addEventListener("submit", handleImageFormSubmit);
            }
            if (imageFileInput) {
                imageFileInput.addEventListener("change", handleImageFileChange);
            }

            // Resim görüntüleme modal
            if (closeImageViewBtn) {
                closeImageViewBtn.addEventListener("click", closeImageViewModal);
            }
            if (imageViewModalBackdrop) {
                imageViewModalBackdrop.addEventListener("click", closeImageViewModal);
            }
            const prevImageBtn = document.getElementById("prev-image-btn");
            const nextImageBtn = document.getElementById("next-image-btn");
            if (prevImageBtn) {
                prevImageBtn.addEventListener("click", prevImage);
            }
            if (nextImageBtn) {
                nextImageBtn.addEventListener("click", nextImage);
            }
            if (deleteImageFromViewBtn) {
                deleteImageFromViewBtn.addEventListener("click", handleDeleteImageFromView);
            }
            if (reorderImagesInViewBtn) {
                reorderImagesInViewBtn.addEventListener("click", toggleReorderMode);
            }
            
            // Klavye ile navigasyon
            document.addEventListener("keydown", (e) => {
                if (!imageViewModal || imageViewModal.classList.contains("hidden")) return;
                if (e.key === "ArrowLeft") {
                    e.preventDefault();
                    prevImage();
                } else if (e.key === "ArrowRight") {
                    e.preventDefault();
                    nextImage();
                } else if (e.key === "Escape") {
                    closeImageViewModal();
                }
            });
}

// --- Karakter Detay Ekranı ---

async function openCharacterDetail(character) {
    currentCharacter = character;
    currentCharacterId = character.id;

    // Karakteri backend'den tekrar yükle (mainImageId bilgisi için)
    try {
        const response = await fetch(`${getCharactersUrl(currentProjectId)}/${character.id}`);
        if (response.ok) {
            const fullCharacter = await response.json();
            currentCharacter = fullCharacter;
            character = fullCharacter;
        } else if (response.status === 404) {
            // Karakter backend'de yoksa, mevcut karakter bilgisini kullan
            console.warn("Karakter backend'de bulunamadı, mevcut bilgiler kullanılıyor:", character.id);
        }
    } catch (err) {
        console.error("Karakter detayları yüklenirken hata:", err);
        // Hata durumunda mevcut karakter bilgisini kullanmaya devam et
    }

    // Ekran geçişi
    mainScreen.classList.add("hidden");
    characterDetailScreen.classList.remove("hidden");

    // Karakter bilgilerini doldur
    characterDetailName.textContent = `${character.firstName} ${character.lastName}`;
    characterDetailFullName.textContent = `${character.firstName} ${character.lastName}`;

    const metaParts = [];
    if (character.age) metaParts.push(`${character.age} yaş`);
    if (character.zodiac) metaParts.push(`Burç: ${character.zodiac}`);
    characterDetailMeta.textContent = metaParts.join(" • ");

    characterDetailTraits.textContent = character.traits || "";

    // Ana görsel - mainImageId varsa resim kataloğundan bul, yoksa imageUrl kullan
    let mainImageUrl = null;
    if (character.mainImageId) {
        // Resim kataloğunu yükle ve mainImageId'ye göre bul
        try {
            const imagesResponse = await fetch(`${BACKEND_BASE_URL}/api/characters/${character.id}/images`);
            if (imagesResponse.ok) {
                const images = await imagesResponse.json();
                const mainImage = images.find(img => img.id === character.mainImageId);
                if (mainImage) {
                    mainImageUrl = mainImage.url;
                }
            }
        } catch (err) {
            console.error("Ana görsel yüklenirken hata:", err);
        }
        // Fallback olarak imageUrl kullan
        if (!mainImageUrl) {
            mainImageUrl = character.mainImageUrl || character.imageUrl;
        }
    } else {
        mainImageUrl = character.imageUrl;
    }
    
    if (mainImageUrl) {
        characterDetailMainImage.src = mainImageUrl;
        characterDetailMainImage.style.display = "block";
    } else {
        characterDetailMainImage.style.display = "none";
    }

    // Admin butonları
    if (currentUser.role === "admin") {
        editCharacterBtn.style.display = "block";
        addImageBtn.style.display = "block";
    } else {
        editCharacterBtn.style.display = "none";
        addImageBtn.style.display = "none";
    }

    // Resim kataloğunu yükle
    await renderCharacterImages();
}

// Sağ panelde resim kataloğu
async function renderCharacterImagesPanel(characterId) {
    if (!characterImagesGrid || !characterId) return;

    characterImagesGrid.innerHTML = "";

    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/characters/${characterId}/images`);
        if (!response.ok) throw new Error("Görseller yüklenemedi");
        
        const images = await response.json();
        
        // Tag filtrelerini oluştur
        renderTagFilters(images);
        
        // Resimleri render et
        renderImagesInGrid(images, characterImagesGrid);
    } catch (err) {
        console.error("Görseller yüklenirken hata:", err);
        characterImagesGrid.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted);">Görseller yüklenemedi.</div>';
    }
}

// Tag filtrelerini render et
function renderTagFilters(images) {
    if (!tagFiltersEl) return;
    
    tagFiltersEl.innerHTML = "";
    
    // Tüm tag'leri topla
    const allTags = new Set();
    images.forEach(img => {
        if (img.tags && Array.isArray(img.tags)) {
            img.tags.forEach(tag => allTags.add(tag));
        }
    });
    
    if (allTags.size === 0) return;
    
    // "Tümü" chip'i
    const allChip = document.createElement("div");
    allChip.className = "tag-chip active";
    allChip.textContent = "Tümü";
    allChip.dataset.tag = "all";
    allChip.addEventListener("click", () => {
        document.querySelectorAll(".tag-chip").forEach(chip => chip.classList.remove("active"));
        allChip.classList.add("active");
        filterImagesByTag("all");
    });
    tagFiltersEl.appendChild(allChip);
    
    // Her tag için chip
    Array.from(allTags).sort().forEach(tag => {
        const chip = document.createElement("div");
        chip.className = "tag-chip";
        chip.textContent = tag;
        chip.dataset.tag = tag;
        chip.addEventListener("click", () => {
            document.querySelectorAll(".tag-chip").forEach(chip => chip.classList.remove("active"));
            chip.classList.add("active");
            filterImagesByTag(tag);
        });
        tagFiltersEl.appendChild(chip);
    });
}

// Tag'e göre filtrele
function filterImagesByTag(tag) {
    if (!characterImagesGrid) {
        console.warn("filterImagesByTag: characterImagesGrid bulunamadı");
        return;
    }
    
    const imageCards = characterImagesGrid.querySelectorAll(".character-image-card");
    
    imageCards.forEach(card => {
        const cardTagsStr = card.dataset.tags || "";
        const cardTags = cardTagsStr ? cardTagsStr.split(",").map(t => t.trim().toLowerCase()).filter(t => t) : [];
        const searchTag = tag ? tag.trim().toLowerCase() : "";
        
        if (tag === "all" || !tag) {
            card.style.display = "";
        } else if (cardTags.length > 0 && cardTags.includes(searchTag)) {
            card.style.display = "";
        } else {
            card.style.display = "none";
        }
    });
}

// Resimleri grid'e render et (gruplama ile)
function renderImagesInGrid(images, container) {
    if (!container) return;
    
    // Container'a drag & drop event listener'ları ekle (bir kez)
    if (!container.dataset.dropListenerAdded && currentUser && currentUser.role === "admin") {
        container.dataset.dropListenerAdded = "true";
        container.addEventListener("dragover", (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = "move";
        });
        container.addEventListener("drop", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const draggedImageId = e.dataTransfer.getData("text/plain");
            if (draggedImageId) {
                // Son pozisyona taşı
                const allCards = container.querySelectorAll(".character-image-card");
                if (allCards.length > 0) {
                    const lastCard = allCards[allCards.length - 1];
                    const lastImageId = lastCard.dataset.imageId;
                    const lastGroupTitle = lastCard.dataset.groupTitle;
                    if (lastImageId && lastImageId !== draggedImageId) {
                        const draggedGroupTitle = e.dataTransfer.getData("text/group-title");
                        await handleImageReorder(draggedImageId, lastImageId, draggedGroupTitle, lastGroupTitle);
                    }
                }
            }
            // Tüm drag-over class'larını temizle
            document.querySelectorAll(".character-image-card.drag-over").forEach(card => {
                card.classList.remove("drag-over");
            });
            container.classList.remove("drag-active");
        });
    }
    
    // orderIndex'e göre sırala
    images.sort((a, b) => {
        const aOrder = a.orderIndex !== undefined ? a.orderIndex : 999999;
        const bOrder = b.orderIndex !== undefined ? b.orderIndex : 999999;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    });

    // Resimleri başlığa göre grupla
    const groupedImages = {};
    images.forEach((img) => {
        const title = img.title || "İsimsiz";
        if (!groupedImages[title]) {
            groupedImages[title] = [];
        }
        groupedImages[title].push(img);
    });

    // Her grup için kart oluştur
    Object.keys(groupedImages).forEach((title, groupIndex) => {
        const groupImages = groupedImages[title];
        const isGrouped = groupImages.length > 1;
        
        // Default görsel: defaultImageId varsa o, yoksa ilk eklenen (en eski createdAt)
        let defaultImage = groupImages[0];
        if (isGrouped) {
            const defaultImg = groupImages.find(img => img.defaultImageId === img.id);
            if (defaultImg) {
                defaultImage = defaultImg;
            } else {
                defaultImage = groupImages.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0))[0];
            }
        }

        const imageCard = document.createElement("div");
        imageCard.className = "character-image-card";
        if (isGrouped) {
            imageCard.classList.add("grouped-image-card");
        }
        imageCard.style.cursor = "pointer";
        imageCard.dataset.imageId = defaultImage.id;
        imageCard.dataset.groupTitle = title;
        imageCard.dataset.orderIndex = defaultImage.orderIndex !== undefined ? defaultImage.orderIndex : groupIndex;
        
        // Gruplu resimler için tüm resimlerin tag'lerini birleştir
        if (isGrouped) {
            const allGroupTags = new Set();
            groupImages.forEach(img => {
                if (img.tags && Array.isArray(img.tags)) {
                    img.tags.forEach(tag => allGroupTags.add(tag));
                }
            });
            imageCard.dataset.tags = Array.from(allGroupTags).join(",");
        } else {
            imageCard.dataset.tags = (defaultImage.tags || []).join(",");
        }

        // Admin ise drag & drop ekle
        if (currentUser && currentUser.role === "admin") {
            imageCard.classList.add("draggable");
            
            // Drag handle için özel bir alan ekle
            const dragHandle = document.createElement("div");
            dragHandle.className = "drag-handle";
            dragHandle.style.position = "absolute";
            dragHandle.style.top = "4px";
            dragHandle.style.right = "4px";
            dragHandle.style.width = "24px";
            dragHandle.style.height = "24px";
            dragHandle.style.backgroundColor = "var(--bg-elevated)";
            dragHandle.style.border = "1px solid var(--border-soft)";
            dragHandle.style.borderRadius = "4px";
            dragHandle.style.cursor = "grab";
            dragHandle.style.display = "flex";
            dragHandle.style.alignItems = "center";
            dragHandle.style.justifyContent = "center";
            dragHandle.style.zIndex = "10";
            dragHandle.style.opacity = "0.7";
            dragHandle.style.transition = "opacity 0.2s";
            dragHandle.innerHTML = "⋮⋮";
            dragHandle.style.fontSize = "12px";
            dragHandle.style.color = "var(--text-muted)";
            dragHandle.title = "Sürükle";
            
            dragHandle.addEventListener("mouseenter", () => {
                dragHandle.style.opacity = "1";
            });
            dragHandle.addEventListener("mouseleave", () => {
                dragHandle.style.opacity = "0.7";
            });
            
            // Mousedown event'i ekle (sadece click event'ini engelle, drag'i engelleme)
            dragHandle.addEventListener("mousedown", (e) => {
                e.stopPropagation();
                // preventDefault() çağırma - drag'i engeller
            });
            
            dragHandle.draggable = true;
            dragHandle.addEventListener("dragstart", (e) => {
                e.stopPropagation();
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", defaultImage.id);
                e.dataTransfer.setData("text/group-title", title);
                e.dataTransfer.setData("application/json", JSON.stringify({ imageId: defaultImage.id, groupTitle: title }));
                imageCard.classList.add("dragging");
                if (container) container.classList.add("drag-active");
                dragHandle.style.cursor = "grabbing";
                console.log("Drag başladı:", defaultImage.id, title);
            });
            
            dragHandle.addEventListener("dragend", (e) => {
                imageCard.classList.remove("dragging");
                if (container) container.classList.remove("drag-active");
                dragHandle.style.cursor = "grab";
                document.querySelectorAll(".character-image-card.drag-over").forEach(card => {
                    card.classList.remove("drag-over");
                });
                console.log("Drag bitti");
            });
            
            // Drag handle'a tıklanınca click event'inin tetiklenmesini engelle
            dragHandle.addEventListener("click", (e) => {
                e.stopPropagation();
                e.preventDefault();
                return false;
            });
            
            imageCard.appendChild(dragHandle);
            
            // Drop event'leri
            imageCard.addEventListener("dragover", (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.dataTransfer.dropEffect = "move";
                
                const draggingCard = document.querySelector(".character-image-card.dragging");
                if (draggingCard && draggingCard !== imageCard) {
                    imageCard.classList.add("drag-over");
                    console.log("Drag over:", defaultImage.id);
                }
            });

            imageCard.addEventListener("dragleave", (e) => {
                if (!imageCard.contains(e.relatedTarget)) {
                    imageCard.classList.remove("drag-over");
                }
            });

            imageCard.addEventListener("drop", async (e) => {
                e.preventDefault();
                e.stopPropagation();
                imageCard.classList.remove("drag-over");
                
                const draggedImageId = e.dataTransfer.getData("text/plain");
                const draggedGroupTitle = e.dataTransfer.getData("text/group-title");
                
                console.log("Drop event tetiklendi:", draggedImageId, "to", defaultImage.id);
                console.log("Drop event details:", {
                    draggedImageId,
                    targetImageId: defaultImage.id,
                    draggedGroupTitle,
                    targetGroupTitle: title
                });
                
                if (draggedImageId && draggedImageId !== defaultImage.id) {
                    try {
                        await handleImageReorder(draggedImageId, defaultImage.id, draggedGroupTitle, title);
                        showToast("Resim sırası güncellendi", "success");
                        // Resimleri yeniden render et
                        if (currentCharacterId) {
                            await renderCharacterImagesPanel(currentCharacterId);
                        }
                        await renderCharacterImages();
                    } catch (err) {
                        console.error("Resim sıralama hatası:", err);
                        showToast("Resim sırası güncellenemedi", "error");
                    }
                } else {
                    console.log("Drop iptal edildi - aynı resim veya geçersiz ID");
                }
            });
            
            // Container'a da drop event'i ekle (boş alana bırakma için)
            if (container && !container.dataset.dropListenerAdded) {
                container.dataset.dropListenerAdded = "true";
                container.addEventListener("dragover", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                });
                container.addEventListener("drop", async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const draggedImageId = e.dataTransfer.getData("text/plain");
                    if (draggedImageId) {
                        // Son pozisyona taşı
                        const allCards = container.querySelectorAll(".character-image-card");
                        if (allCards.length > 0) {
                            const lastCard = allCards[allCards.length - 1];
                            const lastImageId = lastCard.dataset.imageId;
                            if (lastImageId && lastImageId !== draggedImageId) {
                                const draggedGroupTitle = e.dataTransfer.getData("text/group-title");
                                await handleImageReorder(draggedImageId, lastImageId, draggedGroupTitle, lastCard.dataset.groupTitle);
                            }
                        }
                    }
                });
            }
        }

        const imgEl = document.createElement("img");
        imgEl.alt = defaultImage.title;
        imgEl.style.width = "100%";
        imgEl.style.aspectRatio = "2 / 3";
        imgEl.style.objectFit = "cover";
        imgEl.style.borderRadius = "var(--radius-md)";
        imgEl.style.backgroundColor = "var(--bg-soft)";
        imgEl.loading = "lazy";
        imgEl.draggable = false;
        imgEl.style.pointerEvents = "none";
        
        // Lazy loading
        if ("IntersectionObserver" in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const imgElement = entry.target;
                        imgElement.src = imgElement.dataset.src || defaultImage.url;
                        imgElement.classList.add("loaded");
                        observer.unobserve(imgElement);
                    }
                });
            }, { rootMargin: "50px" });
            
            imgEl.dataset.src = defaultImage.url;
            observer.observe(imgEl);
        } else {
            imgEl.src = defaultImage.url;
        }

        imageCard.addEventListener("click", (e) => {
            if (e.target.classList.contains("drag-handle") || 
                e.target.closest(".drag-handle") ||
                imageCard.classList.contains("dragging")) {
                return;
            }
            if (!e.target.closest("button")) {
                // Her zaman grup bilgisiyle aç (katalog bazlı izolasyon için)
                // Tek resimli katalog için de grup olarak aç
                openImageViewModal(defaultImage, title, groupImages);
            }
        });

        const titleEl = document.createElement("div");
        titleEl.className = "character-image-title";
        titleEl.textContent = title + (isGrouped ? ` (${groupImages.length})` : "");
        titleEl.style.marginTop = "8px";
        titleEl.style.fontSize = "13px";
        titleEl.style.fontWeight = "500";

        imageCard.appendChild(imgEl);
        imageCard.appendChild(titleEl);

        // Gruplu resimler için badge
        if (isGrouped) {
            const groupBadge = document.createElement("div");
            groupBadge.textContent = `📁 ${groupImages.length} resim`;
            groupBadge.style.fontSize = "10px";
            groupBadge.style.color = "var(--accent)";
            groupBadge.style.fontWeight = "600";
            groupBadge.style.marginTop = "4px";
            groupBadge.style.cursor = "pointer";
            groupBadge.addEventListener("click", (e) => {
                e.stopPropagation();
                openImageGroupModal(title, groupImages, defaultImage.id);
            });
            imageCard.appendChild(groupBadge);
        }

        // Admin aksiyonları
        if (currentUser && currentUser.role === "admin") {
            const actions = document.createElement("div");
            actions.style.display = "flex";
            actions.style.gap = "6px";
            actions.style.marginTop = "6px";
            actions.style.flexWrap = "wrap";

            // Ana görsel yap butonu
            const characterId = currentCharacterId || (images.length > 0 ? images[0].characterId : null);
            if (characterId) {
                const setMainBtn = document.createElement("button");
                setMainBtn.className = "btn subtle";
                setMainBtn.textContent = "Ana Görsel";
                setMainBtn.style.fontSize = "11px";
                setMainBtn.style.padding = "4px 8px";
                setMainBtn.style.color = "var(--accent)";
                setMainBtn.style.pointerEvents = "auto";
                setMainBtn.addEventListener("click", async (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    // Karakter bilgisini backend'den al
                    try {
                        const charResponse = await fetch(`${BACKEND_BASE_URL}/api/projects/${currentProjectId}/characters/${characterId}`);
                        if (charResponse.ok) {
                            const character = await charResponse.json();
                            await setMainImage(defaultImage.id, defaultImage.url, character);
                        }
                    } catch (err) {
                        console.error("Karakter bilgisi alınırken hata:", err);
                        showToast("Ana görsel ayarlanamadı", "error");
                    }
                });
                actions.appendChild(setMainBtn);
            }

            // Gruplu resimler için default görsel seç butonu
            if (isGrouped) {
                const selectDefaultBtn = document.createElement("button");
                selectDefaultBtn.className = "btn subtle";
                selectDefaultBtn.textContent = "Görsel Seç";
                selectDefaultBtn.style.fontSize = "11px";
                selectDefaultBtn.style.padding = "4px 8px";
                selectDefaultBtn.style.pointerEvents = "auto";
                selectDefaultBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    openImageGroupModal(title, groupImages, defaultImage.id);
                });
                actions.appendChild(selectDefaultBtn);
            }

            const editBtn = document.createElement("button");
            editBtn.className = "btn subtle";
            editBtn.textContent = "Düzenle";
            editBtn.style.fontSize = "11px";
            editBtn.style.padding = "4px 8px";
            editBtn.style.pointerEvents = "auto";
            editBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                e.preventDefault();
                openImageModal(defaultImage);
            });

            const deleteBtn = document.createElement("button");
            deleteBtn.className = "btn subtle";
            deleteBtn.textContent = "Sil";
            deleteBtn.style.fontSize = "11px";
            deleteBtn.style.padding = "4px 8px";
            deleteBtn.style.color = "var(--danger)";
            deleteBtn.style.pointerEvents = "auto";
            deleteBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                e.preventDefault();
                if (isGrouped) {
                    if (confirm(`"${title}" başlığındaki tüm ${groupImages.length} resmi silmek istediğinize emin misiniz?`)) {
                        groupImages.forEach(img => deleteImage(img.id));
                    }
                } else {
                    deleteImage(defaultImage.id);
                }
            });

            actions.appendChild(editBtn);
            actions.appendChild(deleteBtn);
            imageCard.appendChild(actions);
        }

        container.appendChild(imageCard);
    });
}

async function renderCharacterImages() {
    if (!currentCharacterId) return;

    characterImagesGrid.innerHTML = "";

    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/characters/${currentCharacterId}/images`);
        if (!response.ok) throw new Error("Görseller yüklenemedi");
        
        const images = await response.json();
        
        // orderIndex'e göre sırala (backend'den zaten sıralı geliyor ama emin olmak için)
        images.sort((a, b) => {
            const aOrder = a.orderIndex !== undefined ? a.orderIndex : 999999;
            const bOrder = b.orderIndex !== undefined ? b.orderIndex : 999999;
            if (aOrder !== bOrder) return aOrder - bOrder;
            // orderIndex yoksa createdAt'e göre sırala
            return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        });

        if (images.length === 0) {
            const info = document.createElement("p");
            info.textContent = "Henüz resim eklenmemiş.";
            info.style.color = "#a0a0b3";
            info.style.fontSize = "14px";
            characterImagesGrid.appendChild(info);
            return;
        }

        // Resimleri başlığa göre grupla
        const groupedImages = {};
        images.forEach((img) => {
            const title = img.title || "İsimsiz";
            if (!groupedImages[title]) {
                groupedImages[title] = [];
            }
            groupedImages[title].push(img);
        });

        // Her grup için kart oluştur
        Object.keys(groupedImages).forEach((title, groupIndex) => {
            const groupImages = groupedImages[title];
            const isGrouped = groupImages.length > 1;
            
            // Default görsel: defaultImageId varsa o, yoksa ilk eklenen (en eski createdAt)
            let defaultImage = groupImages[0];
            if (isGrouped) {
                // Önce defaultImageId'ye sahip olanı bul
                const defaultImg = groupImages.find(img => img.defaultImageId === img.id);
                if (defaultImg) {
                    defaultImage = defaultImg;
                } else {
                    // Yoksa en eski olanı al
                    defaultImage = groupImages.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0))[0];
                }
            }

            const imageCard = document.createElement("div");
            imageCard.className = "character-image-card";
            if (isGrouped) {
                imageCard.classList.add("grouped-image-card");
            }
            imageCard.style.cursor = "pointer";
            imageCard.dataset.imageId = defaultImage.id;
            imageCard.dataset.groupTitle = title;
            imageCard.dataset.orderIndex = defaultImage.orderIndex !== undefined ? defaultImage.orderIndex : groupIndex;

            // Admin ise drag & drop ekle
            if (currentUser.role === "admin") {
                imageCard.classList.add("draggable");
                // Kartın kendisini draggable yapma, sadece handle kullan
                
                // Drag handle için özel bir alan ekle (kartın üst kısmı)
                const dragHandle = document.createElement("div");
                dragHandle.className = "drag-handle";
                dragHandle.style.position = "absolute";
                dragHandle.style.top = "4px";
                dragHandle.style.right = "4px";
                dragHandle.style.width = "24px";
                dragHandle.style.height = "24px";
                dragHandle.style.backgroundColor = "var(--bg-elevated)";
                dragHandle.style.border = "1px solid var(--border-soft)";
                dragHandle.style.borderRadius = "4px";
                dragHandle.style.cursor = "grab";
                dragHandle.style.display = "flex";
                dragHandle.style.alignItems = "center";
                dragHandle.style.justifyContent = "center";
                dragHandle.style.zIndex = "10";
                dragHandle.style.opacity = "0.7";
                dragHandle.style.transition = "opacity 0.2s";
                dragHandle.innerHTML = "⋮⋮";
                dragHandle.style.fontSize = "12px";
                dragHandle.style.color = "var(--text-muted)";
                dragHandle.title = "Sürükle";
                
                dragHandle.addEventListener("mouseenter", () => {
                    dragHandle.style.opacity = "1";
                });
                dragHandle.addEventListener("mouseleave", () => {
                    dragHandle.style.opacity = "0.7";
                });
                
                // Mousedown event'i ekle (sadece click event'ini engelle, drag'i engelleme)
                dragHandle.addEventListener("mousedown", (e) => {
                    e.stopPropagation();
                    // preventDefault() çağırma - drag'i engeller
                });
                
                // Drag handle'a drag event'lerini ekle
                dragHandle.draggable = true;
                dragHandle.addEventListener("dragstart", (e) => {
                    e.stopPropagation();
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", defaultImage.id);
                    e.dataTransfer.setData("text/group-title", title);
                    imageCard.classList.add("dragging");
                    characterImagesGrid.classList.add("drag-active");
                    dragHandle.style.cursor = "grabbing";
                    console.log("Drag başladı (renderCharacterImages):", defaultImage.id, title);
                });
                
                dragHandle.addEventListener("dragend", (e) => {
                    imageCard.classList.remove("dragging");
                    characterImagesGrid.classList.remove("drag-active");
                    dragHandle.style.cursor = "grab";
                    // Tüm drag-over class'larını temizle
                    document.querySelectorAll(".character-image-card.drag-over").forEach(card => {
                        card.classList.remove("drag-over");
                    });
                });
                
                // Drag handle'a tıklanınca click event'inin tetiklenmesini engelle
                dragHandle.addEventListener("click", (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    return false;
                });
                
                imageCard.appendChild(dragHandle);
                
                // Kart üzerinde de drag event'leri (geriye dönük uyumluluk)
                imageCard.addEventListener("dragstart", (e) => {
                    // Eğer drag handle'dan gelmediyse
                    if (!e.target.classList.contains("drag-handle")) {
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", defaultImage.id);
                        e.dataTransfer.setData("text/group-title", title);
                        imageCard.classList.add("dragging");
                        characterImagesGrid.classList.add("drag-active");
                    }
                    e.stopPropagation();
                });

                imageCard.addEventListener("dragend", (e) => {
                    imageCard.classList.remove("dragging");
                    characterImagesGrid.classList.remove("drag-active");
                    // Tüm drag-over class'larını temizle
                    document.querySelectorAll(".character-image-card.drag-over").forEach(card => {
                        card.classList.remove("drag-over");
                    });
                });

                imageCard.addEventListener("dragover", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.dataTransfer.dropEffect = "move";
                    
                    const draggingCard = document.querySelector(".character-image-card.dragging");
                    if (draggingCard && draggingCard !== imageCard) {
                        imageCard.classList.add("drag-over");
                    }
                });

                imageCard.addEventListener("dragleave", (e) => {
                    // Sadece kart dışına çıkıldığında temizle
                    if (!imageCard.contains(e.relatedTarget)) {
                        imageCard.classList.remove("drag-over");
                    }
                });

                imageCard.addEventListener("drop", async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    imageCard.classList.remove("drag-over");
                    
                    const draggedImageId = e.dataTransfer.getData("text/plain");
                    const draggedGroupTitle = e.dataTransfer.getData("text/group-title");
                    
                    if (draggedImageId && draggedImageId !== defaultImage.id) {
                        await handleImageReorder(draggedImageId, defaultImage.id, draggedGroupTitle, title);
                    }
                });
            }

            const imgEl = document.createElement("img");
            imgEl.alt = defaultImage.title;
            imgEl.style.width = "100%";
            imgEl.style.aspectRatio = "2 / 3"; // 768x1152 oranı
            imgEl.style.objectFit = "cover";
            imgEl.style.borderRadius = "var(--radius-md)";
            imgEl.style.backgroundColor = "var(--bg-soft)";
            imgEl.loading = "lazy"; // Lazy loading
            imgEl.draggable = false; // Resim kendisi draggable olmasın, sadece kart
            imgEl.style.pointerEvents = "none"; // Resim tıklamalarını kart'a yönlendir
            
            // Lazy loading için Intersection Observer kullan
            if ("IntersectionObserver" in window) {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const imgElement = entry.target;
                            imgElement.src = imgElement.dataset.src || defaultImage.url;
                            imgElement.classList.add("loaded");
                            observer.unobserve(imgElement);
                        }
                    });
                }, { rootMargin: "50px" });
                
                imgEl.dataset.src = defaultImage.url;
                observer.observe(imgEl);
            } else {
                // Fallback: Eski tarayıcılar için direkt yükle
                imgEl.src = defaultImage.url;
            }

            // Resim tıklaması - kart üzerinden yönet
            imageCard.addEventListener("click", (e) => {
                // Drag handle'a tıklanmadıysa ve drag işlemi sırasında değilse
                if (e.target.classList.contains("drag-handle") || 
                    e.target.closest(".drag-handle") ||
                    imageCard.classList.contains("dragging")) {
                    return;
                }
                // Eğer butonlara tıklanmadıysa resim modal'ını aç
                if (!e.target.closest("button")) {
                    // Her zaman grup bilgisiyle aç (katalog bazlı izolasyon için)
                    openImageViewModal(defaultImage, title, groupImages);
                }
            });

            const titleEl = document.createElement("div");
            titleEl.className = "character-image-title";
            titleEl.textContent = title + (isGrouped ? ` (${groupImages.length})` : "");
            titleEl.style.marginTop = "8px";
            titleEl.style.fontSize = "13px";
            titleEl.style.fontWeight = "500";

            imageCard.appendChild(imgEl);
            imageCard.appendChild(titleEl);

            // Gruplu resimler için badge
            if (isGrouped) {
                const groupBadge = document.createElement("div");
                groupBadge.textContent = `📁 ${groupImages.length} resim`;
                groupBadge.style.fontSize = "10px";
                groupBadge.style.color = "var(--accent)";
                groupBadge.style.fontWeight = "600";
                groupBadge.style.marginTop = "4px";
                groupBadge.style.cursor = "pointer";
                groupBadge.addEventListener("click", (e) => {
                    e.stopPropagation();
                    openImageGroupModal(title, groupImages, defaultImage.id);
                });
                imageCard.appendChild(groupBadge);
            }

            // Admin aksiyonları
            if (currentUser && currentUser.role === "admin") {
                const actions = document.createElement("div");
                actions.style.display = "flex";
                actions.style.gap = "6px";
                actions.style.marginTop = "6px";
                actions.style.flexWrap = "wrap";

                // Ana görsel yap butonu (her zaman göster, karakter bilgisi backend'den alınacak)
                const setMainBtn = document.createElement("button");
                setMainBtn.className = "btn subtle";
                setMainBtn.textContent = "Ana Görsel";
                setMainBtn.style.fontSize = "11px";
                setMainBtn.style.padding = "4px 8px";
                setMainBtn.style.color = "var(--accent)";
                setMainBtn.style.pointerEvents = "auto";
                setMainBtn.addEventListener("click", async (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    // Karakter bilgisini backend'den al
                    const characterId = currentCharacterId || (images.length > 0 ? images[0].characterId : null);
                    if (characterId) {
                        try {
                            const charResponse = await fetch(`${BACKEND_BASE_URL}/api/projects/${currentProjectId}/characters/${characterId}`);
                            if (charResponse.ok) {
                                const character = await charResponse.json();
                                await setMainImage(defaultImage.id, defaultImage.url, character);
                            }
                        } catch (err) {
                            console.error("Karakter bilgisi alınırken hata:", err);
                            showToast("Ana görsel ayarlanamadı", "error");
                        }
                    }
                });
                actions.appendChild(setMainBtn);

                // Gruplu resimler için default görsel seç butonu
                if (isGrouped) {
                    const selectDefaultBtn = document.createElement("button");
                    selectDefaultBtn.className = "btn subtle";
                    selectDefaultBtn.textContent = "Görsel Seç";
                    selectDefaultBtn.style.fontSize = "11px";
                    selectDefaultBtn.style.padding = "4px 8px";
                    selectDefaultBtn.style.pointerEvents = "auto";
                    selectDefaultBtn.addEventListener("click", (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        openImageGroupModal(title, groupImages, defaultImage.id);
                    });
                    actions.appendChild(selectDefaultBtn);
                }

                const editBtn = document.createElement("button");
                editBtn.className = "btn subtle";
                editBtn.textContent = "Düzenle";
                editBtn.style.fontSize = "11px";
                editBtn.style.padding = "4px 8px";
                editBtn.style.pointerEvents = "auto"; // Buton tıklamalarını aktif tut
                editBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    openImageModal(defaultImage);
                });

                const deleteBtn = document.createElement("button");
                deleteBtn.className = "btn subtle";
                deleteBtn.textContent = "Sil";
                deleteBtn.style.fontSize = "11px";
                deleteBtn.style.padding = "4px 8px";
                deleteBtn.style.color = "var(--danger)";
                deleteBtn.style.pointerEvents = "auto"; // Buton tıklamalarını aktif tut
                deleteBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (isGrouped) {
                        if (confirm(`"${title}" başlığındaki tüm ${groupImages.length} resmi silmek istediğinize emin misiniz?`)) {
                            groupImages.forEach(img => deleteImage(img.id));
                        }
                    } else {
                        deleteImage(defaultImage.id);
                    }
                });

                actions.appendChild(editBtn);
                actions.appendChild(deleteBtn);
                imageCard.appendChild(actions);
            }

            characterImagesGrid.appendChild(imageCard);
        });
    } catch (err) {
        console.error("Görseller yüklenirken hata:", err);
        const error = document.createElement("p");
        error.textContent = "Görseller yüklenemedi.";
        error.style.color = "#f45b69";
        characterImagesGrid.appendChild(error);
    }
}

// --- Resim Yönetimi ---

// Gruplu resimler için modal
function openImageGroupModal(title, images, currentDefaultId) {
    // Basit bir modal ile resim seçimi
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.style.position = "fixed";
    modal.style.top = "0";
    modal.style.left = "0";
    modal.style.width = "100%";
    modal.style.height = "100%";
    modal.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    modal.style.zIndex = "10000";
    modal.style.display = "flex";
    modal.style.alignItems = "center";
    modal.style.justifyContent = "center";
    
    const content = document.createElement("div");
    content.className = "modal-content";
    content.style.backgroundColor = "var(--bg-elevated)";
    content.style.padding = "24px";
    content.style.borderRadius = "var(--radius-lg)";
    content.style.maxWidth = "600px";
    content.style.maxHeight = "80vh";
    content.style.overflow = "auto";
    
    const titleEl = document.createElement("h3");
    titleEl.textContent = `"${title}" - Görsel Seç (${images.length} resim)`;
    titleEl.style.marginTop = "0";
    content.appendChild(titleEl);
    
    const grid = document.createElement("div");
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "repeat(auto-fill, minmax(120px, 1fr))";
    grid.style.gap = "12px";
    grid.style.marginTop = "16px";
    
    images.forEach((img) => {
        const card = document.createElement("div");
        card.style.cursor = "pointer";
        card.style.border = currentDefaultId === img.id ? "2px solid var(--accent)" : "1px solid var(--border-soft)";
        card.style.borderRadius = "var(--radius-md)";
        card.style.padding = "8px";
        card.style.transition = "border-color 0.2s";
        
        const imgEl = document.createElement("img");
        imgEl.src = img.url;
        imgEl.style.width = "100%";
        imgEl.style.aspectRatio = "2 / 3";
        imgEl.style.objectFit = "cover";
        imgEl.style.borderRadius = "var(--radius-md)";
        
        const label = document.createElement("div");
        label.textContent = currentDefaultId === img.id ? "✓ Seçili" : "Seç";
        label.style.fontSize = "11px";
        label.style.marginTop = "4px";
        label.style.textAlign = "center";
        label.style.color = currentDefaultId === img.id ? "var(--accent)" : "var(--text-muted)";
        
        card.appendChild(imgEl);
        card.appendChild(label);
        
        card.addEventListener("click", async () => {
            // Default görseli güncelle
            await setGroupDefaultImage(title, img.id);
            modal.remove();
            await renderCharacterImages();
        });
        
        grid.appendChild(card);
    });
    
    content.appendChild(grid);
    
    const closeBtn = document.createElement("button");
    closeBtn.className = "btn subtle";
    closeBtn.textContent = "Kapat";
    closeBtn.style.marginTop = "16px";
    closeBtn.addEventListener("click", () => modal.remove());
    content.appendChild(closeBtn);
    
    modal.appendChild(content);
    modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.remove();
    });
    
    document.body.appendChild(modal);
}

async function setGroupDefaultImage(title, imageId) {
    try {
        // Backend'de defaultImageId'yi güncelle
        const response = await fetch(`${BACKEND_BASE_URL}/api/characters/${currentCharacterId}/images`);
        if (!response.ok) throw new Error("Resimler yüklenemedi");
        
        const images = await response.json();
        const groupImages = images.filter(img => img.title === title);
        
        // Grup içindeki tüm resimleri güncelle
        for (const img of groupImages) {
            const updateData = {
                title: img.title,
                description: img.description || "",
                tags: img.tags || []
            };
            
            // Seçilen resim için defaultImageId = kendi id'si, diğerleri için null
            if (img.id === imageId) {
                updateData.defaultImageId = img.id;
            } else {
                // Diğer resimlerden defaultImageId'yi kaldır
                updateData.defaultImageId = null;
            }
            
            const updateResponse = await fetch(`${BACKEND_BASE_URL}/api/images/${img.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updateData)
            });
            
            if (!updateResponse.ok) {
                console.error(`Resim ${img.id} güncellenemedi`);
            }
        }
        
        showToast("Default görsel güncellendi", "success", 2000);
    } catch (err) {
        console.error("Default görsel güncellenirken hata:", err);
        alert("Default görsel güncellenemedi: " + err.message);
    }
}

function openImageModal(image = null) {
    editingImageId = image ? image.id : null;
    imageModalTitle.textContent = image ? "Resim Düzenle" : "Yeni Resim";

    if (image) {
        imageTitleInput.value = image.title || "";
        imageDescriptionInput.value = image.description || "";
        imagePositivePromptInput.value = image.positivePrompt || "";
        imageNegativePromptInput.value = image.negativePrompt || "";
        imageTagsInput.value = Array.isArray(image.tags) ? image.tags.join(", ") : (image.tags || "");
        imageFileInput.required = false;
        if (image.url) {
            imagePreview.src = image.url;
            imagePreviewWrapper.style.display = "block";
        }
    } else {
        imageForm.reset();
        imageFileInput.required = true;
        imagePreviewWrapper.style.display = "none";
    }

    imageModal.classList.remove("hidden");
}

function closeImageModal() {
    imageModal.classList.add("hidden");
    editingImageId = null;
    imageForm.reset();
    imagePreviewWrapper.style.display = "none";
}

function handleImageFileChange() {
    const file = imageFileInput.files[0];
    const errorEl = document.getElementById("image-file-error");
    
    if (!file) {
        imagePreviewWrapper.style.display = "none";
        if (errorEl) errorEl.textContent = "";
        return;
    }

    // Dosya boyutu kontrolü (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        if (errorEl) errorEl.textContent = "Dosya boyutu 5MB'dan büyük olamaz.";
        imageFileInput.value = "";
        imagePreviewWrapper.style.display = "none";
        return;
    }

    // Dosya tipi kontrolü
    if (!file.type.startsWith("image/")) {
        if (errorEl) errorEl.textContent = "Lütfen geçerli bir resim dosyası seçin.";
        imageFileInput.value = "";
        imagePreviewWrapper.style.display = "none";
        return;
    }

    if (errorEl) errorEl.textContent = "";

    const reader = new FileReader();
    reader.onload = function (e) {
        imagePreview.src = e.target.result;
        imagePreviewWrapper.style.display = "block";
    };
    reader.readAsDataURL(file);
}

async function handleImageFormSubmit(event) {
    event.preventDefault();

    const title = imageTitleInput.value.trim();
    if (!title) {
        alert("Resim başlığı gerekli.");
        return;
    }

    // Butonu disable ederek iki kere tıklamayı engelle
    const submitBtn = imageForm.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add("loading");
        submitBtn.textContent = "Kaydediliyor...";
    }

    try {
        let imageUrl = null;
        let fileName = "";

        // Yeni resim yükleniyorsa
        if (imageFileInput.files[0]) {
            const formData = new FormData();
            formData.append("file", imageFileInput.files[0]);

            const uploadResponse = await fetch(BACKEND_UPLOAD_URL, {
                method: "POST",
                body: formData
            });

            if (!uploadResponse.ok) throw new Error("Resim yüklenemedi");

            const uploadData = await uploadResponse.json();
            imageUrl = uploadData.url;
            fileName = uploadData.name || imageFileInput.files[0].name;
        }

        const description = imageDescriptionInput.value.trim();
        const positivePrompt = imagePositivePromptInput.value.trim();
        const negativePrompt = imageNegativePromptInput.value.trim();
        const tags = imageTagsInput.value.trim();

        if (editingImageId) {
            // Güncelle
            const updateData = {
                title,
                description,
                positivePrompt: positivePrompt || null,
                negativePrompt: negativePrompt || null,
                tags
            };
            if (imageUrl) {
                updateData.url = imageUrl;
                updateData.fileName = fileName;
            }

            const response = await fetch(`${BACKEND_BASE_URL}/api/images/${editingImageId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) throw new Error("Resim güncellenemedi");
        } else {
            // Yeni resim
            if (!imageUrl) {
                alert("Yeni resim için dosya seçmelisiniz.");
                return;
            }

            const response = await fetch(`${BACKEND_BASE_URL}/api/characters/${currentCharacterId}/images`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    url: imageUrl,
                    fileName: fileName,
                    title,
                    description,
                    positivePrompt: positivePrompt || null,
                    negativePrompt: negativePrompt || null,
                    tags,
                    createdByUserId: currentUser.username
                })
            });

            if (!response.ok) throw new Error("Resim eklenemedi");
        }

        closeImageModal();
        await renderCharacterImages();
    } catch (err) {
        console.error("Resim kaydedilirken hata:", err);
        alert("Resim kaydedilemedi: " + err.message);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.classList.remove("loading");
            submitBtn.textContent = "Save";
        }
    }
}

// Resim sıralamasını güncelle (drag & drop için)
async function handleImageReorder(draggedImageId, targetImageId, draggedGroupTitle = null, targetGroupTitle = null) {
    if (!currentCharacterId) return;

    // Loading toast göster (kısa süreli)
    showToast("Sıralama güncelleniyor...", "info", 2000);

    try {
        // Mevcut resimleri yükle
        const response = await fetch(`${BACKEND_BASE_URL}/api/characters/${currentCharacterId}/images`);
        if (!response.ok) throw new Error("Resimler yüklenemedi");
        
        const images = await response.json();
        
        // Resimleri başlığa göre grupla
        const groupedImages = {};
        images.forEach((img) => {
            const title = img.title || "İsimsiz";
            if (!groupedImages[title]) {
                groupedImages[title] = [];
            }
            groupedImages[title].push(img);
        });
        
        // Grup sıralamasını hesapla
        const groupKeys = Object.keys(groupedImages);
        const draggedGroupIndex = groupKeys.findIndex(key => {
            const group = groupedImages[key];
            return group.some(img => img.id === draggedImageId);
        });
        const targetGroupIndex = groupKeys.findIndex(key => {
            const group = groupedImages[key];
            return group.some(img => img.id === targetImageId);
        });
        
        if (draggedGroupIndex === -1 || targetGroupIndex === -1 || draggedGroupIndex === targetGroupIndex) return;
        
        // Grupları yeniden sırala
        const [draggedGroup] = groupKeys.splice(draggedGroupIndex, 1);
        groupKeys.splice(targetGroupIndex, 0, draggedGroup);
        
        // Yeni sıralamaya göre tüm resimlerin orderIndex'lerini güncelle
        let currentOrder = 0;
        const imageIds = [];
        
        groupKeys.forEach(groupTitle => {
            const groupImages = groupedImages[groupTitle];
            // Grup içindeki resimleri orderIndex'e göre sırala
            groupImages.sort((a, b) => {
                const aOrder = a.orderIndex !== undefined ? a.orderIndex : 999999;
                const bOrder = b.orderIndex !== undefined ? b.orderIndex : 999999;
                if (aOrder !== bOrder) return aOrder - bOrder;
                return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
            });
            
            // Her resmin ID'sini ekle
            groupImages.forEach(img => {
                imageIds.push(img.id);
            });
        });
        
        // Backend'e gönder
        const reorderResponse = await fetch(`${BACKEND_BASE_URL}/api/characters/${currentCharacterId}/images/reorder`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageIds })
        });
        
        if (!reorderResponse.ok) throw new Error("Sıralama güncellenemedi");
        
        // UI'ı yenile
        await renderCharacterImages();
        showToast("Sıralama güncellendi", "success");
    } catch (err) {
        console.error("Resim sıralaması güncellenirken hata:", err);
        showToast("Resim sıralaması güncellenemedi: " + err.message, "error");
    }
}

async function deleteImage(imageId) {
    if (!confirm("Bu resmi silmek istediğinize emin misiniz?")) return;

    // Loading toast göster
    const loadingToast = showToast("Resim siliniyor...", "info", 0); // 0 = süresiz

    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/images/${imageId}`, {
            method: "DELETE"
        });

        if (!response.ok) throw new Error("Resim silinemedi");

        // Yeni layout için resim kataloğunu yenile
        if (currentCharacterId) {
            await renderCharacterImagesPanel(currentCharacterId);
        }
        // Eski layout için de yenile (geriye dönük uyumluluk)
        await renderCharacterImages();
        
        showToast("Resim silindi", "success");
    } catch (err) {
        console.error("Resim silinirken hata:", err);
        showToast("Resim silinemedi: " + err.message, "error");
    }
}

let currentImageIndex = 0;
let allImagesForCarousel = [];

let currentGroupTitle = null; // Aktif katalog başlığı (sıralama için)

async function openImageViewModal(image, groupTitle = null, groupImages = null) {
    // Her zaman grup bilgisiyle çalış (katalog bazlı izolasyon)
    if (groupImages && groupImages.length > 0) {
        // Grup bilgisi var, sadece o gruba ait resimleri kullan
        allImagesForCarousel = [...groupImages]; // Copy array
        currentImageIndex = allImagesForCarousel.findIndex(img => img.id === image.id);
        if (currentImageIndex === -1) currentImageIndex = 0;
    } else {
        // Fallback: Sadece tıklanan resmi göster
        allImagesForCarousel = [image];
        currentImageIndex = 0;
    }
    
    // Katalog başlığını sakla (sıralama için)
    currentGroupTitle = groupTitle;

    renderImageCarousel();
    imageViewModal.classList.remove("hidden");
}

function renderImageCarousel() {
    const track = document.getElementById("image-carousel-track");
    const indicator = document.getElementById("image-carousel-indicator");
    const prevBtn = document.getElementById("prev-image-btn");
    const nextBtn = document.getElementById("next-image-btn");
    const container = track ? track.parentElement : null;
    
    if (!track || !container) return;

    track.innerHTML = "";
    
    const imageCount = allImagesForCarousel.length;
    
    // Maksimum 3 resim göster (aktif + 1 sol + 1 sağ)
    let startIndex = Math.max(0, currentImageIndex - 1);
    let endIndex = Math.min(imageCount, currentImageIndex + 2);
    
    // Eğer başta veya sonda isek, 3 resim göstermek için ayarla
    if (currentImageIndex === 0) {
        endIndex = Math.min(imageCount, 3);
    } else if (currentImageIndex === imageCount - 1) {
        startIndex = Math.max(0, imageCount - 3);
    }
    
    const visibleImages = allImagesForCarousel.slice(startIndex, endIndex);
    const visibleCount = visibleImages.length;
    
    // Track class'ını ayarla
    track.className = "image-carousel-track";
    if (visibleCount === 1) {
        track.classList.add("single-item");
    } else if (visibleCount === 2) {
        track.classList.add("double-item");
    } else {
        track.classList.add("triple-item");
    }

    // Butonları göster/gizle
    if (imageCount > 1) {
        if (prevBtn) prevBtn.style.display = "block";
        if (nextBtn) nextBtn.style.display = "block";
    } else {
        if (prevBtn) prevBtn.style.display = "none";
        if (nextBtn) nextBtn.style.display = "none";
    }

    // Resimleri oluştur (sadece görünür olanlar)
    visibleImages.forEach((img, visibleIndex) => {
        const actualIndex = startIndex + visibleIndex;
        const item = document.createElement("div");
        item.className = "image-carousel-item";
        if (actualIndex === currentImageIndex) {
            item.classList.add("active");
        }
        
        // Sıralama modunda özel stil
        if (isReorderMode) {
            item.classList.add("reorder-mode");
            item.style.cursor = "move";
            // Sıralama modunda scale'i zorla 1 yap
            item.style.transform = "scale(1)";
            item.style.opacity = actualIndex === currentImageIndex ? "1" : "0.85";
        }

        const imgEl = document.createElement("img");
        imgEl.src = img.url;
        imgEl.alt = img.title;
        imgEl.style.objectFit = "contain";
        imgEl.style.width = "auto";
        imgEl.style.height = "auto";
        imgEl.style.maxWidth = "100%";
        imgEl.style.maxHeight = "100%";
        imgEl.style.display = "block";
        
        // Görsel yüklendikten sonra gerçek boyutlarına göre item'ı ayarla
        imgEl.addEventListener("load", function() {
            const naturalWidth = this.naturalWidth;
            const naturalHeight = this.naturalHeight;
            if (!naturalWidth || !naturalHeight) return;
            
            const aspectRatio = naturalWidth / naturalHeight;
            
            // Ekran boyutlarını al (viewport)
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            // Görseli orijinal boyutlarında göster, sadece viewport'a sığdır
            let itemWidth, itemHeight;
            
            // Orijinal boyutları kullan, sadece viewport'tan taşmaması için sınırla
            const maxWidth = viewportWidth * 0.85; // Viewport'un %85'i
            const maxHeight = viewportHeight * 0.85; // Viewport'un %85'i
            
            if (aspectRatio > 1) {
                // Yatay görsel - genişliği öncelikli
                itemWidth = Math.min(maxWidth, naturalWidth);
                itemHeight = itemWidth / aspectRatio;
                
                // Yükseklik viewport'u aşarsa, yüksekliği sınırla
                if (itemHeight > maxHeight) {
                    itemHeight = maxHeight;
                    itemWidth = itemHeight * aspectRatio;
                }
            } else {
                // Dikey görsel - yüksekliği öncelikli
                itemHeight = Math.min(maxHeight, naturalHeight);
                itemWidth = itemHeight * aspectRatio;
                
                // Genişlik viewport'u aşarsa, genişliği sınırla
                if (itemWidth > maxWidth) {
                    itemWidth = maxWidth;
                    itemHeight = itemWidth / aspectRatio;
                }
            }
            
            // Item'ın boyutunu ayarla (orijinal boyutlar)
            item.style.width = `${itemWidth}px`;
            item.style.height = `${itemHeight}px`;
            item.style.minWidth = `${itemWidth}px`;
            item.style.minHeight = `${itemHeight}px`;
            
            // Aktif görsel ise container'ı da resize et
            if (actualIndex === currentImageIndex) {
                resizeContainerToImage(itemWidth, itemHeight);
            }
            
            // Tüm görseller yüklendikten sonra track pozisyonunu ayarla
            const allImages = track.querySelectorAll("img");
            let loadedCount = 0;
            allImages.forEach(img => {
                if (img.complete) loadedCount++;
            });
            
            if (loadedCount === allImages.length) {
                updateCarouselPosition();
            }
        });
        
        // Görsel zaten yüklenmişse (cache'den)
        if (imgEl.complete) {
            imgEl.dispatchEvent(new Event('load'));
        }
        
        item.appendChild(imgEl);
        
        // Sıralama modunda yukarı/aşağı butonları ekle
        if (isReorderMode && currentUser && currentUser.role === "admin") {
            const controls = document.createElement("div");
            controls.className = "reorder-controls";
            controls.style.position = "absolute";
            controls.style.top = "8px";
            controls.style.right = "8px";
            controls.style.display = "flex";
            controls.style.flexDirection = "column";
            controls.style.gap = "4px";
            controls.style.zIndex = "20";
            
            // Yukarı butonu
            if (actualIndex > 0) {
                const upBtn = document.createElement("button");
                upBtn.innerHTML = "↑";
                upBtn.className = "btn subtle";
                upBtn.style.padding = "4px 8px";
                upBtn.style.fontSize = "14px";
                upBtn.style.minWidth = "auto";
                upBtn.title = "Yukarı taşı";
                upBtn.addEventListener("click", async (e) => {
                    e.stopPropagation();
                    
                    // Loading state
                    upBtn.disabled = true;
                    upBtn.classList.add("loading");
                    
                    try {
                        // Resimleri yer değiştir
                        [allImagesForCarousel[actualIndex], allImagesForCarousel[actualIndex - 1]] = 
                            [allImagesForCarousel[actualIndex - 1], allImagesForCarousel[actualIndex]];
                        currentImageIndex = actualIndex - 1;
                        renderImageCarousel();
                        updateImageInfo();
                    } finally {
                        upBtn.disabled = false;
                        upBtn.classList.remove("loading");
                    }
                });
                controls.appendChild(upBtn);
            }
            
            // Aşağı butonu
            if (actualIndex < allImagesForCarousel.length - 1) {
                const downBtn = document.createElement("button");
                downBtn.innerHTML = "↓";
                downBtn.className = "btn subtle";
                downBtn.style.padding = "4px 8px";
                downBtn.style.fontSize = "14px";
                downBtn.style.minWidth = "auto";
                downBtn.title = "Aşağı taşı";
                downBtn.addEventListener("click", async (e) => {
                    e.stopPropagation();
                    
                    // Loading state
                    downBtn.disabled = true;
                    downBtn.classList.add("loading");
                    
                    try {
                        // Resimleri yer değiştir
                        [allImagesForCarousel[actualIndex], allImagesForCarousel[actualIndex + 1]] = 
                            [allImagesForCarousel[actualIndex + 1], allImagesForCarousel[actualIndex]];
                        currentImageIndex = actualIndex + 1;
                        renderImageCarousel();
                        updateImageInfo();
                    } finally {
                        downBtn.disabled = false;
                        downBtn.classList.remove("loading");
                    }
                });
                controls.appendChild(downBtn);
            }
            
            if (controls.children.length > 0) {
                item.appendChild(controls);
            }
        }

        item.addEventListener("click", () => {
            if (!isReorderMode && actualIndex !== currentImageIndex) {
                currentImageIndex = actualIndex;
                renderImageCarousel();
                updateImageInfo();
                // Container'ı yeni aktif görsel boyutuna göre resize et
                setTimeout(() => {
                    const activeItem = track.querySelector(".image-carousel-item.active");
                    if (activeItem) {
                        resizeContainerToImage(activeItem.offsetWidth, activeItem.offsetHeight);
                    }
                }, 100);
            }
        });

        track.appendChild(item);
    });

    // Track pozisyonunu ayarla - aktif resmi tam ortaya getir
    function updateCarouselPosition() {
        const activeItem = track.querySelector(".image-carousel-item.active");
        if (activeItem && visibleCount > 1) {
            const containerRect = container.getBoundingClientRect();
            const containerWidth = containerRect.width;
            const activeItemRect = activeItem.getBoundingClientRect();
            const itemWidth = activeItemRect.width;
            const gap = parseFloat(getComputedStyle(track).gap) || 16;
            
            // Aktif resmin pozisyonunu hesapla
            const trackRect = track.getBoundingClientRect();
            const activePosition = activeItemRect.left - trackRect.left;
            const centerOffset = (containerWidth / 2) - (itemWidth / 2);
            const translateX = centerOffset - activePosition;
            
            track.style.transform = `translateX(${translateX}px)`;
        } else {
            track.style.transform = "translateX(0)";
        }
    }
    
    // Container'ı aktif görsel boyutuna göre resize et
    function resizeContainerToImage(imgWidth, imgHeight) {
        if (!container) return;
        
        // Padding ve gap için ekstra alan
        const padding = 40; // 20px her iki taraftan
        const gap = 16;
        
        // Container'ı görsel boyutuna göre ayarla
        const newWidth = imgWidth + padding;
        const newHeight = imgHeight + padding;
        
        container.style.width = `${newWidth}px`;
        container.style.height = `${newHeight}px`;
        container.style.maxWidth = `${newWidth}px`;
        container.style.minWidth = `${newWidth}px`;
        container.style.minHeight = `${newHeight}px`;
    }
    
    // İlk pozisyon ayarı
    setTimeout(updateCarouselPosition, 100);
    
    // Tüm görseller yüklendikten sonra tekrar ayarla
    const allImages = track.querySelectorAll("img");
    let loadedImages = 0;
    allImages.forEach(img => {
        if (img.complete) {
            loadedImages++;
        } else {
            img.addEventListener("load", () => {
                loadedImages++;
                if (loadedImages === allImages.length) {
                    setTimeout(updateCarouselPosition, 50);
                    // Aktif görseli bul ve container'ı resize et
                    const activeItem = track.querySelector(".image-carousel-item.active");
                    if (activeItem) {
                        const activeImg = activeItem.querySelector("img");
                        if (activeImg && activeImg.complete) {
                            resizeContainerToImage(activeItem.offsetWidth, activeItem.offsetHeight);
                        }
                    }
                }
            }, { once: true });
        }
    });
    
    if (loadedImages === allImages.length) {
        setTimeout(updateCarouselPosition, 100);
        // Aktif görseli bul ve container'ı resize et
        const activeItem = track.querySelector(".image-carousel-item.active");
        if (activeItem) {
            setTimeout(() => {
                resizeContainerToImage(activeItem.offsetWidth, activeItem.offsetHeight);
            }, 150);
        }
    }

    // Indicator
    if (indicator) {
        indicator.textContent = `${currentImageIndex + 1} / ${imageCount}`;
    }
    
    updateImageInfo();
}

function updateImageInfo() {
    if (allImagesForCarousel.length === 0) return;
    
    const image = allImagesForCarousel[currentImageIndex];
    imageViewTitle.textContent = image.title;
    imageViewDescription.textContent = image.description || "";
    
    if (image.tags && image.tags.length > 0) {
        const tagsText = Array.isArray(image.tags) ? image.tags.join(", ") : image.tags;
        imageViewTags.textContent = `Etiketler: ${tagsText}`;
        imageViewTags.style.display = "block";
    } else {
        imageViewTags.style.display = "none";
    }
    
    // Positive ve Negative Prompt'ları göster
    if (imageViewPrompts) {
        if (image.positivePrompt || image.negativePrompt) {
            imageViewPrompts.innerHTML = "";
            
            if (image.positivePrompt) {
                const positiveDiv = document.createElement("div");
                positiveDiv.style.marginTop = "12px";
                positiveDiv.style.padding = "8px";
                positiveDiv.style.backgroundColor = "var(--bg-soft)";
                positiveDiv.style.borderRadius = "4px";
                positiveDiv.style.fontSize = "13px";
                const positiveLabel = document.createElement("div");
                positiveLabel.textContent = "Positive Prompt:";
                positiveLabel.style.fontWeight = "bold";
                positiveLabel.style.marginBottom = "4px";
                positiveLabel.style.color = "var(--accent)";
                const positiveText = document.createElement("div");
                positiveText.textContent = image.positivePrompt;
                positiveText.style.color = "var(--text-secondary)";
                positiveText.style.whiteSpace = "pre-wrap";
                positiveText.style.wordBreak = "break-word";
                positiveDiv.appendChild(positiveLabel);
                positiveDiv.appendChild(positiveText);
                imageViewPrompts.appendChild(positiveDiv);
            }
            
            if (image.negativePrompt) {
                const negativeDiv = document.createElement("div");
                negativeDiv.style.marginTop = "12px";
                negativeDiv.style.padding = "8px";
                negativeDiv.style.backgroundColor = "var(--bg-soft)";
                negativeDiv.style.borderRadius = "4px";
                negativeDiv.style.fontSize = "13px";
                const negativeLabel = document.createElement("div");
                negativeLabel.textContent = "Negative Prompt:";
                negativeLabel.style.fontWeight = "bold";
                negativeLabel.style.marginBottom = "4px";
                negativeLabel.style.color = "var(--danger)";
                const negativeText = document.createElement("div");
                negativeText.textContent = image.negativePrompt;
                negativeText.style.color = "var(--text-secondary)";
                negativeText.style.whiteSpace = "pre-wrap";
                negativeText.style.wordBreak = "break-word";
                negativeDiv.appendChild(negativeLabel);
                negativeDiv.appendChild(negativeText);
                imageViewPrompts.appendChild(negativeDiv);
            }
            
            imageViewPrompts.style.display = "block";
        } else {
            imageViewPrompts.style.display = "none";
        }
    }
    
    // Silme ve sıralama butonlarını göster/gizle (sadece admin için)
    if (deleteImageFromViewBtn) {
        if (currentUser && currentUser.role === "admin" && allImagesForCarousel.length > 0) {
            deleteImageFromViewBtn.style.display = "block";
        } else {
            deleteImageFromViewBtn.style.display = "none";
        }
    }
    if (reorderImagesInViewBtn) {
        if (currentUser && currentUser.role === "admin" && allImagesForCarousel.length > 1) {
            reorderImagesInViewBtn.style.display = "block";
            reorderImagesInViewBtn.textContent = isReorderMode ? "✓ Sıralamayı Kaydet" : "↕️ Sıralamayı Değiştir";
        } else {
            reorderImagesInViewBtn.style.display = "none";
        }
    }
}

function nextImage() {
    if (allImagesForCarousel.length === 0) return;
    currentImageIndex = (currentImageIndex + 1) % allImagesForCarousel.length;
    renderImageCarousel();
    // Container'ı yeni aktif görsel boyutuna göre resize et
    setTimeout(() => {
        const track = document.getElementById("image-carousel-track");
        const container = track ? track.parentElement : null;
        if (container) {
            const activeItem = track.querySelector(".image-carousel-item.active");
            if (activeItem) {
                resizeContainerToImage(activeItem.offsetWidth, activeItem.offsetHeight);
            }
        }
    }, 150);
}

function prevImage() {
    if (allImagesForCarousel.length === 0) return;
    currentImageIndex = (currentImageIndex - 1 + allImagesForCarousel.length) % allImagesForCarousel.length;
    renderImageCarousel();
}

async function toggleReorderMode() {
    console.log("toggleReorderMode çağrıldı", {
        currentUser: currentUser?.role,
        imageCount: allImagesForCarousel.length,
        isReorderMode
    });
    
    if (!currentUser || currentUser.role !== "admin") {
        console.warn("Kullanıcı admin değil");
        return;
    }
    
    if (allImagesForCarousel.length < 2) {
        console.warn("Yeterli resim yok:", allImagesForCarousel.length);
        showToast("Sıralama için en az 2 resim gerekli", "info");
        return;
    }
    
    if (isReorderMode) {
        // Kaydet modu
        console.log("Sıralama kaydediliyor...");
        
        // Loading state
        if (reorderImagesInViewBtn) {
            reorderImagesInViewBtn.disabled = true;
            reorderImagesInViewBtn.classList.add("loading");
            const originalText = reorderImagesInViewBtn.textContent;
            reorderImagesInViewBtn.textContent = "Kaydediliyor...";
        }
        
        try {
            // Sıralamayı backend'e kaydet
            const updates = allImagesForCarousel.map((img, index) => ({
                id: img.id,
                orderIndex: index
            }));
            
            console.log("Güncellenecek resimler:", updates);
            
            // Her resmi güncelle
            for (const update of updates) {
                const response = await fetch(`${BACKEND_BASE_URL}/api/images/${update.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orderIndex: update.orderIndex })
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Resim ${update.id} güncellenemedi: ${errorText}`);
                }
            }
            
            isReorderMode = false;
            showToast("Sıralama kaydedildi", "success");
            
            // Resim kataloğunu yenile
            if (currentCharacterId) {
                await renderCharacterImagesPanel(currentCharacterId);
            }
            await renderCharacterImages();
            
            // Slide view'ı yeniden render et
            renderImageCarousel();
            updateImageInfo();
            
            // Karakter resim kartlarını yeniden render et (drag handle'ların görünür olması için)
            if (currentCharacterId) {
                await renderCharacterImagesPanel(currentCharacterId);
            }
            await renderCharacterImages();
        } catch (err) {
            console.error("Sıralama kaydedilirken hata:", err);
            showToast("Sıralama kaydedilemedi: " + err.message, "error");
        } finally {
            // Loading state'i kaldır
            if (reorderImagesInViewBtn) {
                reorderImagesInViewBtn.disabled = false;
                reorderImagesInViewBtn.classList.remove("loading");
                reorderImagesInViewBtn.textContent = "↕️ Sıralamayı Değiştir";
            }
        }
    } else {
        // Sıralama moduna geç
        console.log("Sıralama modu aktif ediliyor");
        isReorderMode = true;
        renderImageCarousel();
        updateImageInfo();
        showToast("Sıralama modu aktif - yukarı/aşağı butonlarını kullanın", "info");
        
        // Karakter resim kartlarını yeniden render et (drag handle'ların görünür olması için)
        if (currentCharacterId) {
            await renderCharacterImagesPanel(currentCharacterId);
        }
        await renderCharacterImages();
    }
}

async function handleDeleteImageFromView() {
    if (allImagesForCarousel.length === 0) return;
    
    const image = allImagesForCarousel[currentImageIndex];
    if (!image || !image.id) return;
    
    if (!confirm(`"${image.title || 'Bu resim'}" adlı resmi silmek istediğinize emin misiniz?`)) {
        return;
    }
    
    // Loading state
    if (deleteImageFromViewBtn) {
        deleteImageFromViewBtn.disabled = true;
        deleteImageFromViewBtn.classList.add("loading");
        const originalText = deleteImageFromViewBtn.textContent;
        deleteImageFromViewBtn.textContent = "Siliniyor...";
    }
    
    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/images/${image.id}`, {
            method: "DELETE"
        });

        if (!response.ok) throw new Error("Resim silinemedi");

        // Carousel'dan resmi çıkar
        allImagesForCarousel.splice(currentImageIndex, 1);
        
        // Eğer resim kalmadıysa modal'ı kapat
        if (allImagesForCarousel.length === 0) {
            closeImageViewModal();
            // Resim kataloğunu yenile
            if (currentCharacterId) {
                await renderCharacterImagesPanel(currentCharacterId);
            }
            await renderCharacterImages();
            showToast("Resim silindi", "success");
            return;
        }
        
        // Index'i ayarla (silinen resim son resimse bir öncekine geç)
        if (currentImageIndex >= allImagesForCarousel.length) {
            currentImageIndex = allImagesForCarousel.length - 1;
        }
        
        // Carousel'ı yeniden render et
        renderImageCarousel();
        
        // Resim kataloğunu yenile
        if (currentCharacterId) {
            await renderCharacterImagesPanel(currentCharacterId);
        }
        await renderCharacterImages();
        
        showToast("Resim silindi", "success");
    } catch (err) {
        console.error("Resim silinirken hata:", err);
        showToast("Resim silinemedi: " + err.message, "error");
    }
}

function closeImageViewModal() {
    imageViewModal.classList.add("hidden");
}

// Ana görseli ayarla
async function setMainImage(imageId, imageUrl, character = null) {
    const char = character || currentCharacter;
    if (!currentCharacterId || !char) {
        console.error("setMainImage: currentCharacterId veya character bulunamadı");
        return;
    }

    try {
        const response = await fetch(`${getCharactersUrl(currentProjectId)}/${currentCharacterId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...char,
                mainImageId: imageId,
                mainImageUrl: imageUrl
            })
        });

        if (!response.ok) throw new Error("Ana görsel güncellenemedi");

        const updatedCharacter = await response.json();
        currentCharacter = updatedCharacter;

        // Ana görseli güncelle (detay panelinde)
        if (detailMainImage) {
            detailMainImage.src = imageUrl;
            detailMainImage.style.display = "block";
        }
        if (characterDetailMainImage) {
            characterDetailMainImage.src = imageUrl;
            characterDetailMainImage.style.display = "block";
        }

        // Resim kataloğunu yenile
        if (currentCharacterId) {
            await renderCharacterImagesPanel(currentCharacterId);
        }
        await renderCharacterImages();
        
        // Karakter listesini de güncelle
        if (charactersSidebarList) {
            await renderCharactersSidebar();
        }
        if (mainScreen && !mainScreen.classList.contains("hidden")) {
            await renderCharacters();
        }
        
        showToast("Ana görsel güncellendi", "success");
    } catch (err) {
        console.error("Ana görsel ayarlanırken hata:", err);
        alert("Ana görsel ayarlanamadı: " + err.message);
    }
}

// --- Kullanıcı Yönetimi (Admin) ---

async function openUsersManagement() {
    mainScreen.classList.add("hidden");
    usersManagementScreen.classList.remove("hidden");
    await renderUsers();
}

async function renderUsers() {
    if (!usersList) {
        usersList = document.getElementById("users-list");
    }
    if (!usersList) {
        console.error("users-list element bulunamadı!");
        return;
    }
    
    usersList.innerHTML = "";

    let usersToDisplay = [];
    
    try {
        // Önce backend'den kullanıcıları yüklemeyi dene
        const response = await fetch(`${BACKEND_BASE_URL}/api/users`);
        if (response.ok) {
            const backendUsers = await response.json();
            usersToDisplay = backendUsers;
        } else {
            throw new Error("Backend'den kullanıcılar yüklenemedi");
        }
    } catch (err) {
        console.warn("Backend'den kullanıcılar yüklenemedi, frontend'deki users array'i kullanılıyor:", err);
        // Backend'den yüklenemezse, frontend'deki users array'ini kullan
        usersToDisplay = users || [];
    }

    // Eğer hala boşsa ve frontend'deki users array'i varsa, onu kullan
    if (usersToDisplay.length === 0 && users && users.length > 0) {
        usersToDisplay = users;
    }

    if (usersToDisplay.length === 0) {
        const info = document.createElement("p");
        info.textContent = "Henüz kullanıcı yok.";
        info.style.color = "#a0a0b3";
        usersList.appendChild(info);
        return;
    }

    usersToDisplay.forEach((user) => {
            const userCard = document.createElement("div");
            userCard.className = "character-card";
            userCard.style.marginBottom = "12px";

            const nameEl = document.createElement("div");
            nameEl.className = "character-name";
            nameEl.textContent = `${user.username} (${user.role})`;

            const projectsEl = document.createElement("div");
            projectsEl.className = "character-meta";
            projectsEl.textContent = `Projeler: ${user.projects.length > 0 ? user.projects.join(", ") : "Yok"}`;

            userCard.appendChild(nameEl);
            userCard.appendChild(projectsEl);

            const actions = document.createElement("div");
            actions.className = "character-actions";

            const editBtn = document.createElement("button");
            editBtn.className = "btn subtle";
            editBtn.textContent = "Düzenle";
            editBtn.addEventListener("click", () => openUserModal(user));

            const deleteBtn = document.createElement("button");
            deleteBtn.className = "btn subtle";
            deleteBtn.textContent = "Sil";
            deleteBtn.style.color = "var(--danger)";
            deleteBtn.addEventListener("click", () => {
                // ID yoksa username kullan
                const userId = user.id || user.username;
                deleteUser(userId);
            });

            actions.appendChild(editBtn);
            actions.appendChild(deleteBtn);
            userCard.appendChild(actions);

            usersList.appendChild(userCard);
        });
}

function openUserModal(user = null) {
    // ID yoksa username kullan
    editingUserId = user ? (user.id || user.username) : null;
    userModalTitle.textContent = user ? "Kullanıcı Düzenle" : "Yeni Kullanıcı";
    
    if (user) {
        userUsernameInput.value = user.username;
        userPasswordInput.value = "";
        userPasswordInput.required = false;
        userRoleInput.value = user.role;
        userProjectsInput.value = Array.isArray(user.projects) ? user.projects.join(", ") : "";
    } else {
        userForm.reset();
        userPasswordInput.required = true;
    }
    
    userModal.classList.remove("hidden");
}

function closeUserModal() {
    userModal.classList.add("hidden");
    editingUserId = null;
    userForm.reset();
}

async function handleUserFormSubmit(event) {
    event.preventDefault();

    const username = userUsernameInput.value.trim();
    const password = userPasswordInput.value;
    const role = userRoleInput.value;
    const projectsStr = userProjectsInput.value.trim();

    if (!username) {
        alert("Kullanıcı adı gerekli.");
        return;
    }

    if (!editingUserId && !password) {
        alert("Yeni kullanıcı için şifre gerekli.");
        return;
    }

    const projects = projectsStr ? projectsStr.split(",").map(p => p.trim()).filter(p => p) : [];

    // Loading state
    const submitBtn = userForm.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add("loading");
        const originalText = submitBtn.textContent;
        submitBtn.textContent = "Kaydediliyor...";
    }

    try {
        if (editingUserId) {
            // Güncelle
            const updateData = {
                username,
                role,
                projects
            };
            if (password) {
                updateData.password = password;
            }

            const response = await fetch(`${BACKEND_BASE_URL}/api/users/${editingUserId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) throw new Error("Kullanıcı güncellenemedi");
        } else {
            // Yeni kullanıcı
            const response = await fetch(`${BACKEND_BASE_URL}/api/users`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username,
                    password,
                    role,
                    projects
                })
            });

            if (!response.ok) throw new Error("Kullanıcı oluşturulamadı");
        }

        closeUserModal();
        await renderUsers();
        showToast(editingUserId ? "Kullanıcı güncellendi" : "Kullanıcı oluşturuldu", "success");
    } catch (err) {
        console.error("Kullanıcı kaydedilirken hata:", err);
        showToast("Kullanıcı kaydedilemedi: " + err.message, "error");
    } finally {
        const submitBtn = userForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.classList.remove("loading");
            submitBtn.textContent = "Save";
        }
    }
}

async function deleteUser(userId) {
    if (!confirm("Bu kullanıcıyı silmek istediğinize emin misiniz?")) return;

    // Loading toast göster
    showToast("Kullanıcı siliniyor...", "info", 0); // 0 = süresiz

    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/users/${userId}`, {
            method: "DELETE"
        });

        if (!response.ok) throw new Error("Kullanıcı silinemedi");

        await renderUsers();
        showToast("Kullanıcı silindi", "success");
    } catch (err) {
        console.error("Kullanıcı silinirken hata:", err);
        showToast("Kullanıcı silinemedi: " + err.message, "error");
    }
}

// ========================================
// SENARYO EDITOR - Story Graph Editor
// ========================================

// Senaryo veri yapısı
let scenarioData = {
    chapters: [] // { id, title, content, x, y, parts: [{ id, title, content, x, y }] }
};

let selectedNodeId = null;
let selectedNodeType = null; // "chapter" veya "part"
let draggedNode = null;
let dragOffset = { x: 0, y: 0 };

// Canvas pan özelliği (mouse ile sürükleme) - Global state
let canvasPanState = {
    isPanning: false,
    panStart: { x: 0, y: 0 },
    scrollStart: { x: 0, y: 0 }
};

// Senaryo ekranını aç
async function openScenarioScreen() {
    if (!currentProjectId) {
        showToast("Önce bir proje seçin", "error");
        return;
    }
    
    const project = projects.find(p => p.id === currentProjectId);
    if (!project) return;
    
    // Senaryo verilerini backend'den yükle
    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/projects/${currentProjectId}/scenario`);
        if (response.ok) {
            const data = await response.json();
            scenarioData = data;
        } else {
            // Backend'de yoksa boş başlat
            scenarioData = { chapters: [] };
        }
    } catch (err) {
        console.error("Senaryo yüklenirken hata:", err);
        // Hata durumunda localStorage'dan yükle (fallback)
        const savedData = localStorage.getItem(`scenario_${currentProjectId}`);
        if (savedData) {
            try {
                scenarioData = JSON.parse(savedData);
            } catch (e) {
                scenarioData = { chapters: [] };
            }
        } else {
            scenarioData = { chapters: [] };
        }
    }
    
    // Ekranı göster
    if (mainScreen) mainScreen.classList.add("hidden");
    if (scenarioScreen) {
        scenarioScreen.classList.remove("hidden");
        if (scenarioProjectTitle) {
            scenarioProjectTitle.textContent = `${project.name} - Senaryo`;
        }
    }
    
    // Senaryo editor'ü render et
    renderScenarioEditor();
    
    // Canvas pan özelliğini başlat (sadece bir kez)
    setTimeout(() => {
        setupCanvasPan();
        if (scenarioCanvas) {
            scenarioCanvas.style.cursor = "grab";
        }
    }, 100);
}

// Senaryo ekranını kapat
async function closeScenarioScreen() {
    if (scenarioScreen) scenarioScreen.classList.add("hidden");
    if (mainScreen) mainScreen.classList.remove("hidden");
    
    // Senaryo verilerini backend'e kaydet
    if (currentProjectId) {
        try {
            await saveScenarioToBackend();
        } catch (err) {
            console.error("Senaryo kaydedilemedi:", err);
            // Fallback: localStorage'a kaydet
            localStorage.setItem(`scenario_${currentProjectId}`, JSON.stringify(scenarioData));
        }
    }
}

// Senaryoyu backend'e kaydet
async function saveScenarioToBackend() {
    if (!currentProjectId) return;
    
    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/projects/${currentProjectId}/scenario`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(scenarioData)
        });
        
        if (!response.ok) {
            throw new Error("Senaryo kaydedilemedi");
        }
        
        // Başarılı kayıt sonrası localStorage'ı temizle (artık backend'de)
        localStorage.removeItem(`scenario_${currentProjectId}`);
    } catch (err) {
        console.error("Senaryo kaydedilirken hata:", err);
        throw err;
    }
}

// Senaryo editor'ü render et
function renderScenarioEditor() {
    renderScenarioOutline();
    renderScenarioCanvas();
    renderScenarioProperties();
}

// Outline listesini render et
function renderScenarioOutline() {
    if (!scenarioOutlineList) return;
    
    scenarioOutlineList.innerHTML = "";
    
    if (scenarioData.chapters.length === 0) {
        const emptyMsg = document.createElement("p");
        emptyMsg.textContent = "Henüz bölüm eklenmedi";
        emptyMsg.style.color = "var(--text-muted)";
        emptyMsg.style.fontSize = "13px";
        scenarioOutlineList.appendChild(emptyMsg);
        return;
    }
    
    scenarioData.chapters.forEach((chapter, chapterIndex) => {
        // Chapter item container
        const chapterItemContainer = document.createElement("div");
        chapterItemContainer.className = "scenario-outline-item-container";
        
        // Chapter item
        const chapterItem = document.createElement("div");
        chapterItem.className = `scenario-outline-item chapter ${selectedNodeId === chapter.id && selectedNodeType === "chapter" ? "selected" : ""}`;
        chapterItem.innerHTML = `<span>${chapterIndex + 1}. ${chapter.title || "Yeni Bölüm"}</span>`;
        chapterItem.dataset.nodeId = chapter.id;
        chapterItem.dataset.nodeType = "chapter";
        chapterItem.addEventListener("click", (e) => {
            if (!e.target.closest(".scenario-outline-action-btn")) {
                selectNode(chapter.id, "chapter");
            }
        });
        
        // Chapter action buttons
        const chapterActions = document.createElement("div");
        chapterActions.className = "scenario-outline-actions";
        
        const addPartToChapterBtn = document.createElement("button");
        addPartToChapterBtn.className = "scenario-outline-action-btn add-btn";
        addPartToChapterBtn.innerHTML = "+";
        addPartToChapterBtn.title = "Kısım Ekle";
        addPartToChapterBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            addPartToChapter(chapter.id);
        });
        
        const deleteChapterBtn = document.createElement("button");
        deleteChapterBtn.className = "scenario-outline-action-btn delete-btn";
        deleteChapterBtn.innerHTML = "×";
        deleteChapterBtn.title = "Sil";
        deleteChapterBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            deleteChapter(chapter.id);
        });
        
        chapterActions.appendChild(addPartToChapterBtn);
        chapterActions.appendChild(deleteChapterBtn);
        chapterItem.appendChild(chapterActions);
        chapterItemContainer.appendChild(chapterItem);
        
        // Part items
        chapter.parts.forEach((part, partIndex) => {
            const partItemContainer = document.createElement("div");
            partItemContainer.className = "scenario-outline-item-container";
            
            const partItem = document.createElement("div");
            partItem.className = `scenario-outline-item part ${selectedNodeId === part.id && selectedNodeType === "part" ? "selected" : ""}`;
            partItem.innerHTML = `<span>  ${chapterIndex + 1}.${partIndex + 1} ${part.title || "Yeni Kısım"}</span>`;
            partItem.dataset.nodeId = part.id;
            partItem.dataset.nodeType = "part";
            partItem.addEventListener("click", (e) => {
                if (!e.target.closest(".scenario-outline-action-btn")) {
                    selectNode(part.id, "part");
                }
            });
            
            // Part action buttons
            const partActions = document.createElement("div");
            partActions.className = "scenario-outline-actions";
            
            const deletePartBtn = document.createElement("button");
            deletePartBtn.className = "scenario-outline-action-btn delete-btn";
            deletePartBtn.innerHTML = "×";
            deletePartBtn.title = "Sil";
            deletePartBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                deletePart(chapter.id, part.id);
            });
            
            partActions.appendChild(deletePartBtn);
            partItem.appendChild(partActions);
            partItemContainer.appendChild(partItem);
            chapterItemContainer.appendChild(partItemContainer);
        });
        
        scenarioOutlineList.appendChild(chapterItemContainer);
    });
}

// Canvas'ı render et
function renderScenarioCanvas() {
    if (!scenarioCanvas) return;
    
    scenarioCanvas.innerHTML = "";
    
    // SVG için connector çizgileri (node'ların altında olmalı)
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.style.position = "absolute";
    svg.style.top = "0";
    svg.style.left = "0";
    svg.style.width = "100%";
    svg.style.height = "100%";
    svg.style.pointerEvents = "none";
    svg.style.zIndex = "0";
    scenarioCanvas.appendChild(svg);
    
    // Chapter node'larını render et
    scenarioData.chapters.forEach((chapter, chapterIndex) => {
        const chapterNode = createChapterNode(chapter, chapterIndex);
        if (chapterNode) scenarioCanvas.appendChild(chapterNode);
        
        // Part node'larını render et
        chapter.parts.forEach((part, partIndex) => {
            const partNode = createPartNode(part, chapter.id, partIndex);
            if (partNode) scenarioCanvas.appendChild(partNode);
            
            // Connector çizgisi ekle (4 bölgeden bağlantı)
            drawConnector(svg, chapter, part);
        });
    });
}

// Connector çizgisi çiz (4 bölgeden bağlantı)
function drawConnector(svg, chapter, part) {
    const chapterIndex = scenarioData.chapters.findIndex(c => c.id === chapter.id);
    const chapterX = chapter.x || (200 + chapterIndex * 400);
    const chapterY = chapter.y || 100;
    const chapterWidth = 200;
    const chapterHeight = 120;
    const chapterCenterX = chapterX + chapterWidth / 2;
    const chapterCenterY = chapterY + chapterHeight / 2;
    
    const partIndex = chapter.parts.findIndex(p => p.id === part.id);
    const partX = part.x || (chapterX + 250);
    const partY = part.y || (chapterY + partIndex * 120);
    const partWidth = 180;
    const partHeight = 100;
    const partCenterX = partX + partWidth / 2;
    const partCenterY = partY + partHeight / 2;
    
    // Hangi bağlantı noktalarını kullanacağımızı belirle
    let chapterPoint = { x: 0, y: 0 };
    let partPoint = { x: 0, y: 0 };
    
    // Chapter'dan part'a en yakın noktaları bul
    const dx = partCenterX - chapterCenterX;
    const dy = partCenterY - chapterCenterY;
    
    // Chapter bağlantı noktası
    if (Math.abs(dx) > Math.abs(dy)) {
        // Yatay mesafe daha fazla
        chapterPoint.x = dx > 0 ? chapterX + chapterWidth : chapterX; // Sağ veya Sol
        chapterPoint.y = chapterY + chapterHeight / 2; // Orta
    } else {
        // Dikey mesafe daha fazla
        chapterPoint.x = chapterX + chapterWidth / 2; // Orta
        chapterPoint.y = dy > 0 ? chapterY + chapterHeight : chapterY; // Alt veya Üst
    }
    
    // Part bağlantı noktası
    if (Math.abs(dx) > Math.abs(dy)) {
        partPoint.x = dx > 0 ? partX : partX + partWidth; // Sol veya Sağ
        partPoint.y = partY + partHeight / 2; // Orta
    } else {
        partPoint.x = partX + partWidth / 2; // Orta
        partPoint.y = dy > 0 ? partY : partY + partHeight; // Üst veya Alt
    }
    
    // Çizgi çiz
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("class", "scenario-connector");
    line.setAttribute("x1", chapterPoint.x);
    line.setAttribute("y1", chapterPoint.y);
    line.setAttribute("x2", partPoint.x);
    line.setAttribute("y2", partPoint.y);
    svg.appendChild(line);
}

// Canvas pan özelliğini başlat (sadece bir kez)
function setupCanvasPan() {
    if (!scenarioCanvas) return;
    
    // Canvas container'ı bul
    const canvasContainer = scenarioCanvas.parentElement;
    if (!canvasContainer) return;
    
    // Eğer zaten event listener'lar eklenmişse, önce kaldır
    if (canvasContainer.dataset.panSetup === "true") {
        canvasContainer.removeEventListener("mousedown", handleCanvasMouseDown);
        document.removeEventListener("mousemove", handleCanvasMouseMove);
        document.removeEventListener("mouseup", handleCanvasMouseUp);
    }
    
    canvasContainer.dataset.panSetup = "true";
    
    // Canvas container'a mousedown listener ekle (capture phase'de çalışsın ki diğer elementlerden önce yakalansın)
    canvasContainer.addEventListener("mousedown", handleCanvasMouseDown, true);
    
    // Global mouse move ve mouse up listener'ları
    document.addEventListener("mousemove", handleCanvasMouseMove);
    document.addEventListener("mouseup", handleCanvasMouseUp);
}

function handleCanvasMouseDown(e) {
    if (!scenarioCanvas) return;
    
    const canvasContainer = scenarioCanvas.parentElement;
    
    const target = e.target;
    
    // Eğer bir node'a, button'a, textarea'ya, input'a veya SVG'ye tıklandıysa pan başlatma
    if (target.closest(".scenario-node")) {
        // Node'a tıklandı, pan başlatma
        return;
    }
    if (target.closest("button")) return;
    if (target.closest("textarea")) return;
    if (target.closest("input")) return;
    if (target.tagName === "svg" || target.tagName === "line" || target.closest("svg")) return;
    
    // Node drag işlemi devam ediyorsa pan başlatma
    if (draggedNode) return;
    
    // Canvas'ın kendisine veya boş alanına tıklandıysa pan başlat
    // Canvas container veya canvas'ın kendisine tıklandıysa pan başlat
    if (!target.closest(".scenario-node")) {
        canvasPanState.isPanning = true;
        canvasPanState.panStart.x = e.clientX;
        canvasPanState.panStart.y = e.clientY;
        
        const container = canvasContainer || scenarioCanvas;
        canvasPanState.scrollStart.x = container.scrollLeft;
        canvasPanState.scrollStart.y = container.scrollTop;
        container.style.cursor = "grabbing";
        e.preventDefault();
        e.stopPropagation();
    }
}

function handleCanvasMouseMove(e) {
    if (!canvasPanState.isPanning || !scenarioCanvas) return;
    
    const dx = e.clientX - canvasPanState.panStart.x;
    const dy = e.clientY - canvasPanState.panStart.y;
    
    const canvasContainer = scenarioCanvas.parentElement;
    if (canvasContainer) {
        // Container'ın scroll değerlerini güncelle
        const newScrollLeft = canvasPanState.scrollStart.x - dx;
        const newScrollTop = canvasPanState.scrollStart.y - dy;
        
        canvasContainer.scrollLeft = newScrollLeft;
        canvasContainer.scrollTop = newScrollTop;
    } else {
        // Fallback: canvas'ın kendisini scroll et
        scenarioCanvas.scrollLeft = canvasPanState.scrollStart.x - dx;
        scenarioCanvas.scrollTop = canvasPanState.scrollStart.y - dy;
    }
}

function handleCanvasMouseUp() {
    if (canvasPanState.isPanning && scenarioCanvas) {
        canvasPanState.isPanning = false;
        const container = scenarioCanvas.parentElement || scenarioCanvas;
        container.style.cursor = "grab";
    }
}

// Chapter node oluştur
function createChapterNode(chapter, index) {
    const node = document.createElement("div");
    node.className = `scenario-node chapter ${selectedNodeId === chapter.id ? "selected" : ""}`;
    node.style.left = `${chapter.x || (200 + index * 400)}px`;
    node.style.top = `${chapter.y || 100}px`;
    node.dataset.nodeId = chapter.id;
    node.dataset.nodeType = "chapter";
    
    // Drag handle (üst kısım)
    const dragHandle = document.createElement("div");
    dragHandle.className = "scenario-node-drag-handle";
    dragHandle.innerHTML = `
        <div class="scenario-node-label">Bölüm</div>
        <div class="scenario-node-title">${chapter.title || "Yeni Bölüm"}</div>
    `;
    
    // İçerik textarea
    const contentTextarea = document.createElement("textarea");
    contentTextarea.className = "scenario-node-content";
    contentTextarea.placeholder = "Senaryo içeriği...";
    contentTextarea.value = chapter.content || "";
    contentTextarea.rows = 3;
    let chapterContentTimeout = null;
    contentTextarea.addEventListener("input", (e) => {
        chapter.content = e.target.value;
        if (currentProjectId) {
            // Debounce ile kaydetme
            if (chapterContentTimeout) clearTimeout(chapterContentTimeout);
            chapterContentTimeout = setTimeout(() => {
                saveScenarioToBackend().catch(err => {
                    console.error("Senaryo kaydedilemedi:", err);
                    localStorage.setItem(`scenario_${currentProjectId}`, JSON.stringify(scenarioData));
                });
            }, 500);
        }
    });
    contentTextarea.addEventListener("click", (e) => {
        e.stopPropagation();
    });
    
    // Sil butonu
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "scenario-node-delete";
    deleteBtn.innerHTML = "×";
    deleteBtn.title = "Sil";
    deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteChapter(chapter.id);
    });
    
    node.appendChild(dragHandle);
    node.appendChild(contentTextarea);
    node.appendChild(deleteBtn);
    
    // Drag & drop (sadece drag handle için)
    makeNodeDraggable(node, chapter, dragHandle);
    
    // Click to select
    node.addEventListener("click", (e) => {
        if (e.target === deleteBtn || e.target.closest(".scenario-node-delete")) return;
        if (e.target === contentTextarea || e.target.closest("textarea")) return;
        e.stopPropagation();
        selectNode(chapter.id, "chapter");
    });
    
    return node;
}

// Part node oluştur
function createPartNode(part, chapterId, index) {
    const chapter = scenarioData.chapters.find(c => c.id === chapterId);
    if (!chapter) return null;
    
    const chapterIndex = scenarioData.chapters.findIndex(c => c.id === chapterId);
    const chapterX = chapter.x || (200 + chapterIndex * 400);
    const chapterY = chapter.y || 100;
    
    const node = document.createElement("div");
    node.className = `scenario-node part ${selectedNodeId === part.id ? "selected" : ""}`;
    node.style.left = `${part.x || (chapterX + 250)}px`;
    node.style.top = `${part.y || (chapterY + index * 120)}px`;
    node.dataset.nodeId = part.id;
    node.dataset.nodeType = "part";
    
    // Drag handle (üst kısım)
    const dragHandle = document.createElement("div");
    dragHandle.className = "scenario-node-drag-handle";
    dragHandle.innerHTML = `
        <div class="scenario-node-label">Kısım</div>
        <div class="scenario-node-title">${part.title || "Yeni Kısım"}</div>
    `;
    
    // İçerik textarea
    const contentTextarea = document.createElement("textarea");
    contentTextarea.className = "scenario-node-content";
    contentTextarea.placeholder = "Senaryo içeriği...";
    contentTextarea.value = part.content || "";
    contentTextarea.rows = 2;
    contentTextarea.addEventListener("input", (e) => {
        part.content = e.target.value;
        if (currentProjectId) {
            // Debounce ile kaydetme
            if (partContentTimeout) clearTimeout(partContentTimeout);
            partContentTimeout = setTimeout(() => {
                saveScenarioToBackend().catch(err => {
                    console.error("Senaryo kaydedilemedi:", err);
                    localStorage.setItem(`scenario_${currentProjectId}`, JSON.stringify(scenarioData));
                });
            }, 500);
        }
    });
    contentTextarea.addEventListener("click", (e) => {
        e.stopPropagation();
    });
    
    // Sil butonu
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "scenario-node-delete";
    deleteBtn.innerHTML = "×";
    deleteBtn.title = "Sil";
    deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        deletePart(chapterId, part.id);
    });
    
    node.appendChild(dragHandle);
    node.appendChild(contentTextarea);
    node.appendChild(deleteBtn);
    
    // Drag & drop (sadece drag handle için)
    makeNodeDraggable(node, part, dragHandle);
    
    // Click to select
    node.addEventListener("click", (e) => {
        if (e.target === deleteBtn || e.target.closest(".scenario-node-delete")) return;
        if (e.target === contentTextarea || e.target.closest("textarea")) return;
        e.stopPropagation();
        selectNode(part.id, "part");
    });
    
    return node;
}

// Node'u draggable yap
function makeNodeDraggable(node, data, dragHandle) {
    let isDragging = false;
    const handle = dragHandle || node;
    
    handle.addEventListener("mousedown", (e) => {
        // Textarea veya input içindeyse drag başlatma
        if (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT" || e.target.closest("textarea") || e.target.closest("input")) {
            return;
        }
        
        isDragging = true;
        draggedNode = node;
        
        // Node'un mevcut pozisyonunu al
        const nodeRect = node.getBoundingClientRect();
        const canvasRect = scenarioCanvas.getBoundingClientRect();
        
        // Mouse'un node içindeki offset'ini hesapla
        dragOffset.x = e.clientX - nodeRect.left;
        dragOffset.y = e.clientY - nodeRect.top;
        
        node.style.cursor = "grabbing";
        node.style.zIndex = "1000";
        e.preventDefault();
        e.stopPropagation();
    });
    
    const handleMouseMove = (e) => {
        if (!isDragging || !draggedNode) return;
        
        const canvasRect = scenarioCanvas.getBoundingClientRect();
        
        // Yeni pozisyonu hesapla (mouse pozisyonu - offset)
        const newX = e.clientX - canvasRect.left - dragOffset.x + scenarioCanvas.scrollLeft;
        const newY = e.clientY - canvasRect.top - dragOffset.y + scenarioCanvas.scrollTop;
        
        // Minimum pozisyon kontrolü
        const minX = 0;
        const minY = 0;
        const finalX = Math.max(minX, newX);
        const finalY = Math.max(minY, newY);
        
        draggedNode.style.left = `${finalX}px`;
        draggedNode.style.top = `${finalY}px`;
        
        // Data'yı güncelle
        const nodeId = draggedNode.dataset.nodeId;
        const nodeType = draggedNode.dataset.nodeType;
        
        if (nodeType === "chapter") {
            const chapter = scenarioData.chapters.find(c => c.id === nodeId);
            if (chapter) {
                chapter.x = finalX;
                chapter.y = finalY;
            }
        } else if (nodeType === "part") {
            scenarioData.chapters.forEach(chapter => {
                const part = chapter.parts.find(p => p.id === nodeId);
                if (part) {
                    part.x = finalX;
                    part.y = finalY;
                }
            });
        }
        
        // Connector'ları yeniden çiz
        renderScenarioCanvas();
    };
    
    const handleMouseUp = () => {
        if (isDragging) {
            isDragging = false;
            if (draggedNode) {
                draggedNode.style.cursor = "move";
                draggedNode.style.zIndex = "";
            }
            draggedNode = null;
            
            // Canvas pan state'ini sıfırla (node drag bittiğinde)
            canvasPanState.isPanning = false;
            
            // Veriyi kaydet
            if (currentProjectId) {
                localStorage.setItem(`scenario_${currentProjectId}`, JSON.stringify(scenarioData));
            }
            
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        }
    };
    
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
}

// Node seç
function selectNode(nodeId, nodeType) {
    selectedNodeId = nodeId;
    selectedNodeType = nodeType;
    
    // Outline'ı güncelle
    renderScenarioOutline();
    
    // Canvas'ı güncelle
    renderScenarioCanvas();
    
    // Properties'i güncelle
    renderScenarioProperties();
}

// Properties panel'i render et
function renderScenarioProperties() {
    if (!scenarioPropertiesContent) return;
    
    if (!selectedNodeId || !selectedNodeType) {
        scenarioPropertiesContent.innerHTML = '<p style="color: var(--text-muted); font-size: 13px;">Bir node seçin</p>';
        return;
    }
    
    let nodeData = null;
    if (selectedNodeType === "chapter") {
        nodeData = scenarioData.chapters.find(c => c.id === selectedNodeId);
    } else {
        scenarioData.chapters.forEach(chapter => {
            const part = chapter.parts.find(p => p.id === selectedNodeId);
            if (part) nodeData = part;
        });
    }
    
    if (!nodeData) return;
    
    const label = selectedNodeType === "chapter" ? "Bölüm Başlığı" : "Kısım Başlığı";
    
    scenarioPropertiesContent.innerHTML = `
        <label>
            ${label}
            <input type="text" id="scenario-node-title-input" value="${nodeData.title || ""}" />
        </label>
        <label>
            İçerik
            <textarea id="scenario-node-content-input" rows="6" placeholder="Senaryo içeriği...">${nodeData.content || ""}</textarea>
        </label>
    `;
    
    const titleInput = document.getElementById("scenario-node-title-input");
    if (titleInput) {
        // Debounce ile kaydetme
        let titleTimeout = null;
        titleInput.addEventListener("input", (e) => {
            nodeData.title = e.target.value;
            
            // Sadece node title'ını güncelle, tüm editor'ü render etme
            const nodeElement = scenarioCanvas.querySelector(`[data-node-id="${selectedNodeId}"]`);
            if (nodeElement) {
                const titleElement = nodeElement.querySelector(".scenario-node-title");
                if (titleElement) {
                    titleElement.textContent = nodeData.title || (selectedNodeType === "chapter" ? "Yeni Bölüm" : "Yeni Kısım");
                }
            }
            
            // Outline'ı güncelle
            const outlineItem = scenarioOutlineList.querySelector(`[data-node-id="${selectedNodeId}"]`);
            if (outlineItem) {
                const span = outlineItem.querySelector("span");
                if (span) {
                    if (selectedNodeType === "chapter") {
                        const chapterIndex = scenarioData.chapters.findIndex(c => c.id === selectedNodeId);
                        span.textContent = `${chapterIndex + 1}. ${nodeData.title || "Yeni Bölüm"}`;
                    } else {
                        scenarioData.chapters.forEach((chapter, chapterIndex) => {
                            const partIndex = chapter.parts.findIndex(p => p.id === selectedNodeId);
                            if (partIndex !== -1) {
                                span.textContent = `  ${chapterIndex + 1}.${partIndex + 1} ${nodeData.title || "Yeni Kısım"}`;
                            }
                        });
                    }
                }
            }
            
            // Debounce ile kaydetme (500ms)
            if (titleTimeout) clearTimeout(titleTimeout);
            titleTimeout = setTimeout(() => {
                if (currentProjectId) {
                    saveScenarioToBackend().catch(err => {
                        console.error("Senaryo kaydedilemedi:", err);
                        // Fallback: localStorage'a kaydet
                        localStorage.setItem(`scenario_${currentProjectId}`, JSON.stringify(scenarioData));
                    });
                }
            }, 500);
        });
    }
    
    const contentInput = document.getElementById("scenario-node-content-input");
    if (contentInput) {
        contentInput.addEventListener("input", (e) => {
            nodeData.content = e.target.value;
            // Veriyi kaydet
            if (currentProjectId) {
                localStorage.setItem(`scenario_${currentProjectId}`, JSON.stringify(scenarioData));
            }
        });
    }
}

// Yeni chapter ekle
function addChapter() {
    const newChapter = {
        id: `chapter_${Date.now()}`,
        title: "Yeni Bölüm",
        content: "",
        x: 200 + scenarioData.chapters.length * 400,
        y: 100,
        parts: []
    };
    
    scenarioData.chapters.push(newChapter);
    renderScenarioEditor();
    
    // Yeni chapter'ı seç
    selectNode(newChapter.id, "chapter");
    
    // Veriyi kaydet
    if (currentProjectId) {
        localStorage.setItem(`scenario_${currentProjectId}`, JSON.stringify(scenarioData));
    }
}

// Chapter sil
function deleteChapter(chapterId) {
    if (!confirm("Bu bölümü ve içindeki tüm kısımları silmek istediğinize emin misiniz?")) {
        return;
    }
    
    const index = scenarioData.chapters.findIndex(c => c.id === chapterId);
    if (index !== -1) {
        scenarioData.chapters.splice(index, 1);
        selectedNodeId = null;
        selectedNodeType = null;
        renderScenarioEditor();
        
        // Veriyi kaydet
        if (currentProjectId) {
            saveScenarioToBackend().catch(err => {
                console.error("Senaryo kaydedilemedi:", err);
                localStorage.setItem(`scenario_${currentProjectId}`, JSON.stringify(scenarioData));
            });
        }
        
        showToast("Bölüm silindi", "success");
    }
}

// Part sil
function deletePart(chapterId, partId) {
    if (!confirm("Bu kısmı silmek istediğinize emin misiniz?")) {
        return;
    }
    
    const chapter = scenarioData.chapters.find(c => c.id === chapterId);
    if (chapter) {
        const partIndex = chapter.parts.findIndex(p => p.id === partId);
        if (partIndex !== -1) {
            chapter.parts.splice(partIndex, 1);
            selectedNodeId = null;
            selectedNodeType = null;
            renderScenarioEditor();
            
            // Veriyi kaydet
            if (currentProjectId) {
                saveScenarioToBackend().catch(err => {
                    console.error("Senaryo kaydedilemedi:", err);
                    localStorage.setItem(`scenario_${currentProjectId}`, JSON.stringify(scenarioData));
                });
            }
            
            showToast("Kısım silindi", "success");
        }
    }
}

// Yeni part ekle
function addPart() {
    // Seçili chapter'ı bul veya ilk chapter'ı kullan
    let targetChapter = null;
    
    if (selectedNodeType === "chapter" && selectedNodeId) {
        targetChapter = scenarioData.chapters.find(c => c.id === selectedNodeId);
    } else if (selectedNodeType === "part" && selectedNodeId) {
        // Part seçiliyse, o part'ın chapter'ını bul
        scenarioData.chapters.forEach(chapter => {
            if (chapter.parts.some(p => p.id === selectedNodeId)) {
                targetChapter = chapter;
            }
        });
    }
    
    // Eğer chapter yoksa, ilk chapter'ı kullan veya yeni chapter oluştur
    if (!targetChapter) {
        if (scenarioData.chapters.length === 0) {
            addChapter();
            targetChapter = scenarioData.chapters[0];
        } else {
            targetChapter = scenarioData.chapters[0];
        }
    }
    
    addPartToChapter(targetChapter.id);
}

// Belirli bir chapter'a part ekle
function addPartToChapter(chapterId) {
    const targetChapter = scenarioData.chapters.find(c => c.id === chapterId);
    if (!targetChapter) return;
    
    const chapterIndex = scenarioData.chapters.findIndex(c => c.id === chapterId);
    const chapterX = targetChapter.x || (200 + chapterIndex * 400);
    const chapterY = targetChapter.y || 100;
    const newPart = {
        id: `part_${Date.now()}`,
        title: "Yeni Kısım",
        content: "",
        x: chapterX + 250,
        y: chapterY + targetChapter.parts.length * 120
    };
    
    targetChapter.parts.push(newPart);
    renderScenarioEditor();
    
    // Yeni part'ı seç
    selectNode(newPart.id, "part");
    
    // Veriyi kaydet
    if (currentProjectId) {
        localStorage.setItem(`scenario_${currentProjectId}`, JSON.stringify(scenarioData));
    }
}

// Canvas view'ı resetle - tüm node'ları görünür yap
function resetCanvasView() {
    if (!scenarioCanvas) return;
    
    const canvasContainer = scenarioCanvas.parentElement;
    if (!canvasContainer) return;
    
    if (scenarioData.chapters.length === 0) {
        canvasContainer.scrollTo({ top: 0, left: 0, behavior: "smooth" });
        return;
    }
    
    // Tüm node'ların pozisyonlarını topla
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    
    scenarioData.chapters.forEach((chapter, chapterIndex) => {
        const chapterX = chapter.x || (200 + chapterIndex * 400);
        const chapterY = chapter.y || 100;
        minX = Math.min(minX, chapterX);
        minY = Math.min(minY, chapterY);
        maxX = Math.max(maxX, chapterX + 220); // Chapter genişliği
        maxY = Math.max(maxY, chapterY + 110); // Chapter yüksekliği
        
        chapter.parts.forEach((part, partIndex) => {
            const partX = part.x || (chapterX + 250);
            const partY = part.y || (chapterY + partIndex * 120);
            minX = Math.min(minX, partX);
            minY = Math.min(minY, partY);
            maxX = Math.max(maxX, partX + 200); // Part genişliği
            maxY = Math.max(maxY, partY + 90); // Part yüksekliği
        });
    });
    
    // Canvas container boyutlarını al
    const containerRect = canvasContainer.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    
    // Node'ların merkez noktasını hesapla
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    // Scroll pozisyonunu hesapla (merkezi container'ın ortasına getir)
    const scrollX = centerX - containerWidth / 2;
    const scrollY = centerY - containerHeight / 2;
    
    // Smooth scroll
    canvasContainer.scrollTo({
        left: Math.max(0, scrollX),
        top: Math.max(0, scrollY),
        behavior: "smooth"
        });
}

document.addEventListener("DOMContentLoaded", init);

