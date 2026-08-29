# 🏢 Talento 360 — Plataforma Institucional de Talento Humano

> **Sistema Web Institucional** para la administración integral de servidores públicos, solicitudes de vacaciones, trámites administrativos (permisos, incapacidades, licencias) y comisiones de viáticos, construido sobre una arquitectura modular de **microservicios** con **Docker** y **PostgreSQL**.

---

## 📑 Tabla de Contenido
1. [Arquitectura y Estructura del Proyecto](#-arquitectura-y-estructura-del-proyecto)
2. [Requisitos Previos](#-requisitos-previos)
3. [Cómo Ejecutar el Proyecto por Primera Vez](#-cómo-ejecutar-el-proyecto-por-primera-vez)
4. [Usuarios, Roles y Permisos de Acceso](#-usuarios-roles-y-permisos-de-acceso)
5. [¿Qué hacer cuando modificas un archivo del proyecto?](#-qué-hacer-cuando-modificas-un-archivo-del-proyecto)
6. [Guía Paso a Paso de Git y GitHub](#-guía-paso-a-paso-de-git-y-github)
7. [Comandos Útiles de Docker y Solución de Problemas](#-comandos-útiles-de-docker-y-solución-de-problemas)

---

## 🏛 Arquitectura y Estructura del Proyecto

El proyecto opera bajo una arquitectura desacoplada de microservicios contenerizados, con **Nginx** actuando como servidor web del Frontend SPA y **API Gateway** hacia los servicios internos:

```text
talento360/
├── web/
│   ├── docker-compose.yml          # Orquestador maestro de contenedores
│   ├── database/                   # Scripts SQL de inicialización y esquemas
│   │   ├── 01_schema_and_data.sql  # Tablas principales, cargos, dependencias y usuarios
│   │   └── 03_new_modules.sql      # Tablas de viáticos, solicitudes admin e historial
│   ├── frontend/                   # Cliente Web SPA (HTML5, Vanilla CSS, JS Modular)
│   │   └── src/
│   │       ├── index.html          # Punto de entrada de la aplicación
│   │       ├── css/                # Hojas de estilos (main, components, animations)
│   │       └── js/                 # Lógica de la aplicación y módulos (viaticos, requests, etc.)
│   └── services/                   # Microservicios en Node.js / Express
│       ├── auth-service/           # Autenticación JWT y validación de usuarios (Puerto 3001)
│       ├── employees-service/      # Directorio de personal y hojas de vida (Puerto 3002)
│       ├── requests-service/       # Solicitudes de Vacaciones (Puerto 3003)
│       ├── admin-requests-service/ # Permisos, Incapacidades y Licencias (Puerto 3004)
│       ├── viaticos-service/       # Comisiones y Viáticos (Puerto 3005)
│       └── dashboard-service/      # Analítica y métricas del sistema (Puerto 3006)
└── README.md
```

---

## ⚙️ Requisitos Previos

Antes de iniciar, asegúrate de tener instalado en tu máquina:
- **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** (Debe estar abierto y en ejecución).
- **[Git](https://git-scm.com/)** para el control de versiones.

---

## 🚀 Cómo Ejecutar el Proyecto por Primera Vez

Sigue estos 3 sencillos pasos para levantar toda la plataforma desde cero:

### 1. Clonar el repositorio y abrir terminal
```bash
git clone https://github.com/juanSilvaE/talentoHumano360.git
cd talentoHumano360/web
```

### 2. Construir y levantar los contenedores de Docker
Ejecuta el siguiente comando en la carpeta `web/`:
```bash
docker compose up --build -d
```
> **¿Qué hace este comando?**
> - Crea la red interna `talento360_net`.
> - Inicializa la base de datos **PostgreSQL** y ejecuta automáticamente los scripts de esquema y datos iniciales.
> - Construye las imágenes de los 6 microservicios y del Frontend con Nginx.
> - Deja todos los contenedores corriendo en segundo plano (`-d`).

### 3. Abrir la aplicación en el navegador
Ingresa a: **[http://localhost](http://localhost)**

---

## 👥 Usuarios, Roles y Permisos de Acceso

La plataforma cuenta con control de acceso basado en roles (**RBAC**). Puedes iniciar sesión usando el correo completo o solo el alias del usuario:

| Usuario / Alias | Contraseña | Nombre del Funcionario | Rol | Nivel de Permisos |
|---|---|---|---|---|
| **`admin`**<br>`admin@boyaca.gov.co` | `admin123` | Administrador Maestro | **Administrador** | 🟢 **Acceso Total**: Crear, editar, eliminar, aprobar solicitudes y cambio rápido de estados con 1 clic. |
| **`angela.ussa`**<br>`angela.ussa@boyaca.gov.co` | `@Angela123` | Angela Ussa | **Administrador** | 🟢 **Acceso Total**: Administradora principal institucional. Aparece como aprobador por defecto. |
| **`carlos`**<br>`carlos@boyaca.gov.co` | `carlos123` | Carlos Andrés Torres | **Coordinador** | 🟡 **Intermedio**: Gestión operativa y revisión técnica. |
| **`maria`**<br>`maria@boyaca.gov.co` | `maria123` | María Camila Rodríguez | **Consulta** | 🔴 **Solo Lectura**: No puede crear, editar ni cambiar estados (los botones de acción se ocultan automáticamente por seguridad). |

> ℹ️ **¿Por qué Carlos y María tienen restricciones?**
> - **María (`Consulta`)**: Está configurada intencionalmente con rol de solo lectura para auditorías o consultas informativas. Si inicias sesión con María, la interfaz oculta los botones de "Nuevo", "Editar", "Eliminar" y la interacción de cambio de estados.
> - **Para pruebas y administración completa**, usa siempre las cuentas de **`admin`** o **`angela.ussa`**.

---

## 🔄 ¿Qué hacer cuando modificas un archivo del proyecto?

Cada vez que hagas un cambio en los archivos de frontend (`.html`, `.css`, `.js`), en los microservicios o en los scripts de base de datos, debes seguir estos dos pasos para ver reflejados los cambios:

### 1. Reconstruir los contenedores con Docker
Ubícate en la carpeta `web/` en tu terminal y ejecuta:
```bash
cd web
docker compose up --build -d
```
> Docker detectará únicamente los archivos modificados, reconstruirá las capas necesarias en pocos segundos y reiniciará los contenedores sin perder los datos de la base de datos.

### 2. Recargar el navegador limpiando la caché
Los navegadores guardan en memoria los archivos `.js` y `.css`. Para forzar la carga de la nueva versión:
- Presiona **`Ctrl + F5`** (o **`Shift + F5`** / **`Ctrl + Shift + R`**).

---

## 🌿 Guía Paso a Paso de Git y GitHub

Sigue este flujo estándar cada vez que desees guardar tus cambios y enviarlos al repositorio remoto en GitHub:

### Paso 1: Ubicarte en la raíz del proyecto
Asegúrate de estar en la carpeta principal `talentoHumano360`:
```bash
cd c:\Users\TuUsuario\Desktop\talento360\talentoHumano360
```

### Paso 2: Revisar qué archivos se modificaron
```bash
git status
```

### Paso 3: Preparar todos los cambios (Staging)
```bash
git add .
```

### Paso 4: Confirmar los cambios con un mensaje claro (Commit)
```bash
git commit -m "feat: descripción clara de los cambios realizados"
```

### Paso 5: Descargar cambios remotos (Buena práctica para evitar conflictos)
```bash
git pull origin main
```

### Paso 6: Enviar los cambios a GitHub (Push)
```bash
git push origin main
```

> 💡 **En Windows PowerShell**: Si deseas ejecutar todo en una sola línea, usa punto y coma (`;`):
> ```powershell
> git add . ; git commit -m "mejoras al sistema" ; git push origin main
> ```

---

## 🛠 Comandos Útiles de Docker y Solución de Problemas

| Acción | Comando (ejecutar dentro de `web/`) |
|---|---|
| **Ver estado de los contenedores** | `docker compose ps` |
| **Ver logs en tiempo real de todos los servicios** | `docker compose logs -f` |
| **Ver logs de un servicio específico** | `docker compose logs -f viaticos-service` |
| **Reiniciar los contenedores sin reconstruir** | `docker compose restart` |
| **Detener la aplicación** | `docker compose down` |
| **Reinicio completo desde cero (reset de BD)** | `docker compose down -v` luego `docker compose up --build -d` |
| **Verificar salud de la base de datos PostgreSQL** | `docker exec -it talento360_db pg_isready -U postgres` |

---

### 🌟 Resumen de Módulos Implementados en Talento 360:
1. 📊 **Dashboard Ejecutivo**: Estadísticas en tiempo real, distribución de personal y gráficos dinámicos.
2. 👥 **Servidores Públicos**: Directorio institucional con búsqueda inteligente y gestión de expedientes.
3. 🏖️ **Solicitudes de Vacaciones**: Radicación, cálculo de días, periodos y cambio rápido de estados (1 clic).
4. 📋 **Solicitudes Administrativas**: Gestión de permisos laborales, incapacidades médicas y licencias institucionales.
5. ✈️ **Viáticos y Comisiones**:
   - Autocompletado de servidor (cédula, cargo y dependencia).
   - Selector geográfico nacional (32 departamentos y municipios de Colombia) e internacional.
   - Cálculo automático de días según fechas de inicio y fin.
   - Cálculo del valor total en COP en vivo.
   - Asignación automática de aprobador activo al aprobar.
   - Carga y visor integrado de soportes/facturas adjuntas (PDF/PNG/JPG).
   - Cambio rápido de estados directamente desde la tabla.
