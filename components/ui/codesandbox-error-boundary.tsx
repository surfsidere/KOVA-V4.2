"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class CodeSandboxErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('CodeSandbox Error Boundary caught an error:', error, errorInfo)
    this.setState({ error, errorInfo })
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-8">
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="text-3xl font-bold mb-4 text-red-400">
                🚨 Component Crashed
              </h1>
              <p className="text-lg mb-6 text-gray-300">
                The application encountered an error in CodeSandbox
              </p>
              
              {this.state.error && (
                <div className="bg-gray-800 rounded-lg p-4 mb-6 text-left">
                  <h3 className="text-xl font-semibold mb-2 text-yellow-400">Error Details:</h3>
                  <pre className="text-sm text-red-300 whitespace-pre-wrap overflow-auto">
                    {this.state.error.message}
                  </pre>
                </div>
              )}
              
              {this.state.errorInfo && (
                <div className="bg-gray-800 rounded-lg p-4 mb-6 text-left">
                  <h3 className="text-xl font-semibold mb-2 text-yellow-400">Component Stack:</h3>
                  <pre className="text-sm text-gray-400 whitespace-pre-wrap overflow-auto max-h-40">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </div>
              )}
              
              <div className="space-y-4">
                <button
                  onClick={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Try Again
                </button>
                
                <p className="text-sm text-gray-400">
                  This error boundary helps debug issues in CodeSandbox environment
                </p>
              </div>
            </div>
          </div>
        )
      )
    }

    return this.props.children
  }
}