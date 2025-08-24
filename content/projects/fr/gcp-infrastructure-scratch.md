---
title: "Infrastructure GCP from Scratch"
category: "INFRASTRUCTURE"
client: "Teester (maintenant Skeepers)"
duration: "6 mois"
teamSize: "DevOps Solo + collaboration Lead Developer"
technologies: ["Google Cloud Platform", "Terraform", "Kubernetes", "Docker", "GitLab CI", "Cloud SQL", "Redis", "Load Balancer"]
featured: true
publishedAt: "2023-01-15"
challenge: "Construire une infrastructure évolutive from scratch pour une startup en croissance"
impact: "Migration zéro-downtime, sécurité renforcée, déploiements automatisés"
---

# Infrastructure GCP from Scratch

## Le Défi

Quand j'ai rejoint Teester (maintenant partie du groupe Skeepers), une startup en forte croissance dans le secteur des conseils vidéo, j'ai fait face à un défi majeur. L'infrastructure existante avait été construite par les développeurs directement sur la Console Google Cloud, créant plusieurs problèmes critiques :

- **Vulnérabilités de sécurité** : De nombreux services étaient exposés publiquement (GKE, Cloud SQL)
- **Architecture réseau** : Tout déployé sur le réseau par défaut
- **Pas d'Infrastructure as Code** : Tous les changements effectués manuellement via la console
- **Problèmes de scalabilité** : L'architecture ne pouvait pas supporter la croissance rapide de la startup
- **Pas d'automatisation** : Processus de déploiement manuels sujets aux erreurs

La mission était claire : **reconstruire entièrement l'infrastructure from scratch** tout en maintenant les opérations métier.

## La Solution

### Phase 1 : Conception et Planification de l'Infrastructure

J'ai commencé par concevoir une architecture complètement nouvelle, sécurisée et évolutive :

- **Réseau VPC personnalisé** avec segmentation appropriée des sous-réseaux
- **Clusters GKE privés** avec réseaux autorisés
- **Instances Cloud SQL privées** accessibles uniquement depuis le VPC
- **Bastion host** pour l'accès sécurisé aux ressources privées
- **Configuration load balancer** pour la haute disponibilité
- **Couche de cache Redis** pour améliorer les performances

### Phase 2 : Implémentation Infrastructure as Code

J'ai développé des modules Terraform complets pour :

- **Module Réseau** - VPC, sous-réseaux, règles de pare-feu pour la segmentation réseau sécurisée
- **Module GKE** - Configuration cluster privé, pools de nœuds, paramètres de sécurité
- **Module Base de Données** - Instances Cloud SQL, configuration de sauvegarde, politiques de sécurité
- **Module Load Balancer** - Certificats SSL, règles de routage, contrôles de santé
- **Module Monitoring** - Cloud Monitoring, politiques d'alerte, tableaux de bord
- **Module IAM** - Comptes de service, rôles, gestion des permissions

### Phase 3 : Configuration Pipeline CI/CD

En collaboration étroite avec le lead developer, j'ai implémenté :

- **Stratégie de déploiement dual** : Applications déployées sur les anciens et nouveaux environnements
- **Synchronisation base de données** : Sync en temps réel entre environnements
- **Tests automatisés** : Suite de tests complète pour les changements d'infrastructure
- **Procédures de rollback** : Mécanismes de récupération rapide en cas de problème

### Phase 4 : Exécution de la Migration

La migration a été exécutée pendant une fenêtre de maintenance planifiée :

1. **Synchronisation finale de la base de données**
2. **Basculement DNS** vers la nouvelle infrastructure
3. **Routage du trafic** à travers les nouveaux load balancers
4. **Monitoring et validation** de tous les services
5. **Décommissionnement** de l'ancienne infrastructure

## Technologies Utilisées

- **Google Cloud Platform** : Fournisseur cloud principal
- **Terraform** : Infrastructure as Code
- **Kubernetes (GKE)** : Orchestration de conteneurs
- **Docker** : Conteneurisation
- **GitLab CI** : Intégration/Déploiement Continu
- **Cloud SQL** : Base de données PostgreSQL managée
- **Redis** : Cache en mémoire
- **Cloud Load Balancer** : Distribution du trafic

## Résultats & Impact

### ✅ **Amélioration de la Sécurité**
- Tous les services déplacés vers des réseaux privés
- Rôles et permissions IAM appropriés implémentés
- Règles de pare-feu VPC pour la segmentation réseau
- Connexions chiffrées dans toute la stack

### ✅ **Migration Zéro-Downtime**
- Migration réussie sans interruption de service
- Aucune perte de données pendant la transition
- Expérience utilisateur transparente maintenue

### ✅ **Scalabilité Améliorée**
- Clusters GKE avec auto-scaling
- Optimisation des performances de la base de données
- Configuration load balancer pour la haute disponibilité
- Cache Redis réduisant la charge sur la base de données

### ✅ **Excellence Opérationnelle**
- Infrastructure as Code pour toutes les ressources
- Pipelines de déploiement automatisés

## Témoignage Client

> "Edwin a travaillé avec nous pendant plus d'un an dans le cadre d'une refonte de notre architecture cloud et une modernisation de notre infrastructure. Edwin est polyvalent : il est à l'aise avec le cloud, avec Kubernetes et avec la gestion de pipelines. Edwin est force de proposition et nous permet de prendre les meilleures décisions pour le déploiement de notre application."
> 
> *— Maxime Baconnais, Lead Tech at Teester*

---

**Durée du Projet** : 6 mois  
**Taille de l'Équipe** : Ingénieur DevOps Solo + collaboration Lead Developer  
**Statut** : Complété avec succès, infrastructure toujours en production