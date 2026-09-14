---
title: "Multi-Project GCP Cloud Foundation"
category: "INFRASTRUCTURE"
client: "Equativ"
duration: "5 months"
teamSize: "Platform team, supporting a dozen product teams"
technologies: ["Google Cloud Platform", "GKE", "Terraform", "Terragrunt", "ArgoCD", "Google Secret Manager", "External Secrets", "cert-manager", "HAProxy", "Kafka"]
featured: true
publishedAt: "2025-11-01"
challenge: "Design the multi-project cloud foundation for an AdTech platform handling several billion requests per day"
impact: "Industrialised GCP landing zone, GitOps at scale, 3,000+ secrets migrated with zero downtime"
---

# Multi-Project GCP Cloud Foundation

## The Challenge

Equativ runs an AdTech platform handling **several billion requests per day** in real time. The task was not to deploy a few services on GCP, but to build the **foundation that a dozen product teams would then migrate onto**.

A cloud foundation built for this volume does not get fixed after the fact. The decisions taken at this stage — IP addressing, project layout, deployment model — become structural for years.

### The Constraints

- **Real-time, high-throughput traffic**: latency and availability are the product, not a side characteristic
- **Multi-project, multi-environment**: each functional domain and each environment in its own perimeter
- **Coexistence with on-premise**: the foundation had to run alongside the existing OVH platform throughout the transition
- **Adoption by a dozen teams**: a foundation nobody uses has no value, so ergonomics for application teams was a design criterion
- **Cost control**: at this scale every architectural choice is financially significant

## Technical Solutions Implemented

### Multi-Project Network Architecture

**Large-scale GCP topology**:
- **Project split by domain and environment**, isolating perimeters and clarifying cost attribution
- **Centrally governed IP addressing** (IPAM), sized to absorb growth without address collisions
- **Private Service Connect and Private Service Access** for private access to managed services
- **Hybrid GCP ↔ on-premise connectivity** designed for the coexistence phase
- **Dual-stack IPv6 strategy** anticipated from the design stage

IP range mapping was a project in its own right. At this scale, an improvised addressing plan is paid for in collisions and forced migrations a few months later.

### Terraform / Terragrunt Industrialisation

**Reproducible provisioning**:
- **Reusable Terraform modules** covering the recurring building blocks
- **Terragrunt configuration hierarchy** ensuring consistency across projects and environments
- **No resources outside the structure**: every exception becomes configuration debt
- **Expressible across all three environments**: a change is only valid if it works for DEV, PREPROD and PROD

### High-Performance GKE Clusters

- **Central cluster per environment and region**, sized for high-performance, high-availability workloads
- **Machine family arbitration** (C4A, C4D) evaluated against real workloads rather than spec sheets
- **Primary region europe-west4**, articulated with the existing edge regions

### Shared Kubernetes Baseline

Rather than letting each team reinvent its stack, a **common baseline** was deployed across all clusters:

- **External Secrets** backed by Google Secret Manager
- **cert-manager** with Let's Encrypt
- **External DNS** for automatic record management
- **HAProxy** as ingress
- **Argo Workflows** for batch and scheduled work
- **Kafka** for event streams

At this volume, **Let's Encrypt rate limits become a design constraint**: anything that could trigger mass certificate reissuance has to be avoided by construction.

### GitOps with ArgoCD

**Declarative deployment only**:
- **ArgoCD as the single deployment path**, no direct `kubectl apply` against clusters
- **Federated ownership per centre of excellence**: each application perimeter has its own deployment scope and named owner
- **Reproducible, traceable and auditable deployments** across the platform

This split is what let adoption scale: teams stay autonomous on their perimeter without the platform becoming a bottleneck.

### Vault → Google Secret Manager Migration

**Over 3,000 secrets migrated with no service interruption.**

- Progressive cutover strategy, with Vault and Secret Manager coexisting during the transition
- Distribution to workloads via External Secrets, driven by ArgoCD
- Vault decommissioned once the cutover was validated

This is the kind of operation where volume changes the nature of the problem: migrating 30 secrets is a script, migrating 3,000 is a migration plan.

## Technologies & Tools Used

- **Google Cloud Platform**: VPC, GKE, IAM, Secret Manager, PSC / PSA
- **Terraform / Terragrunt**: provisioning industrialisation
- **Kubernetes (GKE)**: central workload orchestration
- **ArgoCD**: GitOps deployment
- **External Secrets / External DNS / cert-manager**: shared Kubernetes baseline
- **HAProxy**: high-load ingress
- **Argo Workflows**: scheduled workloads
- **Kafka**: event streams

## Results & Impact

### ✅ **Industrialised Foundation**
- **Multi-project GCP landing zone** operational and documented
- **Fully Terraform / Terragrunt-driven provisioning**, reproducible across environments
- **Shared Kubernetes baseline** available to every team

### ✅ **Security & Compliance**
- **3,000+ secrets** migrated from Vault to Google Secret Manager with no interruption
- **Private connectivity** for managed service access
- **Centralised governance** of IP ranges

### ✅ **Operational Excellence**
- **GitOps throughout**: no imperative deployments left on the central clusters
- **Day-to-day run**: GKE upgrades, operational maintenance of shared components
- **Incident handling on high-QPS traffic** with post-mortems and runbooks

## Technical Expertise Demonstrated

### **Cloud Architecture at Very Large Scale**
- Design of a multi-project landing zone sized for high-throughput real-time traffic
- Anticipation of structural constraints: addressing, isolation, cost

### **Industrialisation and Standardisation**
- Modules and configuration hierarchy designed for adoption by third-party teams
- Shared baseline reducing duplication across a dozen teams

### **Running Sensitive Operations**
- Migration of over 3,000 secrets with no downtime window
- Controlled decommissioning of a critical component (Vault)

---

**Project Duration**: 5 months (November 2025 – March 2026)
**Context**: AdTech platform, several billion requests per day
