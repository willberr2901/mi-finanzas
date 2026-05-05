#!/bin/bash
echo "🔍 Verificando eliminación de módulos..."

if grep -r "AirQuality\|aire\|Calidad del Aire" src/ --include="*.tsx" --include="*.ts"; then
  echo "❌ ERROR: Aún hay referencias a Aire"
  exit 1
fi

if grep -r "RoutesPage\|Rutas\|routes" src/ --include="*.tsx" --include="*.ts" | grep -v "react-router"; then
  echo "❌ ERROR: Aún hay referencias a Rutas"
  exit 1
fi

echo "✅ Limpieza verificada: No hay referencias a Aire ni Rutas"