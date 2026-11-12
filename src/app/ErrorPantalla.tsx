// Si una pantalla falla al cargar o al dibujarse, en lugar de quedar en blanco se recarga una vez y, si sigue mal,
// se muestra un aviso con un botón para reintentar.
import { Component, type ReactNode } from 'react'
import { withTranslation, type WithTranslation } from 'react-i18next'
import Boton from '../components/ui/Boton'
import { esErrorDeModulo, recargarUnaVez } from './recarga'

interface Estado {
  fallo: boolean
}

class Frontera extends Component<WithTranslation & { children: ReactNode }, Estado> {
  state: Estado = { fallo: false }

  static getDerivedStateFromError(): Estado {
    return { fallo: true }
  }

  componentDidCatch(error: unknown) {
    if (esErrorDeModulo(error)) recargarUnaVez()
  }

  render() {
    if (!this.state.fallo) return this.props.children
    const { t } = this.props
    return (
      <main style={{ minHeight: '100dvh', display: 'grid', placeContent: 'center', justifyItems: 'center', gap: 16, padding: 24, textAlign: 'center' }}>
        <p role="alert" style={{ margin: 0, fontWeight: 700 }}>
          {t('comun.error')}
        </p>
        <Boton onClick={() => window.location.reload()}>{t('comun.recargar')}</Boton>
      </main>
    )
  }
}

const ErrorPantalla = withTranslation()(Frontera)
export default ErrorPantalla
