---
title: "Socle Cloud GCP Multi-Projets"
category: "INFRASTRUCTURE"
client: "Equativ"
duration: "5 mois"
teamSize: "Équipe plateforme, en support d'une dizaine d'équipes produit"
technologies: ["Google Cloud Platform", "GKE", "Terraform", "Terragrunt", "ArgoCD", "Google Secret Manager", "External Secrets", "cert-manager", "HAProxy", "Kafka"]
featured: true
publishedAt: "2025-11-01"
challenge: "Concevoir le socle Cloud multi-projets d'une plateforme AdTech traitant plusieurs milliards de requêtes par jour"
impact: "Landing zone GCP industrialisée, GitOps à l'échelle, 3 000+ secrets migrés sans interruption"
---

# Socle Cloud GCP Multi-Projets

## Le Défi

Equativ opère une plateforme AdTech qui traite **plusieurs milliards de requêtes par jour** en temps réel. L'enjeu n'était pas de déployer quelques services sur GCP, mais de construire le **socle sur lequel une dizaine d'équipes produit allaient ensuite migrer** l'ensemble de leurs applications.

Un socle Cloud conçu pour ce volume ne se rattrape pas après coup. Les décisions prises à ce stade — plan d'adressage, découpage en projets, modèle de déploiement — deviennent structurantes pour des années.

### Les Contraintes

- **Très haut débit temps réel** : la latence et la disponibilité sont le produit, pas une caractéristique annexe
- **Multi-projets, multi-environnements** : chaque domaine fonctionnel et chaque environnement dans son propre périmètre
- **Coexistence avec l'on-premise** : le socle devait fonctionner en parallèle de la plateforme OVH existante pendant toute la phase de transition
- **Adoption par une dizaine d'équipes** : un socle que personne n'utilise n'a aucune valeur, l'ergonomie pour les équipes applicatives était un critère de conception
- **Maîtrise des coûts** : l'échelle rend chaque choix d'architecture financièrement significatif

## Solutions Techniques Implémentées

### Architecture Réseau Multi-Projets

**Topologie GCP à grande échelle** :
- **Découpage projet par domaine et par environnement**, pour isoler les périmètres et clarifier la facturation
- **Plan d'adressage IP gouverné centralement** (IPAM), dimensionné pour absorber la croissance sans collision d'adressage
- **Private Service Connect et Private Service Access** pour les accès privés aux services managés
- **Connectivité hybride GCP ↔ on-premise** conçue pour la phase de coexistence
- **Stratégie dual-stack IPv6** anticipée dès la conception

Le mapping des plages IP a été un chantier à part entière. À cette échelle, un plan d'adressage improvisé se paie en collisions et en migrations forcées quelques mois plus tard.

### Industrialisation Terraform / Terragrunt

**Provisioning reproductible** :
- **Modules Terraform réutilisables** couvrant les briques récurrentes
- **Hiérarchie de configuration Terragrunt** garantissant la cohérence entre projets et environnements
- **Pas de ressource hors structure** : toute exception devient une dette de configuration
- **Expressibilité sur les trois environnements** : un changement n'est valide que s'il se décline en DEV, PREPROD et PROD

### Clusters GKE Haute Performance

- **Cluster central par environnement et par région**, dimensionné pour des workloads haute performance et haute disponibilité
- **Arbitrage des familles de machines** (C4A, C4D) évaluées sur les workloads réels plutôt que sur les fiches techniques
- **Région principale europe-west4**, articulée avec les régions edge existantes

### Socle Kubernetes Partagé

Plutôt que de laisser chaque équipe réinventer sa stack, un **socle commun** a été déployé sur tous les clusters :

- **External Secrets** adossé à Google Secret Manager
- **cert-manager** avec Let's Encrypt
- **External DNS** pour la gestion automatique des enregistrements
- **HAProxy** en ingress
- **Argo Workflows** pour les traitements batch et planifiés
- **Kafka** pour les flux d'événements

À ce volume, les **rate limits Let's Encrypt deviennent une contrainte de conception** : toute opération susceptible de déclencher une réémission massive de certificats doit être évitée par construction.

### GitOps avec ArgoCD

**Déploiement déclaratif uniquement** :
- **ArgoCD comme unique chemin de déploiement**, aucun `kubectl apply` direct sur les clusters
- **Ownership fédérée par centre d'excellence** : chaque périmètre applicatif dispose de son propre espace de déploiement et de son référent
- **Déploiements reproductibles, traçables et auditables** à l'échelle de la plateforme

Ce découpage a permis de scaler l'adoption : les équipes restent autonomes sur leur périmètre sans que la plateforme devienne un goulot d'étranglement.

### Migration Vault → Google Secret Manager

**Plus de 3 000 secrets migrés sans interruption de service.**

- Stratégie de bascule progressive, Vault et Secret Manager coexistant pendant la transition
- Distribution aux workloads via External Secrets, piloté par ArgoCD
- Décommissionnement de Vault une fois la bascule validée

C'est typiquement le genre d'opération où le volume change la nature du problème : migrer 30 secrets est un script, en migrer 3 000 est un plan de migration.

## Technologies & Outils Utilisés

- **Google Cloud Platform** : VPC, GKE, IAM, Secret Manager, PSC / PSA
- **Terraform / Terragrunt** : industrialisation du provisioning
- **Kubernetes (GKE)** : orchestration des workloads centraux
- **ArgoCD** : déploiement GitOps
- **External Secrets / External DNS / cert-manager** : socle Kubernetes partagé
- **HAProxy** : ingress haute charge
- **Argo Workflows** : traitements planifiés
- **Kafka** : flux d'événements

## Résultats & Impact

### ✅ **Socle Industrialisé**
- **Landing zone GCP multi-projets** opérationnelle et documentée
- **Provisioning entièrement en Terraform / Terragrunt**, reproductible entre environnements
- **Socle Kubernetes commun** disponible pour toutes les équipes

### ✅ **Sécurité & Conformité**
- **3 000+ secrets** migrés de Vault vers Google Secret Manager sans interruption
- **Connectivité privée** pour l'accès aux services managés
- **Gouvernance centralisée** des plages IP

### ✅ **Excellence Opérationnelle**
- **GitOps généralisé** : plus aucun déploiement impératif sur les clusters centraux
- **Run quotidien** : upgrades GKE, maintien en condition opérationnelle des composants partagés
- **Gestion d'incidents sur flux haut QPS** avec post-mortems et runbooks

## Expertise Technique Démontrée

### **Architecture Cloud à Très Grande Échelle**
- Conception d'une landing zone multi-projets dimensionnée pour du temps réel haut débit
- Anticipation des contraintes structurantes : adressage, isolation, coûts

### **Industrialisation et Standardisation**
- Modules et hiérarchie de configuration pensés pour l'adoption par des équipes tierces
- Socle partagé réduisant la duplication entre une dizaine d'équipes

### **Conduite d'Opérations Sensibles**
- Migration de plus de 3 000 secrets sans fenêtre d'indisponibilité
- Décommissionnement maîtrisé d'un composant critique (Vault)

---

**Durée du Projet** : 5 mois (novembre 2025 – mars 2026)
**Contexte** : Plateforme AdTech, plusieurs milliards de requêtes par jour
