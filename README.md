# Astra Hub - Plataforma de Estudos

## 📋 Pré-requisitos

- Node.js (versão 18 ou superior)
- npm ou yarn
- Conta no Supabase
- Conta no OpenAI (para geração de questões)

## 🚀 Como Rodar o Projeto

### 1. Clone e Instale Dependências

```bash
# Clone o repositório (se aplicável)
git clone <seu-repositorio>
cd astra-hub

# Instale dependências do backend
cd backend
npm install

# Instale dependências do frontend
cd ../frontend
npm install
```

### 2. Configuração do Supabase

1. **Crie um projeto no Supabase:**
   - Acesse [supabase.com](https://supabase.com)
   - Crie um novo projeto
   - Anote a URL e a chave anônima

2. **Execute as migrações:**
   - No painel do Supabase, vá em "SQL Editor"
   - Execute os arquivos de migração na ordem cronológica:
     ```
     supabase/migrations/20250213013641_white_torch.sql
     supabase/migrations/20250213022321_maroon_star.sql
     supabase/migrations/20250213022456_restless_surf.sql
     supabase/migrations/20250213024611_dawn_lake.sql
     supabase/migrations/20250215214838_dry_silence.sql
     supabase/migrations/20250225021239_ivory_tower.sql
     supabase/migrations/20250225021450_nameless_castle.sql
     supabase/migrations/20250312232000_bright_gate.sql
     supabase/migrations/20250312232027_shiny_villa.sql
     supabase/migrations/20250312232048_proud_bonus.sql
     supabase/migrations/20250312232131_patient_glitter.sql
     supabase/migrations/20250313000919_fading_peak.sql
     supabase/migrations/20250313005253_soft_paper.sql
     supabase/migrations/20250313005449_fading_base.sql
     supabase/migrations/20250313005806_lucky_art.sql
     supabase/migrations/20250313010327_ancient_sound.sql
     supabase/migrations/20250313010852_frosty_waterfall.sql
     supabase/migrations/20250313013646_noisy_frog.sql
     supabase/migrations/20250313013905_light_union.sql
     supabase/migrations/20250313014022_morning_recipe.sql
     supabase/migrations/20250319233803_peaceful_torch.sql
     supabase/migrations/20250319233955_red_voice.sql
     supabase/migrations/20250319234332_ivory_cherry.sql
     supabase/migrations/20250319235011_graceful_valley.sql
     supabase/migrations/20250319235235_lively_scene.sql
     supabase/migrations/20250319235306_peaceful_dream.sql
     supabase/migrations/20250319235329_ancient_waterfall.sql
     supabase/migrations/20250319235448_violet_sky.sql
     supabase/migrations/20250319235636_quick_meadow.sql
     supabase/migrations/20250320001327_sweet_reef.sql
     supabase/migrations/20250320003022_scarlet_voice.sql
     supabase/migrations/20250627222812_dawn_bush.sql
     supabase/migrations/20250627235654_autumn_king.sql
     ```

### 3. Configuração das Variáveis de Ambiente

#### Backend (.env)
Crie o arquivo `backend/.env`:

```env
# Supabase
SUPABASE_URL=sua_url_do_supabase
SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_do_supabase

# OpenAI
OPENAI_API_KEY=sua_chave_da_openai

# Servidor
PORT=3001
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:5173
```

#### Frontend (.env)
Crie o arquivo `frontend/.env`:

```env
# Supabase
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase

# OpenAI
VITE_OPENAI_API_KEY=sua_chave_da_openai

# Stripe (opcional)
VITE_STRIPE_PUBLISHABLE_KEY=sua_chave_publica_do_stripe
```

### 4. Executar o Projeto

#### Terminal 1 - Backend
```bash
cd backend
npm run dev
```
O backend rodará em: `http://localhost:3001`

#### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```
O frontend rodará em: `http://localhost:5173`

### 5. Configuração Inicial

1. **Acesse o frontend:** `http://localhost:5173`
2. **Registre-se** como usuário
3. **Para ter acesso admin:**
   - Execute no SQL Editor do Supabase:
   ```sql
   UPDATE users 
   SET role = 'admin', is_active = true 
   WHERE email = 'seu-email@exemplo.com';
   ```

## 🛠️ Scripts Disponíveis

### Backend
```bash
npm run dev      # Desenvolvimento com nodemon
npm run build    # Build para produção
npm start        # Executar produção
npm run lint     # Verificar código
```

### Frontend
```bash
npm run dev      # Desenvolvimento com Vite
npm run build    # Build para produção
npm run preview  # Preview da build
npm run lint     # Verificar código
```

## 📁 Estrutura do Projeto

```
astra-hub/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── app.ts
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── contexts/
│   │   └── lib/
│   └── package.json
└── supabase/
    └── migrations/
```

## 🔧 Funcionalidades Principais

- ✅ **Autenticação** (Login/Registro)
- ✅ **Gerenciamento de Matérias**
- ✅ **Configuração de Estudos**
- ✅ **Geração de Cronograma**
- ✅ **Calendário Interativo**
- ✅ **Sistema de Questões**
- ✅ **Painel Administrativo**
- ✅ **Análise de Performance**

## 🐛 Troubleshooting

### Erro de CORS
- Verifique se `FRONTEND_URL` no backend está correto
- Confirme se as portas estão corretas

### Erro de Supabase
- Verifique as chaves no arquivo `.env`
- Confirme se as migrações foram executadas
- Verifique se o RLS está configurado

### Erro de OpenAI
- Confirme se a chave da OpenAI está válida
- Verifique se há créditos na conta

### Problemas de Dependências
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
```

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do console
2. Confirme as variáveis de ambiente
3. Verifique se todas as migrações foram executadas
4. Teste a conectividade com Supabase

## 🚀 Deploy

Para deploy em produção:
1. Configure as variáveis de ambiente de produção
2. Execute `npm run build` em ambos os projetos
3. Deploy o backend em um serviço como Railway/Render
4. Deploy o frontend em Vercel/Netlify