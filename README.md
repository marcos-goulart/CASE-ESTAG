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

3. Mudar o fecth e url para o endereço local, apenas descomentar o local e comentar o servidor

### 3. Abrir o frontend

* Basta abrir o arquivo `frontend/index.html` no navegador.
* O frontend se conecta à API em `http://127.0.0.1:5000`.
* Para isso, o backend precisa estar rodando localmente.

---

## 🌐 GitHub Pages

O **frontend** também está publicado no GitHub Pages:
👉 [https://seu-usuario.github.io/CASE-ESTAG/frontend/](https://seu-usuario.github.io/CASE-ESTAG/frontend/)

> ⚠️ **Importante**: Para funcionar corretamente, você ainda pode precisa rodar a **API localmente**.

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