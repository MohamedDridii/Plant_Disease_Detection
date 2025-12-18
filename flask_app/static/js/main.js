/**
 * Plant Disease Detector - JavaScript
 * Gestion du drag-and-drop et des appels API
 */

// Éléments DOM
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');
const previewSection = document.getElementById('preview-section');
const previewImage = document.getElementById('preview-image');
const clearBtn = document.getElementById('clear-btn');
const analyzeBtn = document.getElementById('analyze-btn');
const loaderSection = document.getElementById('loader-section');
const resultsSection = document.getElementById('results-section');
const newAnalysisBtn = document.getElementById('new-analysis-btn');

// Variable pour stocker le fichier sélectionné
let selectedFile = null;

// ==========================================
// GESTION DU DRAG AND DROP
// ==========================================

// Empêcher le comportement par défaut
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Effet visuel quand on survole avec un fichier
['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, unhighlight, false);
});

function highlight() {
    dropzone.classList.add('dragover');
}

function unhighlight() {
    dropzone.classList.remove('dragover');
}

// Gestion du drop
dropzone.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

// Gestion du clic sur la zone
dropzone.addEventListener('click', () => {
    fileInput.click();
});

// Gestion de la sélection via input
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

// ==========================================
// TRAITEMENT DU FICHIER
// ==========================================

function handleFile(file) {
    // Vérifier le type de fichier
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/bmp'];
    
    if (!validTypes.includes(file.type)) {
        showError('Type de fichier non supporté. Utilisez: PNG, JPG, JPEG, GIF ou BMP');
        return;
    }
    
    // Vérifier la taille (max 16MB)
    if (file.size > 16 * 1024 * 1024) {
        showError('Fichier trop volumineux. Maximum: 16MB');
        return;
    }
    
    selectedFile = file;
    
    // Afficher le preview
    const reader = new FileReader();
    reader.onload = (e) => {
        previewImage.src = e.target.result;
        showPreview();
    };
    reader.readAsDataURL(file);
}

// ==========================================
// AFFICHAGE DES SECTIONS
// ==========================================

function showPreview() {
    previewSection.style.display = 'block';
    resultsSection.style.display = 'none';
    loaderSection.style.display = 'none';
    
    // Animation
    previewSection.classList.add('success-animation');
    setTimeout(() => {
        previewSection.classList.remove('success-animation');
    }, 500);
}

function showLoader() {
    previewSection.style.display = 'none';
    loaderSection.style.display = 'block';
    resultsSection.style.display = 'none';
}

function showResults() {
    previewSection.style.display = 'none';
    loaderSection.style.display = 'none';
    resultsSection.style.display = 'block';
    
    // Animation
    resultsSection.classList.add('success-animation');
    setTimeout(() => {
        resultsSection.classList.remove('success-animation');
    }, 500);
}

function resetUI() {
    previewSection.style.display = 'none';
    loaderSection.style.display = 'none';
    resultsSection.style.display = 'none';
    selectedFile = null;
    fileInput.value = '';
}

function showError(message) {
    alert('❌ ' + message);
    dropzone.classList.add('shake');
    setTimeout(() => {
        dropzone.classList.remove('shake');
    }, 500);
}

// ==========================================
// ANALYSE DE L'IMAGE
// ==========================================

async function analyzeImage() {
    if (!selectedFile) {
        showError('Veuillez sélectionner une image');
        return;
    }
    
    showLoader();
    
    // Créer le FormData
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    try {
        const response = await fetch('/predict', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.error) {
            showError(data.error);
            showPreview();
            return;
        }
        
        displayResults(data);
        
    } catch (error) {
        console.error('Erreur:', error);
        showError('Erreur de connexion au serveur');
        showPreview();
    }
}

// ==========================================
// AFFICHAGE DES RÉSULTATS
// ==========================================

function displayResults(data) {
    // Résultat principal
    const resultClass = document.getElementById('result-class');
    const confidenceValue = document.getElementById('confidence-value');
    const confidenceFill = document.getElementById('confidence-fill');
    const mainResult = document.getElementById('main-result');
    
    // Formater le nom de la classe pour l'affichage
    const formattedClass = formatClassName(data.predicted_class);
    resultClass.textContent = formattedClass;
    confidenceValue.textContent = data.confidence.toFixed(1) + '%';
    
    // Déterminer la couleur selon la confiance
    mainResult.classList.remove('error');
    if (data.confidence < 50) {
        mainResult.classList.add('error');
    }
    
    // Animation de la barre de confiance
    setTimeout(() => {
        confidenceFill.style.width = data.confidence + '%';
    }, 100);
    
    // Top 3 prédictions
    const predictionsList = document.getElementById('predictions-list');
    predictionsList.innerHTML = '';
    
    data.top_predictions.forEach((pred, index) => {
        const item = document.createElement('div');
        item.className = 'prediction-item';
        item.innerHTML = `
            <div class="prediction-rank">${index + 1}</div>
            <div class="prediction-info">
                <div class="prediction-class">${formatClassName(pred.class)}</div>
                <div class="prediction-confidence">${pred.confidence.toFixed(1)}% de confiance</div>
            </div>
        `;
        predictionsList.appendChild(item);
    });
    
    showResults();
}

function formatClassName(className) {
    // Remplace les underscores et formate le nom
    return className
        .replace(/_/g, ' ')
        .replace(/  +/g, ' ')
        .trim();
}

// ==========================================
// EVENT LISTENERS
// ==========================================

// Bouton effacer
clearBtn.addEventListener('click', resetUI);

// Bouton analyser
analyzeBtn.addEventListener('click', analyzeImage);

// Bouton nouvelle analyse
newAnalysisBtn.addEventListener('click', resetUI);

// ==========================================
// VÉRIFICATION DU SERVEUR AU CHARGEMENT
// ==========================================

async function checkServerHealth() {
    try {
        const response = await fetch('/health');
        const data = await response.json();
        
        if (!data.model_loaded) {
            console.warn('⚠️ Modèle non chargé sur le serveur');
        } else {
            console.log('✅ Serveur prêt -', data.num_classes, 'classes disponibles');
        }
    } catch (error) {
        console.error('❌ Serveur non accessible:', error);
    }
}

// Vérifier le serveur au chargement
document.addEventListener('DOMContentLoaded', checkServerHealth);
