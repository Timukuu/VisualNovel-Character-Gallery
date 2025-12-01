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
let currentUserInfoEl, logoutBtn, usersManagementBtn, themeToggleBtn, blurToggleBtn;

// Yeni layout DOM referansları (initializeEventListeners içinde alınacak)
let projectListEl, addProjectBtn, charactersSidebarSection, sidebarProjectTitle;
let characterSearchInput, addCharacterSidebarBtn, characterFiltersEl, charactersSidebarList;
let characterDetailPanel, emptyState, characterDetailContent;
let detailMainImage, detailFullName, detailMeta, detailProjectBadge;
let traitsDisplay, traitsEdit, traitsTextarea, editTraitsBtn;
let addImageBtnPanel, tagFiltersEl, characterImagesGrid;

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
const characterImagesGrid = document.getElementById("character-images-grid");
const addImageBtn = document.getElementById("add-image-btn");

// Resim modal
const imageModal = document.getElementById("image-modal");
const imageModalBackdrop = document.getElementById("image-modal-backdrop");
const imageForm = document.getElementById("image-form");
const imageModalTitle = document.getElementById("image-modal-title");
const imageTitleInput = document.getElementById("image-title");
const imageDescriptionInput = document.getElementById("image-description");
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

function loadJSON(path) {
    return fetch(path).then((res) => {
        if (!res.ok) {
            throw new Error("HTTP " + res.status);
        }
        return res.json();
    });
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
    loginErrorEl.textContent = "";

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
        loginErrorEl.textContent = "Kullanıcı adı ve şifre gerekli.";
        return;
    }

    const user = users.find((u) => u.username === username && u.password === password);

    if (!user) {
        loginErrorEl.textContent = "Kullanıcı adı veya şifre hatalı.";
        return;
    }

    currentUser = user;

    // Session'ı localStorage'a kaydet
    localStorage.setItem("currentUser", JSON.stringify({
        username: user.username,
        role: user.role,
        projects: user.projects
    }));

    // Ekran geçişi
    loginScreen.classList.add("hidden");
    mainScreen.classList.remove("hidden");

    // Kullanıcı bilgisi
    currentUserInfoEl.textContent = `${currentUser.username} (${currentUser.role})`;

    // Admin ise kullanıcı yönetimi butonunu göster
    if (currentUser.role === "admin" && usersManagementBtn) {
        usersManagementBtn.style.display = "block";
    } else if (usersManagementBtn) {
        usersManagementBtn.style.display = "none";
    }

    // Projeleri backend'den yükle
    await loadProjectsFromBackend();
    currentProjectId = null;
    currentProjectTitleEl.textContent = "Proje Seçilmedi";
    charactersContainer.innerHTML = "";
    addCharacterBtn.disabled = true;
}

function handleLogout() {
    currentUser = null;
    currentProjectId = null;
    currentCharacterId = null;

    // Session'ı temizle
    localStorage.removeItem("currentUser");

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
    projectListEl.innerHTML = '<li class="loading-overlay" style="list-style: none;"><div class="loading-content"><div class="loading-spinner"></div><span>Projeler yükleniyor...</span></div></li>';
    
    try {
        const response = await fetch(BACKEND_PROJECTS_URL);
        if (!response.ok) throw new Error("Projeler yüklenemedi");
        projects = await response.json();
        renderProjects();
    } catch (err) {
        console.error("Projeler yüklenirken hata:", err);
        projectListEl.innerHTML = '<li style="color: var(--danger);">Projeler yüklenemedi.</li>';
        alert("Projeler yüklenemedi. Konsolu kontrol edin.");
    }
}

async function renderProjects() {
    projectListEl.innerHTML = "";

    if (!currentUser) return;

    // Admin ise "Proje Ekle" butonunu göster
    if (currentUser.role === "admin") {
        addProjectBtn.style.display = "block";
    } else {
        addProjectBtn.style.display = "none";
    }

    const userProjectIds = currentUser.projects || [];
    const userProjects = projects.filter((p) => userProjectIds.includes(p.id));

    if (userProjects.length === 0) {
        const emptyMsg = document.createElement("div");
        emptyMsg.textContent = "Bu kullanıcıya atanmış proje yok.";
        emptyMsg.style.fontSize = "13px";
        emptyMsg.style.color = "var(--text-muted)";
        emptyMsg.style.padding = "12px";
        projectListEl.appendChild(emptyMsg);
        return;
    }

    // Karakter sayılarını yükle
    const projectCharacterCounts = {};
    for (const project of userProjects) {
        try {
            const response = await fetch(getCharactersUrl(project.id));
            if (response.ok) {
                const characters = await response.json();
                projectCharacterCounts[project.id] = characters.length;
            }
        } catch (err) {
            projectCharacterCounts[project.id] = 0;
        }
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
        await loadProjectsFromBackend();
    } catch (err) {
        console.error("Proje kaydedilirken hata:", err);
        alert("Proje kaydedilemedi: " + err.message);
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
    } catch (err) {
        console.error("Proje silinirken hata:", err);
        alert("Proje silinemedi: " + err.message);
    }
}

// --- Karakterler ---

// Sol sütunda karakter listesi
async function renderCharactersSidebar() {
    if (!charactersSidebarList) return;
    
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
                    await deleteCharacter(char.id);
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
}

// Sağ panelde karakter detayı göster
async function showCharacterDetail(character) {
    if (!characterDetailContent || !emptyState) return;

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
    }
    if (addImageBtnPanel) {
        addImageBtnPanel.style.display = currentUser.role === "admin" ? "block" : "none";
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

// Boş durum göster
function showEmptyState() {
    if (!emptyState || !characterDetailContent) return;
    emptyState.classList.remove("hidden");
    characterDetailContent.classList.add("hidden");
    currentCharacterId = null;
}

async function renderCharacters() {
    charactersContainer.innerHTML = "";

    if (!currentProjectId) {
        const info = document.createElement("p");
        info.textContent = "Soldan bir proje seçin.";
        info.style.color = "#a0a0b3";
        info.style.fontSize = "14px";
        charactersContainer.appendChild(info);
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
    try {
        const response = await fetch(`${getCharactersUrl(projectId)}/${characterId}`, {
            method: "DELETE"
        });

        if (!response.ok) throw new Error("Karakter silinemedi");

        await renderCharacters();
    } catch (err) {
        console.error("Karakter silinirken hata:", err);
        alert("Karakter silinemedi: " + err.message);
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

function init() {
    // Tema yükle
    initTheme();
    
    // Blur yükle
    initBlur();
    
    // Önce localStorage'dan session kontrolü yap
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
                        // Otomatik giriş yap
                        loginScreen.classList.add("hidden");
                        mainScreen.classList.remove("hidden");
                        currentUserInfoEl.textContent = `${currentUser.username} (${currentUser.role})`;
                        if (currentUser.role === "admin" && usersManagementBtn) {
                            usersManagementBtn.style.display = "block";
                        }
                        loadProjectsFromBackend();
                        initializeEventListeners();
                    } else {
                        initializeApp();
                    }
                })
                .catch(() => {
                    initializeApp();
                });
            return;
        } catch (err) {
            console.error("Session yüklenirken hata:", err);
        }
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
    const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
    const newTheme = currentTheme === "dark" ? "light" : "dark";
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
    const isBlurred = document.body.classList.contains("blur-images");
    const newBlurState = !isBlurred;
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

function initializeEventListeners() {
    // DOM referanslarını al
    loginScreen = document.getElementById("login-screen");
    mainScreen = document.getElementById("main-screen");
    characterDetailScreen = document.getElementById("character-detail-screen");
    loginForm = document.getElementById("login-form");
    usernameInput = document.getElementById("username");
    passwordInput = document.getElementById("password");
    loginErrorEl = document.getElementById("login-error");
    
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
    
    // Eski referanslar (geriye dönük uyumluluk için)
    currentProjectTitleEl = document.getElementById("current-project-title");
    addCharacterBtn = document.getElementById("add-character-btn");
    charactersContainer = document.getElementById("characters-container");
    
    // Blur toggle
    if (blurToggleBtn) {
        blurToggleBtn.addEventListener("click", toggleBlur);
    }
    
    // Tema toggle
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener("click", toggleTheme);
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
    // Bu fonksiyon renderCharacterImagesPanel içinde çağrılacak
    // Şimdilik basit bir implementasyon
    const imageCards = characterImagesGrid.querySelectorAll(".character-image-card");
    imageCards.forEach(card => {
        const cardTags = card.dataset.tags ? card.dataset.tags.split(",") : [];
        if (tag === "all" || cardTags.includes(tag)) {
            card.style.display = "";
        } else {
            card.style.display = "none";
        }
    });
}

// Resimleri grid'e render et
function renderImagesInGrid(images, container) {
    if (!container) return;
    
    images.forEach((img) => {
        const card = document.createElement("div");
        card.className = "character-image-card";
        card.dataset.imageId = img.id;
        card.dataset.tags = (img.tags || []).join(",");
        
        const imgEl = document.createElement("img");
        imgEl.src = img.url;
        imgEl.alt = img.title || "Görsel";
        imgEl.style.width = "100%";
        imgEl.style.aspectRatio = "2 / 3";
        imgEl.style.objectFit = "cover";
        imgEl.style.borderRadius = "var(--radius-md)";
        
        const titleEl = document.createElement("div");
        titleEl.textContent = img.title || "İsimsiz";
        titleEl.style.marginTop = "8px";
        titleEl.style.fontSize = "13px";
        titleEl.style.fontWeight = "500";
        
        card.appendChild(imgEl);
        card.appendChild(titleEl);
        
        card.addEventListener("click", () => {
            // openImageViewModal fonksiyonu zaten var, parametreleri kontrol et
            if (images && images.length > 0) {
                openImageViewModal(img, null, images);
            } else {
                openImageViewModal(img);
            }
        });
        
        container.appendChild(card);
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
                    // Gruplu resimler için sadece o gruba ait resimleri göster
                    if (isGrouped) {
                        openImageViewModal(defaultImage, title, groupImages);
                    } else {
                        openImageViewModal(defaultImage);
                    }
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

            // Ana görsel işareti
            if (currentCharacter && currentCharacter.mainImageId === defaultImage.id) {
                const mainBadge = document.createElement("div");
                mainBadge.textContent = "★ Ana Görsel";
                mainBadge.style.fontSize = "10px";
                mainBadge.style.color = "var(--accent)";
                mainBadge.style.fontWeight = "600";
                mainBadge.style.marginTop = "4px";
                imageCard.appendChild(mainBadge);
            }

            // Admin aksiyonları
            if (currentUser.role === "admin") {
                const actions = document.createElement("div");
                actions.style.display = "flex";
                actions.style.gap = "6px";
                actions.style.marginTop = "6px";
                actions.style.flexWrap = "wrap";

                // Ana görsel yap butonu
                if (!currentCharacter || currentCharacter.mainImageId !== defaultImage.id) {
                    const setMainBtn = document.createElement("button");
                    setMainBtn.className = "btn subtle";
                    setMainBtn.textContent = "Ana Görsel";
                    setMainBtn.style.fontSize = "11px";
                    setMainBtn.style.padding = "4px 8px";
                    setMainBtn.style.color = "var(--accent)";
                    setMainBtn.style.pointerEvents = "auto"; // Buton tıklamalarını aktif tut
                    setMainBtn.addEventListener("click", (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setMainImage(defaultImage.id, defaultImage.url);
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
        const tags = imageTagsInput.value.trim();

        if (editingImageId) {
            // Güncelle
            const updateData = {
                title,
                description,
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
    } catch (err) {
        console.error("Resim sıralaması güncellenirken hata:", err);
        alert("Resim sıralaması güncellenemedi: " + err.message);
    }
}

async function deleteImage(imageId) {
    if (!confirm("Bu resmi silmek istediğinize emin misiniz?")) return;

    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/images/${imageId}`, {
            method: "DELETE"
        });

        if (!response.ok) throw new Error("Resim silinemedi");

        await renderCharacterImages();
    } catch (err) {
        console.error("Resim silinirken hata:", err);
        alert("Resim silinemedi: " + err.message);
    }
}

let currentImageIndex = 0;
let allImagesForCarousel = [];

async function openImageViewModal(image, groupTitle = null, groupImages = null) {
    // Eğer grup bilgisi verilmişse, sadece o gruba ait resimleri kullan
    if (groupTitle && groupImages && groupImages.length > 0) {
        allImagesForCarousel = groupImages;
        currentImageIndex = allImagesForCarousel.findIndex(img => img.id === image.id);
        if (currentImageIndex === -1) currentImageIndex = 0;
    } else {
        // Grup bilgisi yoksa, tüm resimleri yükle (eski davranış - geriye dönük uyumluluk)
        try {
            const response = await fetch(`${BACKEND_BASE_URL}/api/characters/${currentCharacterId}/images`);
            if (response.ok) {
                allImagesForCarousel = await response.json();
                currentImageIndex = allImagesForCarousel.findIndex(img => img.id === image.id);
                if (currentImageIndex === -1) currentImageIndex = 0;
            } else {
                allImagesForCarousel = [image];
                currentImageIndex = 0;
            }
        } catch (err) {
            console.error("Resimler yüklenirken hata:", err);
            allImagesForCarousel = [image];
            currentImageIndex = 0;
        }
    }

    renderImageCarousel();
    imageViewModal.classList.remove("hidden");
}

function renderImageCarousel() {
    const track = document.getElementById("image-carousel-track");
    const indicator = document.getElementById("image-carousel-indicator");
    const prevBtn = document.getElementById("prev-image-btn");
    const nextBtn = document.getElementById("next-image-btn");
    
    if (!track) return;

    track.innerHTML = "";
    
    const imageCount = allImagesForCarousel.length;
    
    // Track class'ını ayarla
    track.className = "image-carousel-track";
    if (imageCount === 1) {
        track.classList.add("single-item");
    } else if (imageCount === 2) {
        track.classList.add("double-item");
    }

    // Butonları göster/gizle
    if (imageCount > 1) {
        prevBtn.style.display = "block";
        nextBtn.style.display = "block";
    } else {
        prevBtn.style.display = "none";
        nextBtn.style.display = "none";
    }

    // Resimleri oluştur
    allImagesForCarousel.forEach((img, index) => {
        const item = document.createElement("div");
        item.className = "image-carousel-item";
        if (index === currentImageIndex) {
            item.classList.add("active");
        }

        const imgEl = document.createElement("img");
        imgEl.src = img.url;
        imgEl.alt = img.title;
        item.appendChild(imgEl);

        item.addEventListener("click", () => {
            if (index !== currentImageIndex) {
                currentImageIndex = index;
                renderImageCarousel();
                updateImageInfo();
            }
        });

        track.appendChild(item);
    });

    // Track pozisyonunu ayarla (3 resim için)
    setTimeout(() => {
        if (imageCount > 3) {
            const activeItem = track.querySelector(".image-carousel-item.active");
            if (activeItem) {
                const itemWidth = activeItem.offsetWidth;
                const gap = 20;
                const containerWidth = track.parentElement.offsetWidth;
                const offset = -(currentImageIndex * (itemWidth + gap)) + (containerWidth / 2) - (itemWidth / 2);
                track.style.transform = `translateX(${offset}px)`;
            }
        } else {
            track.style.transform = "translateX(0)";
        }
    }, 50);

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
}

function nextImage() {
    if (allImagesForCarousel.length === 0) return;
    currentImageIndex = (currentImageIndex + 1) % allImagesForCarousel.length;
    renderImageCarousel();
}

function prevImage() {
    if (allImagesForCarousel.length === 0) return;
    currentImageIndex = (currentImageIndex - 1 + allImagesForCarousel.length) % allImagesForCarousel.length;
    renderImageCarousel();
}

function closeImageViewModal() {
    imageViewModal.classList.add("hidden");
}

// Ana görseli ayarla
async function setMainImage(imageId, imageUrl) {
    if (!currentCharacterId || !currentCharacter) return;

    try {
        const response = await fetch(`${getCharactersUrl(currentProjectId)}/${currentCharacterId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...currentCharacter,
                mainImageId: imageId,
                mainImageUrl: imageUrl
            })
        });

        if (!response.ok) throw new Error("Ana görsel güncellenemedi");

        const updatedCharacter = await response.json();
        currentCharacter = updatedCharacter;

        // Ana görseli güncelle
        characterDetailMainImage.src = imageUrl;
        characterDetailMainImage.style.display = "block";

        // Resim kataloğunu yenile
        await renderCharacterImages();
        
        // Karakter listesini de güncelle (eğer main screen'deyse)
        if (mainScreen && !mainScreen.classList.contains("hidden")) {
            await renderCharacters();
        }
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
    usersList.innerHTML = "";

    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/users`);
        if (!response.ok) throw new Error("Kullanıcılar yüklenemedi");
        
        const users = await response.json();

        if (users.length === 0) {
            const info = document.createElement("p");
            info.textContent = "Henüz kullanıcı yok.";
            info.style.color = "#a0a0b3";
            usersList.appendChild(info);
            return;
        }

        users.forEach((user) => {
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
            deleteBtn.addEventListener("click", () => deleteUser(user.id));

            actions.appendChild(editBtn);
            actions.appendChild(deleteBtn);
            userCard.appendChild(actions);

            usersList.appendChild(userCard);
        });
    } catch (err) {
        console.error("Kullanıcılar yüklenirken hata:", err);
        const error = document.createElement("p");
        error.textContent = "Kullanıcılar yüklenemedi.";
        error.style.color = "#f45b69";
        usersList.appendChild(error);
    }
}

function openUserModal(user = null) {
    editingUserId = user ? user.id : null;
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
    } catch (err) {
        console.error("Kullanıcı kaydedilirken hata:", err);
        alert("Kullanıcı kaydedilemedi: " + err.message);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.classList.remove("loading");
            submitBtn.textContent = "Save";
        }
    }
}

async function deleteUser(userId) {
    if (!confirm("Bu kullanıcıyı silmek istediğinize emin misiniz?")) return;

    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/users/${userId}`, {
            method: "DELETE"
        });

        if (!response.ok) throw new Error("Kullanıcı silinemedi");

        await renderUsers();
    } catch (err) {
        console.error("Kullanıcı silinirken hata:", err);
        alert("Kullanıcı silinemedi: " + err.message);
    }
}

document.addEventListener("DOMContentLoaded", init);
