# 📚 Documentación Estándar para Proyectos - Alejandro Mauro

## 🎯 Propósito
Este directorio contiene la documentación consolidada y estandarizada para todos los proyectos web. **Copia este directorio completo** a nuevos proyectos como base de documentación.

## 📁 Contenido del Directorio

### 📋 Documentos Principales
- **`normas.md`** - 🏆 **DOCUMENTO PRINCIPAL** - Normas consolidadas de UX/UI, estadísticas y despliegue
- **`mejores_practicas6.md`** - Mejores prácticas de desarrollo, templates de código y arquitectura

### 📋 Documentos de Referencia
- **`despliegue_coolify_docker.md`** - Guía completa de despliegue Docker en Coolify
- **`estadisticas.md`** - Sistema de estadísticas persistentes para aplicaciones
- **`lecciones_aprendidas_ecg.md`** - 🆕 Experiencias y soluciones del proyecto ECG exitoso

### 🎨 Recursos Visuales
- **`theme/`** - Carpeta completa con recursos gráficos y definición de tema
  - `favicon.png` - Favicon estándar (32x32px)
  - `logo-compacto.png` - Logo principal para headers
  - `logo-cursos-informed.svg` - Logo vectorial alternativo
  - `fondo_abstracto.png` - Imagen de fondo opcional
  - `UX-UI-ejemplo.png` - Referencia visual del diseño target
  - `UX-UI-ejemplo-modal.png` - Referencia del modal de información
  - `theme.md` - Definición completa del tema (colores, tipografía, componentes)

## 🚀 Cómo Usar en Nuevos Proyectos

### 1️⃣ Copia Base
```bash
# En tu nuevo proyecto
cp -r /ruta/al/proyecto-anterior/docs2 ./docs
```

### 2️⃣ Archivos de Referencia Principales
Para cualquier nuevo proyecto, consulta **ÚNICAMENTE** estos 2 archivos:

1. **`docs/normas.md`** - Para estructura UX/UI, sistema de estadísticas, y configuración de despliegue
2. **`docs/mejores_practicas6.md`** - Para arquitectura de código, templates y metodologías

### 3️⃣ Recursos Gráficos
- Copia `docs/theme/` completo a tu proyecto
- Los recursos gráficos están listos para usar
- Personaliza colores en `theme.md` si es necesario

### 4️⃣ Configuración Proyecto-Específica
- Actualiza el título de la aplicación en `normas.md`
- Personaliza las métricas de estadísticas según tu lógica de negocio
- Ajusta variables de entorno específicas en `despliegue_coolify_docker.md`

## ✅ Checklist de Implementación

### 📋 Documentación
- [ ] Directorio `docs/` copiado al nuevo proyecto
- [ ] `normas.md` revisado y personalizado
- [ ] `mejores_practicas6.md` aplicado como guía de desarrollo
- [ ] Variables de entorno documentadas

### 🎨 Recursos Visuales
- [ ] Carpeta `theme/` copiada a `docs/theme/`
- [ ] `favicon.png` colocado en `/public/favicon.png`
- [ ] `logo-compacto.png` colocado en `/public/logo-compacto.png`
- [ ] Paleta de colores aplicada según `theme.md`

### 🏗️ Implementación
- [ ] Estructura de directorios según `normas.md`
- [ ] Header estándar implementado
- [ ] Sistema de estadísticas configurado
- [ ] Dockerfile multi-stage creado
- [ ] Health checks implementados

## 🔄 Actualización de Documentación

### Versionado
- **v6.0** - Versión actual con normas consolidadas
- Cada proyecto debe actualizar su documentación basándose en esta versión

### Mejoras Futuras
Si encuentras mejoras o nuevos patrones:
1. Actualiza la documentación en el proyecto actual
2. Propaga los cambios a `docs2/` para futuros proyectos
3. Incrementa el número de versión

## 🎯 Objetivo Final

**Meta**: Con estos 2 archivos (`normas.md` + `mejores_practicas6.md`) deberías poder crear cualquier proyecto web nuevo siguiendo estándares consistentes, sin necesidad de consultar documentación adicional.

---

**📅 Creado:** Agosto 2025  
**👨‍💻 Autor:** Alejandro Mauro  
**🔄 Versión:** 6.0  
**📋 Uso:** Base documental para todos los proyectos web