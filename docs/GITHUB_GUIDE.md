# 🚀 Guía para subir AgroTech a GitHub

Sigue estos pasos exactos para subir tu código ahora que hemos añadido los archivos necesarios:

## 1. Crear el repositorio en GitHub
1. Ve a [GitHub](https://github.com) e inicia sesión.
2. Crea un nuevo repositorio llamado `agrotech-hidalgo`.
3. **No** selecciones README, licencia ni .gitignore (ya los tenemos).

## 2. Ejecutar estos comandos en la terminal
Copia y pega uno por uno:

```bash
# Añadir los nuevos cambios (README y .gitignore)



# Confirmar los cambios
git commit -m "Build: Configuración final y documentación para GitHub"

# Cambiar a la rama principalgit add .
git commit -m "Actualización de reglas o mejoras"
git push origin main
git branch -M main

# Conectar con tu repo (Sustituye con TU URL de GitHub)
git remote add origin https://github.com/TU_USUARIO/agrotech-hidalgo.git

# Subir el código por primera vez
git push -u origin main
```

## 3. ¿Qué hacer si 'git commit' dice "nothing to commit"?
Si después de ejecutar `git add .` te dice que no hay nada que confirmar, significa que los archivos ya están al día. Simplemente procede con el paso del `remote` y el `push`.

¡Felicidades por completar tu proyecto! 🌽🛰️
