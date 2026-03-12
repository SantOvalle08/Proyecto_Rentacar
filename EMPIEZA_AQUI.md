# 🚀 EMPIEZA AQUÍ - Despliegue Super Simple

## 📚 ¿NO SABES POR DÓNDE EMPEZAR?

### ⭐ OPCIÓN 1: GUÍA PASO A PASO ULTRA DETALLADA (Recomendada)
👉 **Abre: [PASO_A_PASO_SIMPLE.md](PASO_A_PASO_SIMPLE.md)**
- Instrucciones MUY detalladas desde cero
- Explicaciones de cada paso
- Capturas de pantalla descritas
- Soluciones a errores comunes
- **45 minutos total**

### ⚡ OPCIÓN 2: SOLO LOS COMANDOS (Rápida)
👉 **Abre: [COMANDOS_EN_ORDEN.txt](COMANDOS_EN_ORDEN.txt)**
- Solo comandos para copiar y pegar
- Sin explicaciones largas
- Directo al grano
- **30 minutos total**

---

## 🎯 ¿Qué vas a lograr?

Al terminar tendrás:
- ✅ Backend desplegado en Google Cloud
- ✅ Frontend desplegado en Vercel
- ✅ Base de datos en MongoDB Atlas
- ✅ URLs públicas para compartir
- ✅ Aplicación funcionando 24/7
- ✅ **¡Tu nota asegurada!** 🎓

---

## 📋 Requisitos Previos

Antes de empezar, necesitas:
- ✅ Cuenta de Google (Gmail)
- ✅ Proyecto en Google Cloud creado: **proyectorentaca** ✅ (Ya lo tienes)
- ✅ PowerShell abierto
- ✅ 45 minutos de tiempo

---

## 🛠️ Si Prefieres Usar Scripts Automáticos

### Script 1: Verificar que todo esté listo
```powershell
.\pre-deploy-check.ps1
```

### Script 2: Desplegar automáticamente
```powershell
.\deploy-gcp.ps1
```

---

## 🆘 ¿Necesitas Ayuda?

### Errores comunes:
- **"gcloud no se reconoce"** → Instala Google Cloud CLI desde: https://cloud.google.com/sdk/docs/install
- **"Cannot connect to MongoDB"** → Verifica Network Access en MongoDB Atlas
- **"Project not found"** → Ejecuta: `gcloud projects list` y usa el nombre exacto

### Ver logs en tiempo real:
```powershell
gcloud app logs tail -s default
```

---

## 📚 Más Guías Disponibles

Si necesitas más detalles:
- **[GUIA_DESPLIEGUE_GCP.md](GUIA_DESPLIEGUE_GCP.md)** - Guía completa con todas las opciones
- **[TIPS_PRESENTACION_GCP.md](TIPS_PRESENTACION_GCP.md)** - Para preparar tu exposición
- **[CHECKLIST_DESPLIEGUE.md](CHECKLIST_DESPLIEGUE.md)** - Checklist imprimible

---

## 🎉 Resultado Final

Tu aplicación estará disponible en:
- **Backend:** https://proyectorentaca.uc.r.appspot.com
- **Frontend:** https://rentacar-[tu-usuario].vercel.app

**¡Comparte estas URLs con tu profesor!** 🎓

---

**💡 TIP:** Si es tu primera vez desplegando en la nube, usa **[PASO_A_PASO_SIMPLE.md](PASO_A_PASO_SIMPLE.md)** - te guiará como si estuviera contigo.

**¡Vamos, tú puedes! 💪 De esto depende tu nota!** 🚀
