# Talento 360 — Plataforma de Gestión de Talento Humano

Plataforma web institucional para la administración integral de servidores públicos, solicitudes de vacaciones, trámites administrativos (permisos, incapacidades, licencias), comisiones de viáticos y modalidades de trabajo/horarios, implementada con una interfaz web SPA, microservicios en Node.js y base de datos PostgreSQL orquestados mediante Docker.

---

## Requisitos

Para ejecutar el proyecto en tu máquina únicamente necesitas tener instalado y en ejecución:

* **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** (con Docker Compose v2+)
* **[Git](https://git-scm.com/)**

---

## Ejecutar desde cero

Sigue estos pasos si acabas de clonar el repositorio o nunca has levantado el proyecto:

### 1. Clonar el repositorio y entrar a la carpeta de ejecución
Abre una terminal y ejecuta:
```bash
git clone https://github.com/juanSilvaE/talentoHumano360.git
cd talentoHumano360/web
```

### 2. Configurar variables de entorno (Solo la primera vez)
Copia el archivo de ejemplo para crear tu archivo `.env`:

* **En Windows (PowerShell):**
  ```powershell
  Copy-Item .env.example .env
  ```
* **En Linux / macOS / Git Bash:**
  ```bash
  cp .env.example .env
  ```

### 3. Construir y levantar todos los contenedores
Ejecuta el siguiente comando dentro de la carpeta `web/`:
```bash
docker compose up --build -d
```
> Este comando crea la red interna, inicializa PostgreSQL ejecutando automáticamente los esquemas y datos iniciales en orden, compila los microservicios y levanta el servidor web Nginx en segundo plano.

### 4. Abrir la aplicación
Ingresa en tu navegador web a:
👉 **[http://localhost](http://localhost)**

### 5. Iniciar sesión
Puedes ingresar con cualquiera de las credenciales de administrador precargadas:

| Usuario / Alias | Contraseña | Rol |
|---|---|---|
| `admin` o `admin@boyaca.gov.co` | `admin123` | Administrador |
| `angela.ussa` o `angela.ussa@boyaca.gov.co` | `@Angela123` | Administrador |

---

## Ejecutar después de realizar cambios

Una vez que el proyecto ya fue configurado y levantado previamente, utiliza el flujo adecuado según el tipo de cambio que hayas realizado:

### Si modificaste archivos de Frontend (`.html`, `.css`, `.js`)
La carpeta `frontend/src/` está montada directamente como volumen en el contenedor. **No es necesario reconstruir los contenedores.**
1. Guarda tus cambios en el editor.
2. Ve al navegador y recarga forzando la limpieza de caché con **`Ctrl + F5`** (o **`Shift + F5`** / **`Cmd + Shift + R`** en Mac).

### Si modificaste código de los Microservicios (`services/`) o agregaste dependencias
El código de los servicios se empaqueta en las imágenes de Docker. Debes recompilar los servicios modificados:
* **Recompilar todos los servicios:**
  ```bash
  docker compose up --build -d
  ```
* **Recompilar un solo servicio específico (ejemplo: employees-service):**
  ```bash
  docker compose up --build -d employees-service
  ```

### Si modificaste la configuración del servidor web (`frontend/nginx.conf`)
Basta con reiniciar el contenedor del frontend:
```bash
docker compose restart frontend
```

### Si necesitas reiniciar la base de datos desde cero
Si modificaste los scripts SQL de `database/` y deseas reconstruir la base de datos limpia con todos los esquemas iniciales:
> ⚠️ **Atención:** Este comando borrará los datos creados localmente en la base de datos.
```bash
docker compose down -v
docker compose up --build -d
```

### Iniciar y detener el proyecto día a día (sin cambios de código)
* **Para pausar/detener el proyecto:**
  ```bash
  docker compose stop
  ```
* **Para volver a iniciarlo:**
  ```bash
  docker compose start
  ```

---

## Comandos principales

Todos estos comandos deben ejecutarse desde la carpeta `web/`:

| Acción | Comando |
|---|---|
| **Levantar todo en segundo plano** | `docker compose up -d` |
| **Recompilar y levantar tras cambios** | `docker compose up --build -d` |
| **Detener contenedores (manteniendo datos)** | `docker compose stop` |
| **Reanudar contenedores detenidos** | `docker compose start` |
| **Apagar y desmontar contenedores** | `docker compose down` |
| **Ver estado de los servicios** | `docker compose ps` |
| **Ver registros/logs en tiempo real** | `docker compose logs -f` |
| **Ver logs de un servicio puntual** | `docker compose logs -f <nombre-servicio>` |
