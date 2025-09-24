Perfeito 🚀
Já vi toda a estrutura do seu projeto e os arquivos principais (`app.py`, `index.html`, `script.js`, `styles.css`, `users.csv`, `metrics.csv`). Vou te ajudar a:

1. **Preparar o repositório para o GitHub** (com `.gitignore`, organização e instruções).
2. **Configurar o GitHub Pages** para servir seu `frontend`.
3. **Criar um README.md profissional** com instruções claras de uso: clonar, rodar a API, abrir o frontend.

---

### 📌 Estrutura recomendada no GitHub

```
CASE-ESTAG/
│
├── backend/
│   ├── app.py
│   ├── metrics.csv
│   ├── users.csv
│   └── requirements.txt
│
├── frontend/
│   ├── index.html
│   ├── script.js
│   └── styles.css
│
├── .gitignore
└── README.md
```

---

### 📌 Arquivo `.gitignore` (para evitar subir coisas desnecessárias)

Crie um `.gitignore` na raiz:

```gitignore
# Python
__pycache__/
*.pyc
*.pyo
*.pyd
*.env
venv/
env/
.venv/

# IDE / Editor
.vscode/
.idea/

# Sistema
.DS_Store
Thumbs.db
```

---

### 📌 Configuração do GitHub Pages

* O **GitHub Pages** só serve **arquivos estáticos**. Então, o seu `frontend/` será hospedado lá.
* O **backend (Flask)** precisa rodar **localmente** ou em outra plataforma (Render, Railway, Heroku etc.).
* No seu `script.js`, a API está apontando para `http://127.0.0.1:5000`, ou seja, local. Para GitHub Pages, isso continua funcionando **se o usuário rodar o backend localmente**.

👉 Se quiser rodar a API também online, aí precisaríamos configurar um deploy da API (ex: Render). Quer que eu já prepare esse extra?

---

### 📌 README.md sugerido

Aqui está uma versão inicial bem profissional para o seu repositório:

```markdown
# 📊 Case Estágio - Métricas

Este projeto é composto por **backend (Flask API)** e **frontend (HTML/CSS/JS)** para visualização, paginação e exportação de métricas com autenticação JWT.

---

## 🚀 Funcionalidades
- Login com autenticação JWT.
- Listagem de métricas paginadas.
- Filtros por data.
- Ordenação clicando nos cabeçalhos da tabela.
- Exportação CSV (página atual ou todos os dados).
- Tema claro/escuro (toggle).
- Controle de permissões (usuário comum x admin).

---

## 📂 Estrutura
```

backend/   → API em Flask (Python)
frontend/  → Interface web (HTML/CSS/JS)

````

---

## 🛠️ Como rodar o projeto

### 1. Clonar o repositório
```bash
git clone https://github.com/seu-usuario/CASE-ESTAG.git
cd CASE-ESTAG
````

### 2. Rodar o backend (API Flask)

No diretório `backend/`:

1. Criar ambiente virtual e instalar dependências:

   ```bash
   python -m venv venv
   source venv/bin/activate   # Linux/Mac
   venv\Scripts\activate      # Windows

   pip install -r requirements.txt
   ```

2. Rodar a API:

   ```bash
   python app.py
   ```

   A API ficará disponível em:

   ```
   http://127.0.0.1:5000
   ```

### 3. Abrir o frontend

* Basta abrir o arquivo `frontend/index.html` no navegador.
* O frontend se conecta à API em `http://127.0.0.1:5000`.
* Para isso, o backend precisa estar rodando localmente.

---

## 🌐 GitHub Pages

O **frontend** também está publicado no GitHub Pages:
👉 [https://seu-usuario.github.io/CASE-ESTAG/frontend/](https://seu-usuario.github.io/CASE-ESTAG/frontend/)

> ⚠️ **Importante**: Para funcionar corretamente, você ainda precisa rodar a **API localmente**.

---

## 👤 Login de Teste

As credenciais são carregadas do arquivo `users.csv`. Exemplo:

```csv
username,password,role
admin,1234,admin
user1,abcd,user
```

* Admin tem acesso a todas as métricas (incluindo `cost_micros`).
* Usuário comum tem acesso limitado.

---

## 📦 Dependências principais

* Flask
* Flask-CORS
* PyJWT

---

✍️ Autor: **Marcos Goulart**