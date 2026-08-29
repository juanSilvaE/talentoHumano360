# Talento 360 - Sistema de Gestión de Hojas de Vida (Web)

**Talento 360** es una aplicación web desarrollada como sistema de gestión de hojas de vida, perfiles de servidores, dependencias y solicitudes administrativas para un entorno institucional inspirado en la **Gobernación de Boyacá**.

El sistema permite consultar, visualizar y administrar información relacionada con servidores públicos, hojas de vida, dependencias y solicitudes como vacaciones, incapacidades, permisos, licencias por maternidad y viáticos.

Esta versión del proyecto está completamente orientada a la **arquitectura web basada en microservicios** y se ejecuta mediante contenedores usando **Docker y Docker Compose**.

---

## Estructura del Proyecto

El repositorio consta de los siguientes componentes principales:

```text
talento360/
├── database/            # Scripts SQL para creación y poblado de la base de datos PostgreSQL.
├── web/                 # Código fuente de la aplicación web y configuración de despliegue.
│   ├── docker-compose.yml   # Orquestador de contenedores (Frontend, Servicios, Base de datos).
│   ├── frontend/            # Aplicación web cliente (interfaz de usuario).
│   └── services/            # Microservicios backend (Auth, Employees, Requests, etc.).
└── README.md            # Documentación del proyecto.
```

---

## Arquitectura de Microservicios

El backend de la aplicación se divide en varios servicios independientes para mantener una arquitectura modular:

1. **Auth Service (3001)**: Manejo de autenticación, JWT y gestión de inicio de sesión.
2. **Employees Service (3002)**: Gestión de información de empleados, perfiles y hojas de vida.
3. **Requests Service (3003)**: Gestión de solicitudes generales (Vacaciones, incapacidades, permisos).
4. **Admin Requests Service (3004)**: Gestión de solicitudes desde el punto administrativio (aprobaciones, rechazos).
5. **Viáticos Service (3005)**: Nuevo módulo para control y registro de viáticos.
6. **Dashboard Service (3006)**: Obtención de estadísticas consolidadas e información general para el panel principal.

Todos estos servicios se conectan a una única base de datos **PostgreSQL**.

---

## Requisitos previos

Para poder ejecutar la aplicación correctamente en tu entorno local, necesitas tener instalado:

- [Docker](https://www.docker.com/products/docker-desktop/) (Docker Desktop para Windows/Mac o Docker Engine en Linux).
- [Git](https://git-scm.com/) (opcional, para clonar el repositorio).

---

## Cómo ejecutar el proyecto localmente

El despliegue de toda la aplicación web, incluyendo la base de datos, el backend y el frontend, se realiza con un solo comando.

### 1. Ubícate en la carpeta `web`

Abre una terminal o línea de comandos, navega hasta el directorio raíz del proyecto y luego ingresa a la carpeta `web/`:

```bash
cd web
```

### 2. Ejecuta Docker Compose

Levanta la infraestructura en segundo plano construyendo las imágenes necesarias:

```bash
docker-compose up --build -d
```

Este comando realizará las siguientes tareas:
- Descargará la imagen de **PostgreSQL (Alpine)** y ejecutará los scripts iniciales ubicados en `database/` para crear el esquema y poblar datos falsos de prueba.
- Construirá y desplegará cada uno de los microservicios de la carpeta `services/`.
- Construirá el **Frontend** y lo publicará a través de **Nginx** en el puerto `80`.

### 3. Accede a la aplicación

Una vez que todos los contenedores estén levantados y saludables, abre tu navegador web favorito y accede a:

[http://localhost](http://localhost)

---

## Usuarios de prueba

Una vez que hayas ingresado a la aplicación en `http://localhost`, puedes utilizar las siguientes credenciales de prueba que se cargan automáticamente en la base de datos:

| Usuario (Email) | Contraseña |
|---|---|
| admin@boyaca.gov.co | admin123 |
| carlos@... | carlos123 |
| maria@... | maria123 |

> **Nota:** Puedes utilizar la contraseña `admin123` para el acceso inicial y comprobar los registros exactos de correos predeterminados revisando la tabla `users` o el script de base de datos (`02_seed_data.sql`).

---

## Detener el proyecto

Para detener todos los servicios y los contenedores en ejecución sin perder la información guardada en la base de datos (gracias al uso de volúmenes persistentes de Docker), ejecuta el siguiente comando desde la misma carpeta `web/`:

```bash
docker-compose down
```

Si deseas reiniciar la base de datos de cero (borrando también los volúmenes), puedes añadir el flag `-v`:

```bash
docker-compose down -v
```
