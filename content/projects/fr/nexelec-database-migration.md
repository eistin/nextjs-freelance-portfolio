---
title: "Migration Database AWS vers GCP"
category: "MIGRATION"
client: "Nexelec"
duration: "2 semaines"
teamSize: "solo"
technologies: ["Google Cloud Platform", "Cloud SQL", "Terraform", "MySQL", "Cloud Run", "IAM", "Secret Manager"]
featured: true
publishedAt: "2024-09-01"
challenge: "Migrer l'infrastructure database AWS vers GCP avec synchronisation multi-usines"
impact: "2 bases industrielles migrées, backup automatisé, infrastructure sécurisée"
---

# Migration Database AWS vers GCP pour Nexelec

## Le Défi

Nexelec, PME IoT spécialisée dans les solutions pour bâtiments intelligents, faisait face à un défi critique de migration d'infrastructure. Leur architecture database AWS nécessitait une modernisation vers GCP, avec une complexité particulière : **synchroniser des bases de données industrielles** depuis leurs usines en Bretagne et Tunisie.

### Défis Techniques Spécifiques

- **2 usines distantes** avec bases de données locales MySQL (Bretagne et Tunisie)
- **Connectivité intermittente** dans les environnements industriels
- **Synchronisation automatisée** toutes les 6 heures via dumps
- **Applications legacy** en Qt nécessitant une compatibilité MySQL stricte
- **Sécurisation** d'une infrastructure AWS non sécurisée

## Solutions Techniques Implémentées

### Architecture Cloud SQL

**Migration sécurisée vers GCP** :
- **2 instances Cloud SQL MySQL** (usine-nexelec et usine-emkamed)
- **Gestion des secrets** via Google Secret Manager
- **Service accounts dédiés** pour chaque usine avec permissions granulaires
- **Accès IAM sécurisé** pour les équipes DevOps

### Stratégie de Synchronisation

**Automatisation des dumps industriels** :
- **Scripts de backup Windows** optimisés pour environnements déconnectés
- **Authentification par service account** pour injections sécurisées
- **Monitoring des processus** de synchronisation
- **Rollback automatique** en cas d'échec de dump

### Sécurisation de l'Infrastructure

**Migration depuis AWS non sécurisé** :
- **Audit complet** de l'architecture AWS existante
- **Whitelisting IP** pour accès restreints
- **Chiffrement des connexions** SSL/TLS
- **Gestion fine des permissions** par environnement

### Intégration Applications

**Connexion Cloud Run Backend** :
- **Annotations Cloud SQL** pour accès natif depuis les services
- **Configuration multi-database** pour Navixis et bases industrielles
- **Proxy SQL transparent** pour les applications existantes

## Technologies & Outils Utilisés

- **Google Cloud Platform** : Plateforme d'infrastructure cible
- **Cloud SQL MySQL** : Base de données managée
- **Terraform** : Infrastructure as Code pour la migration
- **Google Secret Manager** : Gestion sécurisée des credentials
- **Cloud Run** : Services backend pour accès aux données
- **IAM** : Gestion fine des accès et permissions
- **MySQL Proxy** : Connexions sécurisées vers Cloud SQL

## Résultats & Impact

### ✅ **Migration Réussie**
- **2 instances Cloud SQL** déployées et opérationnelles
- **100% de compatibilité** maintenue avec applications Qt legacy
- **Zero downtime** durant la migration des données critiques

### ✅ **Sécurisation Infrastructure**
- **Élimination des failles** de l'ancienne architecture AWS
- **Authentification robuste** via service accounts
- **Accès restreints** par whitelisting et IAM

### ✅ **Automatisation Processus**
- **Synchronisation automatique** toutes les 6 heures
- **Scripts de backup** optimisés pour Windows industriel
- **Monitoring proactif** des transferts de données

### ✅ **Optimisation Opérationnelle**
- **Gestion centralisée** depuis GCP Console
- **Accès sécurisé** pour les équipes techniques
- **Documentation complète** des processus de maintenance

## Expertise Technique Démontrée

### **Architecture Multi-Environnements Industriels**
- Conception de solutions robustes pour environnements déconnectés
- Gestion de la synchronisation de données avec contraintes de connectivité
- Adaptation aux spécificités des infrastructures industrielles

### **Migration Infrastructure Critique**
- Transition seamless depuis AWS vers GCP sans interruption
- Maintien de la compatibilité avec applications legacy critiques
- Sécurisation d'architectures précédemment non protégées

### **Intégration Cloud Native**
- Configuration avancée Cloud Run avec accès multi-databases
- Optimisation des connexions via Cloud SQL Proxy
- Automatisation complète via Terraform et Infrastructure as Code

## Témoignage Client

> "J'ai eu la chance de collaborer avec Edwin sur plusieurs projets Cloud & DevOps (GCP, Terraform, Docker, GitHub, CI/CD, PostgreSQL). Travailler avec Edwin était une véritable garantie de réussite de projet. Son expertise technique nous a non seulement permis d'avancer rapidement, mais aussi de le faire en suivant les meilleures pratiques, avec un fort accent sur la maintenabilité, l'évolutivité, la durabilité et la cybersécurité. Il a toujours assuré un excellent suivi, respecté les délais et le budget, partagé ses connaissances pour rendre l'équipe autonome, et trouvé des solutions créatives chaque fois que des défis se présentaient. En plus de cela, il est formidable de travailler avec lui sur le plan humain, positif, abordable et apportant une bonne énergie. Un véritable partenaire de confiance que je recommande vivement !"
> 
> *— Loic, Lead Architect at Nexelec*

---

**Durée du Projet** : 2 semaines  
**Taille de l'Équipe** : solo