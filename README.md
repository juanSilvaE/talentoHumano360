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
docker compose down
```

---

## 🔄 Flujo de Trabajo: Cómo guardar y subir cambios a GitHub

Cada vez que realices una modificación en los archivos del proyecto (código frontend, microservicios, estilos o base de datos), sigue estos pasos para sincronizar tus cambios con el repositorio en GitHub:

### Paso 1: Abrir la terminal en la raíz del proyecto
Asegúrate de estar ubicado en la carpeta principal del proyecto (`talentoHumano360`):
```bash
cd /ruta/hacia/talentoHumano360
```

### Paso 2: Verificar qué archivos fueron modificados
Revisa qué archivos has editado, agregado o eliminado:
```bash
git status
```
> *(Opcional)* Si quieres ver exactamente qué líneas de código cambiaron:
> ```bash
> git diff
> ```

### Paso 3: Preparar los archivos para el commit (Staging)
Agrega todos los archivos modificados:
```bash
git add .
```
> O si solo quieres agregar archivos específicos:
> ```bash
> git add web/frontend/src/index.html
> ```

### Paso 4: Crear el commit con un mensaje descriptivo
Registra los cambios en tu historial local explicando brevemente qué hiciste:
```bash
git commit -m "fix: actualización de nombre a Talento 360 y estilos"
```

### Paso 5: Descargar cambios remotos (Buena práctica)
Antes de subir, asegúrate de tener la última versión de GitHub para evitar conflictos:
```bash
git pull origin main
```

### Paso 6: Subir los cambios a GitHub
Envía tus commits al repositorio remoto:
```bash
git push origin main
```

---

### 🌿 Flujo alternativo con Ramas (Recomendado para trabajo en equipo)

Si trabajas con ramas de características (*feature branches*):

1. **Crear y cambiar a una nueva rama:**
   ```bash
   git checkout -b feature/nueva-funcionalidad
   ```
2. **Hacer tus cambios, agregar y commitear:**
   ```bash
   git add .
   git commit -m "feat: descripción del cambio"
   ```
3. **Publicar la rama en GitHub:**
   ```bash
   git push -u origin feature/nueva-funcionalidad
   ```
4. **Crear Pull Request en GitHub:**
   - Entra a [https://github.com/juanSilvaE/talentoHumano360](https://github.com/juanSilvaE/talentoHumano360).
   - Haz clic en el botón verde **Compare & pull request**.
   - Revisa los cambios y haz clic en **Create pull request** y luego **Merge**.

---

## ⚡ ¿Cómo ver los cambios reflejados en el navegador?

Cuando modifiques archivos del frontend o microservicios con Docker en ejecución:

1. Reconstruye el contenedor para cargar los nuevos archivos:
   ```bash
   cd web
   docker compose up --build -d
   ```
2. Abre [http://localhost](http://localhost) y recarga forzando la limpieza de caché con **`Ctrl + F5`** (o **`Shift + F5`**).
