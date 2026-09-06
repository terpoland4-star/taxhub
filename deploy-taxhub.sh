#!/bin/bash

# Script de déploiement TaxHub Backend sur VPS
# Déploie le backend sur le port 8080 avec PM2
# Usage: bash deploy-taxhub.sh

set -e

# Configuration
REPO_URL="https://github.com/terpoland4-star/taxhub.git"
DEPLOY_DIR="/home/nigerlaptops/taxhub-backend"
PORT=8080
SERVICE_NAME="taxhub-backend"
NODE_ENV="production"

echo "🚀 Déploiement TaxHub Backend"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. Vérifier si PM2 est installé
echo "1️⃣  Vérification de PM2..."
if ! command -v pm2 &> /dev/null; then
    echo "   ⏳ Installation de PM2..."
    sudo npm install -g pm2
    echo "   ✓ PM2 installé"
else
    echo "   ✓ PM2 déjà installé"
fi

echo ""

# 2. Créer le répertoire de déploiement
echo "2️⃣  Préparation du répertoire..."
if [ -d "$DEPLOY_DIR" ]; then
    echo "   ⚠️  Le répertoire existe déjà"
    read -p "   Voulez-vous le mettre à jour? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd "$DEPLOY_DIR"
        git pull origin main
    else
        echo "   Déploiement annulé"
        exit 0
    fi
else
    echo "   ⏳ Création du répertoire..."
    mkdir -p "$DEPLOY_DIR"
    cd "$DEPLOY_DIR"
    git clone "$REPO_URL" .
    echo "   ✓ Répertoire créé et repo cloné"
fi

echo ""

# 3. Installer les dépendances
echo "3️⃣  Installation des dépendances..."
npm install
echo "   ✓ Dépendances installées"

echo ""

# 4. Créer le fichier .env
echo "4️⃣  Configuration de l'environnement..."
if [ ! -f .env ]; then
    cat > .env << EOF
# TaxHub Backend Configuration
PORT=$PORT
NODE_ENV=$NODE_ENV

# Database
DATABASE_URL=postgresql://user:password@127.0.0.1:5432/taxhub
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=taxhub
DB_USER=taxhub_user

# Auth (à configurer selon vos besoins)
JWT_SECRET=your-secret-key-change-this
CORS_ORIGIN=*

# Application
APP_NAME=TaxHub
APP_URL=https://taxhub.example.com
EOF
    echo "   ✓ Fichier .env créé"
    echo "   ⚠️  ⚠️  IMPORTANT: Editez .env avec vos paramètres réels!"
else
    echo "   ℹ️  .env existe déjà (non modifié)"
fi

echo ""

# 5. Arrêter le service existant s'il existe
echo "5️⃣  Arrêt du service existant..."
if pm2 info "$SERVICE_NAME" > /dev/null 2>&1; then
    pm2 stop "$SERVICE_NAME"
    pm2 delete "$SERVICE_NAME"
    echo "   ✓ Service arrêté"
else
    echo "   ℹ️  Service n'existe pas encore"
fi

echo ""

# 6. Démarrer le service avec PM2
echo "6️⃣  Démarrage du service..."
pm2 start "npm start" --name "$SERVICE_NAME" --port "$PORT" --env "$NODE_ENV"
pm2 save
echo "   ✓ Service démarré sur le port $PORT"

echo ""

# 7. Configurer PM2 pour démarrage automatique
echo "7️⃣  Configuration du démarrage automatique..."
pm2 startup systemd -u nigerlaptops --hp /home/nigerlaptops
echo "   ✓ PM2 configuré pour démarrage automatique"

echo ""

# 8. Afficher le statut
echo "8️⃣  Statut des services:"
pm2 list

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Déploiement terminé!"
echo ""
echo "📝 Informations importantes:"
echo "   🔗 Backend accessible sur: http://localhost:$PORT"
echo "   📁 Répertoire: $DEPLOY_DIR"
echo "   🔧 Configuration: $DEPLOY_DIR/.env"
echo "   📊 Logs: pm2 logs $SERVICE_NAME"
echo "   🔄 Statut: pm2 status"
echo ""
echo "⚠️  PROCHAINES ÉTAPES:"
echo "   1. Éditer .env avec les paramètres réels"
echo "   2. Configurer la base de données PostgreSQL"
echo "   3. Configurer nginx comme reverse proxy (voir nginx-config.conf)"
echo "   4. Tester: curl http://localhost:$PORT"
echo ""
