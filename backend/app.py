# app.py
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import jwt
import datetime
from functools import wraps
import csv
import math
import os
import io
from collections import Counter

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Chave secreta para assinar JWT (NUNCA deixar fixa em produção)
app.config["SECRET_KEY"] = "minha_chave_super_secreta"

# ---------------- Carregar usuários do CSV ---------------- #
users = {}
users_path = "users.csv"
if os.path.exists(users_path):
    with open(users_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            username = row.get("username")
            if not username:
                continue
            users[username] = {
                "password": row.get("password", ""),
                "role": row.get("role", "")
            }
else:
    print(f"[WARN] users.csv não encontrado em {os.path.abspath(users_path)}. Usando dict vazio.")

# ---------------- Helpers para datas ---------------- #
def try_parse_date(ts_str):
    if not ts_str:
        return None
    s = ts_str.strip()
    patterns = ["%Y-%m-%d %H:%M", "%Y-%m-%d", "%d/%m/%Y %H:%M", "%d/%m/%Y"]
    for p in patterns:
        try:
            return datetime.datetime.strptime(s, p).date()
        except Exception:
            continue
    return None

# ---------------- Carregar métricas do CSV (todas colunas) ---------------- #
metrics_data = []
metrics_path = "metrics.csv"
if os.path.exists(metrics_path):
    with open(metrics_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for idx, row in enumerate(reader, start=1):
            entry = dict(row)
            try:
                entry["id"] = int(row.get("id") or idx)
            except Exception:
                entry["id"] = idx
            ts_raw = row.get("timestamp") or row.get("date") or ""
            entry["timestamp"] = ts_raw
            entry["date_obj"] = try_parse_date(ts_raw)
            metrics_data.append(entry)
else:
    for i in range(1, 501):
        ts = f"2024-08-{(i % 30) + 1:02d} 10:00"
        metrics_data.append({
            "id": i,
            "timestamp": ts,
            "date_obj": try_parse_date(ts),
            "username": f"user{i % 3 + 1}",
            "action": "login"
        })
    print("[INFO] metrics.csv não encontrado — usando dados de exemplo.")

months = [m["date_obj"].strftime("%Y-%m") if m.get("date_obj") else "unknown" for m in metrics_data]
counts = Counter(months)
print(f"[INFO] Métricas carregadas: {len(metrics_data)} registros")
print(f"[INFO] Contagem por mês: {dict(counts)}")

# ---------------- JWT Helpers ---------------- #
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if "Authorization" in request.headers:
            bearer = request.headers["Authorization"]
            if isinstance(bearer, str) and bearer.startswith("Bearer "):
                token = bearer.split(" ", 1)[1]

        if not token:
            return jsonify({"error": "Token ausente"}), 401

        try:
            data = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
            current_user = data.get("username")
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expirado"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Token inválido"}), 401
        except Exception as e:
            return jsonify({"error": f"Token inválido: {str(e)}"}), 401

        return f(current_user, *args, **kwargs)
    return decorated

# ---------------- Rotas ---------------- #
@app.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    username = data.get("username")
    password = data.get("password")

    if username in users and users[username]["password"] == password:
        role = users[username]["role"]
        token = jwt.encode({
            "username": username,
            "role": role,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)
        }, app.config["SECRET_KEY"], algorithm="HS256")
        return jsonify({"token": token, "role": role, "success": True})

    return jsonify({"error": "Credenciais inválidas"}), 401


@app.route("/metrics", methods=["GET"])
@token_required
def get_metrics(current_user):
    try:
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 50))
        date_filter = request.args.get("date")
        sort_by = request.args.get("sort_by")
        sort_order = request.args.get("sort_order", "asc").lower()

        role = users.get(current_user, {}).get("role", "")

        filtered = metrics_data
        if date_filter:
            try:
                filtro_date = datetime.datetime.strptime(date_filter.strip(), "%Y-%m-%d").date()
            except Exception:
                return jsonify({"error": "Formato de data inválido"}), 400
            filtered = [m for m in filtered if m.get("date_obj") == filtro_date]

        if sort_by and filtered:
            if any(sort_by in m for m in filtered):
                def sort_key(m):
                    if sort_by in ("date", "timestamp", "date_obj"):
                        return m.get("date_obj") or datetime.date.min
                    v = m.get(sort_by)
                    if isinstance(v, (int, float)):
                        return v
                    if v is None:
                        return ""
                    s = str(v).strip()
                    try:
                        return float(s.replace(",", "").replace(" ", ""))
                    except Exception:
                        return s.lower()
                reverse = (sort_order == "desc")
                filtered = sorted(filtered, key=sort_key, reverse=reverse)

        total = len(filtered)
        total_pages = math.ceil(total / limit) if total > 0 else 1
        if page < 1: page = 1
        if page > total_pages: page = total_pages

        start = (page - 1) * limit
        end = start + limit
        paginated = filtered[start:end]

        results = []
        for m in paginated:
            row = dict(m)
            row.pop("date_obj", None)
            if role != "admin":
                row.pop("cost_micros", None)
            results.append(row)

        return jsonify({
            "user": current_user,
            "role": role,
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": total_pages,
            "sort_by": sort_by,
            "sort_order": sort_order,
            "results": results
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/metrics/export", methods=["GET"])
@token_required
def export_metrics(current_user):
    role = users.get(current_user, {}).get("role", "user")
    date_filter = request.args.get("date")
    sort_by = request.args.get("sort_by")
    sort_order = request.args.get("sort_order", "asc")

    query = metrics_data
    if date_filter:
        try:
            filtro_date = datetime.datetime.strptime(date_filter.strip(), "%Y-%m-%d").date()
            query = [m for m in query if m.get("date_obj") == filtro_date]
        except Exception:
            return jsonify({"error": "Formato de data inválido"}), 400

    if sort_by and query:
        def sort_key(m):
            if sort_by in ("date", "timestamp", "date_obj"):
                return m.get("date_obj") or datetime.date.min
            v = m.get(sort_by)
            if isinstance(v, (int, float)): return v
            if v is None: return ""
            s = str(v).strip()
            try: return float(s.replace(",", "").replace(" ", ""))
            except: return s.lower()
        reverse = (sort_order == "desc")
        query = sorted(query, key=sort_key, reverse=reverse)

    output = io.StringIO()
    writer = csv.writer(output)

    if not query:
        return jsonify({"error": "Nenhum dado para exportar"}), 404

    columns = [k for k in query[0].keys() if k != "date_obj"]
    if role != "admin" and "cost_micros" in columns:
        columns.remove("cost_micros")
    writer.writerow(columns)

    for row in query:
        data = [row.get(col, "") for col in columns]
        writer.writerow(data)

    output.seek(0)
    return Response(
        output,
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment;filename=metrics_export.csv"}
    )


if __name__ == "__main__":
    app.run(debug=True)
