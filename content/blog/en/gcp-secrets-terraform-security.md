---
title: "Securing GCP Secrets with Terraform"
excerpt: "Learn how to protect your GCP secrets when deploying with Terraform. Compare modern solutions: Write-Only Attributes, OpenTofu with encryption, and integration with external secret managers."
author: "Edwin Istin"
publishedAt: "2025-09-17"
tags: ["Terraform", "GCP", "Security", "Secrets", "OpenTofu", "Infrastructure as Code", "DevSecOps", "Cloud Security"]
featured: true
readTime: "12 min read"
category: "DevSecOps"
image: "/blog/terraform-secret.png"
---

# Securing GCP Secrets with Terraform

Terraform is the go-to tool for Infrastructure as Code, but it hides a major security problem: **all secrets end up in plain text in the state file**. In this article, we explore modern solutions to protect your GCP secrets during Terraform deployments.

![Securing GCP Secrets with Terraform](/blog/terraform-secret.png)

## The problem: Your secrets are exposed

### Anatomy of a secret leak

Here's what happens when you create a secret with Terraform:

```hcl
resource "google_secret_manager_secret" "api_key" {
  secret_id = "api-key"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "api_key" {
  secret = google_secret_manager_secret.api_key.id

  # This secret will be stored in PLAIN TEXT in the state!
  secret_data = "my-super-secret-api-key-12345"
}
```

Even with `sensitive = true`, run this command:

```bash
terraform show -json | jq '.values.root_module.resources[] |
  select(.type == "google_secret_manager_secret_version") |
  .values.secret_data'
```

**Result**:
```json
"my-super-secret-api-key-12345"
```

**Your secret is visible in plain text in the state!** 😱

### Risk vectors

Secrets in the Terraform state create multiple vulnerability points:

| Vector | Risk | Impact |
|--------|------|--------|
| **Backend Storage** | GCS bucket with wrong ACLs | Massive secret exposure |
| **Automatic Backups** | Unencrypted state copies | Historical secrets exposed |
| **CI/CD Logs** | State parsing or debug | Leaks in logs |
| **Pull Requests** | State included in diffs | Public exposure on GitHub |
| **Extended Team** | Read access to state = access to secrets | Internal compromise |

## Solution 1: Write-Only Attributes (Google Provider v5.0+)

### How it works

Google Provider v5.0 introduces **write-only fields**: attributes that are never read after creation.

```hcl
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"  # Minimum required version
    }
  }
}

resource "google_service_account_key" "sa_key" {
  service_account_id = google_service_account.sa.name

  # The secret does NOT appear in the state!
  lifecycle {
    ignore_changes = [private_key]
  }
}
```

### Before vs After in the State

**Before (Provider < v5.0)**:
```json
{
  "type": "google_service_account_key",
  "values": {
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQE...",
    "private_key_type": "TYPE_GOOGLE_CREDENTIALS_FILE"
  }
}
```

**After (Provider >= v5.0)**:
```json
{
  "type": "google_service_account_key",
  "values": {
    "private_key": "[REDACTED]",
    "private_key_type": "TYPE_GOOGLE_CREDENTIALS_FILE"
  }
}
```

### Supported resources

For the complete list of supported resources and attributes, see the [official documentation](https://registry.terraform.io/providers/hashicorp/google/latest/docs/guides/using_write_only_attributes#updating-write-only-attributes).

### Important limitations

⚠️ **Warning**: Write-only attributes have constraints:

1. **No retrieval**: Impossible to read the secret after creation
2. **No drift detection**: Terraform cannot detect manual changes
3. **Recreate only**: To "change" the secret, you must recreate the resource

## Solution 2: OpenTofu with State Encryption

### Migration to OpenTofu

[OpenTofu](https://opentofu.org/) is an open-source fork of Terraform with native state encryption. It offers full compatibility with existing Terraform configurations while adding essential security features.

### Encryption configuration

**Option 1: Passphrase encryption (development)**

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

**Option 2: GCP KMS encryption (production)**

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
      enforced = true  # Refuses to write unencrypted state
    }
  }
}
```

### Encryption key rotation

```bash
# Rotation with new KMS key
tofu state encryption rotate \
  -key-provider=gcp_kms \
  -key-id="projects/my-project/locations/global/keyRings/terraform/cryptoKeys/state-key-v2"
```

### Key provider comparison

| Provider | Security | Complexity | Cost | Use Case |
|----------|----------|------------|------|----------|
| **pbkdf2** | Good | Low | Free | Dev/Test |
| **gcp_kms** | Excellent | Medium | ~$1/month/key | Production |
| **aws_kms** | Excellent | Medium | ~$1/month/key | Multi-cloud |
| **age** | Very good | Low | Free | Open-source |

## Solution 3: Data Sources and External Secrets

### Zero-Secret architecture

The idea: never create secrets with Terraform, only reference them.

```hcl
# Do NOT create the secret
# resource "google_secret_manager_secret_version" "api_key" { ... }

# Reference only
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

### Integration with HashiCorp Vault

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
  password = data.vault_generic_secret.db_creds.data["password"]  # Never in state!
}
```

## Solution Comparison

### Decision matrix

| Criteria | Write-Only | OpenTofu | Data Sources + External |
|----------|------------|----------|------------------------|
| **Security** | Very good | Excellent | Excellent |
| **Implementation complexity** | Low | Medium | High |
| **Infrastructure cost** | None | KMS if used | Variable by solution |
| **Drift Detection** | Limited | Complete | Complete |
| **Secret Rotation** | Manual | Automatable | Automatable |
| **Traceability/Audit** | GCP native | GCP + encryption | Complete with external solution |

### Recommendations by context

**Startups / Simple projects**:
```hcl
# Solution: Write-Only Attributes
# ✅ Simple, native, sufficient for most cases
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}
```

**Enterprises with compliance constraints**:
```hcl
# Solution: OpenTofu + GCP KMS
# ✅ Complete encryption, audit trail, automatic rotation
terraform {
  encryption {
    key_provider "gcp_kms" "master" {
      kms_encryption_key = var.kms_key_id
    }
  }
}
```

**Complex multi-cloud environments**:
```hcl
# Solution: Vault + External Secrets
# ✅ Centralization, automatic rotation, multi-cloud
provider "vault" {
  # Centralized configuration
}
```

## Conclusion

Securing secrets in Terraform is no longer optional. With available modern solutions:

- **Write-Only Attributes**: Simple and native solution for most cases
- **OpenTofu**: For complete control with state encryption
- **External Secrets**: Zero-trust architecture for complex environments

**Recommended approach**: Start with Write-Only Attributes, evolve to OpenTofu if needed, and consider external solutions for specific requirements.

Most importantly: **act now**. Every day with plain text secrets is a compromise risk.

---

*Which solution have you adopted to secure your Terraform secrets? Have you encountered specific challenges during migration? Let's share our experiences to build more secure infrastructures.*