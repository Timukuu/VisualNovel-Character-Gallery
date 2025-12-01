// Basit karakter katalog SPA'sı
// Not: Karakterler şimdilik sadece localStorage'da tutuluyor (tarayıcı bazlı).

let users = [];
let projects = [];

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

// DOM referansları
const loginScreen = document.getElementById("login-screen");
const mainScreen = document.getElementById("main-screen");
const characterDetailScreen = document.getElementById("character-detail-screen");

const loginForm = document.getElementById("login-form");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginErrorEl = document.getElementById("login-error");

const currentUserInfoEl = document.getElementById("current-user-info");
const logoutBtn = document.getElementById("logout-btn");
const usersManagementBtn = document.getElementById("users-management-btn");

const projectListEl = document.getElementById("project-list");
const currentProjectTitleEl = document.getElementById("current-project-title");
const addCharacterBtn = document.getElementById("add-character-btn");
const addProjectBtn = document.getElementById("add-project-btn");
const charactersContainer = document.getElementById("characters-container");

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

    // Formu temizle
    loginForm.reset();
    loginErrorEl.textContent = "";

    // Ekran geçişi
    mainScreen.classList.add("hidden");
    loginScreen.classList.remove("hidden");
}

// --- Projeler ---

async function loadProjectsFromBackend() {
    try {
        const response = await fetch(BACKEND_PROJECTS_URL);
        if (!response.ok) throw new Error("Projeler yüklenemedi");
        projects = await response.json();
        renderProjects();
    } catch (err) {
        console.error("Projeler yüklenirken hata:", err);
        alert("Projeler yüklenemedi. Konsolu kontrol edin.");
    }
}

function renderProjects() {
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
        const li = document.createElement("li");
        li.textContent = "Bu kullanıcıya atanmış proje yok.";
        li.style.fontSize = "13px";
        li.style.color = "#a0a0b3";
        projectListEl.appendChild(li);
        return;
    }

    userProjects.forEach((project) => {
        const li = document.createElement("li");
        li.className = "project-item";

        const projectWrapper = document.createElement("div");
        projectWrapper.style.display = "flex";
        projectWrapper.style.alignItems = "center";
        projectWrapper.style.gap = "6px";
        projectWrapper.style.width = "100%";

        const btn = document.createElement("button");
        btn.className = "project-btn";
        btn.style.flex = "1";
        btn.style.textAlign = "left";
        btn.style.display = "flex";
        btn.style.flexDirection = "column";
        btn.style.alignItems = "flex-start";
        btn.style.gap = "4px";
        
        const nameSpan = document.createElement("span");
        nameSpan.textContent = project.name;
        nameSpan.style.fontWeight = "500";
        
        btn.appendChild(nameSpan);
        
        if (project.description) {
            const descSpan = document.createElement("span");
            descSpan.textContent = project.description;
            descSpan.style.fontSize = "11px";
            descSpan.style.color = "var(--text-muted)";
            descSpan.style.overflow = "hidden";
            descSpan.style.textOverflow = "ellipsis";
            descSpan.style.whiteSpace = "nowrap";
            descSpan.style.maxWidth = "100%";
            btn.appendChild(descSpan);
        }
        
        btn.dataset.projectId = project.id;

        if (project.id === currentProjectId) {
            btn.classList.add("active");
        }

        btn.addEventListener("click", () => {
            currentProjectId = project.id;
            renderProjects();
            onProjectSelected(project);
        });

        projectWrapper.appendChild(btn);

        // Admin ise düzenle/sil butonları
        if (currentUser.role === "admin") {
            const editBtn = document.createElement("button");
            editBtn.className = "btn subtle";
            editBtn.textContent = "✎";
            editBtn.style.fontSize = "14px";
            editBtn.style.padding = "4px 8px";
            editBtn.style.minWidth = "28px";
            editBtn.style.cursor = "pointer";
            editBtn.title = "Düzenle";
            editBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                e.preventDefault();
                openProjectModal(project);
            });

            const deleteBtn = document.createElement("button");
            deleteBtn.className = "btn subtle";
            deleteBtn.textContent = "×";
            deleteBtn.style.fontSize = "18px";
            deleteBtn.style.padding = "2px 8px";
            deleteBtn.style.minWidth = "28px";
            deleteBtn.style.cursor = "pointer";
            deleteBtn.style.color = "var(--danger)";
            deleteBtn.title = "Sil";
            deleteBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                e.preventDefault();
                deleteProject(project.id);
            });

            projectWrapper.appendChild(editBtn);
            projectWrapper.appendChild(deleteBtn);
        }

        li.appendChild(projectWrapper);
        projectListEl.appendChild(li);
    });
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

    const characters = await loadCharacters(currentProjectId);

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

        // Görsel
        const imageWrapper = document.createElement("div");
        imageWrapper.className = "character-image-wrapper";

        if (ch.imageUrl) {
            const img = document.createElement("img");
            img.src = ch.imageUrl;
            img.alt = `${ch.firstName} ${ch.lastName}`;
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
    
    // Hangi ekrandan açıldığını kaydet
    if (characterDetailScreen && !characterDetailScreen.classList.contains("hidden")) {
        previousScreen = "characterDetail";
    } else {
        previousScreen = "main";
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
        if (character.imageUrl) {
            charImagePreview.src = character.imageUrl;
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
    if (previousScreen === "characterDetail" && currentCharacter) {
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
function handleCharacterFormSubmit(event) {
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
        submitBtn.textContent = "Yükleniyor...";
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
    // users JSON'unu yükle, projects backend'den gelecek
    Promise.all([loadJSON("data/users.json"), fetch(BACKEND_PROJECTS_URL).then(res => res.json())])
        .then(([usersData, projectsData]) => {
            users = usersData;
            projects = projectsData;

            // Event listeners
            loginForm.addEventListener("submit", handleLoginSubmit);
            logoutBtn.addEventListener("click", handleLogout);

            addCharacterBtn.addEventListener("click", openCharacterModal);
            discardCharacterBtn.addEventListener("click", closeCharacterModal);
            characterModalBackdrop.addEventListener("click", closeCharacterModal);

            characterForm.addEventListener("submit", handleCharacterFormSubmit);
            charImageInput.addEventListener("change", handleImageChange);

            // Proje yönetimi
            addProjectBtn.addEventListener("click", () => openProjectModal());
            discardProjectBtn.addEventListener("click", closeProjectModal);
            projectModalBackdrop.addEventListener("click", closeProjectModal);
            projectForm.addEventListener("submit", handleProjectFormSubmit);

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
                        characterDetailScreen.classList.add("hidden");
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
        })
        .catch((err) => {
            console.error("Başlangıç verileri yüklenemedi:", err);
            alert("Veri dosyaları (users.json / projects.json) yüklenemedi. Konsolu kontrol edin.");
        });
}

// --- Karakter Detay Ekranı ---

async function openCharacterDetail(character) {
    currentCharacter = character;
    currentCharacterId = character.id;

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

    // Ana görsel
    if (character.imageUrl) {
        characterDetailMainImage.src = character.imageUrl;
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

async function renderCharacterImages() {
    if (!currentCharacterId) return;

    characterImagesGrid.innerHTML = "";

    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/characters/${currentCharacterId}/images`);
        if (!response.ok) throw new Error("Görseller yüklenemedi");
        
        const images = await response.json();

        if (images.length === 0) {
            const info = document.createElement("p");
            info.textContent = "Henüz resim eklenmemiş.";
            info.style.color = "#a0a0b3";
            info.style.fontSize = "14px";
            characterImagesGrid.appendChild(info);
            return;
        }

        images.forEach((img) => {
            const imageCard = document.createElement("div");
            imageCard.className = "character-image-card";
            imageCard.style.cursor = "pointer";

            const imgEl = document.createElement("img");
            imgEl.src = img.url;
            imgEl.alt = img.title;
            imgEl.style.width = "100%";
            imgEl.style.height = "150px";
            imgEl.style.objectFit = "cover";
            imgEl.style.borderRadius = "8px";

            imgEl.addEventListener("click", () => {
                openImageViewModal(img);
            });

            const titleEl = document.createElement("div");
            titleEl.className = "character-image-title";
            titleEl.textContent = img.title;
            titleEl.style.marginTop = "8px";
            titleEl.style.fontSize = "13px";
            titleEl.style.fontWeight = "500";

            imageCard.appendChild(imgEl);
            imageCard.appendChild(titleEl);

            // Admin aksiyonları
            if (currentUser.role === "admin") {
                const actions = document.createElement("div");
                actions.style.display = "flex";
                actions.style.gap = "6px";
                actions.style.marginTop = "6px";

                const editBtn = document.createElement("button");
                editBtn.className = "btn subtle";
                editBtn.textContent = "Düzenle";
                editBtn.style.fontSize = "11px";
                editBtn.style.padding = "4px 8px";
                editBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    openImageModal(img);
                });

                const deleteBtn = document.createElement("button");
                deleteBtn.className = "btn subtle";
                deleteBtn.textContent = "Sil";
                deleteBtn.style.fontSize = "11px";
                deleteBtn.style.padding = "4px 8px";
                deleteBtn.style.color = "var(--danger)";
                deleteBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    deleteImage(img.id);
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
    if (!file) {
        imagePreviewWrapper.style.display = "none";
        return;
    }

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

function openImageViewModal(image) {
    imageViewLarge.src = image.url;
    imageViewTitle.textContent = image.title;
    imageViewDescription.textContent = image.description || "";
    
    if (image.tags && image.tags.length > 0) {
        const tagsText = Array.isArray(image.tags) ? image.tags.join(", ") : image.tags;
        imageViewTags.textContent = `Etiketler: ${tagsText}`;
        imageViewTags.style.display = "block";
    } else {
        imageViewTags.style.display = "none";
    }

    imageViewModal.classList.remove("hidden");
}

function closeImageViewModal() {
    imageViewModal.classList.add("hidden");
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
