# Talento 360 (Web)

Plataforma institucional web basada en arquitectura de microservicios.

## Estructura del Repositorio

```text
talento360/
├── database/            # Scripts SQL para creación y poblado de la base de datos PostgreSQL.
├── web/                 # Aplicación completa
│   ├── docker-compose.yml   # Orquestador (Frontend, Microservicios, BD)
│   ├── frontend/            # Cliente
│   └── services/            # Microservicios (Auth, Employees, Requests, Viáticos, Dashboard)
└── README.md            
```

## Requisitos previos

- [Docker](https://www.docker.com/products/docker-desktop/) instalado y en ejecución.

## Cómo ejecutar el proyecto

1. Entra a la carpeta `web`:
   ```bash
   cd web
   ```

2. Levanta los contenedores:
   ```bash
   docker-compose up --build -d
   ```

3. Abre en tu navegador: [http://localhost](http://localhost)

---

## Acceso de prueba

Puedes usar estas credenciales precargadas:

| Usuario | Contraseña |
|---|---|
| admin@boyaca.gov.co | admin123 |
| carlos@... | carlos123 |
| maria@... | maria123 |

---

## Detener la aplicación

En la misma carpeta `web/`, ejecuta:
```bash
docker-compose down
```
