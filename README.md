# 🌽 AgroTech - Hidalgo 🛰️

Sistema inteligente de monitoreo y diagnóstico agrícola diseñado específicamente para fortalecer el campo en la región de Hidalgo, México.

## 🚀 Características Principales

- **🛰️ Monitoreo IoT en Tiempo Real**: Visualización de temperatura, humedad del suelo, humedad del aire, punto de rocío y evapotranspiración (ET) mediante sensores conectados.
- **🧠 Diagnóstico Híbrido con IA**: Identificación de plagas y enfermedades mediante descripciones de texto o fotografías, utilizando Gemini 1.5 Flash y un motor experto local de respaldo.
- **🛡️ Red de Prevención Local**: Sistema de reportes comunitarios para alertar sobre brotes de plagas en municipios como Actopan, Ixmiquilpan y Pachuca.
- **📊 Gestión de Fincas**: Organización y seguimiento de múltiples terrenos sincronizados con la nube de Firebase.
- **📄 Reportes Profesionales**: Generación de informes de salud del cultivo en formatos CSV y Word para trámites agrícolas.

## 🛠️ Tecnologías Utilizadas

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS.
- **UI Components**: ShadCN UI, Lucide Icons.
- **Backend & Auth**: Firebase (Authentication, Firestore, Realtime Database).
- **IA Generativa**: Google Genkit + Gemini 1.5 Flash.
- **Gráficos**: Recharts.

## 📦 Instalación y Configuración

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/TU_USUARIO/agrotech-hidalgo.git
   cd agrotech-hidalgo
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Variables de Entorno**:
   Crea un archivo `.env` en la raíz con tus llaves de API:
   ```env
   GEMINI_API_KEY=tu_llave_aqui
   ```

4. **Ejecutar en desarrollo**:
   ```bash
   npm run dev
   ```

---
*Desarrollado con ❤️ para los agricultores de Hidalgo.*
# agrotech-hidalgo
