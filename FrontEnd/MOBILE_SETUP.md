# 📱 Guia de Instalação Mobile - Minha Aula

## 🎯 Visão Geral
O sistema "Minha Aula" foi otimizado para funcionar como uma Progressive Web App (PWA) com foco em dispositivos móveis. Todos os dados são armazenados localmente no dispositivo.

## 📋 Pré-requisitos

### Para Desenvolvimento:
- Node.js 18+ 
- npm ou yarn
- Git

### Para Android:
- Android Studio (para emulador)
- Dispositivo Android 8.0+ ou emulador

### Para iOS:
- Xcode (apenas no macOS)
- Dispositivo iOS 12+ ou simulador
- Conta Apple Developer (para dispositivo físico)

## 🚀 Instalação e Configuração

### 1. Clone e Configure o Projeto
\`\`\`bash
# Clone o repositório
git clone <seu-repositorio>
cd minha-aula

# Instale as dependências
npm install

# Execute em modo de desenvolvimento
npm run dev
\`\`\`

### 2. Configuração para PWA
\`\`\`bash
# Instale as dependências PWA
npm install next-pwa workbox-webpack-plugin

# Adicione ao next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
})

module.exports = withPWA({
  // sua configuração existente
})
\`\`\`

### 3. Manifesto PWA
Crie `public/manifest.json`:
\`\`\`json
{
  "name": "Minha Aula - Gestão de Aulas",
  "short_name": "Minha Aula",
  "description": "Sistema de gerenciamento de aulas particulares",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
\`\`\`

## 📱 Instalação no Android

### Método 1: PWA via Navegador
1. **Abra o Chrome no Android**
2. **Acesse**: `http://seu-ip:3000` (IP da sua máquina)
3. **Toque no menu** (3 pontos) → "Adicionar à tela inicial"
4. **Confirme** a instalação
5. **Abra o app** pela tela inicial

### Método 2: Capacitor (App Nativo)
\`\`\`bash
# Instale o Capacitor
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android

# Inicialize o Capacitor
npx cap init "Minha Aula" "com.minhaula.app"

# Adicione a plataforma Android
npx cap add android

# Build do projeto
npm run build
npx cap sync

# Abra no Android Studio
npx cap open android
\`\`\`

### No Android Studio:
1. **Conecte seu dispositivo** ou inicie um emulador
2. **Clique em "Run"** (▶️) para instalar no dispositivo
3. **Aguarde** a compilação e instalação

### Método 3: APK via Expo (Alternativo)
\`\`\`bash
# Instale o Expo CLI
npm install -g @expo/cli

# Inicialize projeto Expo
npx create-expo-app --template blank-typescript

# Configure para web
npx expo install react-dom react-native-web @expo/webpack-config

# Build para Android
npx expo build:android
\`\`\`

## 🍎 Instalação no iOS

### Método 1: PWA via Safari
1. **Abra o Safari no iOS**
2. **Acesse**: `http://seu-ip:3000`
3. **Toque no botão compartilhar** (□↗)
4. **Selecione**: "Adicionar à Tela de Início"
5. **Confirme** o nome e toque em "Adicionar"
6. **Abra o app** pela tela inicial

### Método 2: Capacitor (App Nativo)
\`\`\`bash
# Adicione a plataforma iOS
npx cap add ios

# Build e sync
npm run build
npx cap sync

# Abra no Xcode
npx cap open ios
\`\`\`

### No Xcode:
1. **Conecte seu dispositivo iOS** ou use o simulador
2. **Configure o Team** (conta Apple Developer)
3. **Selecione o dispositivo** de destino
4. **Clique em "Run"** (▶️) para instalar

### Método 3: Expo Go (Desenvolvimento)
\`\`\`bash
# Instale o Expo Go no iPhone (App Store)
# Execute o projeto
npx expo start

# Escaneie o QR Code com o Expo Go
\`\`\`

## 🔧 Configurações Específicas Mobile

### 1. Viewport e Meta Tags
Adicione ao `app/layout.tsx`:
\`\`\`tsx
export const metadata = {
  title: 'Minha Aula',
  description: 'Sistema de gerenciamento de aulas particulares',
  manifest: '/manifest.json',
  themeColor: '#000000',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
}
\`\`\`

### 2. Service Worker
Crie `public/sw.js`:
\`\`\`javascript
const CACHE_NAME = 'minha-aula-v1'
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request)
      })
  )
})
\`\`\`

### 3. Configurações de Toque
\`\`\`css
/* Adicione ao globals.css */
* {
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}

input, textarea {
  -webkit-user-select: text;
  user-select: text;
}

.touch-manipulation {
  touch-action: manipulation;
}
\`\`\`

## 🔍 Testando a Instalação

### Verificações Android:
- ✅ App aparece na tela inicial
- ✅ Abre em tela cheia (sem barra do navegador)
- ✅ Dados salvos localmente persistem
- ✅ Funciona offline
- ✅ Gestos de toque funcionam

### Verificações iOS:
- ✅ App aparece na tela inicial
- ✅ Splash screen personalizada
- ✅ Status bar integrada
- ✅ Dados persistem entre sessões
- ✅ Funciona offline

## 🐛 Solução de Problemas

### Android:
- **App não instala**: Verifique se "Fontes desconhecidas" está habilitado
- **Dados não salvam**: Verifique permissões de armazenamento
- **App lento**: Limpe cache do navegador

### iOS:
- **PWA não funciona**: Use apenas Safari, não Chrome
- **App não aparece**: Verifique se foi adicionado corretamente
- **Dados perdidos**: Verifique se o Safari não está limpando dados

### Geral:
- **Erro de rede**: Verifique se o IP está correto
- **Layout quebrado**: Teste em diferentes tamanhos de tela
- **Performance**: Use React DevTools para debug

## 📊 Monitoramento

### Analytics Mobile:
\`\`\`javascript
// Adicione ao _app.tsx
useEffect(() => {
  // Detectar se é PWA
  const isPWA = window.matchMedia('(display-mode: standalone)').matches
  
  // Detectar plataforma
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  const isAndroid = /Android/.test(navigator.userAgent)
  
  console.log('PWA:', isPWA, 'iOS:', isIOS, 'Android:', isAndroid)
}, [])
\`\`\`

## 🚀 Deploy para Produção

### Netlify:
\`\`\`bash
# Build
npm run build

# Deploy manual ou conecte ao Git
\`\`\`

### Firebase Hosting:
\`\`\`bash
# Instale Firebase CLI
npm install -g firebase-tools

# Inicialize
firebase init hosting

# Deploy
firebase deploy
\`\`\`

## 📱 Recursos Mobile Específicos

### Notificações Push:
\`\`\`javascript
// Solicitar permissão
Notification.requestPermission()

// Enviar notificação local
new Notification('Lembrete de Aula', {
  body: 'Você tem uma aula em 30 minutos',
  icon: '/icon-192x192.png'
})
\`\`\`

### Vibração:
\`\`\`javascript
// Feedback tátil
if ('vibrate' in navigator) {
  navigator.vibrate(100) // 100ms
}
\`\`\`

### Orientação:
\`\`\`javascript
// Detectar mudança de orientação
window.addEventListener('orientationchange', () => {
  // Reajustar layout se necessário
})
\`\`\`

## 🎯 Próximos Passos

1. **Teste em dispositivos reais**
2. **Configure analytics**
3. **Implemente notificações push**
4. **Adicione sincronização em nuvem**
5. **Publique nas lojas de apps**

---

**💡 Dica**: Para melhor experiência, sempre teste em dispositivos físicos, não apenas emuladores!
