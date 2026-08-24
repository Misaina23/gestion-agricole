# VIDEEKO VANILLA - Backend Django

## Description
Backend Django REST API pour l'application de gestion agricole VIDEEKO VANILLA.

## Stack Technique
- Python 3.11+
- Django 5.0+
- Django REST Framework
- PostgreSQL
- JWT Authentication

## Installation

### 1. Creer l'environnement virtuel
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows
```

### 2. Installer les dependances
```bash
pip install -r requirements.txt
```

### 3. Configurer la base de donnees PostgreSQL
```bash
# Creer la base de donnees
psql -U postgres
CREATE DATABASE videeko_vanilla;
\q
```

### 4. Configurer les variables d'environnement
```bash
cp .env.example .env
# Editer .env avec vos parametres
```

### 5. Appliquer les migrations
```bash
python manage.py migrate
```

### 6. Creer un superutilisateur
```bash
python manage.py createsuperuser
```

### 7. Charger le registre agricole réel
```bash
# Base vide ou réinitialisation complète : supprime les anciens producteurs,
# parcelles et données agricoles liées, puis charge le registre Vintsy.
python manage.py seed

# Démarrage normal : met à jour le registre sans supprimer les saisies déjà
# présentes dans la base.
python manage.py seed --keep
```

### 8. Lancer le serveur
```bash
python manage.py runserver
```

## API Endpoints

### Authentication
- `POST /api/token/` - Obtenir un token JWT
- `POST /api/token/refresh/` - Rafraichir le token
- `POST /api/token/verify/` - Verifier le token

### Comptes
- `GET /api/accounts/users/` - Liste des utilisateurs
- `GET /api/accounts/users/me/` - Profil utilisateur courant
- `POST /api/accounts/users/change_password/` - Changer mot de passe

### Producteurs
- `GET /api/producers/` - Liste des producteurs
- `POST /api/producers/` - Creer un producteur
- `GET /api/producers/{id}/` - Detail d'un producteur
- `PUT /api/producers/{id}/` - Modifier un producteur
- `DELETE /api/producers/{id}/` - Supprimer un producteur
- `GET /api/producers/stats/` - Statistiques

### Parcelles
- `GET /api/parcels/` - Liste des parcelles
- `POST /api/parcels/` - Creer une parcelle
- `GET /api/parcels/{id}/` - Detail d'une parcelle
- `GET /api/parcels/stats/` - Statistiques
- `GET /api/parcels/map_data/` - Donnees pour carte

### Productions
- `GET /api/productions/` - Liste des productions
- `POST /api/productions/` - Creer une production
- `GET /api/productions/{id}/` - Detail d'une production
- `GET /api/productions/stats/` - Statistiques
- `POST /api/productions/{id}/update_status/` - Mettre a jour le statut

### Inspections
- `GET /api/inspections/` - Liste des inspections
- `POST /api/inspections/` - Creer une inspection
- `GET /api/inspections/{id}/` - Detail d'une inspection
- `GET /api/inspections/stats/` - Statistiques
- `POST /api/inspections/{id}/start/` - Demarrer une inspection
- `POST /api/inspections/{id}/complete/` - Completer une inspection

### Donnees de reference
- `GET /api/regions/` - Regions
- `GET /api/communes/` - Communes
- `GET /api/fokontanys/` - Fokontanys
- `GET /api/varieties/` - Varietes de vanille
- `GET /api/quality-grades/` - Grades de qualite
- `GET /api/seasons/` - Saisons
- `GET /api/dashboard/` - Statistiques tableau de bord
- `GET /api/reference-data/` - Toutes les donnees de reference

## Structure des dossiers
```
backend/
├── videeko_vanilla/     # Configuration Django
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── accounts/            # Gestion utilisateurs
├── core/                # Modeles de base
├── producers/           # Gestion producteurs
├── parcels/             # Gestion parcelles
├── productions/         # Gestion productions
├── inspections/         # Gestion inspections
├── manage.py
└── requirements.txt
```

## Tests
```bash
python manage.py test
```

## Deploiement
Voir la documentation de deploiement pour les instructions de production.
