# POS OfficeMax - Sistema de Punto de Venta e Inventario (MVP)

Sistema web moderno de Punto de Venta (POS), control de inventario (Kardex), gestión de clientes/usuarios, y cuadre de caja diseñado específicamente para papelerías y pequeños comercios.

---

## 🚀 Arquitectura y Tecnologías

*   **Backend**: Node.js, Express, PostgreSQL (`pg`), JWT, `bcrypt`, `node-thermal-printer`.
*   **Frontend**: React 19, Vite 7, Tailwind CSS v4 con sistema de tokens personalizados, Zustand, `html5-qrcode`, `lucide-react`.
*   **Base de Datos**: PostgreSQL 18.1+ con inmutabilidad contable (precios y costos históricos registrados por transacción).
*   **Paleta de Colores Oficial (Rebranding OfficeMax)**:
    *   **Naranja (Primario)**: `#F64C29`
    *   **Rojo Cálido (Secundario/Hover)**: `#F22C36`
    *   **Superficies y Sidebar**: `#000000` / `#111111` (Gris Oscuro / Negro Premium)

---

## 📁 Estructura del Proyecto

```text
pos-officemax/
├── client/                     # Aplicación Frontend (React + Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/        # Componentes UI (Layout, Sidebar, Modal, etc.)
│   │   ├── pages/             # Vistas principales (POS, Inventario, Kardex, Clientes, Usuarios, Auth)
│   │   ├── services/          # Cliente API (Axios)
│   │   └── stores/            # Estado global (Zustand: Carrito, Sesión Auth, Caja)
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

### 1. Base de Datos (PostgreSQL)
Crea una base de datos en PostgreSQL llamada `pos_papeleria` e importa el esquema base:

```bash
psql -U postgres -d pos_papeleria -f database/schema.sql
```

Aplica las migraciones requeridas ubicadas en `database/migrations/` en orden cronológico si corresponde.

### 2. Configuración del Backend
Navega a la carpeta `server/`, instala las dependencias y configura las variables de entorno:

```bash
cd server
npm install
```

Crea o edita el archivo `.env` en la raíz de `server/`:

```env
PORT=3000
DATABASE_URL=postgres://postgres:TU_CONTRASEÑA@127.0.0.1:5432/pos_papeleria
NODE_ENV=development

# Impresora Epson TM-U220D (ESC/POS)
PRINTER_ENABLED=false # Cambiar a true para producción e impresión física
PRINTER_INTERFACE=usb
PRINTER_PORT=/dev/usb/lp0 # En Windows usa puertos COM (ej: COM3) o red (ej: \\localhost\Impresora)
PRINTER_BAUD_RATE=9600
PRINTER_WIDTH=40

# Contenido del Ticket
TICKET_NOMBRE_NEGOCIO=PAPELERIA OFFICEMAX
TICKET_RUC=9999999999001
TICKET_DIRECCION=Cuenca - Ecuador
TICKET_TELEFONO=0999999999
TICKET_MENSAJE_PIE=Gracias por su compra!
TICKET_TIPO_DOCUMENTO=Nota de Venta
TICKET_ABRIR_CAJON=true
```

Inicia el servidor de desarrollo del Backend:
```bash
npm run dev
```

### 3. Configuración del Frontend
Navega a la carpeta `client/`, instala las dependencias e inicia el servidor de desarrollo:

```bash
cd ../client
npm install
npm run dev
```

*Nota: El frontend está configurado con HTTPS mediante certificados autofirmados por motivos de seguridad en producción y pruebas. En tu navegador, acepta la advertencia de seguridad para entrar a `https://localhost:5173`.*

---

## 💻 Compatibilidad con Windows (Desarrollo y Pruebas)

El proyecto es totalmente compatible con Windows (CMD o PowerShell). Si migras el proyecto de Linux a Windows, ten en cuenta los siguientes puntos:

1.  **PostgreSQL**: Asegúrate de tener el motor de PostgreSQL corriendo localmente en el puerto `5432` y con las credenciales correspondientes en tu archivo `server/.env`.
2.  **Impresora de Tickets**: Cambia el puerto de la impresora `/dev/usb/lp0` en tu archivo `server/.env` por su equivalente de Windows (ej: `COM3`, `COM4` o una ruta de red compartida como `\\localhost\NombreImpresora`). Si no tienes impresora conectada, mantén `PRINTER_ENABLED=false` para ver el diseño del ticket simulado en la consola del backend.

---

## 🔐 Credenciales de Prueba por Defecto

*   **Administrador**: usuario `admin` / contraseña `admin123`
*   **Cajero**: usuario `cajero` / contraseña `caja123`