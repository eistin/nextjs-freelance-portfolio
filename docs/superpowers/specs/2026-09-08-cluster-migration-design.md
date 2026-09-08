# Portfolio migration: Cloud Run → stini-cluster — Design Spec

**Date:** 2026-09-08
**Status:** Approved design, pre-implementation
**Repo:** `eistin/nextjs-freelance-portfolio` (public)
**Cluster:** stini-cluster (see `stini-cluster/docs/superpowers/specs/2026-09-08-stini-cluster-design.md`)

## Goal

Move the portfolio's deployment from GCP Cloud Run to the stini-cluster
(1× cx33, hel1) with GitOps via ArgoCD, then decommission the GCP serving
infrastructure. The site keeps serving at the apex `edwindev.cloud` with a
staged, low-risk cutover.

## Current state (verified 2026-09-08)

- Serves at apex `edwindev.cloud` via Cloud Run domain mapping; Cloudflare
  records are DNS-only (grey cloud), values from
  `next-freelance-terraform/nextjs-portfolio` outputs.
- CI: `.github/workflows/cloud-run.yml` — GCP workload identity → Artifact
  Registry (`stini-326916`) → `gcloud run services update`.
- Runtime env (Terraform-managed on Cloud Run): `RESEND_API_KEY` (secret),
  `CONTACT_EMAIL=istin.edwin@gmail.com`, `FROM_EMAIL_DOMAIN=edwindev.cloud`,
  `NEXT_PUBLIC_BASE_URL=https://edwindev.cloud`,
  `NEXT_PUBLIC_GA_MEASUREMENT_ID`.
- Dockerfile: Next.js standalone output, port 3000, non-root — works as-is
  for linux/amd64. No changes needed.
- Cluster side already ready: Gateway listeners + valid wildcard/apex cert
  for `edwindev.cloud`, external-dns (Cloudflare-proxied), ArgoCD synced to
  `stini-cluster/argocd/base`.

## Decisions

| Topic | Decision | Rationale |
|---|---|---|
| Registry | **GHCR, public image** `ghcr.io/eistin/nextjs-freelance-portfolio` | Native GH Actions auth (`GITHUB_TOKEN`), free, no pull secret, sheds the GCP dependency; repo is already public |
| Image tag → cluster | **CI bumps the tag in git**: workflow pushes `:<git-sha>`, edits `deploy/kustomization.yaml`, commits back with `[skip ci]` | Fully GitOps — git shows exactly what runs; rollback = revert |
| Build-time env | `NEXT_PUBLIC_*` passed as **Docker build args** in CI (and still set at runtime for server-side reads) | Next.js inlines `NEXT_PUBLIC_*` into the client bundle at build time; Cloud Run's runtime-only injection was incorrect for client code |
| Manifests | `deploy/` Kustomize folder in this repo (cluster onboarding contract) | Code + deployment evolve together |
| Secret | `RESEND_API_KEY` as **KSOPS-encrypted secret in `deploy/`** (repo gets its own `.sops.yaml`, same age key as stini-cluster) | Per the cluster's designed contract; first real exercise of the installed KSOPS machinery — the plan must verify the generator syncs |
| Non-secret env | kustomize `configMapGenerator` | Simple, visible |
| Routing | HTTPRoute with **two parentRefs** (`sectionName: https-edwindev-wildcard` and `https-edwindev-apex`) | Keeps the HTTP→HTTPS redirect unshadowed (established cluster ruling); apex + staging host need different listeners |
| Cutover | **Staged**: serve `portfolio.edwindev.cloud` first, verify (incl. contact form), then add apex hostname + delete old grey-cloud records so external-dns takes over | Near-zero visitor risk; external-dns won't overwrite records it doesn't own, so old records must be removed manually |
| Cloud Run | **Decommission after cutover**: `terraform destroy` both `next-freelance-terraform` stacks (service, domain mapping, Artifact Registry, GitHub SA/WIF); archive that repo. The GCP project itself stays (hosts the cluster's state bucket) | Single source of truth; removes idle infra |
| Repo location | Local move to `~/Workspace/stini-projects/`; GitHub repo unchanged | Nothing depends on the local path |

## Components

### 1. CI — `.github/workflows/deploy.yml` (replaces `cloud-run.yml`)

On push to main (ignoring `deploy/kustomization.yaml` churn via `[skip ci]`):
1. Build linux/amd64 image from the existing Dockerfile with build args
   `NEXT_PUBLIC_BASE_URL=https://edwindev.cloud` and
   `NEXT_PUBLIC_GA_MEASUREMENT_ID` (from a repo variable).
2. Push `ghcr.io/eistin/nextjs-freelance-portfolio:<git-sha>` using
   `GITHUB_TOKEN` (`packages: write`). Image visibility: public.
3. Update `deploy/kustomization.yaml` `newTag` to `<git-sha>`, commit
   `chore(deploy): image <git-sha> [skip ci]`, push.

The Dockerfile gains `ARG`/`ENV` lines for the two `NEXT_PUBLIC_*` values
(only change to it).

### 2. `deploy/` folder

- `kustomization.yaml` — resources + `images:` newTag + configMapGenerator
  (CONTACT_EMAIL, FROM_EMAIL_DOMAIN, NEXT_PUBLIC_* runtime copies) +
  KSOPS secret generator.
- `deployment.yaml` — 1 replica, image `ghcr.io/eistin/nextjs-freelance-portfolio`,
  port 3000, envFrom configmap + secret, requests ~100m/128Mi limit 256Mi,
  liveness/readiness GET `/` on 3000.
- `service.yaml` — ClusterIP 80 → 3000.
- `httproute.yaml` — ns `portfolio`; parentRefs to `main-gateway` (ns
  `gateway`) with the two sectionNames; hostnames: `portfolio.edwindev.cloud`
  initially, apex `edwindev.cloud` added at cutover.
- `namespace.yaml` — `portfolio`.
- `secrets.sops.yaml` + `secret-generator.yaml` (KSOPS) — RESEND_API_KEY.
- `.sops.yaml` at repo root — rule for `deploy/.*secret.*\.yaml$`, same age
  public key as stini-cluster.

### 3. stini-cluster side (one small PR)

`argocd/base/apps/portfolio.yaml` — Application: repo
`https://github.com/eistin/nextjs-freelance-portfolio`, path `deploy/`,
`targetRevision: HEAD`, automated sync + prune + selfHeal,
`CreateNamespace=false` (namespace.yaml owns it), sync-wave 3. Listed in
`argocd/base/kustomization.yaml`.

## Cutover sequence

1. Deploy with staging hostname only → verify `https://portfolio.edwindev.cloud`
   (page, assets, GA beacon, **contact form end-to-end** — real email received).
2. Add apex hostname + apex parentRef to `httproute.yaml`; push.
3. Delete the old grey-cloud apex records (the Cloud Run domain-mapping
   records) from the `edwindev.cloud` zone via Cloudflare API.
4. external-dns creates proxied apex records (target annotation on the
   Gateway). Verify `https://edwindev.cloud` serves from the cluster
   (Cloudflare edge IPs, valid cert, contact form once more).
5. Decommission: `terraform destroy` in `next-freelance-terraform`
   (`nextjs-portfolio` stack, then `infra` stack), delete `cloud-run.yml`
   from the portfolio repo (done in step 1's CI replacement), archive the
   terraform repo on GitHub.

## Error handling / rollback

- Before step 3, Cloud Run keeps serving the apex — abort at any point with
  zero visitor impact.
- After step 3, rollback = re-create the grey-cloud records (values are in
  `next-freelance-terraform` outputs / terraform state — capture them in the
  plan before deletion) and remove the apex from the HTTPRoute.
- After step 5 (destroy), rollback is a redeploy to the cluster only — the
  staged verification makes this acceptable.

## Testing

- CI stays lean: no in-workflow container smoke step — the staging
  hostname (`portfolio.edwindev.cloud`) is the smoke test.
- KSOPS verification: after the Application first syncs, confirm the
  `resend-api-key` secret exists in ns `portfolio` and the ArgoCD app is
  Healthy — this validates the whole KSOPS chain for every future project.
- Post-cutover checks: `dig` apex → Cloudflare edge; `curl -sI` apex → 200;
  `http://` → 301; contact form email received.

## Out of scope

- `www.edwindev.cloud` (not mapped today), HPA/multi-replica, preview
  environments, VictoriaMetrics, image retention policies on GHCR.
