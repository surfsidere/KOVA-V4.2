# 🏖️ CodeSandbox Integration Guide

This project is optimized for CodeSandbox development with automatic synchronization from GitHub.

## 🚀 Quick Start

1. **Automatic Setup**: When you open this project in CodeSandbox, it will automatically:
   - Install dependencies
   - Clean build artifacts
   - Start the development server
   - Configure VSCode extensions

2. **Direct Link**: [Open in CodeSandbox](https://codesandbox.io/p/github/surfsidere/Etheral_Depth/main)

## ⚡ Features

### Automatic Sync
- **GitHub Integration**: Changes pushed to main branch automatically appear in CodeSandbox
- **Real-time Updates**: No manual refresh needed
- **Branch Support**: Switch branches in CodeSandbox to see different versions

### Development Environment
- **VSCode Extensions**: Pre-configured with React, TypeScript, and Tailwind extensions
- **Auto-formatting**: Code formats on save with Prettier
- **Linting**: ESLint runs automatically
- **Git Integration**: GitLens and Git Graph for better version control

### Performance Optimizations
- **Clean Build**: Automatically cleans `.next` directory on startup
- **Hot Reload**: Instant updates when you make changes
- **Error Handling**: Better error messages and debugging

## 🛠️ Available Tasks

In CodeSandbox, you can run these tasks from the Command Palette (Cmd/Ctrl + Shift + P):

- **`dev`**: Start development server (runs automatically)
- **`build`**: Build for production
- **`clean`**: Clean build artifacts
- **`rebuild`**: Clean and rebuild project
- **`lint`**: Run ESLint
- **`test`**: Run Jest tests
- **`test:coverage`**: Run tests with coverage

## 🔧 Troubleshooting

### Build Errors
If you see "Cannot find module" errors:
1. Run the "Clean Build" task
2. Or manually run: `rm -rf .next && npm run dev`

### Sync Issues
If changes from GitHub aren't appearing:
1. Check the Git panel in CodeSandbox
2. Pull latest changes manually
3. Ensure you're on the correct branch

### Extensions Not Loading
1. Open Command Palette (Cmd/Ctrl + Shift + P)
2. Type "Developer: Reload Window"
3. Extensions will auto-install on reload

## 🎯 Development Workflow

1. **Make changes** in your local environment or directly in CodeSandbox
2. **Commit and push** to GitHub (automatically syncs to CodeSandbox)
3. **Preview instantly** - changes appear in CodeSandbox within seconds
4. **Share easily** - Send CodeSandbox link for instant collaboration

## 🌟 Tips

- Use `Cmd/Ctrl + Shift + P` to access all VSCode features
- The terminal supports all standard commands
- Hot reload works for all React components
- Tailwind classes have full IntelliSense support
- Git operations work seamlessly with GitHub

---

Happy coding! 🚀