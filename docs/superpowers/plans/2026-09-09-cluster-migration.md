# Portfolio Cluster Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the portfolio from GCP Cloud Run to stini-cluster (GHCR image, ArgoCD GitOps, both `edwindev.cloud` and `theclouds.dev` serving), then decommission the GCP serving infrastructure.

**Architecture:** CI builds/pushes `ghcr.io/eistin/nextjs-freelance-portfolio:<sha>` and commits the tag into `deploy/kustomization.yaml`; ArgoCD (already running on stini-cluster) syncs the repo's `deploy/` Kustomize folder (KSOPS secret for Resend); the existing Gateway serves the hostnames; a staged DNS cutover moves both apex domains, then `next-freelance-terraform` is destroyed.

**Tech Stack:** GitHub Actions + GHCR, Kustomize + KSOPS (SOPS/age), ArgoCD, Cilium Gateway API, Cloudflare API, Terraform (destroy only).

**Spec:** `docs/superpowers/plans/../specs/2026-09-08-cluster-migration-design.md` (in this repo)

## Global Constraints

- Image: `ghcr.io/eistin/nextjs-freelance-portfolio`, tag = full git SHA, **public** visibility, linux/amd64.
- The only secret is `RESEND_API_KEY` — it must never appear in plaintext in any commit, log, or report. Read its value from the live Cloud Run service, never from chat.
- age public key (same as stini-cluster): `age14mycsk7clgt7z7g99eh3hqq90pjlk77s37udzkh68ksrekaum4yqznl4z2`; private key already in `~/.config/sops/age/keys.txt` (export `SOPS_AGE_KEY_FILE="$HOME/.config/sops/age/keys.txt"` before sops commands — macOS sops does not read `~/.config` by default).
- Non-secret env values (exact): `CONTACT_EMAIL=istin.edwin@gmail.com`, `FROM_EMAIL_DOMAIN=edwindev.cloud`, `NEXT_PUBLIC_BASE_URL=https://edwindev.cloud`, `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-QQ3GP98E89`.
- Cluster facts: Gateway `main-gateway` in ns `gateway` with listeners `https-edwindev-wildcard`, `https-edwindev-apex`, `https-theclouds-apex` (+ HTTP catch-all with 301 redirect — HTTPRoutes must always use `sectionName` to avoid shadowing it); external-dns is Cloudflare-proxied with target annotation `89.167.62.173`.
- Repo paths after Task 1: portfolio at `/Users/stini/Workspace/stini-projects/nextjs-freelance-portfolio`; cluster repo at `/Users/stini/Workspace/stini-projects/stini-cluster`. Cloudflare zone IDs: edwindev.cloud `b69deebbe4cb6fce16d26382364cf6fa`, theclouds.dev `64d18c8a33db3a48aca35fd276d8fc51`; `CLOUDFLARE_API_TOKEN` comes from `stini-cluster/.env`.
- Until Task 4 step 5 executes, Cloud Run keeps serving both apexes — abort anywhere before that with zero visitor impact.

### DNS records to delete at cutover (recorded verbatim for rollback)

`edwindev.cloud` zone: `CNAME edwindev.cloud → theclouds.dev, proxied=true`.
`theclouds.dev` zone: `A theclouds.dev → 216.239.32.21 / 216.239.34.21 / 216.239.36.21 / 216.239.38.21, proxied=true`; `AAAA theclouds.dev → 2001:4860:4802:32::15 / :34::15 / :36::15 / :38::15, proxied=true`; `A theclouds.dev → 192.64.119.250, proxied=true` (stray Namecheap parking record — delete, do not restore). Leave `www.theclouds.dev`, MX, and TXT records untouched.

---

### Task 1: Repo move + deploy/ manifests + SOPS secret

**Files:**
- Move (filesystem): `/Users/stini/Workspace/portfolio/nextjs-freelance-portfolio` → `/Users/stini/Workspace/stini-projects/nextjs-freelance-portfolio`
- Create: `.sops.yaml`, `deploy/namespace.yaml`, `deploy/deployment.yaml`, `deploy/service.yaml`, `deploy/httproute.yaml`, `deploy/secret-generator.yaml`, `deploy/secrets.sops.yaml` (encrypted), `deploy/kustomization.yaml`

**Interfaces:**
- Produces: kustomize root `deploy/` consumed by Task 3's Application (path `deploy`); image field `ghcr.io/eistin/nextjs-freelance-portfolio` with `newTag` that Task 2's CI rewrites; Secret name `portfolio-secrets` and ConfigMap name `portfolio-config` consumed via `envFrom`; hostnames/parentRefs extended in Task 4.

- [ ] **Step 1: Move the working copy** (local only; GitHub remote unchanged)

```bash
mv /Users/stini/Workspace/portfolio/nextjs-freelance-portfolio /Users/stini/Workspace/stini-projects/nextjs-freelance-portfolio
cd /Users/stini/Workspace/stini-projects/nextjs-freelance-portfolio && git status --short | head -3 && git remote -v
```
Expected: clean-ish status, origin `https://github.com/eistin/nextjs-freelance-portfolio.git`. All later steps run from this new path.

- [ ] **Step 2: Write `.sops.yaml`** (repo root)

```yaml
creation_rules:
  # Deploy-time secrets synced by ArgoCD via KSOPS
  - path_regex: deploy/secrets\.sops\.yaml$
    age: age14mycsk7clgt7z7g99eh3hqq90pjlk77s37udzkh68ksrekaum4yqznl4z2
```
(The regex is deliberately exact — a broader `secret.*\.yaml` pattern would also match `secret-generator.yaml`, which must stay plaintext.)

- [ ] **Step 3: Write `deploy/namespace.yaml`**

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: portfolio
  annotations:
    argocd.argoproj.io/sync-wave: "-5"
```

- [ ] **Step 4: Write `deploy/deployment.yaml`**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: portfolio
  namespace: portfolio
spec:
  replicas: 1
  selector:
    matchLabels:
      app: portfolio
  template:
    metadata:
      labels:
        app: portfolio
    spec:
      containers:
        - name: portfolio
          image: ghcr.io/eistin/nextjs-freelance-portfolio
          ports:
            - containerPort: 3000
          envFrom:
            - configMapRef:
                name: portfolio-config
            - secretRef:
                name: portfolio-secrets
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              memory: 256Mi
          readinessProbe:
            httpGet:
              path: /
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /
              port: 3000
            initialDelaySeconds: 15
            periodSeconds: 20
```

- [ ] **Step 5: Write `deploy/service.yaml`**

```yaml
apiVersion: v1
kind: Service
metadata:
  name: portfolio
  namespace: portfolio
spec:
  selector:
    app: portfolio
  ports:
    - port: 80
      targetPort: 3000
```

- [ ] **Step 6: Write `deploy/httproute.yaml`** (staging hostname only — apex hostnames land in Task 4)

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: portfolio
  namespace: portfolio
spec:
  # sectionName pins each parentRef to an HTTPS listener so the Gateway's
  # HTTP catch-all keeps its 301 redirect (hostname-specific routes would
  # otherwise win on the HTTP listener and serve plaintext).
  parentRefs:
    - name: main-gateway
      namespace: gateway
      sectionName: https-edwindev-wildcard
  hostnames:
    - portfolio.edwindev.cloud
  rules:
    - backendRefs:
        - name: portfolio
          port: 80
```

- [ ] **Step 7: Write `deploy/secret-generator.yaml`** (KSOPS generator — stays plaintext)

```yaml
apiVersion: viaduct.ai/v1
kind: ksops
metadata:
  name: portfolio-secret-generator
  annotations:
    config.kubernetes.io/function: |
      exec:
        path: ksops
files:
  - ./secrets.sops.yaml
```

- [ ] **Step 8: Create `deploy/secrets.sops.yaml` and encrypt immediately**

Fetch the key from the live Cloud Run service and write the file without ever echoing the value:

```bash
export SOPS_AGE_KEY_FILE="$HOME/.config/sops/age/keys.txt"
RESEND_KEY=$(gcloud run services describe nextjs-portfolio --project stini-326916 --region europe-west1 --format=json | jq -r '.spec.template.spec.containers[0].env[] | select(.name=="RESEND_API_KEY") | .value')
[ -n "$RESEND_KEY" ] && [ "$RESEND_KEY" != "null" ] && echo "key fetched (not shown)" || echo "FETCH FAILED"
cat > deploy/secrets.sops.yaml <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: portfolio-secrets
  namespace: portfolio
stringData:
  RESEND_API_KEY: ${RESEND_KEY}
EOF
sops -e -i deploy/secrets.sops.yaml
unset RESEND_KEY
grep -c "ENC\[" deploy/secrets.sops.yaml
```
Expected: `key fetched (not shown)`, then a number > 0. If FETCH FAILED, report BLOCKED (the key may have moved to Secret Manager) — do not guess.

- [ ] **Step 9: Write `deploy/kustomization.yaml`**

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - namespace.yaml
  - deployment.yaml
  - service.yaml
  - httproute.yaml

generators:
  - secret-generator.yaml

configMapGenerator:
  - name: portfolio-config
    namespace: portfolio
    literals:
      - CONTACT_EMAIL=istin.edwin@gmail.com
      - FROM_EMAIL_DOMAIN=edwindev.cloud
      - NEXT_PUBLIC_BASE_URL=https://edwindev.cloud
      - NEXT_PUBLIC_GA_MEASUREMENT_ID=G-QQ3GP98E89

images:
  - name: ghcr.io/eistin/nextjs-freelance-portfolio
    newTag: bootstrap  # rewritten by CI on every main push
```

- [ ] **Step 10: Validate what can be validated locally**

The full kustomize build needs the ksops binary (only present in the ArgoCD repo-server), so validate in two parts:

```bash
for f in deploy/namespace.yaml deploy/deployment.yaml deploy/service.yaml deploy/httproute.yaml; do kubectl apply --dry-run=client -f $f -o name; done
export SOPS_AGE_KEY_FILE="$HOME/.config/sops/age/keys.txt"
sops -d deploy/secrets.sops.yaml | kubectl apply --dry-run=client -f - -o name
```
Expected: each prints its resource name (`namespace/portfolio`, `deployment.apps/portfolio`, `service/portfolio`, `httproute.gateway.networking.k8s.io/portfolio`, `secret/portfolio-secrets`). The httproute dry-run may need the cluster connection (CRD-backed) — export `KUBECONFIG="${XDG_RUNTIME_DIR:-$HOME/.cache}/stini-cluster-secrets/kubeconfig"` first. The end-to-end KSOPS chain is verified when ArgoCD syncs in Task 3.

- [ ] **Step 11: Commit and push**

```bash
git add .sops.yaml deploy/
git commit -m "feat: cluster deploy manifests (kustomize + ksops secret)"
git push
git show --stat HEAD | head -12
```
Expected: 7 files, and `deploy/secrets.sops.yaml` shows encrypted content in `git show` (spot check: `git show HEAD:deploy/secrets.sops.yaml | head -3` shows `ENC[`/sops markers, no plaintext key).

---

### Task 2: CI — GHCR build + tag bump (replaces Cloud Run workflow)

**Files:**
- Create: `.github/workflows/deploy.yml`
- Modify: `Dockerfile` (add 4 lines in the builder stage)
- Delete: `.github/workflows/cloud-run.yml`

**Interfaces:**
- Consumes: `deploy/kustomization.yaml` `newTag` field (Task 1).
- Produces: public image `ghcr.io/eistin/nextjs-freelance-portfolio:<full-sha>`; a bot commit `chore(deploy): image <sha> [skip ci]` updating `newTag` — Task 3 relies on both existing.

- [ ] **Step 1: Add build args to `Dockerfile`**

In the `builder` stage, directly after `WORKDIR /app` and before the `COPY --from=deps` line, insert:

```dockerfile
# NEXT_PUBLIC_* values are inlined into the client bundle at build time
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_GA_MEASUREMENT_ID
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_GA_MEASUREMENT_ID=$NEXT_PUBLIC_GA_MEASUREMENT_ID
```

- [ ] **Step 2: Write `.github/workflows/deploy.yml` and delete `cloud-run.yml`**

```yaml
name: Deploy
on:
  push:
    branches:
      - main

permissions:
  contents: write
  packages: write

env:
  IMAGE: ghcr.io/eistin/nextjs-freelance-portfolio

jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Set up Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build and push
        uses: docker/build-push-action@v6
        with:
          context: .
          platforms: linux/amd64
          push: true
          tags: ${{ env.IMAGE }}:${{ github.sha }}
          build-args: |
            NEXT_PUBLIC_BASE_URL=https://edwindev.cloud
            NEXT_PUBLIC_GA_MEASUREMENT_ID=G-QQ3GP98E89

      - name: Bump image tag in deploy manifests
        run: |
          sed -i "s/newTag: .*/newTag: ${{ github.sha }}/" deploy/kustomization.yaml
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add deploy/kustomization.yaml
          git commit -m "chore(deploy): image ${{ github.sha }} [skip ci]"
          git push
```
Then: `rm .github/workflows/cloud-run.yml`.

- [ ] **Step 3: Commit, push, watch the first run**

```bash
git add Dockerfile .github/workflows/
git commit -m "feat: deploy via GHCR + tag bump, drop Cloud Run workflow"
git push
gh run watch --repo eistin/nextjs-freelance-portfolio $(gh run list --repo eistin/nextjs-freelance-portfolio --limit 1 --json databaseId -q '.[0].databaseId') --exit-status
```
Expected: run succeeds (build ~3–5 min). Then `git pull` and confirm `deploy/kustomization.yaml` `newTag` equals the pushed commit's full SHA (`git log --oneline -2` shows the bot's `[skip ci]` commit).

- [ ] **Step 4: Verify the image is publicly pullable (GATE)**

```bash
TOKEN=$(curl -s "https://ghcr.io/token?scope=repository:eistin/nextjs-freelance-portfolio:pull" | jq -r .token)
TAG=$(grep newTag deploy/kustomization.yaml | awk '{print $2}')
curl -s -o /dev/null -w '%{http_code}\n' -H "Authorization: Bearer $TOKEN" -H "Accept: application/vnd.oci.image.index.v1+json, application/vnd.docker.distribution.manifest.v2+json" "https://ghcr.io/v2/eistin/nextjs-freelance-portfolio/manifests/$TAG"
```
Expected: `200`. If `401`/`403`/`404` the package is private (GHCR's default even for public repos) — **pause and ask the human** to flip it: https://github.com/users/eistin/packages/container/nextjs-freelance-portfolio/settings → Danger Zone → Change visibility → Public. Re-run the check; it must return 200 before Task 3 (the cluster pulls anonymously).

- [ ] **Step 5: Commit is already pushed — nothing further; report the image tag for Task 3.**

---

### Task 3: ArgoCD Application + staging verification

**Files:**
- Create: `/Users/stini/Workspace/stini-projects/stini-cluster/argocd/base/apps/portfolio.yaml`
- Modify: `/Users/stini/Workspace/stini-projects/stini-cluster/argocd/base/kustomization.yaml` (append one resource line)

**Interfaces:**
- Consumes: `deploy/` kustomize root (Task 1), public image (Task 2).
- Produces: Application `portfolio` (ns argocd) Synced/Healthy; `https://portfolio.edwindev.cloud` serving — the base state Task 4 cuts over onto.

- [ ] **Step 1: Write `argocd/base/apps/portfolio.yaml`** (in the stini-cluster repo)

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: portfolio
  namespace: argocd
  annotations:
    argocd.argoproj.io/sync-wave: "3"
spec:
  project: default
  source:
    repoURL: https://github.com/eistin/nextjs-freelance-portfolio
    targetRevision: HEAD
    path: deploy
  destination:
    server: https://kubernetes.default.svc
    namespace: portfolio
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - SkipDryRunOnMissingResource=true
```

- [ ] **Step 2: Append to `argocd/base/kustomization.yaml`** (after the `- resources/podinfo` line)

```yaml
  - apps/portfolio.yaml
```

- [ ] **Step 3: Build-check, commit, push**

```bash
cd /Users/stini/Workspace/stini-projects/stini-cluster
kubectl kustomize argocd/base >/dev/null && echo BUILD_OK
git add argocd/base && git commit -m "feat: portfolio application (first project onboarded)" && git push
```
Expected: `BUILD_OK`, push succeeds.

- [ ] **Step 4: Wait for sync and verify the KSOPS chain end-to-end**

```bash
export KUBECONFIG="${XDG_RUNTIME_DIR:-$HOME/.cache}/stini-cluster-secrets/kubeconfig"
kubectl -n argocd annotate application root argocd.argoproj.io/refresh=normal --overwrite
sleep 90
kubectl -n argocd get application portfolio -o jsonpath='{.status.sync.status}/{.status.health.status}'; echo
kubectl -n portfolio get secret portfolio-secrets -o jsonpath='{.data.RESEND_API_KEY}' | wc -c
kubectl -n portfolio get pods
```
Expected: `Synced/Healthy`; secret byte count > 0 (never print the value); pod `portfolio-…` Running 1/1. **This is the first real KSOPS sync** — if the app is Degraded with a kustomize/ksops error, capture `kubectl -n argocd get application portfolio -o jsonpath='{.status.conditions}'` and report; likely suspects are the generator annotation or repo-server SOPS key.

- [ ] **Step 5: Verify staging URL end-to-end**

```bash
dig +short portfolio.edwindev.cloud
curl -sI https://portfolio.edwindev.cloud | head -1
curl -s https://portfolio.edwindev.cloud | grep -c "edwindev.cloud"
curl -sI http://portfolio.edwindev.cloud | head -1
```
Expected: Cloudflare edge IPs; `HTTP/2 200`; count ≥ 1 (baked NEXT_PUBLIC_BASE_URL shows up in hreflang links); `301`.

- [ ] **Step 6: HUMAN GATE — contact form.** Ask the human to open `https://portfolio.edwindev.cloud`, submit the contact form, and confirm the email arrives at istin.edwin@gmail.com. Only a human can verify receipt. Do not proceed to Task 4 without their confirmation.

---

### Task 4: Cutover — both apex domains to the cluster

**Files:**
- Modify: `deploy/httproute.yaml` (portfolio repo)

**Interfaces:**
- Consumes: verified staging deployment (Task 3), DNS record inventory (Global Constraints).
- Produces: `edwindev.cloud` and `theclouds.dev` served by the cluster; Cloud Run no longer receives traffic (Task 5 may destroy it).

- [ ] **Step 1: Extend `deploy/httproute.yaml`** — replace the `parentRefs:` and `hostnames:` blocks with:

```yaml
  parentRefs:
    - name: main-gateway
      namespace: gateway
      sectionName: https-edwindev-wildcard
    - name: main-gateway
      namespace: gateway
      sectionName: https-edwindev-apex
    - name: main-gateway
      namespace: gateway
      sectionName: https-theclouds-apex
  hostnames:
    - portfolio.edwindev.cloud
    - edwindev.cloud
    - theclouds.dev
```
(Keep the existing comment and everything else unchanged.)

- [ ] **Step 2: Commit, push, wait for sync**

```bash
git add deploy/httproute.yaml && git commit -m "feat: serve apex domains edwindev.cloud + theclouds.dev" && git push
export KUBECONFIG="${XDG_RUNTIME_DIR:-$HOME/.cache}/stini-cluster-secrets/kubeconfig"
sleep 180
kubectl -n portfolio get httproute portfolio -o jsonpath='{.spec.hostnames}'; echo
```
Expected: all three hostnames listed.

- [ ] **Step 3: Snapshot the records being deleted (rollback insurance)**

```bash
set -a && source /Users/stini/Workspace/stini-projects/stini-cluster/.env && set +a
for Z in b69deebbe4cb6fce16d26382364cf6fa 64d18c8a33db3a48aca35fd276d8fc51; do
  curl -s -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" "https://api.cloudflare.com/client/v4/zones/$Z/dns_records?per_page=50" | jq '.result[] | {id,type,name,content,proxied}'
done > /Users/stini/Workspace/stini-projects/nextjs-freelance-portfolio/docs/superpowers/plans/dns-backup-2026-09-09.json
grep -c '"id"' /Users/stini/Workspace/stini-projects/nextjs-freelance-portfolio/docs/superpowers/plans/dns-backup-2026-09-09.json
```
Expected: count ≥ 15. Commit this backup file with the Task 4 final commit.

- [ ] **Step 4: Delete the superseded records** (only these — nothing else)

```bash
set -a && source /Users/stini/Workspace/stini-projects/stini-cluster/.env && set +a
# edwindev.cloud: the apex CNAME → theclouds.dev
ZE=b69deebbe4cb6fce16d26382364cf6fa
for id in $(curl -s -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" "https://api.cloudflare.com/client/v4/zones/$ZE/dns_records?type=CNAME&name=edwindev.cloud" | jq -r '.result[].id'); do
  curl -s -X DELETE -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" "https://api.cloudflare.com/client/v4/zones/$ZE/dns_records/$id" | jq -r '.success'
done
# theclouds.dev: ALL apex A and AAAA records (4 Google A + parking A + 4 Google AAAA; www/MX/TXT untouched)
ZT=64d18c8a33db3a48aca35fd276d8fc51
for id in $(curl -s -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" "https://api.cloudflare.com/client/v4/zones/$ZT/dns_records?name=theclouds.dev&per_page=50" | jq -r '.result[] | select(.type=="A" or .type=="AAAA") | .id'); do
  curl -s -X DELETE -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" "https://api.cloudflare.com/client/v4/zones/$ZT/dns_records/$id" | jq -r '.success'
done
```
Expected: a `true` per deletion (1 + 9 = 10 total).

- [ ] **Step 5: Wait for external-dns, then verify both apexes**

external-dns reconciles every ~1 min. After ~3 min:

```bash
dig +short edwindev.cloud; dig +short theclouds.dev
curl -sI https://edwindev.cloud | head -1; curl -sI https://theclouds.dev | head -1
curl -sI http://edwindev.cloud | head -1
curl -s https://theclouds.dev | grep -c hreflang
```
Expected: both resolve to Cloudflare edge IPs; both HTTPS return `HTTP/2 200` with valid certs (no `-k`); HTTP → `301`; content served. If a domain 522s: check the zone's SSL/TLS mode is Full (strict) — argo/test already work on edwindev.cloud, so theclouds.dev is the one to watch (`curl -s -X PATCH -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" -H "Content-Type: application/json" "https://api.cloudflare.com/client/v4/zones/$ZT/settings/ssl" -d '{"value":"strict"}'` if needed and the token allows; otherwise report for the human).

- [ ] **Step 6: Commit the DNS backup + report.** `git add docs/superpowers/plans/dns-backup-2026-09-09.json && git commit -m "docs: dns record backup from cutover" && git push`. Ask the human for one final contact-form check on `https://edwindev.cloud`.

---

### Task 5: Decommission GCP + docs

**Files:**
- Modify: `README.md` (portfolio repo — deployment section), `CLAUDE.md` (deployment references)
- External: `terraform destroy` in `/Users/stini/Workspace/portfolio/next-freelance-terraform/{nextjs-portfolio,infra}`; archive `eistin/next-freelance-terraform`

**Interfaces:**
- Consumes: verified cutover (Task 4).
- Produces: no GCP serving infra; docs describing the new deployment.

- [ ] **Step 1: Destroy the Cloud Run stack**

```bash
cd /Users/stini/Workspace/portfolio/next-freelance-terraform/nextjs-portfolio
terraform init -input=false && terraform state list
terraform destroy -auto-approve
```
Expected: destroys the Cloud Run service, domain mapping, and related resources. If destroy errors on the domain mapping (already-deleted DNS), re-run once; report persistent errors.

- [ ] **Step 2: Inspect the infra stack, then HUMAN GATE before destroying it**

```bash
cd ../infra && terraform init -input=false && terraform state list
```
Show the human the resource list and ask for explicit go-ahead, flagging two things: (a) if the state bucket `stini-tf-states` itself is in this state, run `terraform state rm <its address>` first so the bucket (holding this very state) survives the destroy; (b) the workload identity pool is named `global-pool` — if any OTHER repo's GitHub Actions deploy to GCP through it, destroying it breaks them. Only the human knows; wait for their answer.

- [ ] **Step 3: Destroy infra (after go-ahead)**

```bash
terraform destroy -auto-approve
```
Expected: removes Artifact Registry, the GitHub SA, WIF (if approved), service enablements. Then verify nothing serving remains: `gcloud run services list --project stini-326916 --region europe-west1` → empty.

- [ ] **Step 4: Archive the terraform repo**

```bash
gh repo archive eistin/next-freelance-terraform --yes
```

- [ ] **Step 5: Update portfolio docs** — in `README.md`, replace the Cloud Run deployment section with:

```markdown
## Deployment

GitOps to the stini-cluster (Hetzner). On push to `main`, GitHub Actions
builds `ghcr.io/eistin/nextjs-freelance-portfolio:<sha>` and commits the
tag into `deploy/kustomization.yaml`; ArgoCD on the cluster syncs `deploy/`
automatically. Serves at https://edwindev.cloud and https://theclouds.dev.

- Manifests: `deploy/` (Kustomize; Resend secret is SOPS-encrypted, synced
  via KSOPS)
- Cluster/platform repo: https://github.com/eistin/stini-cluster
- Rollback: `git revert` the tag-bump commit (or any commit) — ArgoCD
  follows git.
```
In `CLAUDE.md`, update any Cloud Run/GCP deployment references to match (search for `Cloud Run`, `gcloud`, `Artifact Registry` and rewrite or remove those lines).

- [ ] **Step 6: Final commit**

```bash
cd /Users/stini/Workspace/stini-projects/nextjs-freelance-portfolio
git add README.md CLAUDE.md && git commit -m "docs: deployment is GitOps to stini-cluster" && git push
```

---

## Verification checklist (whole-plan acceptance)

- `https://edwindev.cloud`, `https://theclouds.dev`, `https://portfolio.edwindev.cloud` all serve the portfolio over valid TLS; `http://` variants 301.
- Contact form delivers email (human-verified twice: staging + post-cutover).
- `deploy/kustomization.yaml` `newTag` matches a public GHCR image; ArgoCD app `portfolio` Synced/Healthy; secret `portfolio-secrets` exists (KSOPS chain proven).
- `gcloud run services list` in stini-326916/europe-west1 is empty; `next-freelance-terraform` archived.
- No plaintext `RESEND_API_KEY` anywhere in either repo's history from this migration.
- Cluster spend unchanged (~€9/mo — no new Hetzner resources).
