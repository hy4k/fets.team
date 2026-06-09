-- ============================================================
-- FETS Internal Operating System — Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- Project: duexkufmxqfnzlbrdmhc
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
DO $$ BEGIN CREATE TYPE user_role AS ENUM ('super_admin','hr_admin','centre_manager','accountant','staff','viewer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE employment_type AS ENUM ('full_time','part_time','trainee','contract');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE staff_status AS ENUM ('active','resigned','on_hold','terminated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- CENTRES
-- ============================================================
CREATE TABLE IF NOT EXISTS centres (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  city       TEXT NOT NULL,
  address    TEXT,
  phone      TEXT,
  email      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO centres (name, city, address) VALUES
  ('FETS Calicut',   'Calicut',   'Calicut, Kerala, India'),
  ('FETS Cochin',    'Cochin',    'Cochin, Kerala, India'),
  ('FETS Mangalore', 'Mangalore', 'Mangalore, Karnataka, India')
ON CONFLICT DO NOTHING;

-- ============================================================
-- DEPARTMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS departments (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO departments (name) VALUES
  ('Operations'),('Administration'),('IT'),('Finance'),('Training'),('Candidate Services')
ON CONFLICT DO NOTHING;

-- ============================================================
-- DESIGNATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS designations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         TEXT NOT NULL,
  department_id UUID REFERENCES departments(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  TEXT,
  role       user_role DEFAULT 'staff',
  staff_id   TEXT UNIQUE,
  centre_id  UUID REFERENCES centres(id),
  avatar_url TEXT,
  phone      TEXT,
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', 'staff')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- STAFF
-- ============================================================
CREATE TABLE IF NOT EXISTS staff (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id                TEXT UNIQUE NOT NULL,
  full_name               TEXT NOT NULL,
  photo_url               TEXT,
  mobile                  TEXT,
  email                   TEXT,
  alternate_email         TEXT,
  address                 TEXT,
  emergency_contact_name  TEXT,
  emergency_contact_phone TEXT,
  centre_id               UUID REFERENCES centres(id),
  department_id           UUID REFERENCES departments(id),
  designation_id          UUID REFERENCES designations(id),
  designation_text        TEXT,
  date_of_joining         DATE,
  date_of_birth           DATE,
  employment_type         employment_type DEFAULT 'full_time',
  status                  staff_status DEFAULT 'active',
  reporting_manager_id    UUID REFERENCES staff(id),
  basic_salary            DECIMAL(10,2) DEFAULT 0,
  bank_name               TEXT,
  bank_account_number     TEXT,
  bank_ifsc               TEXT,
  bank_branch             TEXT,
  aadhaar_number          TEXT,
  pan_number              TEXT,
  aadhaar_url             TEXT,
  resume_url              TEXT,
  agreement_url           TEXT,
  auth_user_id            UUID REFERENCES auth.users(id),
  notes                   TEXT,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- Seed: current FETS staff
INSERT INTO staff (staff_id, full_name, status, employment_type) VALUES
  ('FETS0006', 'Aysha Satha',  'active', 'full_time'),
  ('FETS0007', 'Anshitha K',   'active', 'full_time'),
  ('FETS0009', 'Linofer K',    'active', 'full_time'),
  ('FETS0010', 'Bindu Rajan',  'active', 'full_time'),
  ('FETS0011', 'Abidha',       'active', 'full_time'),
  ('FETS0014', 'Nimmy M',      'active', 'full_time'),
  ('FETS0015', 'Naima MM',     'active', 'full_time'),
  ('FETS0016', 'Shimna K',     'active', 'full_time'),
  ('FETS0017', 'Lazeem P',     'active', 'full_time')
ON CONFLICT (staff_id) DO NOTHING;

-- Link Calicut staff to Calicut centre
UPDATE staff SET centre_id = (SELECT id FROM centres WHERE city = 'Calicut')
WHERE staff_id IN ('FETS0006','FETS0007','FETS0009','FETS0010','FETS0011','FETS0014','FETS0015','FETS0016');

-- Link Cochin staff
UPDATE staff SET centre_id = (SELECT id FROM centres WHERE city = 'Cochin')
WHERE staff_id = 'FETS0017';

-- ============================================================
-- ADMIN SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_settings (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key        TEXT UNIQUE NOT NULL,
  value      TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO admin_settings (key, value) VALUES
  ('company_name',       'Forun Testing & Educational Services'),
  ('company_short_name', 'FETS'),
  ('logo_url',           ''),
  ('letterhead_url',     ''),
  ('signature_url',      ''),
  ('seal_url',           ''),
  ('primary_email',      'info@fets.in'),
  ('primary_phone',      ''),
  ('website',            'https://fets.in'),
  ('doc_number_prefix',  'FETS'),
  ('doc_number_counter', '1000'),
  ('calicut_address',    'Calicut, Kerala, India'),
  ('cochin_address',     'Cochin, Kerala, India'),
  ('mangalore_address',  'Mangalore, Karnataka, India')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- DOCUMENT TEMPLATES
-- ============================================================
CREATE TABLE IF NOT EXISTS document_templates (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  category      TEXT NOT NULL,
  template_key  TEXT UNIQUE NOT NULL,
  description   TEXT,
  html_content  TEXT,
  placeholders  JSONB DEFAULT '[]',
  has_letterhead BOOLEAN DEFAULT TRUE,
  has_signature  BOOLEAN DEFAULT TRUE,
  has_seal       BOOLEAN DEFAULT FALSE,
  has_qr         BOOLEAN DEFAULT FALSE,
  is_active      BOOLEAN DEFAULT TRUE,
  created_by     UUID REFERENCES auth.users(id),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO document_templates (name, category, template_key, description) VALUES
  ('Offer Letter',               'HR Letters',       'offer_letter',            'Initial offer of employment'),
  ('Appointment Letter',         'HR Letters',       'appointment_letter',       'Formal appointment confirmation'),
  ('Experience Letter',          'HR Letters',       'experience_letter',        'Proof of employment experience'),
  ('Relieving Letter',           'HR Letters',       'relieving_letter',         'Staff exit and relieving confirmation'),
  ('Salary Certificate',         'Finance',          'salary_certificate',       'Proof of current salary'),
  ('Increment Letter',           'Finance',          'increment_letter',         'Salary increment notification'),
  ('Pay Slip',                   'Finance',          'payslip',                  'Monthly salary statement'),
  ('Warning Letter',             'Disciplinary',     'warning_letter',           'Formal warning to staff'),
  ('Appreciation Letter',        'HR Letters',       'appreciation_letter',      'Appreciation for good performance'),
  ('Confirmation Letter',        'HR Letters',       'confirmation_letter',      'Probation period completion'),
  ('Leave Approval Letter',      'HR Letters',       'leave_approval',           'Formal leave approval'),
  ('Authorization Letter',       'Operations',       'authorization_letter',     'Centre visit authorization'),
  ('Internship Certificate',     'Certificates',     'internship_certificate',   'Internship completion certificate'),
  ('Training Certificate',       'Certificates',     'training_certificate',     'Training completion certificate'),
  ('Staff ID Card',              'Operations',       'id_card',                  'Official staff identity card'),
  ('NDA Agreement',              'Legal',            'nda_agreement',            'Non-disclosure and confidentiality'),
  ('Asset Handover Letter',      'Operations',       'asset_handover',           'Asset issuance and handover record'),
  ('Uniform Issue Form',         'Operations',       'uniform_issue',            'Uniform and ID card issuance'),
  ('Certification Record',       'Certifications',   'cert_record',              'Staff certification completion record')
ON CONFLICT (template_key) DO NOTHING;

-- ============================================================
-- GENERATED DOCUMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS generated_documents (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doc_number       TEXT UNIQUE NOT NULL,
  template_id      UUID REFERENCES document_templates(id),
  doc_type         TEXT NOT NULL,
  staff_id         UUID REFERENCES staff(id),
  status           TEXT DEFAULT 'draft'
                   CHECK (status IN ('draft','submitted','approved','rejected','generated','archived')),
  field_values     JSONB DEFAULT '{}',
  pdf_url          TEXT,
  verification_id  TEXT UNIQUE DEFAULT gen_random_uuid()::TEXT,
  created_by       UUID REFERENCES auth.users(id),
  approved_by      UUID REFERENCES auth.users(id),
  approval_date    TIMESTAMPTZ,
  approval_remarks TEXT,
  version          INTEGER DEFAULT 1,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SALARY RECORDS
-- ============================================================
CREATE TABLE IF NOT EXISTS salary_records (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id            UUID REFERENCES staff(id) NOT NULL,
  month               INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year                INTEGER NOT NULL,
  basic_salary        DECIMAL(10,2) DEFAULT 0,
  hra                 DECIMAL(10,2) DEFAULT 0,
  transport_allowance DECIMAL(10,2) DEFAULT 0,
  other_allowances    DECIMAL(10,2) DEFAULT 0,
  incentives          DECIMAL(10,2) DEFAULT 0,
  overtime            DECIMAL(10,2) DEFAULT 0,
  pf_deduction        DECIMAL(10,2) DEFAULT 0,
  esi_deduction       DECIMAL(10,2) DEFAULT 0,
  leave_deduction     DECIMAL(10,2) DEFAULT 0,
  advance_deduction   DECIMAL(10,2) DEFAULT 0,
  other_deductions    DECIMAL(10,2) DEFAULT 0,
  payment_date        DATE,
  payment_mode        TEXT DEFAULT 'bank_transfer',
  is_paid             BOOLEAN DEFAULT FALSE,
  payslip_url         TEXT,
  admin_notes         TEXT,
  generated_by        UUID REFERENCES auth.users(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(staff_id, month, year)
);

-- ============================================================
-- CERTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS certifications (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  issuing_body TEXT,
  category     TEXT,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO certifications (name, issuing_body, category) VALUES
  ('Prometric Proctor Certification',   'Prometric',    'External'),
  ('Pearson VUE Proctor Certification', 'Pearson VUE',  'External'),
  ('PSI Certification',                 'PSI',          'External'),
  ('ETS Certification',                 'ETS',          'External'),
  ('IELTS Examiner Certification',      'IDP/BC',       'External'),
  ('CELPIP Examiner Certification',     'Paragon',      'External'),
  ('ITTS Certification',                'ITTS',         'External'),
  ('LanguageCert Certification',        'LanguageCert', 'External'),
  ('Internal FETS Training',            'FETS',         'Internal'),
  ('Security Training',                 'FETS',         'Internal'),
  ('Candidate Handling Training',       'FETS',         'Internal')
ON CONFLICT DO NOTHING;

-- ============================================================
-- STAFF CERTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS staff_certifications (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id         UUID REFERENCES staff(id) NOT NULL,
  certification_id UUID REFERENCES certifications(id) NOT NULL,
  status           TEXT DEFAULT 'not_started'
                   CHECK (status IN ('not_started','in_progress','taken','passed','failed','expired')),
  taken_date       DATE,
  expiry_date      DATE,
  certificate_url  TEXT,
  remarks          TEXT,
  centre_id        UUID REFERENCES centres(id),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(staff_id, certification_id)
);

-- ============================================================
-- LEAVE TYPES
-- ============================================================
CREATE TABLE IF NOT EXISTS leave_types (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           TEXT NOT NULL UNIQUE,
  days_per_year  INTEGER DEFAULT 0,
  is_paid        BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO leave_types (name, days_per_year, is_paid) VALUES
  ('Casual Leave',    12, TRUE),
  ('Sick Leave',       7, TRUE),
  ('Annual Leave',    15, TRUE),
  ('Unpaid Leave',     0, FALSE),
  ('Maternity Leave', 90, TRUE),
  ('Paternity Leave',  5, TRUE)
ON CONFLICT DO NOTHING;

-- ============================================================
-- LEAVE REQUESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS leave_requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id        UUID REFERENCES staff(id) NOT NULL,
  leave_type_id   UUID REFERENCES leave_types(id) NOT NULL,
  from_date       DATE NOT NULL,
  to_date         DATE NOT NULL,
  days            INTEGER NOT NULL,
  reason          TEXT,
  status          TEXT DEFAULT 'pending'
                  CHECK (status IN ('pending','approved','rejected','cancelled')),
  approved_by     UUID REFERENCES auth.users(id),
  approval_date   TIMESTAMPTZ,
  remarks         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ATTENDANCE
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id   UUID REFERENCES staff(id) NOT NULL,
  date       DATE NOT NULL,
  check_in   TIME,
  check_out  TIME,
  status     TEXT DEFAULT 'present'
             CHECK (status IN ('present','absent','half_day','on_leave','holiday','weekend')),
  shift      TEXT,
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(staff_id, date)
);

-- ============================================================
-- DOCUMENT VAULT (Employee self-service)
-- ============================================================
CREATE TABLE IF NOT EXISTS document_vault (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id                UUID REFERENCES staff(id) NOT NULL,
  doc_name                TEXT NOT NULL,
  doc_type                TEXT NOT NULL,
  file_url                TEXT NOT NULL,
  uploaded_by             UUID REFERENCES auth.users(id),
  is_visible_to_employee  BOOLEAN DEFAULT TRUE,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LETTER REQUESTS (Employee self-service)
-- ============================================================
CREATE TABLE IF NOT EXISTS letter_requests (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id          UUID REFERENCES staff(id) NOT NULL,
  letter_type       TEXT NOT NULL,
  reason            TEXT,
  status            TEXT DEFAULT 'pending'
                    CHECK (status IN ('pending','processing','ready','rejected')),
  generated_doc_id  UUID REFERENCES generated_documents(id),
  hr_notes          TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES auth.users(id),
  action       TEXT NOT NULL,
  entity_type  TEXT NOT NULL,
  entity_id    TEXT,
  old_values   JSONB,
  new_values   JSONB,
  ip_address   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff               ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_records      ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_vault      ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests      ENABLE ROW LEVEL SECURITY;
ALTER TABLE letter_requests     ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance          ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs          ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Own profile" ON profiles;
CREATE POLICY "Own profile" ON profiles FOR ALL USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins all profiles" ON profiles;
CREATE POLICY "Admins all profiles" ON profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','hr_admin'))
);

-- Staff policies
DROP POLICY IF EXISTS "Admins full staff" ON staff;
CREATE POLICY "Admins full staff" ON staff FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','hr_admin','centre_manager','accountant'))
);

DROP POLICY IF EXISTS "Staff own record" ON staff;
CREATE POLICY "Staff own record" ON staff FOR SELECT USING (auth_user_id = auth.uid());

-- Salary policies
DROP POLICY IF EXISTS "Finance access salary" ON salary_records;
CREATE POLICY "Finance access salary" ON salary_records FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','hr_admin','accountant'))
);

DROP POLICY IF EXISTS "Staff own salary" ON salary_records;
CREATE POLICY "Staff own salary" ON salary_records FOR SELECT USING (
  EXISTS (SELECT 1 FROM staff WHERE id = salary_records.staff_id AND auth_user_id = auth.uid())
);

-- Documents policies
DROP POLICY IF EXISTS "Admins manage docs" ON generated_documents;
CREATE POLICY "Admins manage docs" ON generated_documents FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','hr_admin','centre_manager'))
);

DROP POLICY IF EXISTS "Staff own docs" ON generated_documents;
CREATE POLICY "Staff own docs" ON generated_documents FOR SELECT USING (
  EXISTS (SELECT 1 FROM staff WHERE id = generated_documents.staff_id AND auth_user_id = auth.uid())
);

-- Document vault
DROP POLICY IF EXISTS "Admins manage vault" ON document_vault;
CREATE POLICY "Admins manage vault" ON document_vault FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','hr_admin'))
);

DROP POLICY IF EXISTS "Staff own vault" ON document_vault;
CREATE POLICY "Staff own vault" ON document_vault FOR SELECT USING (
  is_visible_to_employee = TRUE AND
  EXISTS (SELECT 1 FROM staff WHERE id = document_vault.staff_id AND auth_user_id = auth.uid())
);

-- Leave requests
DROP POLICY IF EXISTS "Admins manage leave" ON leave_requests;
CREATE POLICY "Admins manage leave" ON leave_requests FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','hr_admin','centre_manager'))
);

DROP POLICY IF EXISTS "Staff own leave" ON leave_requests;
CREATE POLICY "Staff own leave" ON leave_requests FOR ALL USING (
  EXISTS (SELECT 1 FROM staff WHERE id = leave_requests.staff_id AND auth_user_id = auth.uid())
);

-- Open tables (read by all authenticated users)
ALTER TABLE centres           ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications    ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_types       ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read centres"    ON centres            FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth read depts"      ON departments        FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth read certs"      ON certifications     FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth read leave_types" ON leave_types       FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth read templates"  ON document_templates FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth read settings"   ON admin_settings     FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins manage settings" ON admin_settings   FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- ============================================================
-- STORAGE BUCKETS (run after schema)
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES
--   ('staff-photos',    'staff-photos',    false),
--   ('staff-documents', 'staff-documents', false),
--   ('payslips',        'payslips',        false),
--   ('letterheads',     'letterheads',     false),
--   ('certificates',    'certificates',    false)
-- ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- DONE
-- ============================================================
-- After running this schema:
-- 1. Go to Authentication > Users > Add User
-- 2. Create your admin account (email + password)
-- 3. Run: UPDATE profiles SET role = 'super_admin' WHERE id = '<your-user-id>';
-- 4. You can now log in to FETS OS at https://fets.team
-- ============================================================
