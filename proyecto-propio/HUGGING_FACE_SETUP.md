# 🤗 Configuración de Hugging Face - ¡GRATIS!

## ¿Por qué Hugging Face?

✅ **Completamente GRATUITO** (sin límites de crédito)
✅ **Modelos open source** potentes
✅ **Sin tarjeta de crédito** requerida
✅ **Múltiples modelos** disponibles
✅ **Comunidad activa** y soporte

## 🚀 Configuración Rápida (5 minutos)

### 1. Crear cuenta en Hugging Face

1. Ve a: https://huggingface.co/join
2. Crea tu cuenta gratuita
3. Confirma tu email

### 2. Generar token de acceso

1. Ve a: https://huggingface.co/settings/tokens
2. Haz clic en "New token"
3. Nombre: `VisionText-Pro`
4. Tipo: `Read` (suficiente para la app)
5. Copia el token generado

### 3. Configurar en la aplicación

1. Crea archivo `.env.local` en la raíz del proyecto
2. Agrega tu token:

```env
VITE_HUGGINGFACE_TOKEN=hf_tu_token_aqui
```

### 4. ¡Listo!

La aplicación detectará automáticamente el token y usará Hugging Face.

## 🔧 Modelos Utilizados

### Para OCR y Texto:

- **microsoft/DialoGPT-medium**: Generación de texto
- **facebook/bart-large-cnn**: Resúmenes inteligentes
- **facebook/bart-large-mnli**: Clasificación de documentos

### Para Análisis de Tráfico:

- **Análisis básico**: Procesamiento sin límites
- **Análisis avanzado**: Con modelos de Hugging Face

## 📊 Comparación de Proveedores

| Característica       | OpenAI      | Hugging Face | Análisis Básico |
| -------------------- | ----------- | ------------ | --------------- |
| **Costo**            | 💰 Pago     | 🆓 GRATIS    | 🆓 GRATIS       |
| **Precisión OCR**    | ⭐⭐⭐⭐⭐  | ⭐⭐⭐⭐     | ⭐⭐⭐          |
| **Análisis Tráfico** | ⭐⭐⭐⭐⭐  | ⭐⭐⭐⭐     | ⭐⭐⭐          |
| **Velocidad**        | Rápido      | Medio        | Rápido          |
| **Límites**          | Por crédito | Sin límites  | Sin límites     |

## 🛠️ Configuración Avanzada

### Cambiar proveedor manualmente:

```typescript
import { aiService } from "./services/aiService";

// Usar Hugging Face
aiService.setProvider("huggingface");

// Usar OpenAI (si tienes API key)
aiService.setProvider("openai");

// Usar solo análisis básico
aiService.setProvider("none");
```

### Verificar proveedor actual:

```typescript
const provider = aiService.getCurrentProvider();
console.log("Proveedor actual:", provider);

const info = aiService.getProviderInfo();
console.log("Info:", info);
```

## 🔍 Modelos Alternativos

Si quieres experimentar con otros modelos:

### Para generación de texto:

- `gpt2` (más pequeño, más rápido)
- `google/flan-t5-small` (muy eficiente)
- `microsoft/DialoGPT-small` (más rápido)

### Para clasificación:

- `distilbert-base-uncased-finetuned-sst-2-english`
- `cardiffnlp/twitter-roberta-base-sentiment-latest`

## 🚨 Solución de Problemas

### Error: "Invalid token"

- Verifica que copiaste el token completo
- Asegúrate de que el token tenga permisos de lectura

### Error: "Model not found"

- Algunos modelos pueden estar temporalmente no disponibles
- La app tiene fallbacks automáticos

### Respuestas lentas

- Es normal la primera vez (descarga del modelo)
- Las siguientes peticiones son más rápidas

## 🎯 Consejos de Uso

1. **Primera vez**: Puede tardar un poco (descarga modelos)
2. **Uso regular**: Muy rápido después de la primera carga
3. **Sin internet**: No funcionará (modelos en la nube)
4. **Límites**: Hugging Face tiene límites suaves, pero generosos

## 🆘 Soporte

Si tienes problemas:

1. Verifica tu token en https://huggingface.co/settings/tokens
2. Revisa la consola del navegador
3. Prueba con `aiService.testConnection()`

---

## 🚀 ¡Disfruta de tu IA gratuita!

Con Hugging Face tienes acceso a modelos de IA de última generación sin costo. Es la opción perfecta para desarrolladores que quieren potencia sin pagar.

**¿Necesitas ayuda?** Revisa la documentación oficial: https://huggingface.co/docs
