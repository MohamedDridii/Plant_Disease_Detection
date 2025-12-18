"""
Flask Application pour la détection de maladies des plantes
Utilise le modèle MobileNetV2 pré-entraîné
"""

import os
import numpy as np
from flask import Flask, render_template, request, jsonify
from werkzeug.utils import secure_filename
import tensorflow as tf
from PIL import Image
import io
import base64

# Configuration de l'application Flask
app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # Max 16MB
app.config['UPLOAD_FOLDER'] = 'uploads'

# Extensions autorisées
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp'}

# Paramètres du modèle
IMAGE_SIZE = (224, 224)

# Liste des classes (maladies des plantes)
# IMPORTANT: Cette liste doit être dans l'ordre ALPHABETIQUE (comme le fait ImageDataGenerator)
CLASS_NAMES = [
    'Apple___Apple_scab',
    'Apple___Black_rot',
    'Apple___Cedar_apple_rust',
    'Apple___healthy',
    'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot',
    'Corn_(maize)___Common_rust_',
    'Corn_(maize)___Northern_Leaf_Blight',
    'Corn_(maize)___healthy',
    'Pepper__bell___Bacterial_spot',
    'Pepper__bell___healthy',
    'Potato___Early_blight',
    'Potato___Late_blight',
    'Potato___healthy',
    'Tomato_Bacterial_spot',
    'Tomato_Early_blight',
    'Tomato_Late_blight',
    'Tomato_Leaf_Mold',
    'Tomato_Septoria_leaf_spot',
    'Tomato_Spider_mites_Two_spotted_spider_mite',
    'Tomato__Target_Spot',
    'Tomato__Tomato_YellowLeaf__Curl_Virus',
    'Tomato__Tomato_mosaic_virus',
    'Tomato_healthy'
]

# Variable globale pour le modèle
model = None

def load_model():
    """Charge le modèle pré-entraîné"""
    global model
    model_path = '../best_mobilenet_model.keras'
    
    if os.path.exists(model_path):
        print(f"Chargement du modèle depuis {model_path}...")
        model = tf.keras.models.load_model(model_path)
        print("Modèle chargé avec succès!")
        return True
    else:
        print(f"ERREUR: Le modèle n'existe pas à {model_path}")
        print("Assurez-vous d'avoir entraîné le modèle d'abord.")
        return False

def allowed_file(filename):
    """Vérifie si l'extension du fichier est autorisée"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def preprocess_image(image_data):
    """
    Prétraite l'image pour la prédiction
    Args:
        image_data: bytes de l'image ou chemin du fichier
    Returns:
        numpy array de l'image prétraitée
    """
    # Si c'est des bytes, on les convertit en image
    if isinstance(image_data, bytes):
        img = Image.open(io.BytesIO(image_data))
    else:
        img = Image.open(image_data)
    
    # Convertir en RGB si nécessaire (enlève le canal alpha)
    if img.mode != 'RGB':
        img = img.convert('RGB')
    
    # Redimensionner à la taille attendue
    img = img.resize(IMAGE_SIZE)
    
    # Convertir en array numpy
    img_array = np.array(img)
    
    # Normaliser entre 0 et 1
    img_array = img_array / 255.0
    
    # Ajouter la dimension batch
    img_array = np.expand_dims(img_array, axis=0)
    
    return img_array

def predict(image_data):
    """
    Fait une prédiction sur l'image
    Args:
        image_data: données de l'image
    Returns:
        dict avec la classe prédite et la confiance
    """
    if model is None:
        return {'error': 'Modèle non chargé'}
    
    try:
        # Prétraiter l'image
        processed_image = preprocess_image(image_data)
        
        # Faire la prédiction
        predictions = model.predict(processed_image, verbose=0)
        
        # Obtenir l'index de la classe avec la plus haute probabilité
        predicted_index = np.argmax(predictions[0])
        confidence = float(predictions[0][predicted_index]) * 100
        
        # Obtenir le nom de la classe
        predicted_class = CLASS_NAMES[predicted_index]
        
        # Obtenir les top 3 prédictions
        top_indices = np.argsort(predictions[0])[::-1][:3]
        top_predictions = [
            {
                'class': CLASS_NAMES[i],
                'confidence': float(predictions[0][i]) * 100
            }
            for i in top_indices
        ]
        
        return {
            'success': True,
            'predicted_class': predicted_class,
            'confidence': confidence,
            'top_predictions': top_predictions
        }
    
    except Exception as e:
        return {'error': str(e)}

# Routes Flask
@app.route('/')
def index():
    """Page d'accueil avec l'interface drag-and-drop"""
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict_route():
    """
    Route API pour faire une prédiction
    Accepte une image via multipart/form-data ou base64
    """
    try:
        # Vérifier si une image a été envoyée
        if 'file' in request.files:
            file = request.files['file']
            
            if file.filename == '':
                return jsonify({'error': 'Aucun fichier sélectionné'}), 400
            
            if not allowed_file(file.filename):
                return jsonify({'error': 'Type de fichier non autorisé. Utilisez: png, jpg, jpeg, gif, bmp'}), 400
            
            # Lire les données de l'image
            image_data = file.read()
            
        elif 'image' in request.json:
            # Image en base64
            image_data = base64.b64decode(request.json['image'].split(',')[1])
            
        else:
            return jsonify({'error': 'Aucune image fournie'}), 400
        
        # Faire la prédiction
        result = predict(image_data)
        
        if 'error' in result:
            return jsonify(result), 500
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health')
def health():
    """Route pour vérifier que le serveur fonctionne"""
    return jsonify({
        'status': 'ok',
        'model_loaded': model is not None,
        'num_classes': len(CLASS_NAMES)
    })

# Point d'entrée
if __name__ == '__main__':
    # Charger le modèle au démarrage
    if load_model():
        print("\n" + "="*50)
        print("SERVEUR FLASK PRÊT")
        print("="*50)
        print(f"Classes: {len(CLASS_NAMES)}")
        print("Accédez à http://localhost:5000")
        print("="*50 + "\n")
        
        # Lancer le serveur
        app.run(debug=True, host='0.0.0.0', port=5000)
    else:
        print("\nImpossible de démarrer le serveur sans modèle.")
        print("Entraînez d'abord le modèle avec mobilenet.ipynb")
