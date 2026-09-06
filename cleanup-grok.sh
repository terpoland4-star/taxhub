#!/bin/bash

# Script de nettoyage complet: suppression des références Grok et renommage par Hamadine
# Usage: bash cleanup-grok.sh

set -e

echo "🧹 Début du nettoyage des références Grok..."
echo ""

# 1. Supprimer les dossiers Grok
echo "📁 Suppression des dossiers Grok..."
rm -rf .grok
rm -rf public/__grok
echo "   ✓ Dossiers supprimés"

# 2. Supprimer les fichiers Grok
echo "📄 Suppression des fichiers Grok..."
rm -f server/virtual-grok-og-identity.d.ts
echo "   ✓ Fichiers supprimés"

# 3. Renommer les fichiers contenant "grok"
echo "🔄 Renommage des fichiers..."
# Pas de fichiers à renommer pour l'instant dans ce projet
echo "   ✓ Pas de fichiers à renommer"

# 4. Remplacer "grok" par "hamadine" dans tous les fichiers (case-insensitive pour les chemins, case-sensitive pour le contenu)
echo "🔍 Remplacement du contenu 'grok' → 'hamadine'..."

# Créer une liste des fichiers à modifier
files_to_modify=$(find . -type f \( \
  -name "*.ts" \
  -o -name "*.tsx" \
  -o -name "*.mjs" \
  -o -name "*.js" \
  -o -name "*.json" \
  -o -name "*.md" \
  -o -name "*.html" \
  -o -name "*.css" \
  -o -name ".env*" \
  -o -name ".prettierrc" \
  \) \
  ! -path "./node_modules/*" \
  ! -path "./.git/*" \
  ! -path "./dist/*" \
  ! -path "./cleanup-grok.sh" \
  2>/dev/null || true)

# Compter les occurrences avant
echo ""
echo "📊 Analyse des occurrences 'grok':"
grok_count=0
for file in $files_to_modify; do
  if grep -qi "grok" "$file" 2>/dev/null; then
    file_count=$(grep -io "grok" "$file" | wc -l)
    grok_count=$((grok_count + file_count))
    echo "   - $file: $file_count occurrences"
  fi
done
echo "   Total: $grok_count occurrences"
echo ""

# Remplacer les occurrences
echo "🔧 Remplacement en cours..."
for file in $files_to_modify; do
  if grep -qi "grok" "$file" 2>/dev/null; then
    # Remplacer grok par hamadine (tous les cas)
    sed -i 's/grok/hamadine/g' "$file"
    sed -i 's/Grok/Hamadine/g' "$file"
    sed -i 's/GROK/HAMADINE/g' "$file"
    sed -i 's/grok/hamadine/g' "$file"
  fi
done
echo "   ✓ Remplacement terminé"

# 5. Nettoyer les références aux scripts Grok
echo "📦 Nettoyage des fichiers de configuration..."

# Vérifier package.json
if [ -f "package.json" ]; then
  echo "   - Nettoyage de package.json"
  sed -i 's/"grok[^"]*":[^,}]*,?//g' package.json
  sed -i 's/--with-grok//g' package.json
  sed -i 's/grok-pwa//g' package.json
fi

# 6. Supprimer les références aux skills Grok du README s'il existe
if [ -f "README.md" ]; then
  echo "   - Nettoyage de README.md"
  sed -i '/\.grok/d' README.md
fi

echo ""
echo "✅ Nettoyage terminé!"
echo ""
echo "📝 Résumé des actions:"
echo "   ✓ Dossiers .grok/ et public/__grok/ supprimés"
echo "   ✓ Fichiers Grok supprimés"
echo "   ✓ $grok_count occurrences de 'grok' remplacées par 'hamadine'"
echo "   ✓ Fichiers de configuration nettoyés"
echo ""
echo "🚀 Prochaines étapes:"
echo "   1. Vérifier les changements: git status"
echo "   2. Vérifier les modifications: git diff"
echo "   3. Valider les changements: git add ."
echo "   4. Commiter: git commit -m 'chore: nettoyage complet des références Grok et renommage par Hamadine'"
echo ""
