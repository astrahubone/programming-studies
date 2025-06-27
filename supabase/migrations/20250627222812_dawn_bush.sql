/*
  # Create technologies and sub-topics tables

  1. New Tables
    - `technologies`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `description` (text)
      - `icon_name` (text) - nome do ícone para usar no frontend
      - `is_active` (boolean) - se a tecnologia está ativa
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `technology_subtopics`
      - `id` (uuid, primary key)
      - `technology_id` (uuid, foreign key)
      - `name` (text)
      - `description` (text)
      - `hours_required` (integer) - horas necessárias para completar
      - `difficulty_level` (enum: 'iniciante', 'intermediario', 'avancado')
      - `order_index` (integer) - ordem de apresentação
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read data
    - Add policies for admins to manage data
*/

-- Create enum for difficulty levels
CREATE TYPE difficulty_level_tech AS ENUM ('iniciante', 'intermediario', 'avancado');

-- Create technologies table
CREATE TABLE IF NOT EXISTS technologies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  icon_name text NOT NULL, -- Nome do ícone (ex: 'Code', 'Database', etc.)
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create technology_subtopics table
CREATE TABLE IF NOT EXISTS technology_subtopics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technology_id uuid REFERENCES technologies(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  hours_required integer NOT NULL CHECK (hours_required > 0),
  difficulty_level difficulty_level_tech NOT NULL DEFAULT 'iniciante',
  order_index integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS technologies_name_idx ON technologies(name);
CREATE INDEX IF NOT EXISTS technologies_is_active_idx ON technologies(is_active);
CREATE INDEX IF NOT EXISTS technology_subtopics_technology_id_idx ON technology_subtopics(technology_id);
CREATE INDEX IF NOT EXISTS technology_subtopics_order_idx ON technology_subtopics(technology_id, order_index);
CREATE INDEX IF NOT EXISTS technology_subtopics_is_active_idx ON technology_subtopics(is_active);

-- Enable Row Level Security
ALTER TABLE technologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE technology_subtopics ENABLE ROW LEVEL SECURITY;

-- Create policies for technologies table
CREATE POLICY "Anyone can read active technologies"
  ON technologies
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage technologies"
  ON technologies
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.is_active = true
    )
  );

-- Create policies for technology_subtopics table
CREATE POLICY "Anyone can read active subtopics"
  ON technology_subtopics
  FOR SELECT
  TO authenticated
  USING (
    is_active = true 
    AND EXISTS (
      SELECT 1 FROM technologies
      WHERE technologies.id = technology_subtopics.technology_id
      AND technologies.is_active = true
    )
  );

CREATE POLICY "Admins can manage subtopics"
  ON technology_subtopics
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.is_active = true
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_technologies_updated_at ON technologies;
CREATE TRIGGER update_technologies_updated_at
  BEFORE UPDATE ON technologies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_technology_subtopics_updated_at ON technology_subtopics;
CREATE TRIGGER update_technology_subtopics_updated_at
  BEFORE UPDATE ON technology_subtopics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert initial technologies data
INSERT INTO technologies (name, description, icon_name) VALUES
  ('HTML', 'Linguagem de marcação para estruturar páginas web', 'Globe'),
  ('CSS', 'Linguagem de estilo para design e layout de páginas web', 'Palette'),
  ('JavaScript', 'Linguagem de programação para desenvolvimento web interativo', 'Code'),
  ('React', 'Biblioteca JavaScript para construção de interfaces de usuário', 'Code'),
  ('Segurança', 'Conceitos e práticas de segurança em desenvolvimento', 'Shield'),
  ('Dados', 'Gerenciamento e manipulação de dados e bancos de dados', 'Database'),
  ('Cloud', 'Computação em nuvem e serviços cloud', 'Cloud')
ON CONFLICT (name) DO NOTHING;

-- Insert initial subtopics data
INSERT INTO technology_subtopics (technology_id, name, description, hours_required, difficulty_level, order_index)
SELECT 
  t.id,
  subtopic.name,
  subtopic.description,
  subtopic.hours_required,
  subtopic.difficulty_level::difficulty_level_tech,
  subtopic.order_index
FROM technologies t
CROSS JOIN (
  VALUES 
    -- HTML subtopics
    ('HTML', 'Estrutura básica HTML', 'Elementos fundamentais, tags básicas e estrutura de documento', 4, 'iniciante', 1),
    ('HTML', 'Formulários e validação', 'Criação de formulários interativos e validação de dados', 6, 'intermediario', 2),
    ('HTML', 'Semântica e acessibilidade', 'HTML semântico e práticas de acessibilidade', 8, 'intermediario', 3),
    
    -- CSS subtopics
    ('CSS', 'CSS básico e seletores', 'Sintaxe CSS, seletores e propriedades fundamentais', 6, 'iniciante', 1),
    ('CSS', 'Layout e Flexbox', 'Técnicas de layout moderno com Flexbox', 8, 'intermediario', 2),
    ('CSS', 'Grid e responsividade', 'CSS Grid e design responsivo', 10, 'intermediario', 3),
    ('CSS', 'Animações e transições', 'Criação de animações e efeitos visuais', 6, 'avancado', 4),
    
    -- JavaScript subtopics
    ('JavaScript', 'Fundamentos JavaScript', 'Variáveis, tipos de dados, funções e controle de fluxo', 12, 'iniciante', 1),
    ('JavaScript', 'DOM e eventos', 'Manipulação do DOM e tratamento de eventos', 10, 'intermediario', 2),
    ('JavaScript', 'Programação assíncrona', 'Promises, async/await e APIs', 8, 'intermediario', 3),
    ('JavaScript', 'ES6+ e módulos', 'Recursos modernos do JavaScript e sistema de módulos', 6, 'avancado', 4),
    
    -- React subtopics
    ('React', 'Componentes e JSX', 'Criação de componentes e sintaxe JSX', 8, 'iniciante', 1),
    ('React', 'Estado e props', 'Gerenciamento de estado e comunicação entre componentes', 10, 'intermediario', 2),
    ('React', 'Hooks e ciclo de vida', 'React Hooks e gerenciamento do ciclo de vida', 12, 'intermediario', 3),
    ('React', 'Context e estado global', 'Context API e gerenciamento de estado global', 8, 'avancado', 4),
    
    -- Segurança subtopics
    ('Segurança', 'Fundamentos de segurança web', 'Conceitos básicos de segurança em aplicações web', 6, 'iniciante', 1),
    ('Segurança', 'Autenticação e autorização', 'Sistemas de login, JWT e controle de acesso', 8, 'intermediario', 2),
    ('Segurança', 'Vulnerabilidades comuns', 'OWASP Top 10 e prevenção de ataques', 10, 'avancado', 3),
    
    -- Dados subtopics
    ('Dados', 'Bancos de dados relacionais', 'SQL e modelagem de dados relacionais', 12, 'iniciante', 1),
    ('Dados', 'NoSQL e bancos modernos', 'MongoDB, Redis e bancos não-relacionais', 8, 'intermediario', 2),
    ('Dados', 'APIs e integração', 'REST APIs, GraphQL e integração de dados', 10, 'intermediario', 3),
    
    -- Cloud subtopics
    ('Cloud', 'Fundamentos de cloud', 'Conceitos básicos de computação em nuvem', 6, 'iniciante', 1),
    ('Cloud', 'Serviços AWS/Azure', 'Principais serviços de cloud providers', 12, 'intermediario', 2),
    ('Cloud', 'DevOps e CI/CD', 'Práticas DevOps e pipelines de deployment', 10, 'avancado', 3)
) AS subtopic(tech_name, name, description, hours_required, difficulty_level, order_index)
WHERE t.name = subtopic.tech_name;

-- Create view for technologies with total hours
CREATE OR REPLACE VIEW technologies_with_hours AS
SELECT 
  t.id,
  t.name,
  t.description,
  t.icon_name,
  t.is_active,
  COALESCE(SUM(ts.hours_required), 0) as total_hours,
  COUNT(ts.id) as subtopics_count,
  t.created_at,
  t.updated_at
FROM technologies t
LEFT JOIN technology_subtopics ts ON ts.technology_id = t.id AND ts.is_active = true
WHERE t.is_active = true
GROUP BY t.id, t.name, t.description, t.icon_name, t.is_active, t.created_at, t.updated_at
ORDER BY t.name;

-- Grant access to the view
GRANT SELECT ON technologies_with_hours TO authenticated;