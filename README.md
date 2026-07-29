# POS OfficeMax - Sistema de Punto de Venta e Inventario (MVP)

Sistema web moderno de Punto de Venta (POS), control de inventario (Kardex), gestión de clientes/usuarios, y cuadre de caja diseñado específicamente para papelerías y pequeños comercios. El sistema respeta las reglas de negocio de inmutabilidad contable y gestión mixta de ítems (Físicos, Servicios y Recargas).

---

## 🚀 Arquitectura y Tecnologías

*   **Backend**: Node.js, Express, PostgreSQL (`pg`), JWT, `bcrypt`, `node-thermal-printer`.
*   **Frontend**: React 19, Vite 7, Tailwind CSS v4 con sistema de tokens personalizados (Rebranding OfficeMax), Zustand, `html5-qrcode`, `lucide-react`.
*   **Base de Datos**: PostgreSQL 18.1+ con inmutabilidad contable (precios y costos históricos registrados por transacción) y protección referencial estricta.
*   **Paleta de Colores Oficial (OfficeMax)**:
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
│   ├── models/                # Modelos de consulta a PostgreSQL (Transacciones atómicas)
│   ├── routes/                # Enrutadores Express (Auth, Productos, Ventas, Caja, etc.)
│   ├── scripts/               # Scripts de mantenimiento y pruebas del servidor
│   └── index.js               # Punto de entrada principal de la API con CORS abierto para LAN
├── contexto.md                 # Especificaciones del negocio y arquitectura maestra
└── README.md
```

---

## 🖥️ Guía de Instalación para Windows (Entorno Local On-Premise)

El sistema está diseñado para correr localmente (On-Premise) en una PC principal con Windows (servidor) y ser accesible a través de la red local (LAN) vía Wi-Fi por dispositivos móviles o tablets.

### 1. Requisitos Previos en Windows
1.  **Node.js**: Descarga e instala la última versión LTS (Long Term Support) desde [nodejs.org](https://nodejs.org/). Asegúrate de marcar la casilla "Automatically install the necessary tools..." durante la instalación (instala Chocolatey y las dependencias de compilación para C++).
2.  **PostgreSQL**: Descarga e instala PostgreSQL (versión 14 o superior recomendada) desde [postgresql.org](https://www.postgresql.org/download/windows/). Recuerda la contraseña que configures para el usuario `postgres`.
3.  **Git**: Para clonar el repositorio (opcional si descargas el ZIP).

### 2. Configuración de la Base de Datos
1. Abre **pgAdmin** (se instala junto con PostgreSQL) o la consola `psql`.
2. Crea una nueva base de datos llamada `pos_papeleria`.
3. Importa el esquema de la base de datos ubicado en la carpeta del proyecto. Usando la línea de comandos de Windows (CMD) o PowerShell en la raíz del proyecto:
   ```cmd
   psql -U postgres -d pos_papeleria -f database/schema.sql
   ```
   *(Te pedirá la contraseña del usuario postgres)*

### 3. Configuración y Arranque del Backend (Servidor API)
Abre una terminal (CMD/PowerShell) y navega a la carpeta del servidor:

```cmd
cd pos-officemax\server
npm install
```
> **Nota de Compatibilidad (bcrypt):** Si el comando `npm install` falla en Windows al intentar compilar `bcrypt` (errores de `node-gyp` o Visual Studio), puedes desinstalarlo y usar la versión 100% JavaScript:
> `npm uninstall bcrypt && npm install bcryptjs`
> Y luego reemplazar `require('bcrypt')` por `require('bcryptjs')` en tu código si fuera necesario (aunque generalmente los pre-compilados de `bcrypt` funcionan bien en Node 18+ en Windows).

Crea el archivo de configuración `.env` en la carpeta `server/` copiando estas variables:

```env
PORT=3000
# Reemplaza 'TU_CONTRASEÑA' con la contraseña que le pusiste a PostgreSQL
DATABASE_URL=postgres://postgres:TU_CONTRASEÑA@127.0.0.1:5432/pos_papeleria
NODE_ENV=development

# Configuración de Hardware (Impresora Epson TM-U220D)
PRINTER_ENABLED=true
PRINTER_INTERFACE=serial
# En Windows, averigua qué puerto COM usa tu impresora (ej. COM3).
# Si está compartida en red, usa: \\localhost\NombreDeTuImpresora
PRINTER_PORT=COM3 
PRINTER_BAUD_RATE=9600
PRINTER_WIDTH=40

# Personalización del Ticket Comercial
TICKET_NOMBRE_NEGOCIO=PAPELERIA OFFICEMAX
TICKET_RUC=9999999999001
TICKET_DIRECCION=Cuenca - Ecuador
TICKET_TELEFONO=0999999999
TICKET_MENSAJE_PIE=¡Gracias por su compra!
TICKET_TIPO_DOCUMENTO=Nota de Venta
TICKET_ABRIR_CAJON=true
```

Inicia el servidor backend:
```cmd
npm run dev
```

### 4. Configuración y Arranque del Frontend (Interfaz Web)
Abre *otra* nueva ventana de terminal (CMD/PowerShell), mantén el backend corriendo, y ejecuta:

```cmd
cd pos-officemax\client
npm install
npm run dev
```

### 5. Acceso al Sistema
*   **Desde la PC Servidor (Windows):** Abre tu navegador en `http://localhost:5173`
*   **Desde un Celular/Tablet en la misma red Wi-Fi:**
    1. Averigua la dirección IP local de tu PC Windows (Abre CMD y escribe `ipconfig`. Busca "Dirección IPv4" ej. `192.168.1.15`).
    2. En el navegador del celular, ingresa: `http://192.168.1.15:5173`
    *(El backend está configurado con CORS abierto para permitir esta conexión móvil sin problemas).*

---

## 🔐 Credenciales de Acceso por Defecto

Usa estas credenciales para ingresar al sistema y empezar a probar el Punto de Venta:

*   **Administrador**:
    *   Usuario: `admin`
    *   Contraseña: `admin123`
*   **Cajero**:
    *   Usuario: `cajero`
    *   Contraseña: `caja123`