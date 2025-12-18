# 🌿 Plant Disease Detector - Interface Web Flask

Application web avec interface drag-and-drop pour détecter les maladies des plantes en utilisant le modèle MobileNetV2 pré-entraîné.

## 📁 Structure du Projet

```
flask_app/
├── app.py                 # Application Flask principale
├── requirements.txt       # Dépendances Python
├── templates/
│   └── index.html        # Page web avec interface drag-and-drop
├── static/
│   ├── css/
│   │   └── style.css     # Styles CSS
│   └── js/
│       └── main.js       # JavaScript pour le drag-and-drop
└── uploads/              # Dossier pour les images (optionnel)
```

## 🚀 Comment Lancer l'Application

### 1. Prérequis

Assurez-vous d'avoir :
- Python 3.8+
- Le modèle entraîné `best_mobilenet_model.keras` dans le dossier parent

### 2. Installation des dépendances

```bash
cd flask_app
pip install -r requirements.txt
```

### 3. Lancer le serveur

```bash
python app.py
```

### 4. Accéder à l'interface

Ouvrez votre navigateur et allez à : **http://localhost:5000**

## 🎯 Fonctionnalités

- ✅ **Drag and Drop** : Glissez-déposez une image de feuille
- ✅ **Upload classique** : Cliquez pour parcourir les fichiers
- ✅ **Preview** : Visualisation de l'image avant analyse
- ✅ **Prédiction** : Détection de la maladie avec niveau de confiance
- ✅ **Top 3** : Affiche les 3 prédictions les plus probables
- ✅ **Design responsive** : Fonctionne sur mobile et desktop

## 🖼️ Formats d'images supportés

- PNG
- JPG / JPEG
- GIF
- BMP

## 📊 Classes Détectées (23)

Le modèle peut détecter les maladies suivantes :

| Plante | Maladies |
|--------|----------|
| 🍎 Pomme | Apple Scab, Black Rot, Cedar Apple Rust, Healthy |
| 🌽 Maïs | Cercospora Leaf Spot, Common Rust, Northern Leaf Blight, Healthy |
| 🫑 Poivron | Bacterial Spot, Healthy |
| 🥔 Pomme de terre | Early Blight, Late Blight, Healthy |
| 🍅 Tomate | 10 maladies différentes + Healthy |

## 🔧 Configuration

Modifiez `app.py` si nécessaire :

```python
# Chemin vers le modèle
MODEL_PATH = '../best_mobilenet_model.keras'

# Port du serveur
app.run(port=5000)

# Taille des images
IMAGE_SIZE = (224, 224)
```

## 📝 API Endpoints

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/` | GET | Page d'accueil avec interface |
| `/predict` | POST | Envoie une image pour prédiction |
| `/health` | GET | Vérifie l'état du serveur |

### Exemple d'appel API avec curl :

```bash
curl -X POST -F "file=@image.jpg" http://localhost:5000/predict
```

### Réponse JSON :

```json
{
  "success": true,
  "predicted_class": "Tomato_Late_blight",
  "confidence": 95.67,
  "top_predictions": [
    {"class": "Tomato_Late_blight", "confidence": 95.67},
    {"class": "Tomato_Early_blight", "confidence": 2.15},
    {"class": "Potato___Late_blight", "confidence": 1.02}
  ]
}
```

## ⚠️ Troubleshooting

### Le modèle ne se charge pas
- Vérifiez que `best_mobilenet_model.keras` existe dans le dossier parent
- Entraînez d'abord le modèle avec `mobilenet.ipynb`

### Erreur de mémoire GPU
- Ajoutez au début de `app.py` :
```python
import os
os.environ['CUDA_VISIBLE_DEVICES'] = '-1'  # Force CPU
```

### Port déjà utilisé
- Changez le port dans `app.py` : `app.run(port=5001)`

## 📜 License

Projet Data Science - GLSI 3
