---
title: "Next.js Deployment on GCP"
category: "DEPLOYMENT"
client: "LeoAI"
duration: "3 weeks"
teamSize: "solo"
technologies: ["Google Cloud Platform", "Next.js", "Docker", "Terraform", "Cloud Run", "CloudSQL", "GitHub Actions", "Cloudflare"]
featured: true
publishedAt: "2024-09-01"
challenge: "Migrate Next.js SaaS application to GCP with modern infrastructure"
impact: "PHP to Next.js migration, automated infrastructure, complete CI/CD"
---

# Next.js Deployment on GCP for LeoAI

## The Challenge

LeoAI, an innovative AI startup specializing in solutions for students, needed to **migrate their SaaS** from their legacy PHP infrastructure hosted on SiteGround to a modern solution on Google Cloud Platform. With their previous contractor unable to complete the mission, they sought an expert to **audit and deploy** their new Next.js application to production.

### Technical Challenges

- **Complete migration** from legacy PHP architecture to modern Next.js
- **Existing staging infrastructure** requiring comprehensive audit
- **Production deployment** with high availability requirements
- **CI/CD pipeline** creation from scratch
- **Security** of access and data

## Technical Solutions Implemented

### Cloud Native Infrastructure

**Modern GCP architecture**:
- **Cloud Run** for Next.js application hosting
- **CloudSQL** for database with private network
- **Container Registry** for Docker image management
- **Private VPC** for secure service isolation
- **Bastion host** for secure database access

### Containerization & Deployment

**Docker optimization**:
- **Multi-stage Dockerfiles** for image size optimization
- **Environment variables** configurable per environment
- **Integrated health checks** for Cloud Run
- **Production-ready configuration** with Next.js optimizations

### CI/CD Automation

**GitHub Actions pipeline**:
- **Continuous integration** with automated testing
- **Automatic deployment** to Cloud Run
- **Secret management** via Secret Manager
- **Automatic rollback** on failure

### Infrastructure as Code

**Terraform for reproducibility**:
- **Reusable modules** for Cloud Run and CloudSQL
- **Multi-environment configuration** (dev/prod)
- **Automated provisioning** of entire infrastructure
- **Centralized variables** for configuration management

### DNS Configuration & Security

**Cloudflare migration**:
- **Complete DNS configuration** with validated propagation
- **Automatic SSL certificates** on all domains
- **DDoS protection** and performance optimizations
- **Centralized management** of domains and subdomains

## Technologies & Tools Used

- **Google Cloud Platform**: Primary cloud infrastructure
- **Next.js**: React framework for SaaS application
- **Docker**: Application containerization
- **Terraform**: Infrastructure as Code
- **Cloud Run**: Scalable serverless hosting
- **CloudSQL**: Managed relational database
- **GitHub Actions**: CI/CD pipeline
- **Cloudflare**: DNS management and CDN

## Results & Impact

### ✅ **Successful Migration**
- **Next.js application** successfully deployed to production
- **Modern infrastructure** replacing legacy PHP architecture
- **Separate environments** (development/production) operational

### ✅ **Complete Automation**
- **CI/CD pipeline** fully automated via GitHub Actions
- **Automatic deployments** on every commit to main branches
- **Centralized and secure** secret management

### ✅ **Infrastructure Security**
- **Private VPC network** isolating the database
- **Secure bastion access** for administration
- **Granular IAM roles** and permissions

### ✅ **Performance & Reliability**
- **Automatic scalability** via serverless Cloud Run
- **SSL/TLS configured** on all domains
- **Integrated monitoring** and alerting

## Technical Expertise Demonstrated

### **Complete Architecture Migration**
- Seamless transition from legacy PHP architecture to modern Next.js
- Complete audit and refactoring of existing infrastructure
- Performance and scalability optimization

### **Modern DevOps & Infrastructure**
- Implementation of complete cloud-native infrastructure
- End-to-end automation of deployment processes
- Secure configuration with cloud best practices

### **Complete Technical Support**
- Team training on new processes
- Detailed technical documentation
- DevOps support for operational autonomy

## Client Testimonial

> "A great DevOps profile who helped us migrate to GCP! Very professional and involved"
> 
> *— Zakaria Essir, CEO at LeoAI*

---

**Project Duration**: 3 weeks  
**Team Size**: solo