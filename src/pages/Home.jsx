import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getCategorias, getProductos } from '../hooks/useApi'
import ProductCard from '../components/ProductCard'

const iconos = { sets:'🌸', corsets:'🪢', lenceria:'✨', bodys:'🎀', accesorios:'💎' }

export default function Home() {
  const nav = useNavigate()
  const [categorias, setCategorias] = useState([])
  const [destacados, setDestacados] = useState([])

  useEffect(() => {
    async function load() {
      const [cats, prods] = await Promise.all([getCategorias(), getProductos()])
      setCategorias(cats)
      setDestacados(prods.filter(p => p.nuevo === 1))
    }
    load()
  }, [])