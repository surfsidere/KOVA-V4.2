# 🧪 KOVA V4: Testing Guide

Comprehensive testing strategy for the immersive scroll system.

## 📋 Testing Overview

Our testing suite ensures the reliability, performance, and user experience of the immersive scroll system across all devices and scenarios.

### Testing Pyramid

```
    /\     E2E Tests (Playwright)
   /  \    - User workflows
  /____\   - Cross-browser compatibility
 /      \  - Performance benchmarks
/__________\ 
|  UNIT   | Unit Tests (Jest)
| TESTS   | - Hook behavior
|_________| - Component rendering
|INTEGRATION| Integration Tests (Jest + RTL)  
|  TESTS    | - Provider interactions
|___________| - System coordination
```

## 🛠️ Test Categories

### 1. Unit Tests (`__tests__/hooks/`, `__tests__/components/`)

**Purpose**: Verify individual components and hooks work correctly in isolation.

**Coverage**:
- ✅ `useLenisScroll` - Lenis integration and scroll state management
- ✅ `useSectionManager` - Section lifecycle and progress tracking  
- ✅ `ScrollSection` - Section wrapper with effects and callbacks
- ✅ `ScrollTrigger` - Scroll-based animation triggers
- ✅ `ParallaxLayer` - Parallax effect implementation

**Key Test Scenarios**:
- Hook initialization and state management
- Component rendering with various props
- Callback execution and event handling
- Cleanup and memory management
- Error boundary behavior

### 2. Integration Tests (`__tests__/providers/`)

**Purpose**: Verify that components work together through the provider architecture.

**Coverage**:
- ✅ `LenisProvider` - Lenis initialization and context provision
- ✅ `SectionProvider` - Section registration and management
- ✅ Provider hierarchy and data flow
- ✅ Cross-provider communication

**Key Test Scenarios**:
- Provider initialization and context sharing
- Section registration and z-index assignment  
- Animation coordination across providers
- Error handling and recovery

### 3. E2E Tests (`__tests__/e2e/`)

**Purpose**: Validate complete user workflows and real-world scenarios.

**Coverage**:
- ✅ Full page scroll experience
- ✅ Section transitions and effects
- ✅ Performance during scrolling
- ✅ Mobile and desktop viewports
- ✅ Accessibility compliance
- ✅ Browser compatibility

**Key Test Scenarios**:
- Smooth scrolling with Lenis
- Section activation and deactivation
- Z-index orchestration
- Performance benchmarks
- Memory usage monitoring
- Reduced motion support

### 4. Performance Tests (`__tests__/performance/`)

**Purpose**: Ensure performance budgets are met across different scenarios.

**Performance Budgets**:
- 🎯 FPS: ≥55fps during scrolling
- 🎯 Memory: <100MB total usage
- 🎯 LCP: <2.5s (Largest Contentful Paint)
- 🎯 CLS: <0.1 (Cumulative Layout Shift)
- 🎯 Animations: ≤25 concurrent

**Key Test Scenarios**:
- Frame rate during continuous scrolling
- Memory usage and cleanup
- Core Web Vitals compliance
- Mobile device performance
- Stress testing with rapid interactions

## 🚀 Running Tests

### Quick Commands

```bash
# Run all unit and integration tests
npm run test

# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e-ui

# Run performance benchmarks
npm run test:performance

# Run complete test suite
npm run test:all

# CI/CD pipeline tests
npm run test:ci
```

### Detailed Test Execution

#### Unit Tests
```bash
# Run specific test file
npm test -- useLenisScroll.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should handle scroll"

# Run with verbose output
npm test -- --verbose

# Debug mode
npm test -- --detectOpenHandles --forceExit
```

#### E2E Tests
```bash
# Run specific test file
npx playwright test immersive-scroll.test.ts

# Run on specific browser
npx playwright test --project=chromium

# Run in debug mode
npx playwright test --debug

# Run with specific viewport
npx playwright test --config=playwright.mobile.config.ts
```

#### Performance Tests
```bash
# Run performance benchmarks
npx playwright test __tests__/performance/

# Generate performance report
npx playwright test --reporter=html __tests__/performance/

# Run with specific performance budgets
PERFORMANCE_BUDGET_FPS=60 npx playwright test benchmark.test.ts
```

## 🎯 Test Configuration

### Jest Configuration (`jest.config.js`)

```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup/setupTests.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.(css|scss)$': 'identity-obj-proxy',
  },
  collectCoverageFrom: [
    'components/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    'providers/**/*.{ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}
```

### Playwright Configuration (`playwright.config.ts`)

```typescript
export default defineConfig({
  testDir: './__tests__/e2e',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: devices['Desktop Chrome'] },
    { name: 'firefox', use: devices['Desktop Firefox'] },
    { name: 'webkit', use: devices['Desktop Safari'] },
    { name: 'Mobile Chrome', use: devices['Pixel 5'] },
    { name: 'Mobile Safari', use: devices['iPhone 12'] },
  ],
})
```

## 🔧 Test Development

### Writing Unit Tests

```typescript
import { renderHook, act } from '@testing-library/react'
import { useLenisScroll } from '@/hooks/use-lenis-scroll'
import { TestWrapper } from '../setup/TestWrapper'

describe('useLenisScroll', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useLenisScroll(), {
      wrapper: TestWrapper
    })
    
    expect(result.current.scrollProgress).toBeDefined()
    expect(result.current.velocity).toBe(0)
  })
  
  it('should handle scroll callbacks', () => {
    const onScrollMock = jest.fn()
    
    renderHook(() => useLenisScroll({ onScroll: onScrollMock }), {
      wrapper: TestWrapper
    })
    
    // Test callback execution
  })
})
```

### Writing E2E Tests

```typescript
import { test, expect } from '@playwright/test'

test.describe('Immersive Scroll', () => {
  test('should scroll smoothly through sections', async ({ page }) => {
    await page.goto('/')
    
    // Wait for Lenis initialization
    await page.waitForFunction(() => window.lenis?.isSmooth)
    
    // Test smooth scrolling
    await page.evaluate(() => window.scrollTo(0, 1000))
    await page.waitForTimeout(500)
    
    const scrollPosition = await page.evaluate(() => window.scrollY)
    expect(scrollPosition).toBeGreaterThan(900)
  })
})
```

### Writing Performance Tests

```typescript
test('should maintain 60fps during scrolling', async ({ page }) => {
  await page.goto('/')
  
  const fps = await page.evaluate(async () => {
    return new Promise(resolve => {
      let frameCount = 0
      const startTime = performance.now()
      
      function countFrame() {
        frameCount++
        const elapsed = performance.now() - startTime
        
        if (elapsed < 3000) {
          requestAnimationFrame(countFrame)
        } else {
          resolve((frameCount / elapsed) * 1000)
        }
      }
      
      requestAnimationFrame(countFrame)
    })
  })
  
  expect(fps).toBeGreaterThan(55)
})
```

## 🛡️ Test Mocking Strategy

### Global Mocks (`__tests__/setup/setupTests.ts`)

```typescript
// Mock Lenis
jest.mock('@studio-freight/lenis', () => ({
  default: jest.fn().mockImplementation(() => ({
    scrollTo: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    destroy: jest.fn(),
    raf: jest.fn(),
    isSmooth: true,
  })),
}))

// Mock Framer Motion  
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => React.createElement('div', props, children),
  },
  motionValue: jest.fn(() => ({
    get: jest.fn(() => 0),
    set: jest.fn(),
  })),
}))

// Mock Web APIs
global.IntersectionObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))
```

### Test Utilities

```typescript
// Test wrapper for providers
export const TestWrapper = ({ children }) => (
  <LenisProvider>
    <SectionProvider>
      <AnimationProvider>
        {children}
      </AnimationProvider>
    </SectionProvider>
  </LenisProvider>
)

// Mock scroll helpers
export const mockScrollTo = (progress: number) => {
  const maxScroll = document.body.scrollHeight - window.innerHeight
  Object.defineProperty(window, 'scrollY', { 
    value: maxScroll * progress 
  })
}
```

## 📊 Coverage Reports

### Coverage Targets

- **Statements**: 80%
- **Branches**: 80%  
- **Functions**: 80%
- **Lines**: 80%

### Generating Reports

```bash
# Generate coverage report
npm run test:coverage

# View coverage report
open coverage/lcov-report/index.html

# Coverage for specific files
npm test -- --collectCoverageFrom="hooks/**/*.ts" --coverage
```

## 🚨 Continuous Integration

### GitHub Actions Integration

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:coverage
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### Quality Gates

- ✅ All tests must pass
- ✅ Coverage thresholds must be met
- ✅ Performance budgets must be satisfied
- ✅ No TypeScript errors
- ✅ Linting must pass

## 🐛 Debugging Tests

### Common Issues

**Test Timeout**:
```bash
# Increase timeout
npm test -- --testTimeout=10000
```

**Memory Issues**:
```bash
# Run with more memory
NODE_OPTIONS="--max-old-space-size=4096" npm test
```

**Mock Issues**:
```javascript
// Clear mocks between tests
afterEach(() => {
  jest.clearAllMocks()
  jest.restoreAllMocks()
})
```

### Debug Tools

- Jest debugger: `npm test -- --detectOpenHandles`
- Playwright debug: `npx playwright test --debug`
- Coverage analysis: `npm run test:coverage`
- Performance profiling: Chrome DevTools

## 📈 Performance Monitoring

### Metrics Tracked

- **FPS**: Frame rate during scrolling
- **Memory**: JavaScript heap usage
- **LCP**: Largest Contentful Paint
- **CLS**: Cumulative Layout Shift
- **Animation Count**: Active animations
- **Bundle Size**: JavaScript payload

### Monitoring Dashboard

```typescript
// Performance monitoring hook
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState({
    fps: 60,
    memory: 0,
    animations: 0,
  })
  
  useEffect(() => {
    // Monitor performance metrics
    const monitor = new PerformanceMonitor()
    monitor.onUpdate(setMetrics)
    
    return () => monitor.destroy()
  }, [])
  
  return metrics
}
```

## 🎉 Best Practices

### Test Organization
- Group related tests in describe blocks
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Keep tests focused and isolated

### Performance Testing  
- Test on various devices and network conditions
- Monitor memory usage and cleanup
- Validate against performance budgets
- Use realistic user scenarios

### E2E Testing
- Test critical user journeys
- Use page object pattern for reusability
- Handle flaky tests with proper waits
- Test across multiple browsers

### Maintenance
- Keep tests up to date with feature changes
- Review and refactor tests regularly
- Monitor test execution time
- Update dependencies and configurations

This comprehensive testing strategy ensures the immersive scroll system delivers exceptional performance and user experience across all platforms and scenarios.