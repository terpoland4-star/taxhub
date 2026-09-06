#!/bin/bash

# Script pour créer un ZIP du repository TaxHub nettoyé
# Exclut node_modules, .git, et autres fichiers inutiles

REPO_DIR="/home/nigerlaptops/taxhub-backend"
OUTPUT_DIR="/tmp"
ZIP_NAME="taxhub-backend-cleaned.zip"
ZIP_PATH="$OUTPUT_DIR/$ZIP_NAME"

echo "📦 Création du ZIP du repository nettoyé..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ ! -d "$REPO_DIR" ]; then
    echo "❌ Erreur: Le répertoire $REPO_DIR n'existe pas"
    exit 1
fi

cd "$REPO_DIR"

# Créer le ZIP en excluant les fichiers inutiles
echo "⏳ Compression en cours..."
zip -r "$ZIP_PATH" . \
    -x "node_modules/*" \
    ".git/*" \
    ".env" \
    "*.log" \
    "dist/*" \
    ".DS_Store" \
    "*.sqlite" \
    ".env.local" \
    ".npm-cache/*" \
    ".next/*" \
    > /dev/null 2>&1

if [ -f "$ZIP_PATH" ]; then
    SIZE=$(du -h "$ZIP_PATH" | cut -f1)
    echo "   ✓ ZIP créé avec succès"
    echo ""
    echo "📊 Informations:"
    echo "   📁 Fichier: $ZIP_NAME"
    echo "   💾 Taille: $SIZE"
    echo "   📍 Chemin: $ZIP_PATH"
    echo ""
    echo "✅ Le ZIP est prêt à être téléchargé!"
    echo ""
    echo "📥 Pour télécharger:"
    echo "   scp -i ~/.ssh/vps_key nigerlaptops@145.239.75.158:$ZIP_PATH ./"
    echo ""
else
    echo "❌ Erreur: Impossible de créer le ZIP"
    exit 1
fi
