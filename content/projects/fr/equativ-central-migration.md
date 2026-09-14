---
title: "Migration On-Prem → GCP à l'Échelle"
category: "MIGRATION"
client: "Equativ"
duration: "8 mois"
teamSize: "Pilotage transverse d'une dizaine d'équipes"
technologies: ["Google Cloud Platform", "GKE", "Cloud SQL", "Database Migration Service", "Terraform", "Terragrunt", "ArgoCD", "Kafka", "SQL Server", "PostgreSQL", "HAProxy"]
featured: true
publishedAt: "2026-03-01"
challenge: "Migrer les services client-facing d'une plateforme AdTech depuis l'on-premise vers GCP sans dégradation de service"
impact: "200+ applications migrées, bases SQL Server et PostgreSQL basculées, zéro dégradation sur le trafic temps réel"
---

# Migration On-Prem → GCP à l'Échelle

## Le Défi

Migrer les services client-facing d'une plateforme AdTech traitant **plusieurs milliards de requêtes par jour**, depuis une infrastructure on-premise **OVH / Kubernetes** vers GCP.

La difficulté n'était pas technique au sens strict. Elle était **combinatoire** : le socle central alimente l'ensemble des edges temps réel, ce qui veut dire que chaque bascule devait se faire sans dégradation de service, à l'échelle de **200+ applications** réparties sur une dizaine d'équipes, avec des dépendances croisées entre services et entre environnements.

### L'Ampleur du Défi

- **200+ applications** suivies individuellement, dont une centaine d'applications Full-Stack
- **Une dizaine d'équipes** d'ingénierie à coordonner, chacune avec son calendrier et ses priorités
- **Estate de bases central** : une quarantaine de bases SQL Server, plus l'estate PostgreSQL
- **Trois environnements** à migrer dans l'ordre : DEV, puis PREPROD, puis PROD
- **Réplication native vers les edges** à préserver pendant toute la transition
- **Tolérance quasi nulle à l'indisponibilité** sur les flux temps réel

### Le Vrai Point Dur

À cette échelle, le goulot d'étranglement n'est pas l'outillage, c'est **l'alignement**. Une migration qui touche 200+ applications échoue rarement sur un problème technique isolé ; elle échoue parce qu'une dépendance n'a pas été identifiée, parce qu'une équipe n'était pas prête, ou parce que personne ne savait qui possédait une application.

## Solutions Techniques Implémentées

### Plan de Migration Multi-Environnements

**Séquencement DEV → PREPROD → PROD** :
- **Gates GO/NOGO** à chaque changement d'environnement : rien ne passe à l'étape suivante avant validation de la précédente
- **Planification de bascule par équipe**, adaptée aux contraintes de chacune
- **DEV comme gate réel** et non comme répétition symbolique : la validation applicative de bout en bout conditionnait le passage en PREPROD

Ce séquencement a transformé une migration à risque en une série de bascules dont chacune était petite, réversible et validée.

### Cadrage Amont avec les Équipes Applicatives

- **Analyse d'impact par périmètre** avant chaque vague
- **Cartographie des dépendances** inter-services et inter-environnements
- **Identification et levée des bloqueurs** avant chaque fenêtre de bascule
- **Inventaire d'ownership** : identifier le référent de chaque application, y compris celles qui n'en avaient plus

Certaines dépendances croisées étaient **intentionnelles et devaient être préservées** : plusieurs sources de configuration ont leur référence en production et sont lues depuis les environnements inférieurs. Les "corriger" aurait cassé le comportement attendu.

### Migration des Bases de Données

**SQL Server** :
- Bascule via **Database Migration Service** et réplication native en cascade
- Migration **par vagues successives**, chaque vague étant une liste définie de bases
- **Référent backend identifié et mobilisé** sur chaque fenêtre pour valider le comportement applicatif
- **Fenêtres de downtime maîtrisées** et annoncées

**PostgreSQL** :
- Bascule s'appuyant sur les **slots de réplication**
- Environ **30 minutes d'indisponibilité UI** par bascule, annoncées et planifiées
- **Découplage volontaire** de la migration SQL Server, à la demande des équipes applicatives, pour éviter de cumuler trop de changements simultanés

**Stratégie de bascule par alias DNS** :
Les chaînes de connexion pointent vers un alias, l'alias est repointé de l'IP on-premise vers l'instance Cloud SQL. Simple sur le papier, à condition que les applications utilisent effectivement des chaînes basées sur alias — ce qui a été un **point de blocage récurrent** et a dû être traité application par application en amont.

### Connectivité Hybride

- **Private Service Connect** et **Private Service Access** pour le chemin GCP ↔ on-premise
- **VPN** pour les accès d'administration
- Résolution différenciée selon le chemin d'appel : les workloads Cloud et les workloads on-premise n'empruntent pas les mêmes points d'entrée

### Migration Applicative

Pour chaque application :
1. **Vérification de compatibilité** de version applicative et API
2. **Mise à jour de la configuration d'ingress** (classe d'ingress, host, path)
3. **Déploiement sur le cluster central** par ajout du cluster cible dans la définition ArgoCD
4. **Bascule de l'alias DNS** vers la nouvelle zone

Pour les applications routées derrière un **WAF**, un audit préalable des enregistrements DNS a été nécessaire, avec classification des applications et implication des équipes sécurité en amont de la bascule des IP backend.

### Sauvegardes et Exploitation

- **Stratégie de sauvegarde hybride** on-premise / cloud pendant la coexistence, puis **full cloud multi-projets** avec isolation des backups
- **Exploitation du cluster central haute charge** : arbitrage des familles de machines, runbook et plan de reprise
- **Runbook dédié** pour les opérations sensibles sur le tier haute charge, après retour d'expérience

### Animation du Programme

- **Suivi hebdomadaire multi-équipes** avec un format fixe : statut par équipe, points d'attention, détail des actions
- **Source de vérité unique** de l'avancement, une ligne par application, maintenue par les équipes elles-mêmes
- **Documentation de passation** pour rendre le programme reprenable
- **Accompagnement de l'équipe base de données** dans sa montée en compétence Cloud : formation Terraform / Terragrunt et transfert progressif de l'ownership du provisioning

Ce dernier point comptait autant que la migration elle-même. Une migration réussie qui laisse l'équipe d'exploitation dépendante d'un prestataire n'est pas terminée.

## Technologies & Outils Utilisés

- **Google Cloud Platform** : GKE, Cloud SQL, PSC / PSA, VPC, Secret Manager
- **Database Migration Service** : migration SQL Server
- **SQL Server / PostgreSQL** : estates central supply et demand
- **Terraform / Terragrunt** : provisioning industrialisé
- **ArgoCD / Argo Workflows** : déploiement GitOps et traitements planifiés
- **Kafka** : réplication d'événements
- **HAProxy** : ingress haute charge
- **Helm** : packaging applicatif

## Résultats & Impact

### ✅ **Migration Livrée**
- **200+ applications** migrées vers le socle central GCP
- **Trois environnements** basculés dans l'ordre, chacun validé avant le suivant
- **Estate de bases central** migré vers Cloud SQL par vagues successives

### ✅ **Continuité de Service**
- **Aucune dégradation** sur les flux temps réel alimentant les edges
- **Fenêtres d'indisponibilité maîtrisées**, planifiées et communiquées
- **Réplication vers les edges préservée** pendant toute la transition

### ✅ **Autonomie des Équipes**
- **Transfert d'ownership** du provisioning des bases vers l'équipe interne
- **Formation Terraform / Terragrunt** de l'équipe d'exploitation
- **Documentation et runbooks** couvrant les opérations sensibles

## Expertise Technique Démontrée

### **Pilotage de Programme Multi-Équipes**
- Coordination d'une dizaine d'équipes d'ingénierie sur huit mois
- Gates GO/NOGO et séquencement par environnement
- Source de vérité unique et rituel de suivi hebdomadaire

### **Migration de Données Critiques**
- SQL Server via DMS et réplication native en cascade
- PostgreSQL via slots de réplication
- Bascule par alias DNS, réversible dans la fenêtre

### **Architecture Hybride**
- Connectivité privée GCP ↔ on-premise pendant la coexistence
- Résolution différenciée selon le chemin d'appel
- Stratégie de sauvegarde évolutive, de l'hybride vers le full cloud

---

**Durée du Projet** : 8 mois (mars – octobre 2026)
**Contexte** : Plateforme AdTech, plusieurs milliards de requêtes par jour, 200+ applications
