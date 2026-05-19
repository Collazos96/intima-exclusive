import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { crearProducto, editarProducto, isAuthenticated } from '../../hooks/useAdmin'
import { getCategorias, getProducto } from '../../hooks/useApi'
import ImageUploader from '../../components/ImageUploader'

const TALLAS_DISPONIBLES = ['S', 'M', 'L', 'XL']
// Tallas extra disponibles por categoría (se agregan a los botones estándar)
const TALLAS_EXTRA = { tangas: ['Unica'] }
// Categorías con talla única y variantes de nombre libre (sin botones de talla)
const CATS_TALLA_UNICA = ['accesorios', 'pijamas']

const productoVacio = {
  id: '',
  nombre: '',
  precio: '',
  categoria_id: 'sets',
  nuevo: true,
  descripcion: '',
  imagenes: [],
  colores: [{ nombre: '', tallas: [] }],
}

export default function AdminProductoForm() {
  const nav = useNavigate()
  const { id } = useParams()
  const esEdicion = !!id

  const [form, setForm] = useState(productoVacio)
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(esEdicion)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')

  useEffect(() => {
    if (!isAuthenticated()) {
      nav('/admin/login')
      return
    }
    async function cargar() {
      const cats = await getCategorias()
      setCategorias(cats)
      if (esEdicion) {
        const prod = await getProducto(id)
        setForm({
          id: prod.id,
          nombre: prod.nombre,
          precio: prod.precio,
          categoria_id: prod.categoria_id,
          nuevo: prod.nuevo === 1,
          descripcion: prod.descripcion,
          imagenes: prod.imagenes.length > 0 ? prod.imagenes : [],
          colores: prod.colores.length > 0 ? prod.colores.map(c => ({
            nombre: c.nombre,
            tallas: c.tallas,
          })) : [{ nombre: '', tallas: [] }],
        })
        setLoadingData(false)
      }
    }
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  function handleCampo(campo, valor) {
    if (campo === 'categoria_id') {
      setForm(f => {
        const desdeUnica = CATS_TALLA_UNICA.includes(f.categoria_id)
        const haciaUnica = CATS_TALLA_UNICA.includes(valor)
        let colores = f.colores
        if (haciaUnica && !desdeUnica) {
          colores = [{ nombre: '', tallas: ['Unica'] }]
        } else if (!haciaUnica && desdeUnica) {
          colores = [{ nombre: '', tallas: [] }]
        }
        return { ...f, categoria_id: valor, colores }
      })
    } else {
      setForm(f => ({ ...f, [campo]: valor }))
    }
  }


  function handleImagen(index, valor) {
    const nuevas = [...form.imagenes]
    nuevas[index] = valor
    setForm(f => ({ ...f, imagenes: nuevas }))
  }

  function agregarImagen() {
    setForm(f => ({ ...f, imagenes: [...f.imagenes, ''] }))
  }

  function eliminarImagen(index) {
    const nuevas = form.imagenes.filter((_, i) => i !== index)
    setForm(f => ({ ...f, imagenes: nuevas }))
  }

  function handleImagenSubida(url) {
    setForm(f => ({ ...f, imagenes: [...f.imagenes, url] }))
  }

  function handleColorNombre(index, valor) {
    const nuevos = [...form.colores]
    nuevos[index] = { ...nuevos[index], nombre: valor }
    setForm(f => ({ ...f, colores: nuevos }))
  }

  function toggleTalla(colorIndex, talla) {
    const nuevos = [...form.colores]
    const tallas = nuevos[colorIndex].tallas
    if (tallas.includes(talla)) {
      nuevos[colorIndex].tallas = tallas.filter(t => t !== talla)
    } else {
      nuevos[colorIndex].tallas = [...tallas, talla]
    }
    setForm(f => ({ ...f, colores: nuevos }))
  }

  function agregarColor() {
    const esTallaUnica = CATS_TALLA_UNICA.includes(form.categoria_id)
    setForm(f => ({ ...f, colores: [...f.colores, { nombre: '', tallas: esTallaUnica ? ['Unica'] : [] }] }))
  }

  function eliminarColor(index) {
    const nuevos = form.colores.filter((_, i) => i !== index)
    setForm(f => ({ ...f, colores: nuevos.length > 0 ? nuevos : [{ nombre: '', tallas: [] }] }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setExito('')

    if (!form.id && !esEdicion) {
      setError('El ID del producto es obligatorio.')
      return
    }
    if (form.imagenes.filter(i => i.trim()).length === 0) {
      setError('Debes agregar al menos una imagen.')
      return
    }
    const esTallaUnica = CATS_TALLA_UNICA.includes(form.categoria_id)
    if (esTallaUnica) {
      if (form.colores.length === 0) {
        setError('Agrega al menos una variante.')
        return
      }
      if (form.colores.some(c => !c.nombre.trim())) {
        setError('Todas las variantes deben tener nombre.')
        return
      }
    } else {
      if (form.colores.some(c => !c.nombre.trim())) {
        setError('Todos los colores deben tener nombre.')
        return
      }
      if (form.colores.some(c => c.tallas.length === 0)) {
        setError('Cada color debe tener al menos una talla seleccionada.')
        return
      }
    }

    setLoading(true)
    const payload = {
      ...form,
      precio: parseInt(form.precio),
      imagenes: form.imagenes.filter(i => i.trim()),
      // Talla única: garantizar 'Unica' en todas las variantes
      colores: esTallaUnica
        ? form.colores.map(c => ({ ...c, tallas: ['Unica'] }))
        : form.colores,
    }

    try {
      const resultado = esEdicion
        ? await editarProducto(id, payload)
        : await crearProducto(payload)

      if (resultado?.error) {
        setError(resultado.error)
      } else {
        setExito(esEdicion ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.')
        setTimeout(() => nav('/admin'), 1500)
      }
    } catch (err) {
      setError(err.message || 'Ocurrió un error al guardar el producto.')
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) return (
    <div className="min-h-screen flex items-center justify-center bg-cream-100">
      <p className="font-serif italic text-gold-500">Cargando producto...</p>
    </div>
  )

  return (
    <main className="min-h-screen bg-cream-100 pt-[70px]">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-2xl text-wine-800">
              {esEdicion ? 'Editar producto' : 'Nuevo producto'}
            </h1>
            <p className="font-sans text-[0.75rem] text-taupe-600 tracking-wide mt-1">
              {esEdicion ? `Editando: ${form.nombre}` : 'Completa los campos para agregar un producto'}
            </p>
          </div>
          <button
            onClick={() => nav('/admin')}
            className="border border-gold-300 text-taupe-600 px-5 py-2 font-sans text-[0.68rem] tracking-widest uppercase hover:border-wine-600 hover:text-wine-600 transition-colors">
            Volver
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 font-sans text-sm px-4 py-3 mb-6">
            {error}
          </div>
        )}
        {exito && (
          <div className="bg-green-50 border border-green-200 text-green-700 font-sans text-sm px-4 py-3 mb-6">
            {exito}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">

          <div className="bg-white border border-gold-300 p-6">
            <h2 className="font-sans text-[0.68rem] tracking-widest uppercase text-taupe-600 mb-5 pb-3 border-b border-cream-200">
              Datos basicos
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {!esEdicion && (
                <div>
                  <label className="block font-sans text-[0.65rem] tracking-widest uppercase text-taupe-600 mb-2">ID del producto</label>
                  <input
                    type="text"
                    value={form.id}
                    onChange={e => handleCampo('id', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    className="w-full border border-gold-300 px-3 py-2.5 font-sans text-sm text-wine-900 outline-none focus:border-wine-600"
                    placeholder="ej: set-carmina"
                    required
                  />
                  <p className="font-sans text-[0.6rem] text-taupe-400 mt-1">Solo letras minusculas y guiones. No se puede cambiar despues.</p>
                </div>
              )}
              <div>
                <label className="block font-sans text-[0.65rem] tracking-widest uppercase text-taupe-600 mb-2">Nombre</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={e => handleCampo('nombre', e.target.value)}
                  className="w-full border border-gold-300 px-3 py-2.5 font-sans text-sm text-wine-900 outline-none focus:border-wine-600"
                  placeholder="ej: Set Carmina"
                  required
                />
              </div>
              <div>
                <label className="block font-sans text-[0.65rem] tracking-widest uppercase text-taupe-600 mb-2">Precio (COP)</label>
                <input
                  type="number"
                  value={form.precio}
                  onChange={e => handleCampo('precio', e.target.value)}
                  className="w-full border border-gold-300 px-3 py-2.5 font-sans text-sm text-wine-900 outline-none focus:border-wine-600"
                  placeholder="ej: 189000"
                  required
                />
              </div>
              <div>
                <label className="block font-sans text-[0.65rem] tracking-widest uppercase text-taupe-600 mb-2">Categoria</label>
                <select
                  value={form.categoria_id}
                  onChange={e => handleCampo('categoria_id', e.target.value)}
                  className="w-full border border-gold-300 px-3 py-2.5 font-sans text-sm text-wine-900 outline-none focus:border-wine-600 bg-white">
                  {categorias.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="nuevo"
                  checked={form.nuevo}
                  onChange={e => handleCampo('nuevo', e.target.checked)}
                  className="w-4 h-4 accent-wine-600"
                />
                <label htmlFor="nuevo" className="font-sans text-[0.72rem] tracking-widest uppercase text-taupe-600 cursor-pointer">
                  Marcar como nuevo
                </label>
              </div>
            </div>
            <div className="mt-5">
              <label className="block font-sans text-[0.65rem] tracking-widest uppercase text-taupe-600 mb-2">Descripcion</label>
              <textarea
                value={form.descripcion}
                onChange={e => handleCampo('descripcion', e.target.value)}
                rows={4}
                className="w-full border border-gold-300 px-3 py-2.5 font-sans text-sm text-wine-900 outline-none focus:border-wine-600 resize-none"
                placeholder="Describe el producto..."
                required
              />
            </div>
          </div>

          {/* IMAGENES */}
          <div className="bg-white border border-gold-300 p-6">
            <h2 className="font-sans text-[0.68rem] tracking-widest uppercase text-taupe-600 mb-5 pb-3 border-b border-cream-200">
              Imagenes
            </h2>
            <p className="font-sans text-[0.72rem] text-taupe-400 mb-4">
              Sube imagenes directamente o ingresa una URL de Cloudflare R2.
            </p>
            <div className="mb-5">
              <p className="font-sans text-[0.65rem] tracking-widest uppercase text-taupe-600 mb-3">Subir nueva imagen</p>
              <ImageUploader onUpload={handleImagenSubida}/>
            </div>
            <div className="space-y-3">
              <p className="font-sans text-[0.65rem] tracking-widest uppercase text-taupe-600 mb-2">Imagenes agregadas</p>
              {form.imagenes.filter(i => i.trim()).length === 0 ? (
                <p className="font-sans text-[0.72rem] text-taupe-400 italic">No hay imagenes agregadas aun.</p>
              ) : (
                form.imagenes.map((img, i) => (
                  img.trim() ? (
                    <div key={i} className="flex gap-3 items-center border border-cream-200 p-2">
                      <span className="font-sans text-[0.62rem] text-taupe-400 w-5">{i + 1}</span>
                      <img src={img} alt="" className="w-12 h-12 object-cover border border-gold-300" onError={e => e.target.style.display='none'}/>
                      <input
                        type="url"
                        value={img}
                        onChange={e => handleImagen(i, e.target.value)}
                        className="flex-1 border border-gold-300 px-3 py-2 font-sans text-[0.72rem] text-wine-900 outline-none focus:border-wine-600"
                      />
                      <button
                        type="button"
                        onClick={() => eliminarImagen(i)}
                        className="border border-red-200 text-red-400 px-3 py-2 font-sans text-[0.6rem] tracking-widest uppercase hover:bg-red-50 transition-colors">
                        Eliminar
                      </button>
                    </div>
                  ) : null
                ))
              )}
            </div>
            <button
              type="button"
              onClick={agregarImagen}
              className="mt-4 border border-gold-300 text-taupe-600 px-4 py-2 font-sans text-[0.65rem] tracking-widest uppercase hover:border-wine-600 hover:text-wine-600 transition-colors">
              + Agregar URL manualmente
            </button>
          </div>

          {/* COLORES Y TALLAS / TIPOS ACCESORIOS */}
          <div className="bg-white border border-gold-300 p-6">
            <h2 className="font-sans text-[0.68rem] tracking-widest uppercase text-taupe-600 mb-1 pb-3 border-b border-cream-200">
              {form.categoria_id === 'pijamas' ? 'Diseños disponibles' : form.categoria_id === 'accesorios' ? 'Variantes disponibles' : 'Colores y tallas'}
            </h2>

            {CATS_TALLA_UNICA.includes(form.categoria_id) ? (
              <>
                <p className="font-sans text-[0.72rem] text-taupe-400 mb-5 mt-3">
                  Talla única. Agrega cada variante por nombre
                  {form.categoria_id === 'pijamas' ? ' (ej: Flores rosas, Lunares, Rayas azules)' : form.categoria_id === 'tangas' ? ' (ej: Negro, Rojo, Nude, Blanco)' : ' (ej: Antifaz Negro, Liguero Rojo, Malla Blanca)'}.
                </p>
                <div className="space-y-3">
                  {form.colores.map((variante, ci) => (
                    <div key={ci} className="flex gap-3 items-center border border-cream-200 p-3">
                      <span className="font-sans text-[0.62rem] text-taupe-400 w-5">{ci + 1}</span>
                      <input
                        type="text"
                        value={variante.nombre}
                        onChange={e => handleColorNombre(ci, e.target.value)}
                        className="flex-1 border border-gold-300 px-3 py-2 font-sans text-sm text-wine-900 outline-none focus:border-wine-600"
                        placeholder={form.categoria_id === 'pijamas' ? 'Nombre del diseño (ej: Flores rosas)' : form.categoria_id === 'tangas' ? 'Color o variante (ej: Negro, Rojo, Nude)' : 'Nombre de la variante (ej: Antifaz Negro)'}
                      />
                      <button
                        type="button"
                        onClick={() => eliminarColor(ci)}
                        className="border border-red-200 text-red-400 px-3 py-2 font-sans text-[0.6rem] tracking-widest uppercase hover:bg-red-50 transition-colors">
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={agregarColor}
                  className="mt-4 border border-gold-300 text-taupe-600 px-4 py-2 font-sans text-[0.65rem] tracking-widest uppercase hover:border-wine-600 hover:text-wine-600 transition-colors">
                  + Agregar variante
                </button>
              </>
            ) : (
              <>
                <div className="space-y-5 mt-5">
                  {form.colores.map((color, ci) => (
                    <div key={ci} className="border border-cream-200 p-4">
                      <div className="flex gap-3 items-center mb-4">
                        <input
                          type="text"
                          value={color.nombre}
                          onChange={e => handleColorNombre(ci, e.target.value)}
                          className="flex-1 border border-gold-300 px-3 py-2 font-sans text-sm text-wine-900 outline-none focus:border-wine-600"
                          placeholder="Nombre del color (ej: Rojo)"
                        />
                        <button
                          type="button"
                          onClick={() => eliminarColor(ci)}
                          className="border border-red-200 text-red-400 px-3 py-2 font-sans text-[0.6rem] tracking-widest uppercase hover:bg-red-50 transition-colors">
                          Eliminar
                        </button>
                      </div>
                      <div>
                        <p className="font-sans text-[0.62rem] tracking-widest uppercase text-taupe-400 mb-2">Tallas disponibles</p>
                        <div className="flex gap-2 flex-wrap">
                          {[...TALLAS_DISPONIBLES, ...(TALLAS_EXTRA[form.categoria_id] ?? [])].map(t => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => toggleTalla(ci, t)}
                              className={`px-3 h-11 font-sans text-[0.75rem] border-2 transition-all ${
                                color.tallas.includes(t)
                                  ? 'border-wine-600 bg-wine-600 text-cream-200'
                                  : 'border-gold-300 text-taupe-600 hover:border-wine-600'
                              }`}>
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={agregarColor}
                  className="mt-4 border border-gold-300 text-taupe-600 px-4 py-2 font-sans text-[0.65rem] tracking-widest uppercase hover:border-wine-600 hover:text-wine-600 transition-colors">
                  + Agregar color
                </button>
              </>
            )}
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => nav('/admin')}
              className="border border-gold-300 text-taupe-600 px-8 py-3 font-sans text-[0.68rem] tracking-widest uppercase hover:border-wine-600 transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-wine-600 text-cream-200 px-8 py-3 font-sans text-[0.68rem] tracking-widest uppercase hover:bg-wine-800 transition-colors disabled:opacity-50">
              {loading ? 'Guardando...' : esEdicion ? 'Actualizar producto' : 'Crear producto'}
            </button>
          </div>

        </form>
      </div>
    </main>
  )
}