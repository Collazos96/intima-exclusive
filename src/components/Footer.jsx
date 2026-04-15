import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-wine-800 py-10 px-8 text-center">
      <span className="block font-serif font-bold text-cream-200 tracking-widest uppercase text-base">Íntima</span>
      <span className="block font-serif italic text-gold-300 text-sm mb-5">Exclusive</span>
      <ul className="flex gap-5 justify-center flex-wrap mb-6">
        <li><a href="https://www.instagram.com/intima_exclusive?igsh=MXFxcnFlc25ub3VyOA==" target="_blank" className="font-sans text-[0.65rem] tracking-widest uppercase text-gold-300 hover:text-cream-200 transition-colors">Instagram</a></li>
        <li><a href="https://wa.me/573028556022" target="_blank" className="font-sans text-[0.65rem] tracking-widest uppercase text-gold-300 hover:text-cream-200 transition-colors">WhatsApp</a></li>
        <li><Link to="/politica" className="font-sans text-[0.65rem] tracking-widest uppercase text-gold-300 hover:text-cream-200 transition-colors">Política de cambios</Link></li>
        <li><Link to="/faq" className="font-sans text-[0.65rem] tracking-widest uppercase text-gold-300 hover:text-cream-200 transition-colors">Preguntas frecuentes</Link></li>
        <li><a href="https://wa.me/573028556022" target="_blank" className="font-sans text-[0.65rem] tracking-widest uppercase text-gold-300 hover:text-cream-200 transition-colors">+57 302 855 6022</a></li>
      </ul>
      <p className="font-sans text-[0.65rem] text-white/25 tracking-wide">© 2026 Íntima Exclusive · Delicadeza que empodera</p>
    </footer>
  )
}