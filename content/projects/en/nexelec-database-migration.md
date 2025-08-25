---
title: "AWS to GCP Database Migration"
category: "MIGRATION"
client: "Nexelec"
duration: "2 weeks"
teamSize: "solo"
technologies: ["Google Cloud Platform", "Cloud SQL", "Terraform", "MySQL", "Cloud Run", "IAM", "Secret Manager"]
featured: true
publishedAt: "2024-09-01"
challenge: "Migrate AWS database infrastructure to GCP with multi-plant synchronization"
impact: "2 industrial databases migrated, automated backup, secured infrastructure"
---

# AWS to GCP Database Migration for Nexelec

## The Challenge

Nexelec, an IoT SME specializing in smart building solutions, faced a critical infrastructure migration challenge. Their AWS database architecture required modernization to GCP, with a particular complexity: **synchronizing industrial databases** from their plants in Brittany and Tunisia.

### Specific Technical Challenges

- **2 remote plants** with local MySQL databases (Brittany and Tunisia)
- **Intermittent connectivity** in industrial environments
- **Automated synchronization** every 6 hours via dumps
- **Legacy Qt applications** requiring strict MySQL compatibility
- **Securing** an unsecured AWS infrastructure

## Technical Solutions Implemented

### Cloud SQL Architecture

**Secure migration to GCP**:
- **2 Cloud SQL MySQL instances** (usine-nexelec and usine-emkamed)
- **Secret management** via Google Secret Manager
- **Dedicated service accounts** for each plant with granular permissions
- **Secure IAM access** for DevOps teams

### Synchronization Strategy

**Industrial dump automation**:
- **Optimized Windows backup scripts** for disconnected environments
- **Service account authentication** for secure injections
- **Synchronization process monitoring**
- **Automatic rollback** on dump failure

### Infrastructure Security

**Migration from unsecured AWS**:
- **Comprehensive audit** of existing AWS architecture
- **IP whitelisting** for restricted access
- **SSL/TLS connection encryption**
- **Fine-grained permissions** management per environment

### Application Integration

**Cloud Run Backend connection**:
- **Cloud SQL annotations** for native access from services
- **Multi-database configuration** for Navixis and industrial databases
- **Transparent SQL proxy** for existing applications

## Technologies & Tools Used

- **Google Cloud Platform**: Target infrastructure platform
- **Cloud SQL MySQL**: Managed database service
- **Terraform**: Infrastructure as Code for migration
- **Google Secret Manager**: Secure credential management
- **Cloud Run**: Backend services for data access
- **IAM**: Fine-grained access and permissions management
- **MySQL Proxy**: Secure connections to Cloud SQL

## Results & Impact

### ✅ **Successful Migration**
- **2 Cloud SQL instances** deployed and operational
- **100% compatibility** maintained with Qt legacy applications
- **Zero downtime** during critical data migration

### ✅ **Infrastructure Security**
- **Elimination of vulnerabilities** from old AWS architecture
- **Robust authentication** via service accounts
- **Restricted access** through whitelisting and IAM

### ✅ **Process Automation**
- **Automatic synchronization** every 6 hours
- **Optimized backup scripts** for industrial Windows
- **Proactive monitoring** of data transfers

### ✅ **Operational Optimization**
- **Centralized management** from GCP Console
- **Secure access** for technical teams
- **Complete documentation** of maintenance processes

## Technical Expertise Demonstrated

### **Multi-Environment Industrial Architecture**
- Design of robust solutions for disconnected environments
- Data synchronization management with connectivity constraints
- Adaptation to industrial infrastructure specificities

### **Critical Infrastructure Migration**
- Seamless transition from AWS to GCP without interruption
- Compatibility maintenance with critical legacy applications
- Securing previously unprotected architectures

### **Cloud Native Integration**
- Advanced Cloud Run configuration with multi-database access
- Connection optimization via Cloud SQL Proxy
- Complete automation via Terraform and Infrastructure as Code

## Client Testimonial

> "I had the chance to collaborate with Edwin on several Cloud & DevOps projects (GCP, Terraform, Docker, GitHub, CI/CD, PostgreSQL). Working with Edwin was a real guarantee of project success. His technical expertise not only allowed us to move fast, but also to do so following best practices, with a strong focus on maintainability, scalability, sustainability, and cybersecurity. He consistently provided excellent follow-up, respected deadlines and budget, shared knowledge to make the team autonomous, and always came up with creative solutions whenever challenges arose. On top of that, he's great to work with on a human level, positive, approachable, and bringing good energy. A true partner you can trust, whom I highly recommend!"
> 
> *— Loic, Lead Architect at Nexelec*

---

**Project Duration**: 2 weeks  
**Team Size**: solo