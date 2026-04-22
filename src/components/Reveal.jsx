import { useInView } from '../lib/useInView'

/**
 * Envoltorio que hace fade-in + slide-up cuando entra al viewport.
 *
 * Props:
 *   delay (ms)   — retraso antes de animar
 *   as           — etiqueta HTML (default 'div')
 *   className    — clases extra
 */
export default function Reveal({ children, delay = 0, as: Tag = 'div', className = '', ...rest }) {
  const [ref, inView] = useInView()
  const style = {
    transitionDelay: inView ? `${delay}ms` : '0ms',
  }
  return (
    <Tag
      ref={ref}
      className={`transition-all duration-700 ease-out ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${className}`}
      style={style}
      {...rest}
    >
      {children}
    </Tag>
  )
}
