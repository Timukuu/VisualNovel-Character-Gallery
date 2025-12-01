// Basit karakter katalog SPA'sı
// Not: Karakterler şimdilik sadece localStorage'da tutuluyor (tarayıcı bazlı).

let users = [];
let projects = [];

let currentUser = null;
let currentProjectId = null;

// Backend endpoints (Render'da host edilmiş)
const BACKEND_BASE_URL = "https://character-backend-buw3.onrender.com";
const BACKEND_UPLOAD_URL = `${BACKEND_BASE_URL}/upload`;
const BACKEND_PROJECTS_URL = `${BACKEND_BASE_URL}/api/projects`;

// DOM referansları
const loginScreen = document.getElementById("login-screen");
const mainScreen = document.getElementById("main-screen");

const loginForm = document.getElementById("login-form");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginErrorEl = document.getElementById("login-error");

const currentUserInfoEl = document.getElementById("current-user-info");
const logoutBtn = document.getElementById("logout-btn");

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

// --- Yardımcılar ---

function loadJSON(path) {
    return fetch(path).then((res) => {
        if (!res.ok) {
            throw new Error("HTTP " + res.status);
        }
        return res.json();
    });
}

function saveCharacters(projectId, characters) {
    const key = "characters_" + projectId;
    localStorage.setItem(key, JSON.stringify(characters));
}

function loadCharacters(projectId) {
    const key = "characters_" + projectId;
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    try {
        return JSON.parse(raw);
    } catch (e) {
        console.error("Karakter verisi parse edilemedi:", e);
        return [];
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
        btn.textContent = project.name;
        btn.dataset.projectId = project.id;
        btn.style.flex = "1";

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
            editBtn.style.fontSize = "12px";
            editBtn.style.padding = "4px 6px";
            editBtn.title = "Düzenle";
            editBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                openProjectModal(project);
            });

            const deleteBtn = document.createElement("button");
            deleteBtn.className = "btn subtle";
            deleteBtn.textContent = "×";
            deleteBtn.style.fontSize = "16px";
            deleteBtn.style.padding = "2px 6px";
            deleteBtn.title = "Sil";
            deleteBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                deleteProject(project.id);
            });

            projectWrapper.appendChild(editBtn);
            projectWrapper.appendChild(deleteBtn);
        }

        li.appendChild(projectWrapper);
        projectListEl.appendChild(li);
    });
}

function onProjectSelected(project) {
    currentProjectTitleEl.textContent = project.name;

    // Admin ise "Karakter Ekle" aktif, değilse pasif (sadece görüntüleme)
    addCharacterBtn.disabled = currentUser.role !== "admin";

    renderCharacters();
}

// --- Proje Yönetimi (Admin) ---

function openProjectModal(project = null) {
    editingProjectId = project ? project.id : null;
    projectModalTitle.textContent = project ? "Proje Düzenle" : "Yeni Proje";
    projectNameInput.value = project ? project.name : "";
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
                body: JSON.stringify({ name })
            });

            if (!response.ok) throw new Error("Proje güncellenemedi");
        } else {
            // Yeni proje oluştur
            const response = await fetch(BACKEND_PROJECTS_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name })
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

function renderCharacters() {
    charactersContainer.innerHTML = "";

    if (!currentProjectId) {
        const info = document.createElement("p");
        info.textContent = "Soldan bir proje seçin.";
        info.style.color = "#a0a0b3";
        info.style.fontSize = "14px";
        charactersContainer.appendChild(info);
        return;
    }

    const characters = loadCharacters(currentProjectId);

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

        // Admin aksiyonları
        if (currentUser.role === "admin") {
            const actions = document.createElement("div");
            actions.className = "character-actions";

            const deleteBtn = document.createElement("button");
            deleteBtn.className = "btn subtle";
            deleteBtn.textContent = "Sil";

            deleteBtn.addEventListener("click", () => {
                if (!confirm("Bu karakteri silmek istediğinize emin misiniz?")) return;
                deleteCharacter(currentProjectId, ch.id);
            });

            actions.appendChild(deleteBtn);
            card.appendChild(actions);
        }

        charactersContainer.appendChild(card);
    });
}

function deleteCharacter(projectId, characterId) {
    const characters = loadCharacters(projectId);
    const filtered = characters.filter((ch) => ch.id !== characterId);
    saveCharacters(projectId, filtered);
    renderCharacters();
}

// --- Modal (Karakter Ekle) ---

function openCharacterModal() {
    if (!currentProjectId) return;
    characterModalTitle.textContent = "Yeni Karakter";
    characterForm.reset();
    clearImagePreview();
    characterModal.classList.remove("hidden");
}

function closeCharacterModal() {
    characterModal.classList.add("hidden");
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
        id: generateId(),
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

function saveNewCharacter(character) {
    const characters = loadCharacters(currentProjectId);
    characters.push(character);
    saveCharacters(currentProjectId, characters);
    closeCharacterModal();
    renderCharacters();
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
        })
        .catch((err) => {
            console.error("Başlangıç verileri yüklenemedi:", err);
            alert("Veri dosyaları (users.json / projects.json) yüklenemedi. Konsolu kontrol edin.");
        });
}

document.addEventListener("DOMContentLoaded", init);
