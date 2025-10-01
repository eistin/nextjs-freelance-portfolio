---
title: "Sécurisation des Secrets GCP avec Terraform"
excerpt: "Découvrez comment protéger vos secrets GCP lors du déploiement avec Terraform. Comparaison des solutions modernes : Write-Only Attributes, OpenTofu avec chiffrement, et intégration avec des gestionnaires de secrets externes."
author: "Edwin Istin"
publishedAt: "2025-09-17"
tags: ["Terraform", "GCP", "Sécurité", "Secrets", "OpenTofu", "Infrastructure as Code", "DevSecOps", "Cloud Security"]
featured: true
readTime: "12 min de lecture"
category: "DevSecOps"
image: "/blog/terraform-secret.png"
---

# Sécurisation des Secrets GCP avec Terraform

Terraform est l'outil de référence pour l'Infrastructure as Code, mais il cache un problème de sécurité majeur : **tous les secrets se retrouvent en clair dans le state file**. Dans cet article, nous explorons les solutions modernes pour protéger vos secrets GCP lors de déploiements Terraform.

![Sécurisation des Secrets GCP avec Terraform](/blog/terraform-secret.png)

## Le problème : Vos secrets sont exposés

### Anatomie d'une fuite de secrets

Voici ce qui se passe lorsque vous créez un secret avec Terraform :

```hcl
resource "google_secret_manager_secret" "api_key" {
  secret_id = "api-key"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "api_key" {
  secret = google_secret_manager_secret.api_key.id

  # Ce secret sera stocké en CLAIR dans le state !
  secret_data = "my-super-secret-api-key-12345"
}
```

Même avec `sensitive = true`, exécutez cette commande :

```bash
terraform show -json | jq '.values.root_module.resources[] |
  select(.type == "google_secret_manager_secret_version") |
  .values.secret_data'
```

**Résultat** :
```json
"my-super-secret-api-key-12345"
```

**Votre secret est visible en clair dans le state !** 😱

### Les vecteurs de risque

Les secrets dans le state Terraform créent plusieurs points de vulnérabilité :

| Vecteur | Risque | Impact |
|---------|--------|--------|
| **Stockage Backend** | Bucket GCS avec mauvais ACL | Exposition massive de secrets |
| **Backups Automatiques** | Copies du state non chiffrées | Secrets historiques exposés |
| **CI/CD Logs** | State parsing ou debug | Fuites dans les logs |
| **Pull Requests** | State inclus dans les diffs | Exposition publique sur GitHub |
| **Équipe Élargie** | Accès read au state = accès aux secrets | Compromission interne |

## Solution 1 : Write-Only Attributes (Google Provider v5.0+)

### Le fonctionnement

Google Provider v5.0 introduit les **write-only fields** : des attributs qui ne sont jamais lus après la création.

```hcl
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"  # Version minimale requise
    }
  }
}

resource "google_service_account_key" "sa_key" {
  service_account_id = google_service_account.sa.name

  # Le secret n'apparaît PAS dans le state !
  lifecycle {
    ignore_changes = [private_key]
  }
}
```

### Avant vs Après dans le State

**Avant (Provider < v5.0)** :
```json
{
  "type": "google_service_account_key",
  "values": {
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQE...",
    "private_key_type": "TYPE_GOOGLE_CREDENTIALS_FILE"
  }
}
```

**Après (Provider >= v5.0)** :
```json
{
  "type": "google_service_account_key",
  "values": {
    "private_key": "[REDACTED]",
    "private_key_type": "TYPE_GOOGLE_CREDENTIALS_FILE"
  }
}
```

### Resources supportées

Pour la liste complète des ressources et attributs supportés, consultez la [documentation officielle](https://registry.terraform.io/providers/hashicorp/google/latest/docs/guides/using_write_only_attributes#updating-write-only-attributes).

### Limitations importantes

⚠️ **Attention** : Les write-only attributes ont des contraintes :

1. **Pas de récupération** : Impossible de lire le secret après création
2. **Pas de drift detection** : Terraform ne peut pas détecter les modifications manuelles
3. **Recreate uniquement** : Pour "changer" le secret, il faut recréer la ressource

## Solution 2 : OpenTofu avec chiffrement du State

### Migration vers OpenTofu

[OpenTofu](https://opentofu.org/) est un fork open-source de Terraform avec chiffrement natif du state. Il offre une compatibilité totale avec les configurations Terraform existantes tout en ajoutant des fonctionnalités de sécurité essentielles.

### Configuration du chiffrement

**Option 1 : Chiffrement avec passphrase (développement)**

```hcl
# backend.tf
terraform {
  encryption {
    key_provider "pbkdf2" "master" {
      passphrase = env("TOFU_PASSPHRASE")
      key_length = 32
      iterations = 600000
      hash_function = "sha512"
    }

    method "aes_gcm" "state_encryption" {
      keys = key_provider.pbkdf2.master
    }

    state {
      method = method.aes_gcm.state_encryption
    }
  }
}
```

**Option 2 : Chiffrement avec GCP KMS (production)**

```hcl
# backend.tf
terraform {
  encryption {
    key_provider "gcp_kms" "master" {
      kms_encryption_key = "projects/${var.project_id}/locations/global/keyRings/terraform/cryptoKeys/state-key"
      key_length = 32
    }

    method "aes_gcm" "state_encryption" {
      keys = key_provider.gcp_kms.master
    }

    state {
      method = method.aes_gcm.state_encryption
      enforced = true  # Refuse d'écrire un state non chiffré
    }
  }
}
```

### Rotation des clés de chiffrement

```bash
# Rotation avec nouvelle clé KMS
tofu state encryption rotate \
  -key-provider=gcp_kms \
  -key-id="projects/mon-projet/locations/global/keyRings/terraform/cryptoKeys/state-key-v2"
```

### Comparaison des providers de clés

| Provider | Sécurité | Complexité | Coût | Cas d'usage |
|----------|----------|------------|------|-------------|
| **pbkdf2** | Bonne | Faible | Gratuit | Dev/Test |
| **gcp_kms** | Excellente | Moyenne | ~1$/mois/clé | Production |
| **aws_kms** | Excellente | Moyenne | ~1$/mois/clé | Multi-cloud |
| **age** | Très bonne | Faible | Gratuit | Open-source |

## Solution 3 : Data Sources et Secrets Externes

### Architecture Zero-Secret

L'idée : ne jamais créer de secrets avec Terraform, seulement les référencer.

```hcl
# Ne PAS créer le secret
# resource "google_secret_manager_secret_version" "api_key" { ... }

# Référencer uniquement
data "google_secret_manager_secret_version" "api_key" {
  secret  = "api-key"
  version = "latest"
}

resource "google_cloud_run_service" "api" {
  # ...
  template {
    spec {
      containers {
        env {
          name = "API_KEY"
          value_from {
            secret_key_ref {
              name = data.google_secret_manager_secret_version.api_key.secret
              key  = "latest"
            }
          }
        }
      }
    }
  }
}
```

### Intégration avec HashiCorp Vault

```hcl
provider "vault" {
  address = "https://vault.company.com"
}

data "vault_generic_secret" "db_creds" {
  path = "database/creds/prod"
}

resource "google_sql_user" "app" {
  instance = google_sql_database_instance.main.name
  name     = data.vault_generic_secret.db_creds.data["username"]
  password = data.vault_generic_secret.db_creds.data["password"]  # Jamais dans le state !
}
```

## Comparaison des Solutions

### Matrice de décision

| Critère | Write-Only | OpenTofu | Data Sources + Externe |
|---------|------------|----------|------------------------|
| **Sécurité** | Très bonne | Excellente | Excellente |
| **Complexité d'implémentation** | Faible | Moyenne | Élevée |
| **Coût d'infrastructure** | Aucun | KMS si utilisé | Variable selon solution |
| **Drift Detection** | Limitée | Complète | Complète |
| **Rotation des Secrets** | Manuelle | Automatisable | Automatisable |
| **Traçabilité/Audit** | GCP natif | GCP + chiffrement | Complet avec solution externe |

### Recommandations par contexte

**Startups / Projets simples** :
```hcl
# Solution : Write-Only Attributes
# ✅ Simple, natif, suffisant pour la plupart des cas
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}
```

**Entreprises avec contraintes de conformité** :
```hcl
# Solution : OpenTofu + GCP KMS
# ✅ Chiffrement complet, audit trail, rotation automatique
terraform {
  encryption {
    key_provider "gcp_kms" "master" {
      kms_encryption_key = var.kms_key_id
    }
  }
}
```

**Environnements multi-cloud complexes** :
```hcl
# Solution : Vault + External Secrets
# ✅ Centralisation, rotation automatique, multi-cloud
provider "vault" {
  # Configuration centralisée
}
```

## Conclusion

La sécurisation des secrets dans Terraform n'est plus optionnelle. Avec les solutions modernes disponibles :

- **Write-Only Attributes** : Solution simple et native pour la majorité des cas
- **OpenTofu** : Pour un contrôle total avec chiffrement du state
- **External Secrets** : Architecture zero-trust pour environnements complexes

**L'approche recommandée** : Commencez par Write-Only Attributes, évoluez vers OpenTofu si nécessaire, et considérez les solutions externes pour des besoins spécifiques.

Le plus important : **agissez maintenant**. Chaque jour avec des secrets en clair est un risque de compromission.

---

*Quelle solution avez-vous adoptée pour sécuriser vos secrets Terraform ? Avez-vous rencontré des défis particuliers lors de la migration ? Partageons nos expériences pour construire des infrastructures plus sécurisées.*