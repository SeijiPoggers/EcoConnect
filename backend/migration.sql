-- ═══════════════════════════════════════════════════════
-- Migration v3: Instituições + Modo Instituição
-- ═══════════════════════════════════════════════════════

-- InstitutionRole enum
CREATE TYPE "InstitutionRole" AS ENUM ('ADMIN', 'MEMBER');

-- Adiciona campos Modo Instituição em ProfessionalProfile
ALTER TABLE "professional_profiles"
  ADD COLUMN "institutionMode"  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "institutionCount" INTEGER NOT NULL DEFAULT 0;

-- Tabela Institution
CREATE TABLE "institutions" (
  "id"          TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"        TEXT NOT NULL,
  "type"        TEXT NOT NULL,
  "description" TEXT,
  "city"        TEXT NOT NULL,
  "state"       TEXT NOT NULL DEFAULT 'SP',
  "address"     TEXT,
  "phone"       TEXT,
  "email"       TEXT,
  "website"     TEXT,
  "logoUrl"     TEXT,
  "emoji"       TEXT NOT NULL DEFAULT '🏥',
  "slotsTotal"  INTEGER NOT NULL DEFAULT 10,
  "slotsUsed"   INTEGER NOT NULL DEFAULT 0,
  "rating"      DOUBLE PRECISION NOT NULL DEFAULT 5.0,
  "isActive"    BOOLEAN NOT NULL DEFAULT true,
  "createdById" TEXT NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabela InstitutionTag
CREATE TABLE "institution_tags" (
  "id"            TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "institutionId" TEXT NOT NULL,
  "tag"           TEXT NOT NULL,
  CONSTRAINT "institution_tags_institutionId_tag_key" UNIQUE ("institutionId", "tag"),
  CONSTRAINT "institution_tags_institutionId_fkey"
    FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE
);

-- Tabela InstitutionMember (M:N)
CREATE TABLE "institution_members" (
  "id"             TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "institutionId"  TEXT NOT NULL,
  "professionalId" TEXT NOT NULL,
  "role"           "InstitutionRole" NOT NULL DEFAULT 'MEMBER',
  "joinedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "institution_members_institutionId_professionalId_key"
    UNIQUE ("institutionId", "professionalId"),
  CONSTRAINT "institution_members_institutionId_fkey"
    FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE,
  CONSTRAINT "institution_members_professionalId_fkey"
    FOREIGN KEY ("professionalId") REFERENCES "professional_profiles"("id") ON DELETE CASCADE
);

-- Adiciona institutionId na tabela appointments
ALTER TABLE "appointments"
  ADD COLUMN "institutionId" TEXT,
  ADD CONSTRAINT "appointments_institutionId_fkey"
    FOREIGN KEY ("institutionId") REFERENCES "institutions"("id");

-- Índices
CREATE INDEX "institutions_createdById_idx" ON "institutions"("createdById");
CREATE INDEX "institution_members_professionalId_idx" ON "institution_members"("professionalId");
CREATE INDEX "appointments_institutionId_idx" ON "appointments"("institutionId");

-- Função para atualizar updatedAt automaticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW."updatedAt" = CURRENT_TIMESTAMP; RETURN NEW; END;
$$ language 'plpgsql';

CREATE TRIGGER institutions_updated_at
  BEFORE UPDATE ON "institutions"
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
