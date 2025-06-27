import { 
  Code, 
  Database, 
  Cloud, 
  Shield, 
  Globe, 
  Palette,
  Server,
  Smartphone,
  Monitor,
  Cpu,
  HardDrive,
  Network,
  Lock,
  Settings,
  Zap
} from 'lucide-react';

// Mapeamento de nomes de tecnologias para ícones
const technologyIconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  // Tecnologias web básicas
  'HTML': Globe,
  'CSS': Palette,
  'JavaScript': Code,
  'TypeScript': Code,
  
  // Frameworks e bibliotecas
  'React': Code,
  'Vue': Code,
  'Angular': Code,
  'Node.js': Server,
  'Express': Server,
  'Next.js': Code,
  'Nuxt.js': Code,
  
  // Mobile
  'React Native': Smartphone,
  'Flutter': Smartphone,
  'Swift': Smartphone,
  'Kotlin': Smartphone,
  
  // Backend e APIs
  'Python': Code,
  'Java': Code,
  'C#': Code,
  'PHP': Code,
  'Ruby': Code,
  'Go': Code,
  'Rust': Code,
  
  // Bancos de dados
  'MySQL': Database,
  'PostgreSQL': Database,
  'MongoDB': Database,
  'Redis': Database,
  'SQLite': Database,
  'Dados': Database,
  'Database': Database,
  
  // Cloud e DevOps
  'AWS': Cloud,
  'Azure': Cloud,
  'Google Cloud': Cloud,
  'Docker': Cloud,
  'Kubernetes': Cloud,
  'Cloud': Cloud,
  
  // Segurança
  'Segurança': Shield,
  'Security': Shield,
  'Cybersecurity': Shield,
  'Authentication': Lock,
  'OAuth': Lock,
  
  // Ferramentas e outros
  'Git': Settings,
  'GitHub': Settings,
  'GitLab': Settings,
  'Linux': Monitor,
  'Windows': Monitor,
  'macOS': Monitor,
  'Performance': Zap,
  'Optimization': Zap,
  'Network': Network,
  'Hardware': Cpu,
  'Storage': HardDrive,
};

/**
 * Retorna o ícone apropriado para uma tecnologia baseado no nome
 * @param technologyName Nome da tecnologia
 * @param iconName Nome do ícone vindo da API (fallback)
 * @returns Componente do ícone
 */
export function getTechnologyIcon(
  technologyName: string, 
  iconName?: string
): React.ComponentType<{ size?: number }> {
  // Primeiro, tenta encontrar pelo nome da tecnologia (case insensitive)
  const normalizedTechName = technologyName.trim();
  
  // Busca exata
  if (technologyIconMap[normalizedTechName]) {
    return technologyIconMap[normalizedTechName];
  }
  
  // Busca case-insensitive
  const foundKey = Object.keys(technologyIconMap).find(
    key => key.toLowerCase() === normalizedTechName.toLowerCase()
  );
  
  if (foundKey) {
    return technologyIconMap[foundKey];
  }
  
  // Se não encontrou pelo nome da tecnologia, tenta pelo iconName da API
  if (iconName && technologyIconMap[iconName]) {
    return technologyIconMap[iconName];
  }
  
  // Busca parcial no nome da tecnologia
  const partialMatch = Object.keys(technologyIconMap).find(
    key => normalizedTechName.toLowerCase().includes(key.toLowerCase()) ||
           key.toLowerCase().includes(normalizedTechName.toLowerCase())
  );
  
  if (partialMatch) {
    return technologyIconMap[partialMatch];
  }
  
  // Ícone padrão se não encontrar nenhuma correspondência
  return Code;
}

/**
 * Adiciona um novo mapeamento de tecnologia para ícone
 * @param technologyName Nome da tecnologia
 * @param IconComponent Componente do ícone
 */
export function addTechnologyIcon(
  technologyName: string, 
  IconComponent: React.ComponentType<{ size?: number }>
): void {
  technologyIconMap[technologyName] = IconComponent;
}

/**
 * Lista todas as tecnologias mapeadas
 * @returns Array com os nomes das tecnologias
 */
export function getAvailableTechnologies(): string[] {
  return Object.keys(technologyIconMap);
}