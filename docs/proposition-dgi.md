# NigerTax Pro : proposition à la Direction Générale des Impôts du Niger

Initiateur : [votre nom] — Hamadine Services
Démonstration : https://taxhub.hamadine-services.net

## 1. Le problème

- **Peu de PME déclarent régulièrement.** Les formulaires, les seuils de régime et les échéances sont mal connus. Déclarer prend du temps, et le contribuable n'en voit pas le bénéfice.
- **Le circuit papier coûte cher à tout le monde.** Chaque déclaration et chaque paiement donnent lieu à un formulaire en plusieurs exemplaires, un bordereau, une quittance et souvent un déplacement au centre des impôts.
- **L'énergie est contrainte.** Les délestages pèsent sur les bureaux comme sur les contribuables. Un service numérique doit tourner sur un téléphone, avec peu de données et peu de batterie.
- **Les réformes avancent plus vite que l'information.** Le nouveau CGI (ord. n°2025-22), la loi de finances 2026 (ord. n°2025-44) et la facture certifiée SECeF changent les règles. Les PME l'apprennent souvent trop tard.

## 2. La solution

Une application web mobile, en français, pensée pour les PME et les cabinets comptables.

| Module | Ce qu'il fait | Intérêt pour la DGI |
|---|---|---|
| Déclaration et simulation | Calcule la TVA, l'ISB/IMF et l'impôt synthétique, recommande le régime selon le CA | Déclarations plus justes, moins de rectifications |
| Calendrier et rappels | Échéances du régime de l'entreprise, rappels avant la date limite | Moins de retards et de pénalités à recouvrer |
| Paiement mobile | Airtel Money / Moov Money, reçu horodaté | Moins d'espèces manipulées, recettes traçables |
| **FONAP & DIGI-PME** | Score de préparation au dossier de financement : NIF, RCCM, SECeF, déclarations à jour | **Incitation positive au civisme fiscal : être à jour donne accès au financement** |
| **Zéro papier** | Compteur de feuilles, trajets, carburant et CO₂ évités, projection nationale, mode sobre | Indicateurs mesurables pour le rapport d'activité de la DGI |
| **Veille LF 2026** | Textes en vigueur, statut de chaque mesure et effet sur les calculs | Même information pour tous les contribuables |
| Taux versionnés | Chaque taux porte sa source, sa date d'effet et son statut de validation | Changer un taux ne demande aucune mise à jour du code |
| Mode cabinet | Plusieurs clients, échéances consolidées, marque blanche | Les cabinets diffusent l'outil auprès des PME |

## 3. Pourquoi le lien avec le FONAP change la donne

Le FONAP (Fonds National d'Appui aux PME/PMI) exige des candidats un **NIF et un RCCM**. Son programme **DIGI-PME** (PTBA 2026) accompagne 15 PME/PMI dans leur digitalisation.

NigerTax Pro relie les deux : la PME qui déclare dans l'application constitue en même temps son dossier de financement. La DGI y gagne un argument concret pour la formalisation, sans contrôle supplémentaire. En retour, l'outil lui-même peut constituer le « projet de digitalisation » présenté au FONAP.

Pistes de partenariat :

- DGI : convention d'expérimentation et validation des taux (Phase Z).
- FONAP : reconnaissance du score de préparation comme pré-vérification des dossiers.
- Opérateurs mobiles : homologation des paiements.

## 4. Impact « zéro papier » (ordre de grandeur)

Hypothèses : 50 000 contribuables, 12 déclarations par an chacun. Par déclaration, 4 feuilles de formulaire, 2 de bordereau et 1 de quittance, plus un aller-retour de 10 km à moto pour déclarer et un autre pour payer.

- Environ **8 400 rames de papier** évitées par an.
- **1,2 million de déplacements** évités, soit environ **360 000 L de carburant** et **850 t de CO₂**.
- Environ **2,4 millions d'heures** rendues à l'activité économique.

Ces chiffres sont recalculés en direct dans l'application (menu « Zéro papier »). Il faut les affiner avec les statistiques réelles de la DGI.

## 5. Sobriété énergétique, côté technique

- Pages légères et application installable (PWA), utilisable sur un téléphone d'entrée de gamme.
- Mode sobre : fond sombre, qui consomme moins sur les écrans OLED, et aucune animation.
- Reçus et synthèses numériques partagés par e-mail ou par messagerie, plutôt qu'imprimés.
- Un seul petit serveur suffit (Node.js + PostgreSQL). L'hébergement actuel est un VPS unique.

## 6. Ce qui reste à faire (Phase Z)

1. Valider les taux et barèmes 2026 avec un fiscaliste et la DGI : taux réduits de TVA, IMF, barème de l'impôt synthétique, pénalités.
2. Vérifier au Journal officiel le statut de la taxe sur les dépôts et transferts (abrogation signalée au 21 août 2026) et de la taxe de 1 % sur certains paiements en espèces.
3. Interconnecter avec les services de la DGI (e-SISIC, e-SECeF), si la DGI y consent.
4. Homologuer les paiements auprès des opérateurs mobiles.
5. Mener un pilote avec 20 à 50 PME (par exemple les lauréats FONAP) et un ou deux cabinets.

## 7. Modèle économique proposé

- **PME** : gratuit pour l'impôt synthétique, abonnement modeste au réel.
- **Cabinets** : abonnement selon le nombre de dossiers.
- **DGI** : licence institutionnelle ou convention de service, avec tableau de bord agrégé et anonymisé (taux de dépôt à l'échéance, papier évité).

## Sources

- FONAP, création et missions : [ANP](https://anp.ne/le-niger-se-dote-dun-fonds-national-dappui-aux-pme-et-pmi-fonap/), [Le Sahel](https://www.lesahel.org/lancement-des-activites-du-fonap-le-gouvernement-sengage-dans-une-dynamique-daccompagnement-des-pme-pmi/), [annuaire FONAP-2022](https://fonap.ne/sites/default/files/2023-02/fonap_annuaire_pme_pmi_2022.pdf)
- DIGI-PME : [FONAP, projets et programmes](https://fonap.ne/fr/nos-projets-programmes)
- Loi de finances 2026 : [Le Sahel, entretien du DGI](https://www.lesahel.org/loi-de-finances-2026-le-directeur-general-des-impots-explique-les-nouvelles-mesures-fiscales/), [CMS, lois de finances 2026](https://cms.law/fr/fra/legal-updates/lois-de-finances-2026-en-afrique-de-l-ouest-et-centrale), [L'autre Républicain](https://www.lautrerepublicain.com/2026/01/loi-de-finances-2026-au-niger-de-nouvelles-mesures-fiscales-qui-font-debat/), [FMI, rapport n°26/74](https://www.imf.org/-/media/files/publications/cr/2026/french/1nerfa2026001.pdf)
- Facture certifiée : [DGI Niger](https://www.impots.gouv.ne/index.php?option=com_content&view=category&layout=blog&id=39&Itemid=184), [Ministère des Finances](https://www.finances.gouv.ne/index.php/une/798-reforme-de-la-facture-certifiee-le-directeur-general-des-impots-eclaire-les-contribuables-sur-les-tenants-et-les-aboutissants-la-reforme-de-la-facture-certifiee-est-un-outil-de-bonne-gouvernance-pour-les-entreprises-et-un-levier-important-pour-la-croissance-du-niger-et-non-un-nouvel-impot)
- Taxe sur les transferts (abrogation signalée) : [Regan van Rooy](https://reganvanrooy.com/niger-repeals-its-money-transfer-tax-a-welcome-reversal-of-a-continental-trend/)
