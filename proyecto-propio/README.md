# VisionText - OCR con IA

Una aplicación web moderna de reconocimiento óptico de caracteres (OCR) que utiliza inteligencia artificial para extraer texto de imágenes capturadas en tiempo real.

## ✨ Características Principales

- 👁️‍🗨️ **Reconocimiento en tiempo real** - Captura y analiza texto al instante
- 🧠 **IA Avanzada** - Powered by Tesseract.js con redes neuronales LSTM
- � **Acceso directo a cámara** - Sin necesidad de subir archivos
- ⚙️ **Altamente configurable** - Ajusta procesamiento según tu contenido
- � **Multiidioma** - Soporte para español, inglés, francés, alemán
- 📱 **Totalmente responsive** - Funciona en desktop y móvil
- 🎨 **Tema claro/oscuro** - Diseño moderno y personalizable
- 🔒 **100% privado** - Todo el procesamiento es local, sin servidores

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js (versión 18 o superior)
- npm o yarn

### Instalación y Ejecución

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build de producción
npm run preview
```

## 📁 Estructura del Proyecto

```
src/
├── components/     # Componentes reutilizables
├── pages/         # Páginas/vistas principales
├── hooks/         # Custom hooks
├── utils/         # Utilidades y helpers
├── types/         # Definiciones de tipos TypeScript
├── styles/        # Estilos globales
└── assets/        # Recursos estáticos (imágenes, iconos, etc.)
```

## 🛠️ Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Previsualiza el build de producción
- `npm run lint` - Ejecuta ESLint para revisar el código

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## 🔍 **Funcionalidad OCR con IA**

Esta aplicación incluye una potente funcionalidad de reconocimiento óptico de caracteres (OCR) que permite:

### 📷 **Métodos de entrada:**
- **📸 Captura desde cámara web** - Reconocimiento en tiempo real
- **📁 Carga de archivos** - Procesa imágenes guardadas (JPG, PNG, GIF, WEBP)

### 🚀 **Características avanzadas:**
- **🔤 Reconocimiento multicarácter** - Letras, números, símbolos y palabras
- **🎯 Marco de enfoque visual** - Guía para mejor captura
- **📊 Medición de confianza** - Indica la precisión del reconocimiento
- **⚙️ Configuración avanzada** - Preprocesamiento y optimizaciones
- **🌐 Soporte multiidioma** - Español, inglés, francés, alemán
- **📱 Diseño responsive** - Funciona en desktop y móvil
- **🔒 Privacidad total** - Procesamiento local, sin servidores

### 🎛️ **Opciones de mejora:**
- **Preprocesamiento** - Mejora contraste automáticamente
- **Escalado 2x** - Aumenta resolución para texto pequeño
- **Filtro de enfoque** - Mejora definición de bordes borrosos
- **Modos de análisis** - Optimizado para diferentes tipos de texto

### 📋 **Cómo usar:**
1. Elige entre **Cámara Web** o **Cargar Imagen**
2. Si usas cámara: apunta al texto y haz clic en "Capturar y Analizar"
3. Si cargas archivo: selecciona una imagen desde tu dispositivo
4. Ajusta configuraciones si es necesario para mejor precisión
5. ¡Obtén el texto reconocido al instante!
