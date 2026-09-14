---
title: "On-Prem → GCP Migration at Scale"
category: "MIGRATION"
client: "Equativ"
duration: "8 months"
teamSize: "Cross-team programme lead, a dozen engineering teams"
technologies: ["Google Cloud Platform", "GKE", "Cloud SQL", "Database Migration Service", "Terraform", "Terragrunt", "ArgoCD", "Kafka", "SQL Server", "PostgreSQL", "HAProxy"]
featured: true
publishedAt: "2026-03-01"
challenge: "Migrate the client-facing services of an AdTech platform from on-premise to GCP with no service degradation"
impact: "200+ applications migrated, SQL Server and PostgreSQL estates cut over, zero degradation on real-time traffic"
---

# On-Prem → GCP Migration at Scale

## The Challenge

Migrate the client-facing services of an AdTech platform handling **several billion requests per day**, from on-premise **OVH / Kubernetes** infrastructure onto GCP.

The difficulty was not technical in the narrow sense. It was **combinatorial**: the central platform feeds every real-time edge, which means each cutover had to happen with no service degradation, across **200+ applications** spread over a dozen teams, with cross-dependencies between services and between environments.

### The Scale of the Challenge

- **200+ applications** tracked individually, around a hundred of them Full-Stack applications
- **A dozen engineering teams** to coordinate, each with its own schedule and priorities
- **Central database estate**: roughly forty SQL Server databases, plus the PostgreSQL estate
- **Three environments** to migrate in order: DEV, then PREPROD, then PROD
- **Native replication to the edges** to preserve throughout the transition
- **Near-zero tolerance for downtime** on real-time traffic

### The Real Hard Part

At this scale the bottleneck is not tooling, it is **alignment**. A migration touching 200+ applications rarely fails on an isolated technical problem; it fails because a dependency was not identified, because a team was not ready, or because nobody knew who owned an application.

## Technical Solutions Implemented

### Multi-Environment Migration Plan

**DEV → PREPROD → PROD sequencing**:
- **GO/NOGO gates** at each environment change: nothing moves to the next step before the previous one is validated
- **Per-team cutover planning**, adapted to each team's constraints
- **DEV as a real gate** rather than a symbolic rehearsal: end-to-end application validation conditioned the move to PREPROD

This sequencing turned a risky migration into a series of cutovers, each of them small, reversible and validated.

### Upfront Scoping with Application Teams

- **Impact analysis per perimeter** ahead of each wave
- **Dependency mapping** across services and across environments
- **Identifying and clearing blockers** before each cutover window
- **Ownership inventory**: identifying the referent for every application, including those that no longer had one

Some cross-dependencies were **intentional and had to be preserved**: several configuration sources have their reference in production and are read from lower environments. "Fixing" them would have broken expected behaviour.

### Database Migration

**SQL Server**:
- Cutover via **Database Migration Service** and native cascade replication
- Migration **in successive waves**, each wave a defined list of databases
- **A named backend referent on standby** for each window to validate application behaviour
- **Controlled, announced downtime windows**

**PostgreSQL**:
- Cutover based on **replication slots**
- Around **30 minutes of UI unavailability** per cutover, announced and planned
- **Deliberately decoupled** from the SQL Server migration, at the application teams' request, to avoid stacking too many simultaneous changes

**DNS alias cutover strategy**:
Connection strings point at an alias, and the alias is repointed from the on-premise IP to the Cloud SQL instance. Simple on paper, provided applications actually use alias-based connection strings — which proved to be a **recurring blocker** and had to be handled application by application beforehand.

### Hybrid Connectivity

- **Private Service Connect** and **Private Service Access** for the GCP ↔ on-premise path
- **VPN** for administrative access
- Resolution differentiated by call path: cloud workloads and on-premise workloads do not use the same entry points

### Application Migration

For each application:
1. **Version compatibility check** for the application and its APIs
2. **Ingress configuration update** (ingress class, host, path)
3. **Deployment onto the central cluster** by adding the target cluster to the ArgoCD definition
4. **DNS alias cutover** to the new zone

For applications routed behind a **WAF**, a prior audit of the DNS records was required, with applications classified accordingly and security teams involved ahead of the backend IP switch.

### Backups and Operations

- **Hybrid on-premise / cloud backup strategy** during coexistence, then **full cloud multi-project** with backup isolation
- **Running the high-load central cluster**: machine family arbitration, runbook and disaster recovery plan
- **A dedicated runbook** for sensitive operations on the high-load tier, written from operational experience

### Programme Management

- **Weekly multi-team tracking** in a fixed format: per-team status, points of attention, detailed actions
- **A single source of truth** for progress, one row per application, maintained by the teams themselves
- **Handover documentation** so the programme stays resumable
- **Upskilling the database team on cloud**: Terraform / Terragrunt training and progressive transfer of provisioning ownership

That last point mattered as much as the migration itself. A successful migration that leaves the operations team dependent on a contractor is not finished.

## Technologies & Tools Used

- **Google Cloud Platform**: GKE, Cloud SQL, PSC / PSA, VPC, Secret Manager
- **Database Migration Service**: SQL Server migration
- **SQL Server / PostgreSQL**: central supply and demand estates
- **Terraform / Terragrunt**: industrialised provisioning
- **ArgoCD / Argo Workflows**: GitOps deployment and scheduled workloads
- **Kafka**: event replication
- **HAProxy**: high-load ingress
- **Helm**: application packaging

## Results & Impact

### ✅ **Migration Delivered**
- **200+ applications** migrated onto the central GCP platform
- **Three environments** cut over in order, each validated before the next
- **Central database estate** migrated to Cloud SQL in successive waves

### ✅ **Service Continuity**
- **No degradation** on the real-time traffic feeding the edges
- **Controlled downtime windows**, planned and communicated
- **Edge replication preserved** throughout the transition

### ✅ **Team Autonomy**
- **Ownership transfer** of database provisioning to the internal team
- **Terraform / Terragrunt training** for the operations team
- **Documentation and runbooks** covering sensitive operations

## Technical Expertise Demonstrated

### **Multi-Team Programme Leadership**
- Coordination of a dozen engineering teams over eight months
- GO/NOGO gates and per-environment sequencing
- Single source of truth and a weekly tracking ritual

### **Critical Data Migration**
- SQL Server via DMS and native cascade replication
- PostgreSQL via replication slots
- DNS alias cutover, reversible within the window

### **Hybrid Architecture**
- Private GCP ↔ on-premise connectivity during coexistence
- Resolution differentiated by call path
- Backup strategy evolving from hybrid to full cloud

---

**Project Duration**: 8 months (March – October 2026)
**Context**: AdTech platform, several billion requests per day, 200+ applications
