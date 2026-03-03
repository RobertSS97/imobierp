#!/bin/bash
# ─── ImobiERP - Script de Deploy para Produção ────────────────────
# Uso:
#   chmod +x deploy.sh
#   ./deploy.sh                 # build e push
#   ./deploy.sh --setup         # gerar .env de produção
#   ./deploy.sh --seed          # rodar seed (criar admin)

set -euo pipefail

IMAGE="robertn64/imobierp"
TAG="${1:-latest}"
ENV_FILE=".env.production"

# ─── Cores ─────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[ImobiERP]${NC} $1"; }
success() { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; }

# ─── Setup: gerar arquivo .env de produção ────────────────────────
if [[ "${1:-}" == "--setup" ]]; then
  log "Gerando secrets de produção..."

  JWT_SECRET=$(openssl rand -hex 64)
  JWT_REFRESH_SECRET=$(openssl rand -hex 64)
  ADMIN_JWT_SECRET=$(openssl rand -hex 64)
  CRON_SECRET=$(openssl rand -hex 32)
  PG_PASSWORD=$(openssl rand -hex 32)

  cat > "$ENV_FILE" <<EOF
# ─── ImobiERP - Variáveis de Produção ─────────────────────────────
# Gerado em: $(date -u '+%Y-%m-%dT%H:%M:%SZ')
# ATENÇÃO: NÃO commitar este arquivo!

# Banco de dados
POSTGRES_USER=imobierp
POSTGRES_PASSWORD=${PG_PASSWORD}
POSTGRES_DB=imobierp
DATABASE_URL=postgresql://imobierp:${PG_PASSWORD}@db:5432/imobierp?schema=public

# JWT (NÃO alterar após deploy - invalida tokens ativos)
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
ADMIN_JWT_SECRET=${ADMIN_JWT_SECRET}

# CORS (domínios permitidos, separados por vírgula)
ALLOWED_ORIGINS=https://seudominio.com.br

# Cron
CRON_SECRET=${CRON_SECRET}

# Admin inicial (usado pelo seed)
ADMIN_EMAIL=admin@imobierp.com
ADMIN_PASSWORD=Admin@2024!
ADMIN_NAME=Robert

# API
NEXT_PUBLIC_API_URL=/api
EOF

  success "Arquivo $ENV_FILE criado!"
  warn "IMPORTANTE: Edite ALLOWED_ORIGINS com seu domínio real"
  warn "IMPORTANTE: Altere ADMIN_PASSWORD para uma senha segura"
  echo ""
  log "Para deploy: docker compose --env-file $ENV_FILE up -d"
  exit 0
fi

# ─── Seed: criar admin user ───────────────────────────────────────
if [[ "${1:-}" == "--seed" ]]; then
  log "Rodando seed no container..."
  docker compose exec app npx tsx prisma/seed.ts
  success "Seed concluído!"
  exit 0
fi

# ─── Build e Push ──────────────────────────────────────────────────
log "Iniciando build da imagem Docker..."
log "Imagem: ${IMAGE}:${TAG}"
echo ""

# Build
docker build -t "${IMAGE}:${TAG}" .
success "Build concluído!"

# Tag latest se não for "latest"
if [[ "$TAG" != "latest" ]]; then
  docker tag "${IMAGE}:${TAG}" "${IMAGE}:latest"
  success "Tag latest criada"
fi

# Push
log "Fazendo push para Docker Hub..."
docker push "${IMAGE}:${TAG}"
if [[ "$TAG" != "latest" ]]; then
  docker push "${IMAGE}:latest"
fi
success "Push concluído!"

echo ""
log "═══════════════════════════════════════════════════"
success "Deploy: ${IMAGE}:${TAG}"
log "═══════════════════════════════════════════════════"
echo ""
log "Para iniciar em produção:"
echo "  docker compose --env-file .env.production up -d"
echo ""
log "Para rodar o seed (criar admin):"
echo "  docker compose exec app npx tsx prisma/seed.ts"
echo ""
