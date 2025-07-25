# KOVA V4 - Ethereal Depth

*Next-generation loyalty platform by [Traction Labs Design](https://tractionlabs.com)*

[![Built by Traction Labs](https://img.shields.io/badge/Built%20by-Traction%20Labs%20Design-blue?style=for-the-badge)](https://tractionlabs.com)
[![Powered by Next.js](https://img.shields.io/badge/Powered%20by-Next.js%2015-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![CodeSandbox Ready](https://img.shields.io/badge/CodeSandbox-Ready-orange?style=for-the-badge)](https://codesandbox.io)

## 🚀 Overview

**KOVA V4** represents the evolution of digital loyalty platforms, designed by **Traction Labs Design** to connect banks, fintechs, and loyalty programs with leading digital brands. Built on 20 years of industry experience, this platform creates an ecosystem where every user defines their own value.

### Key Features

- **🌟 Ethereal Depth Experience**: Immersive 3D background with parallax effects
- **✨ Dynamic Text Glow**: Full text glow effects on rotating content
- **📱 Responsive Design**: Optimized for all devices and screen sizes  
- **🎭 Motion Design**: Framer Motion animations with reduced motion support
- **🔧 Developer Experience**: Hot reload, TypeScript, Tailwind CSS
- **🧪 Testing Suite**: Jest unit tests + Playwright E2E tests

## 🛠️ Technology Stack

- **Framework**: Next.js 15.2.4 with App Router
- **Language**: TypeScript with strict type checking
- **Styling**: Tailwind CSS with custom design system
- **Animation**: Framer Motion with performance optimizations
- **Testing**: Jest (unit) + Playwright (E2E)
- **Development**: CodeSandbox ready with dev containers

## 🚀 Quick Start

### Development Server

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

### Testing

```bash
# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e

# Run with coverage
npm run test:coverage
```

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm run start
```

## 🎨 Design System

### Color Palette
- **Primary**: Deep space blues (#020010, #0a0a23)
- **Accent**: Ethereal glow (#FFF9E1)
- **Interactive**: Blue gradient (#3B82F6 to #8B5CF6)

### Typography
- **Headings**: Thin weight with wide tracking
- **Body**: Light weight with relaxed leading
- **Dynamic**: Glow effects on key messaging

### Components
- **EtherealDepth**: 3D parallax background system
- **HeroSection**: Multi-language hero with rotating text
- **TextRotator**: Animated text with configurable glow effects

## 🌐 Internationalization

Currently supports:
- **Spanish (es)**: Primary language
- **English (en)**: Secondary language

Easy to extend for additional languages through the content configuration system.

## 📱 CodeSandbox Integration

This project is optimized for CodeSandbox development:

- **Automatic Setup**: Dependencies and dev server start automatically
- **GitHub Sync**: Real-time synchronization with repository
- **Dev Containers**: Pre-configured development environment
- **Error Boundaries**: Enhanced debugging for sandbox environment

[Open in CodeSandbox](https://codesandbox.io/p/github/surfsidere/KOVA-V4.1/main)

## 🧪 Testing

### Unit Tests (Jest)
- Component rendering and behavior
- Hook functionality and state management
- Utility function validation
- Performance monitoring

### E2E Tests (Playwright)
- User interaction flows
- Cross-browser compatibility (Firefox on ARM64)
- Responsive design validation
- Accessibility compliance

## 🎯 Performance

- **Bundle Size**: Optimized for <500KB initial load
- **Core Web Vitals**: LCP <2.5s, FID <100ms, CLS <0.1
- **Accessibility**: WCAG 2.1 AA compliance
- **SEO**: Optimized meta tags and structure

## 🏗️ Architecture

```
├── app/                    # Next.js App Router
├── components/
│   └── ui/                # Reusable UI components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
├── styles/                # Global styles and themes
├── tests/
│   ├── __tests__/         # Unit tests
│   └── e2e/              # Playwright E2E tests
├── types/                 # TypeScript definitions
└── config/               # Configuration files
```

## 🚀 Deployment

### Vercel (Recommended)
```bash
vercel --prod
```

### Docker
```bash
docker build -t kova-v4 .
docker run -p 3000:3000 kova-v4
```

### Manual
```bash
npm run build
npm run start
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is proprietary software developed by **Traction Labs Design**.

## 🏢 About Traction Labs Design

Traction Labs Design specializes in creating next-generation digital experiences for the fintech and loyalty industries. With 20 years of experience, we build platforms that connect brands with their most valuable customers.

**Contact**: [design@tractionlabs.com](mailto:design@tractionlabs.com)

---

*Built with ❤️ by Traction Labs Design*