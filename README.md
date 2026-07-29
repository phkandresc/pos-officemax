# POS OfficeMax - Sistema de Punto de Venta e Inventario (MVP)

Sistema web de Punto de Venta (POS), control de inventario (Kardex), gestión de clientes/usuarios y cuadre de caja diseñado para papelerías y pequeños negocios.

## 🚀 Arquitectura y Tecnologías

* **Backend**: Node.js, Express, PostgreSQL (`pg`), JWT, `bcrypt`, `node-thermal-printer`.
* **Frontend**: React 19, Vite 7, Tailwind CSS v4, Zustand, `html5-qrcode`, `lucide-react`.
* **Base de Datos**: PostgreSQL 18.1+ con inmutabilidad contable (precios y costos históricos registrados por transacción).

---

## 📁 Estructura del Proyecto

```text
pos-officemax/
├── client/                     # Aplicación Frontend (React + Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/        # Componentes UI (Layout, Sidebar, Modal, etc.)
│   │   ├── pages/             # Vistas principales (POS, Inventario, Kardex, Clientes, Usuarios, Auth)
│   │   ├── services/          # Cliente API (Axios)
│   │   └── stores/            # Estado global (Zustand: Carrito, Sesión Auth)
│   └── package.json
├── database/                   # Definición de la Base de Datos PostgreSQL
│   ├── schema.sql             # Esquema DDL principal del sistema
│   └── migrations/            # Scripts SQL de migraciones acumuladas
├── server/                     # Aplicación Backend (Node.js + Express)
│   ├── config/                # Configuración de base de datos y variables
│   ├── controllers/           # Controladores de la API REST
│   ├── middleware/            # Middlewares (Autenticación JWT, verificación de Roles)
│   ├── models/                # Modelos de consulta a PostgreSQL
│   ├── routes/                # Enrutadores Express (Auth, Productos, Ventas, Caja, etc.)
│   ├── scripts/               # Scripts de mantenimiento y pruebas del servidor
│   └── index.js               # Punto de entrada principal de la API
├── contexto.md                 # Especificaciones del negocio y arquitectura maestra
└── README.md
```

---

## ⚙️ Configuración e Instalación

### 1. Base de Datos
Crea una base de datos en PostgreSQL llamada `pos_papeleria` e importa el esquema base:

```bash
psql -U postgres -d pos_papeleria -f database/schema.sql
```

Aplica las migraciones requeridas ubicadas en `database/migrations/`.

### 2. Backend
```bash
cd server
npm install
# Crear/ajustar archivo .env basado en las credenciales de PostgreSQL
npm run dev
```

### 3. Frontend
```bash
cd client
npm install
npm run dev
```

---

## 🔐 Credenciales de Prueba por Defecto

* **Administrador**: usuario `admin` / contraseña `admin123`
* **Cajero**: usuario `cajero` / contraseña `caja123`