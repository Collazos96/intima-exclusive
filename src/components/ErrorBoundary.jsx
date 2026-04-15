import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary', error, info)
  }

  reset = () => this.setState({ error: null })

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center px-6 bg-cream-100">
          <div className="max-w-md text-center">
            <h1 className="font-serif text-2xl text-wine-900 mb-3">Algo salió mal</h1>
            <p className="text-taupe-600 mb-6">
              Ocurrió un error inesperado. Puedes intentar de nuevo.
            </p>
            <button
              onClick={() => { this.reset(); window.location.reload() }}
              className="px-6 py-2 bg-wine-600 hover:bg-wine-800 text-white font-sans tracking-widest uppercase text-xs transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
