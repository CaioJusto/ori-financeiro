# 🚀 Configuração do Supabase para Ori Financeiro

## Passo 1: Criar Projeto no Supabase

1. Acesse: https://supabase.com/dashboard
2. Faça login ou crie uma conta gratuita
3. Clique em **"New Project"**
4. Preencha:
   - **Name**: `ori-financeiro`
   - **Database Password**: Escolha uma senha forte (você vai usar ela na connection string)
   - **Region**: `South America (São Paulo)` (ou mais próxima de você)
5. Clique em **"Create new project"**
6. Aguarde ~2 minutos para o projeto ser provisionado

## Passo 2: Obter a Connection String

1. No dashboard do projeto, vá em **"Project Settings"** (ícone de engrenagem no menu lateral)
2. Clique em **"Database"** no menu lateral
3. Role até a seção **"Connection string"**
4. Selecione a aba **"URI"**
5. **IMPORTANTE**: Mude o modo de "Transaction" para **"Session"**
6. Copie a string completa (ela vai parecer com isso):
   ```
   postgresql://postgres.xxxxxxxxxxxxx:[YOUR-PASSWORD]@xxxxx.supabase.co:5432/postgres
   ```
7. Substitua `[YOUR-PASSWORD]` pela senha que você criou no Passo 1

## Passo 3: Configurar o Projeto

1. Copie o arquivo `.env.supabase.example` para `.env`:
   ```bash
   cp .env.supabase.example .env
   ```

2. Edite o arquivo `.env` e substitua `[SUA_URL_DO_SUPABASE]` pela connection string copiada

3. Execute os comandos para configurar o banco:
   ```bash
   # Aplicar o schema no Supabase
   npx prisma db push

   # Popular com dados iniciais
   npm run seed
   ```

4. Reinicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## Passo 4: Acessar o Sistema

1. Acesse: http://localhost:3000
2. Você será redirecionado para a página de login
3. Use as credenciais padrão:
   - **Email**: `admin@ori.com`
   - **Senha**: `admin123`

## 🎉 Pronto!

Seu sistema agora está conectado ao Supabase e pronto para uso!

## 🔒 Segurança

- Nunca commite o arquivo `.env` no git (já está no .gitignore)
- Altere a senha padrão do admin após o primeiro login
- Gere um novo `NEXTAUTH_SECRET` para produção usando:
  ```bash
  openssl rand -base64 32
  ```

## 📊 Monitoramento

Você pode monitorar seu banco de dados diretamente no Supabase:
- **Table Editor**: Visualizar e editar dados
- **SQL Editor**: Executar queries personalizadas
- **Database**: Ver métricas e performance
- **Logs**: Ver logs em tempo real
