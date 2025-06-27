/*
  # Sistema de Configuração de Estudos e Cronograma

  1. New Tables
    - study_configurations: Armazena configurações de estudo do usuário
    - technology_study_sessions: Sessões de estudo geradas

  2. Changes
    - Adiciona order_index nas tabelas technologies e technology_subtopics
    - Cria função para gerar cronograma automaticamente
    - Adiciona view para estatísticas

  3. Security
    - Enable RLS em todas as novas tabelas
    - Políticas para usuários e admins
*/

-- Adicionar order_index na tabela technologies se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'technologies' AND column_name = 'order_index'
  ) THEN
    ALTER TABLE technologies ADD COLUMN order_index integer DEFAULT 0;
    
    -- Definir ordem inicial baseada no nome
    UPDATE technologies SET order_index = 
      CASE name
        WHEN 'HTML' THEN 1
        WHEN 'CSS' THEN 2
        WHEN 'JavaScript' THEN 3
        WHEN 'React' THEN 4
        WHEN 'Node.js' THEN 5
        WHEN 'Python' THEN 6
        WHEN 'Segurança' THEN 7
        WHEN 'Dados' THEN 8
        WHEN 'Cloud' THEN 9
        ELSE 10
      END;
  END IF;
END $$;

-- Adicionar order_index na tabela technology_subtopics se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'technology_subtopics' AND column_name = 'order_index'
  ) THEN
    ALTER TABLE technology_subtopics ADD COLUMN order_index integer DEFAULT 0;
    
    -- Definir ordem inicial baseada no id (ordem de criação)
    WITH ordered_subtopics AS (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY technology_id ORDER BY created_at, name) as rn
      FROM technology_subtopics
    )
    UPDATE technology_subtopics 
    SET order_index = ordered_subtopics.rn
    FROM ordered_subtopics
    WHERE technology_subtopics.id = ordered_subtopics.id;
  END IF;
END $$;

-- Criar índices para order_index
CREATE INDEX IF NOT EXISTS technologies_order_idx ON technologies(order_index);
CREATE INDEX IF NOT EXISTS technology_subtopics_order_idx ON technology_subtopics(technology_id, order_index);

-- Criar tabela de configurações de estudo
CREATE TABLE IF NOT EXISTS study_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  start_date date NOT NULL,
  study_days jsonb NOT NULL, -- Array de objetos: [{"day": "monday", "hours": 3}, ...]
  selected_technologies uuid[] NOT NULL, -- Array de IDs das tecnologias selecionadas
  total_weekly_hours integer NOT NULL,
  total_selected_hours integer NOT NULL, -- Total de horas das tecnologias selecionadas
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de sessões de estudo de tecnologias
CREATE TABLE IF NOT EXISTS technology_study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  configuration_id uuid REFERENCES study_configurations(id) ON DELETE CASCADE NOT NULL,
  technology_id uuid REFERENCES technologies(id) ON DELETE CASCADE NOT NULL,
  subtopic_id uuid REFERENCES technology_subtopics(id) ON DELETE CASCADE NOT NULL,
  scheduled_date date NOT NULL,
  scheduled_hours decimal(3,1) NOT NULL CHECK (scheduled_hours > 0),
  subtopic_progress_hours decimal(3,1) DEFAULT 0, -- Quantas horas já foram estudadas deste subtópico
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS study_configurations_user_id_idx ON study_configurations(user_id);
CREATE INDEX IF NOT EXISTS study_configurations_is_active_idx ON study_configurations(is_active);
CREATE INDEX IF NOT EXISTS technology_study_sessions_user_id_idx ON technology_study_sessions(user_id);
CREATE INDEX IF NOT EXISTS technology_study_sessions_scheduled_date_idx ON technology_study_sessions(scheduled_date);
CREATE INDEX IF NOT EXISTS technology_study_sessions_configuration_id_idx ON technology_study_sessions(configuration_id);
CREATE INDEX IF NOT EXISTS technology_study_sessions_technology_id_idx ON technology_study_sessions(technology_id);
CREATE INDEX IF NOT EXISTS technology_study_sessions_subtopic_id_idx ON technology_study_sessions(subtopic_id);

-- Enable Row Level Security
ALTER TABLE study_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE technology_study_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas para study_configurations
CREATE POLICY "Users can manage own study configurations"
  ON study_configurations
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all study configurations"
  ON study_configurations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.is_active = true
    )
  );

-- Políticas para technology_study_sessions
CREATE POLICY "Users can manage own technology study sessions"
  ON technology_study_sessions
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all technology study sessions"
  ON technology_study_sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.is_active = true
    )
  );

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_study_configurations_updated_at ON study_configurations;
CREATE TRIGGER update_study_configurations_updated_at
  BEFORE UPDATE ON study_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_technology_study_sessions_updated_at ON technology_study_sessions;
CREATE TRIGGER update_technology_study_sessions_updated_at
  BEFORE UPDATE ON technology_study_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Função para gerar cronograma de estudos
CREATE OR REPLACE FUNCTION generate_study_schedule(
  p_user_id uuid,
  p_configuration_id uuid
)
RETURNS TABLE (
  session_id uuid,
  technology_name text,
  subtopic_name text,
  scheduled_date date,
  scheduled_hours decimal,
  week_number integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  config_record RECORD;
  tech_record RECORD;
  subtopic_record RECORD;
  v_current_date date;
  v_current_week integer := 1;
  v_week_hours_used integer := 0;
  v_day_hours_used decimal := 0;
  v_current_day_info jsonb;
  v_day_max_hours decimal;
  v_remaining_subtopic_hours decimal;
  v_session_hours decimal;
  v_session_id uuid;
  v_day_name text;
BEGIN
  -- Buscar configuração
  SELECT * INTO config_record
  FROM study_configurations
  WHERE id = p_configuration_id AND user_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Configuration not found';
  END IF;
  
  -- Limpar sessões existentes desta configuração
  DELETE FROM technology_study_sessions 
  WHERE configuration_id = p_configuration_id;
  
  v_current_date := config_record.start_date;
  
  -- Loop através das tecnologias ordenadas
  FOR tech_record IN 
    SELECT t.*, ts.total_hours
    FROM technologies t
    JOIN technologies_with_hours ts ON ts.id = t.id
    WHERE t.id = ANY(config_record.selected_technologies)
    AND t.is_active = true
    ORDER BY t.order_index, t.name
  LOOP
    -- Loop através dos subtópicos ordenados desta tecnologia
    FOR subtopic_record IN
      SELECT *
      FROM technology_subtopics
      WHERE technology_id = tech_record.id
      AND is_active = true
      ORDER BY order_index, name
    LOOP
      v_remaining_subtopic_hours := subtopic_record.hours_required;
      
      -- Distribuir as horas deste subtópico ao longo dos dias
      WHILE v_remaining_subtopic_hours > 0 LOOP
        -- Encontrar o próximo dia disponível
        LOOP
          -- Obter nome do dia da semana em inglês
          v_day_name := CASE EXTRACT(DOW FROM v_current_date)
            WHEN 0 THEN 'sunday'
            WHEN 1 THEN 'monday'
            WHEN 2 THEN 'tuesday'
            WHEN 3 THEN 'wednesday'
            WHEN 4 THEN 'thursday'
            WHEN 5 THEN 'friday'
            WHEN 6 THEN 'saturday'
          END;
          
          -- Verificar se é um dia de estudo
          SELECT value INTO v_current_day_info
          FROM jsonb_array_elements(config_record.study_days)
          WHERE value->>'day' = v_day_name;
          
          IF v_current_day_info IS NOT NULL THEN
            v_day_max_hours := (v_current_day_info->>'hours')::decimal;
            EXIT;
          END IF;
          
          v_current_date := v_current_date + 1;
        END LOOP;
        
        -- Calcular quantas horas alocar neste dia
        v_session_hours := LEAST(
          v_remaining_subtopic_hours,
          v_day_max_hours - v_day_hours_used
        );
        
        -- Criar sessão de estudo
        INSERT INTO technology_study_sessions (
          user_id,
          configuration_id,
          technology_id,
          subtopic_id,
          scheduled_date,
          scheduled_hours,
          subtopic_progress_hours
        ) VALUES (
          p_user_id,
          p_configuration_id,
          tech_record.id,
          subtopic_record.id,
          v_current_date,
          v_session_hours,
          subtopic_record.hours_required - v_remaining_subtopic_hours
        ) RETURNING id INTO v_session_id;
        
        -- Retornar informações da sessão criada
        RETURN QUERY SELECT 
          v_session_id,
          tech_record.name,
          subtopic_record.name,
          v_current_date,
          v_session_hours,
          v_current_week;
        
        -- Atualizar contadores
        v_remaining_subtopic_hours := v_remaining_subtopic_hours - v_session_hours;
        v_day_hours_used := v_day_hours_used + v_session_hours;
        v_week_hours_used := v_week_hours_used + v_session_hours::integer;
        
        -- Se o dia está completo, avançar para o próximo
        IF v_day_hours_used >= v_day_max_hours THEN
          v_current_date := v_current_date + 1;
          v_day_hours_used := 0;
          
          -- Verificar se completou a semana
          IF v_week_hours_used >= config_record.total_weekly_hours THEN
            v_current_week := v_current_week + 1;
            v_week_hours_used := 0;
          END IF;
        END IF;
      END LOOP;
    END LOOP;
  END LOOP;
  
  RETURN;
END;
$$;

-- View para estatísticas de configurações de estudo
CREATE OR REPLACE VIEW study_configuration_stats AS
SELECT 
  sc.id,
  sc.user_id,
  sc.start_date,
  sc.total_weekly_hours,
  sc.total_selected_hours,
  COUNT(tss.id) as total_sessions,
  COUNT(CASE WHEN tss.is_completed THEN 1 END) as completed_sessions,
  ROUND(
    COUNT(CASE WHEN tss.is_completed THEN 1 END)::decimal / 
    NULLIF(COUNT(tss.id), 0) * 100, 2
  ) as completion_percentage,
  SUM(tss.scheduled_hours) as total_scheduled_hours,
  SUM(CASE WHEN tss.is_completed THEN tss.scheduled_hours ELSE 0 END) as completed_hours,
  MIN(tss.scheduled_date) as first_session_date,
  MAX(tss.scheduled_date) as last_session_date,
  sc.created_at,
  sc.updated_at
FROM study_configurations sc
LEFT JOIN technology_study_sessions tss ON tss.configuration_id = sc.id
WHERE sc.is_active = true
GROUP BY sc.id, sc.user_id, sc.start_date, sc.total_weekly_hours, 
         sc.total_selected_hours, sc.created_at, sc.updated_at;

-- Grant permissions
GRANT SELECT ON study_configuration_stats TO authenticated;
GRANT EXECUTE ON FUNCTION generate_study_schedule TO authenticated;