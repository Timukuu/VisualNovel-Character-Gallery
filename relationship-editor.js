// İLİŞKİ EDITOR - Veri yapısı ve state
let relationshipData = {
    characters: [],
    groups: [],
    relationships: []
};

let selectedRelationshipNodeId = null;
let selectedRelationshipEdgeId = null;
let selectedRelationshipType = null; // "character" veya "relationship"
let draggedRelationshipNode = null;
let relationshipDragOffset = { x: 0, y: 0 };
let isAddingRelationship = false;
let relationshipSourceNodeId = null;

// Canvas pan özelliği - state
let relationshipCanvasPanState = {
    isPanning: false,
    panStart: { x: 0, y: 0 },
    scrollStart: { x: 0, y: 0 }
};

// İlişki tipleri
const RELATIONSHIP_TYPES = [
    { id: "friend", name: "Arkadaş", color: "#4CAF50" },
    { id: "enemy", name: "Düşman", color: "#F44336" },
    { id: "love", name: "Aşk", color: "#E91E63" },
    { id: "rival", name: "Rakip", color: "#FF9800" }
];

// İlişki ekranını aç
async function openRelationshipScreen() {
    if (!currentProjectId) {
        showToast("Önce bir proje seçin", "error");
        return;
    }
    
    const project = projects.find(p => p.id === currentProjectId);
    if (!project) return;
    
    // İlişki verilerini backend'den yükle
    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/projects/${currentProjectId}/relationships`);
        if (response.ok) {
            const data = await response.json();
            relationshipData = data;
        } else {
            // Backend'de yoksa boş başlat
            relationshipData = { characters: [], groups: [], relationships: [] };
        }
    } catch (err) {
        console.error("İlişki verileri yüklenirken hata:", err);
        // Hata durumunda localStorage'dan yükle (fallback)
        const savedData = localStorage.getItem(`relationships_${currentProjectId}`);
        if (savedData) {
            try {
                relationshipData = JSON.parse(savedData);
            } catch (e) {
                relationshipData = { characters: [], groups: [], relationships: [] };
            }
        } else {
            relationshipData = { characters: [], groups: [], relationships: [] };
        }
    }
    
    // Ekranı göster
    if (mainScreen) mainScreen.classList.add("hidden");
    if (relationshipScreen) {
        relationshipScreen.classList.remove("hidden");
        if (relationshipProjectTitle) {
            relationshipProjectTitle.textContent = `${project.name} - İlişki Ağı`;
        }
    }
    
    // Editor'ü render et
    renderRelationshipEditor();
    
    // Canvas pan özelliğini başlat
    setTimeout(() => {
        setupRelationshipCanvasPan();
        if (relationshipCanvas) {
            relationshipCanvas.style.cursor = "grab";
        }
    }, 100);
}

// İlişki ekranını kapat
function closeRelationshipScreen() {
    if (relationshipScreen) relationshipScreen.classList.add("hidden");
    if (mainScreen) mainScreen.classList.remove("hidden");
    isAddingRelationship = false;
    relationshipSourceNodeId = null;
}

// İlişki editor'ü render et
function renderRelationshipEditor() {
    renderRelationshipCharactersList();
    renderRelationshipGroupsList();
    renderRelationshipCanvas();
    renderRelationshipProperties();
}

// Karakter listesini render et
function renderRelationshipCharactersList() {
    if (!relationshipCharactersList) return;
    
    relationshipCharactersList.innerHTML = "";
    
    if (relationshipData.characters.length === 0) {
        relationshipCharactersList.innerHTML = '<p style="color: var(--text-muted); font-size: 12px; padding: 8px;">Henüz karakter yok</p>';
        return;
    }
    
    relationshipData.characters.forEach(char => {
        const item = document.createElement("div");
        item.className = `relationship-list-item ${selectedRelationshipNodeId === char.id ? "selected" : ""}`;
        item.style.cursor = "pointer";
        
        const group = relationshipData.groups.find(g => g.id === char.groupId);
        const groupColor = group ? group.color : "#666";
        
        item.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="width: 12px; height: 12px; border-radius: 50%; background: ${groupColor}; display: inline-block;"></span>
                <span>${char.name || "İsimsiz"}</span>
            </div>
        `;
        
        item.addEventListener("click", () => {
            selectRelationshipNode(char.id);
        });
        
        relationshipCharactersList.appendChild(item);
    });
}

// Grup listesini render et
function renderRelationshipGroupsList() {
    if (!relationshipGroupsList) return;
    
    relationshipGroupsList.innerHTML = "";
    
    if (relationshipData.groups.length === 0) {
        relationshipGroupsList.innerHTML = '<p style="color: var(--text-muted); font-size: 12px; padding: 8px;">Henüz grup yok</p>';
        return;
    }
    
    relationshipData.groups.forEach(group => {
        const item = document.createElement("div");
        item.className = "relationship-list-item";
        item.style.cursor = "pointer";
        
        item.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="width: 12px; height: 12px; border-radius: 50%; background: ${group.color}; display: inline-block;"></span>
                <span>${group.name || "İsimsiz Grup"}</span>
            </div>
        `;
        
        relationshipGroupsList.appendChild(item);
    });
}

// Canvas'ı render et
function renderRelationshipCanvas() {
    if (!relationshipCanvas) return;
    
    relationshipCanvas.innerHTML = "";
    
    // SVG için edge çizgileri (node'ların altında olmalı)
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.style.position = "absolute";
    svg.style.top = "0";
    svg.style.left = "0";
    svg.style.width = "100%";
    svg.style.height = "100%";
    svg.style.pointerEvents = "none";
    svg.style.zIndex = "0";
    relationshipCanvas.appendChild(svg);
    
    // İlişkileri çiz (edge'ler)
    relationshipData.relationships.forEach(rel => {
        drawRelationshipEdge(svg, rel);
    });
    
    // Karakter node'larını render et
    relationshipData.characters.forEach(char => {
        const node = createRelationshipNode(char);
        if (node) relationshipCanvas.appendChild(node);
    });
}

// Karakter node'u oluştur
function createRelationshipNode(char) {
    const group = relationshipData.groups.find(g => g.id === char.groupId);
    const groupColor = group ? group.color : "#666";
    
    const node = document.createElement("div");
    node.className = `relationship-node ${selectedRelationshipNodeId === char.id ? "selected" : ""}`;
    node.style.left = `${char.position?.x || 300}px`;
    node.style.top = `${char.position?.y || 200}px`;
    node.dataset.nodeId = char.id;
    node.style.borderColor = groupColor;
    
    node.innerHTML = `
        <div class="relationship-node-name">${char.name || "İsimsiz"}</div>
    `;
    
    // Drag & drop
    makeRelationshipNodeDraggable(node, char);
    
    // Click to select
    node.addEventListener("click", (e) => {
        e.stopPropagation();
        console.log("Node clicked:", char.id, "isAddingRelationship:", isAddingRelationship, "relationshipSourceNodeId:", relationshipSourceNodeId);
        if (isAddingRelationship) {
            // İlişki ekleme modunda - ikinci karakter seçildi
            if (relationshipSourceNodeId === char.id) {
                // Aynı karaktere tıklandı
                showToast("Farklı bir karakter seçin", "error");
                return;
            }
            
            if (relationshipSourceNodeId && relationshipSourceNodeId !== char.id) {
                console.log("Creating relationship from", relationshipSourceNodeId, "to", char.id);
                // Aynı ilişki zaten var mı kontrol et
                const existingRel = relationshipData.relationships.find(r => 
                    (r.from === relationshipSourceNodeId && r.to === char.id) ||
                    (r.from === char.id && r.to === relationshipSourceNodeId)
                );
                
                if (existingRel) {
                    showToast("Bu karakterler arasında zaten bir ilişki var", "error");
                    isAddingRelationship = false;
                    relationshipSourceNodeId = null;
                    renderRelationshipEditor();
                    return;
                }
                
                // Yeni ilişki oluştur
                const newRel = {
                    id: `rel-${Date.now()}`,
                    from: relationshipSourceNodeId,
                    to: char.id,
                    type: "friend",
                    strength: 50
                };
                relationshipData.relationships.push(newRel);
                saveRelationshipData();
                renderRelationshipEditor();
                isAddingRelationship = false;
                relationshipSourceNodeId = null;
                selectRelationshipEdge(newRel.id);
                showToast("İlişki eklendi! İlişkiyi seçerek tip ve güç ayarlarını yapabilirsiniz.", "success");
            }
        } else {
            // Normal seçim modu
            selectRelationshipNode(char.id);
        }
    });
    
    return node;
}

// İlişki edge'ini çiz
function drawRelationshipEdge(svg, rel) {
    const fromChar = relationshipData.characters.find(c => c.id === rel.from);
    const toChar = relationshipData.characters.find(c => c.id === rel.to);
    
    if (!fromChar || !toChar) return;
    
    const fromX = (fromChar.position?.x || 300) + 60; // Node merkezi
    const fromY = (fromChar.position?.y || 200) + 20;
    const toX = (toChar.position?.x || 300) + 60;
    const toY = (toChar.position?.y || 200) + 20;
    
    const relType = RELATIONSHIP_TYPES.find(t => t.id === rel.type) || RELATIONSHIP_TYPES[0];
    
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("class", "relationship-edge");
    line.setAttribute("x1", fromX);
    line.setAttribute("y1", fromY);
    line.setAttribute("x2", toX);
    line.setAttribute("y2", toY);
    line.setAttribute("stroke", relType.color);
    line.setAttribute("stroke-width", Math.max(2, rel.strength / 20));
    line.setAttribute("opacity", "0.7");
    line.dataset.edgeId = rel.id;
    line.style.cursor = "pointer";
    line.style.pointerEvents = "auto";
    
    line.addEventListener("click", (e) => {
        e.stopPropagation();
        selectRelationshipEdge(rel.id);
    });
    
    svg.appendChild(line);
    
    // Strength badge (orta nokta, çizginin üstüne/altına offset ile)
    const midX = (fromX + toX) / 2;
    const midY = (fromY + toY) / 2;
    
    // Çizginin açısını hesapla (radyan)
    const angle = Math.atan2(toY - fromY, toX - fromX);
    
    // Çizgiye dik yönde offset (yukarı doğru)
    // Perpendicular offset: çizgiye 90 derece dik
    const offsetDistance = 15; // Çizgiden uzaklık
    const offsetX = -Math.sin(angle) * offsetDistance;
    const offsetY = Math.cos(angle) * offsetDistance;
    
    // Badge pozisyonu: orta nokta + offset
    const badgeX = midX + offsetX;
    const badgeY = midY + offsetY;
    
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", badgeX);
    text.setAttribute("y", badgeY);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "middle");
    text.setAttribute("fill", relType.color);
    text.setAttribute("font-size", "12");
    text.setAttribute("font-weight", "bold");
    text.setAttribute("font-weight", "bold");
    text.setAttribute("pointer-events", "none");
    text.textContent = rel.strength;
    svg.appendChild(text);
}

// Node'u draggable yap
function makeRelationshipNodeDraggable(node, char) {
    let isDragging = false;
    
    node.addEventListener("mousedown", (e) => {
        if (e.target.closest("button")) return;
        
        isDragging = true;
        draggedRelationshipNode = node;
        
        const nodeRect = node.getBoundingClientRect();
        const canvasRect = relationshipCanvas.getBoundingClientRect();
        
        relationshipDragOffset.x = e.clientX - nodeRect.left;
        relationshipDragOffset.y = e.clientY - nodeRect.top;
        
        node.style.cursor = "grabbing";
        node.style.zIndex = "1000";
        e.preventDefault();
        e.stopPropagation();
    });
    
    const handleMouseMove = (e) => {
        if (!isDragging || !draggedRelationshipNode) return;
        
        const canvasRect = relationshipCanvas.getBoundingClientRect();
        
        const newX = e.clientX - canvasRect.left - relationshipDragOffset.x + relationshipCanvas.scrollLeft;
        const newY = e.clientY - canvasRect.top - relationshipDragOffset.y + relationshipCanvas.scrollTop;
        
        const minX = 0;
        const minY = 0;
        const finalX = Math.max(minX, newX);
        const finalY = Math.max(minY, newY);
        
        draggedRelationshipNode.style.left = `${finalX}px`;
        draggedRelationshipNode.style.top = `${finalY}px`;
        
        // Data'yı güncelle
        const nodeId = draggedRelationshipNode.dataset.nodeId;
        const character = relationshipData.characters.find(c => c.id === nodeId);
        if (character) {
            character.position = { x: finalX, y: finalY };
            saveRelationshipData();
            // Edge'leri yeniden çiz
            renderRelationshipCanvas();
        }
    };
    
    const handleMouseUp = () => {
        if (isDragging) {
            isDragging = false;
            if (draggedRelationshipNode) {
                draggedRelationshipNode.style.cursor = "move";
                draggedRelationshipNode.style.zIndex = "1";
            }
            draggedRelationshipNode = null;
        }
    };
    
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
}

// Node seç
function selectRelationshipNode(nodeId) {
    selectedRelationshipNodeId = nodeId;
    selectedRelationshipEdgeId = null;
    selectedRelationshipType = "character";
    renderRelationshipEditor();
    renderRelationshipProperties();
}

// Edge seç
function selectRelationshipEdge(edgeId) {
    selectedRelationshipEdgeId = edgeId;
    selectedRelationshipNodeId = null;
    selectedRelationshipType = "relationship";
    renderRelationshipEditor();
    renderRelationshipProperties();
}

// Özellikler panelini render et
function renderRelationshipProperties() {
    if (!relationshipPropertiesContent) return;
    
    if (selectedRelationshipType === "character" && selectedRelationshipNodeId) {
        const char = relationshipData.characters.find(c => c.id === selectedRelationshipNodeId);
        if (!char) return;
        
        relationshipPropertiesContent.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 12px;">
                <label>
                    <div style="margin-bottom: 4px; font-size: 12px; font-weight: 500;">İsim</div>
                    <input type="text" id="relationship-char-name" value="${char.name || ""}" style="width: 100%; padding: 6px; border-radius: 4px; border: 1px solid var(--border-soft);" />
                </label>
                <label>
                    <div style="margin-bottom: 4px; font-size: 12px; font-weight: 500;">Grup</div>
                    <select id="relationship-char-group" style="width: 100%; padding: 6px; border-radius: 4px; border: 1px solid var(--border-soft);">
                        <option value="">Grup yok</option>
                        ${relationshipData.groups.map(g => `<option value="${g.id}" ${char.groupId === g.id ? "selected" : ""}>${g.name}</option>`).join("")}
                    </select>
                </label>
                <button class="btn primary" id="relationship-char-save" style="width: 100%; margin-top: 8px;">Kaydet</button>
                <button class="btn subtle" id="relationship-char-delete" style="width: 100%;">Sil</button>
            </div>
        `;
        
        const nameInput = document.getElementById("relationship-char-name");
        const groupSelect = document.getElementById("relationship-char-group");
        const saveBtn = document.getElementById("relationship-char-save");
        const deleteBtn = document.getElementById("relationship-char-delete");
        
        if (saveBtn) {
            saveBtn.addEventListener("click", () => {
                char.name = nameInput.value;
                char.groupId = groupSelect.value || null;
                saveRelationshipData();
                renderRelationshipEditor();
                showToast("Karakter güncellendi", "success");
            });
        }
        
        if (deleteBtn) {
            deleteBtn.addEventListener("click", () => {
                if (confirm("Bu karakteri silmek istediğinize emin misiniz?")) {
                    relationshipData.characters = relationshipData.characters.filter(c => c.id !== char.id);
                    relationshipData.relationships = relationshipData.relationships.filter(r => r.from !== char.id && r.to !== char.id);
                    saveRelationshipData();
                    selectedRelationshipNodeId = null;
                    renderRelationshipEditor();
                    renderRelationshipProperties();
                    showToast("Karakter silindi", "success");
                }
            });
        }
    } else if (selectedRelationshipType === "relationship" && selectedRelationshipEdgeId) {
        const rel = relationshipData.relationships.find(r => r.id === selectedRelationshipEdgeId);
        if (!rel) return;
        
        const fromChar = relationshipData.characters.find(c => c.id === rel.from);
        const toChar = relationshipData.characters.find(c => c.id === rel.to);
        
        relationshipPropertiesContent.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 12px;">
                <div style="font-size: 12px; color: var(--text-muted);">
                    ${fromChar?.name || "Bilinmeyen"} ↔ ${toChar?.name || "Bilinmeyen"}
                </div>
                <label>
                    <div style="margin-bottom: 4px; font-size: 12px; font-weight: 500;">İlişki Tipi</div>
                    <select id="relationship-type" style="width: 100%; padding: 6px; border-radius: 4px; border: 1px solid var(--border-soft);">
                        ${RELATIONSHIP_TYPES.map(t => `<option value="${t.id}" ${rel.type === t.id ? "selected" : ""}>${t.name}</option>`).join("")}
                    </select>
                </label>
                <label>
                    <div style="margin-bottom: 4px; font-size: 12px; font-weight: 500;">Güç: <span id="relationship-strength-value">${rel.strength}</span></div>
                    <input type="range" id="relationship-strength" min="0" max="100" value="${rel.strength}" style="width: 100%;" />
                </label>
                <button class="btn primary" id="relationship-save" style="width: 100%; margin-top: 8px;">Kaydet</button>
                <button class="btn subtle" id="relationship-delete" style="width: 100%;">Sil</button>
            </div>
        `;
        
        const typeSelect = document.getElementById("relationship-type");
        const strengthInput = document.getElementById("relationship-strength");
        const strengthValue = document.getElementById("relationship-strength-value");
        const saveBtn = document.getElementById("relationship-save");
        const deleteBtn = document.getElementById("relationship-delete");
        
        if (strengthInput && strengthValue) {
            strengthInput.addEventListener("input", (e) => {
                strengthValue.textContent = e.target.value;
            });
        }
        
        if (saveBtn) {
            saveBtn.addEventListener("click", () => {
                rel.type = typeSelect.value;
                rel.strength = parseInt(strengthInput.value);
                saveRelationshipData();
                renderRelationshipEditor();
                showToast("İlişki güncellendi", "success");
            });
        }
        
        if (deleteBtn) {
            deleteBtn.addEventListener("click", () => {
                if (confirm("Bu ilişkiyi silmek istediğinize emin misiniz?")) {
                    relationshipData.relationships = relationshipData.relationships.filter(r => r.id !== rel.id);
                    saveRelationshipData();
                    selectedRelationshipEdgeId = null;
                    renderRelationshipEditor();
                    renderRelationshipProperties();
                    showToast("İlişki silindi", "success");
                }
            });
        }
    } else {
        relationshipPropertiesContent.innerHTML = '<p style="color: var(--text-muted); font-size: 12px;">Bir karakter veya ilişki seçin</p>';
    }
}

// Karakter ekle modalını aç
function openRelationshipCharacterModal() {
    if (relationshipCharacterModal) {
        relationshipCharacterModal.classList.remove("hidden");
        if (relationshipCharacterNameInput) {
            relationshipCharacterNameInput.value = "";
            relationshipCharacterNameInput.focus();
        }
    }
}

// Karakter ekle modalını kapat
function closeRelationshipCharacterModal() {
    if (relationshipCharacterModal) {
        relationshipCharacterModal.classList.add("hidden");
        if (relationshipCharacterForm) {
            relationshipCharacterForm.reset();
        }
    }
}

// Karakter ekle form submit
function handleRelationshipCharacterFormSubmit(e) {
    e.preventDefault();
    
    if (!relationshipCharacterNameInput) return;
    
    const name = relationshipCharacterNameInput.value.trim();
    if (!name) {
        showToast("Karakter adı gerekli", "error");
        return;
    }
    
    const newChar = {
        id: `char-${Date.now()}`,
        name: name,
        groupId: null,
        position: { x: 300, y: 200 }
    };
    
    relationshipData.characters.push(newChar);
    saveRelationshipData();
    renderRelationshipEditor();
    closeRelationshipCharacterModal();
    selectRelationshipNode(newChar.id);
    showToast("Karakter eklendi", "success");
}

// Grup ekle modalını aç
function openRelationshipGroupModal() {
    if (relationshipGroupModal) {
        relationshipGroupModal.classList.remove("hidden");
        if (relationshipGroupNameInput) {
            relationshipGroupNameInput.value = "";
            relationshipGroupNameInput.focus();
        }
    }
}

// Grup ekle modalını kapat
function closeRelationshipGroupModal() {
    if (relationshipGroupModal) {
        relationshipGroupModal.classList.add("hidden");
        if (relationshipGroupForm) {
            relationshipGroupForm.reset();
        }
    }
}

// Grup ekle form submit
function handleRelationshipGroupFormSubmit(e) {
    e.preventDefault();
    
    if (!relationshipGroupNameInput) return;
    
    const name = relationshipGroupNameInput.value.trim();
    if (!name) {
        showToast("Grup adı gerekli", "error");
        return;
    }
    
    const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E2"];
    const color = colors[relationshipData.groups.length % colors.length];
    
    const newGroup = {
        id: `group-${Date.now()}`,
        name: name,
        color: color
    };
    
    relationshipData.groups.push(newGroup);
    saveRelationshipData();
    renderRelationshipEditor();
    closeRelationshipGroupModal();
    showToast("Grup eklendi", "success");
}

// İlişki ekleme modunu başlat
function startAddingRelationship() {
    console.log("startAddingRelationship called, selectedRelationshipNodeId:", selectedRelationshipNodeId);
    if (selectedRelationshipNodeId) {
        isAddingRelationship = true;
        relationshipSourceNodeId = selectedRelationshipNodeId;
        console.log("İlişki ekleme modu aktif, kaynak karakter:", relationshipSourceNodeId);
        // Editor'ü yeniden render et ki seçili karakter vurgulansın
        renderRelationshipEditor();
        showToast("İkinci karakteri seçin (veya iptal için tekrar butona tıklayın)", "info");
    } else {
        showToast("Önce bir karakter seçin", "error");
    }
}

// İlişki ekleme modunu iptal et
function cancelAddingRelationship() {
    isAddingRelationship = false;
    relationshipSourceNodeId = null;
    renderRelationshipEditor();
    showToast("İlişki ekleme iptal edildi", "info");
}

function setupRelationshipCanvasPan() {
    if (!relationshipCanvas) return;
    
    const canvasContainer = relationshipCanvas.parentElement;
    if (!canvasContainer) return;
    
    if (canvasContainer.dataset.panSetup === "true") {
        canvasContainer.removeEventListener("mousedown", handleRelationshipCanvasMouseDown);
        document.removeEventListener("mousemove", handleRelationshipCanvasMouseMove);
        document.removeEventListener("mouseup", handleRelationshipCanvasMouseUp);
    }
    
    canvasContainer.dataset.panSetup = "true";
    canvasContainer.addEventListener("mousedown", handleRelationshipCanvasMouseDown, true);
    document.addEventListener("mousemove", handleRelationshipCanvasMouseMove);
    document.addEventListener("mouseup", handleRelationshipCanvasMouseUp);
}

function handleRelationshipCanvasMouseDown(e) {
    if (!relationshipCanvas) return;
    
    const target = e.target;
    
    if (target.closest(".relationship-node")) return;
    if (target.closest("button")) return;
    if (target.tagName === "svg" || target.tagName === "line" || target.closest("svg")) return;
    if (draggedRelationshipNode) return;
    
    if (!target.closest(".relationship-node")) {
        const canvasContainer = relationshipCanvas.parentElement;
        relationshipCanvasPanState.isPanning = true;
        relationshipCanvasPanState.panStart.x = e.clientX;
        relationshipCanvasPanState.panStart.y = e.clientY;
        
        if (canvasContainer) {
            relationshipCanvasPanState.scrollStart.x = canvasContainer.scrollLeft;
            relationshipCanvasPanState.scrollStart.y = canvasContainer.scrollTop;
            canvasContainer.style.cursor = "grabbing";
        }
        e.preventDefault();
        e.stopPropagation();
    }
}

function handleRelationshipCanvasMouseMove(e) {
    if (!relationshipCanvasPanState.isPanning || !relationshipCanvas) return;
    
    const dx = e.clientX - relationshipCanvasPanState.panStart.x;
    const dy = e.clientY - relationshipCanvasPanState.panStart.y;
    
    const canvasContainer = relationshipCanvas.parentElement;
    if (canvasContainer) {
        canvasContainer.scrollLeft = relationshipCanvasPanState.scrollStart.x - dx;
        canvasContainer.scrollTop = relationshipCanvasPanState.scrollStart.y - dy;
    }
}

function handleRelationshipCanvasMouseUp() {
    if (relationshipCanvasPanState.isPanning && relationshipCanvas) {
        relationshipCanvasPanState.isPanning = false;
        const canvasContainer = relationshipCanvas.parentElement;
        if (canvasContainer) {
            canvasContainer.style.cursor = "grab";
        }
    }
}

// Backend'e kaydet
async function saveRelationshipData() {
    if (!currentProjectId) return;
    
    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/projects/${currentProjectId}/relationships`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(relationshipData)
        });
        
        if (!response.ok) {
            throw new Error("Kayıt başarısız");
        }
    } catch (err) {
        console.error("İlişki verileri kaydedilemedi:", err);
        // Fallback: localStorage
        localStorage.setItem(`relationships_${currentProjectId}`, JSON.stringify(relationshipData));
    }
}

