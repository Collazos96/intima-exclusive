import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { crearProducto, editarProducto, isAuthenticated } from '../../hooks/useAdmin'
import { getCategorias, getProducto } from '../../hooks/useApi'
import ImageUploader from '../../components/ImageUploader'

const TALLAS_DISPONIBLES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL']

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
  }, [id])

  function handleCampo(campo, valor) {
    setForm(f => ({ ...f, [campo]: valor }))
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
    setForm(f => ({ ...f, colores: [...f.colores, { nombre: '', tallas: [] }] }))
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
    if (form.colores.some(c => !c.nombre.trim())) {
      setError('Todos los colores deben tener nombre.')
      return
    }
    if (form.colores.some(c => c.tallas.length === 0)) {
      setError('Cada color debe tener al menos una talla seleccionada.')
      return
    }

    setLoading(true)
    const payload = {
      ...form,
      precio: parseInt(form.precio),
      imagenes: form.imagenes.filter(i => i.trim()),
    }

    const resultado = esEdicion
      ? await editarProducto(id, payload)
      : await crearProducto(payload)

    if (resultado.error) {
      setError('Ocurrio un error al guardar el producto.')
    } else {
      setExito(esEdicion ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.')
      setTimeout(() => nav('/admin'), 1500)
    }
    setLoading(false)
  }

  if (loadingData) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF5EE]">
      <p className="font-serif italic text-[#C4A882]">Cargando producto...</p>
    </div>
  )

  return (
    <main className="min-h-screen bg-[#FAF5EE] pt-[70px]">
      <div className="max-w-3xl mx-auto px-8 py-10">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-2xl text-[#4E0F1C]">
              {esEdicion ? 'Editar producto' : 'Nuevo producto'}
            </h1>
            <p className="font-sans text-[0.75rem] text-[#7A5A60] tracking-wide mt-1">
              {esEdicion ? `Editando: ${form.nombre}` : 'Completa los campos para agregar un producto'}
            </p>
          </div>
          <button
            onClick={() => nav('/admin')}
            className="border border-[#D9C4A8] text-[#7A5A60] px-5 py-2 font-sans text-[0.68rem] tracking-widest uppercase hover:border-[#7B1A2E] hover:text-[#7B1A2E] transition-colors">
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

          <div className="bg-white border border-[#D9C4A8] p-6">
            <h2 className="font-sans text-[0.68rem] tracking-widest uppercase text-[#7A5A60] mb-5 pb-3 border-b border-[#F5EDE0]">
              Datos basicos
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {!esEdicion && (
                <div>
                  <label className="block font-sans text-[0.65rem] tracking-widest uppercase text-[#7A5A60] mb-2">ID del producto</label>
                  <input
                    type="text"
                    value={form.id}
                    onChange={e => handleCampo('id', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    className="w-full border border-[#D9C4A8] px-3 py-2.5 font-sans text-sm text-[#3A1A20] outline-none focus:border-[#7B1A2E]"
                    placeholder="ej: set-carmina"
                    required
                  />
                  <p className="font-sans text-[0.6rem] text-[#B09090] mt-1">Solo letras minusculas y guiones. No se puede cambiar despues.</p>
                </div>
              )}
              <div>
                <label className="block font-sans text-[0.65rem] tracking-widest uppercase text-[#7A5A60] mb-2">Nombre</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={e => handleCampo('nombre', e.target.value)}
                  className="w-full border border-[#D9C4A8] px-3 py-2.5 font-sans text-sm text-[#3A1A20] outline-none focus:border-[#7B1A2E]"
                  placeholder="ej: Set Carmina"
                  required
                />
              </div>
              <div>
                <label className="block font-sans text-[0.65rem] tracking-widest uppercase text-[#7A5A60] mb-2">Precio (COP)</label>
                <input
                  type="number"
                  value={form.precio}
                  onChange={e => handleCampo('precio', e.target.value)}
                  className="w-full border border-[#D9C4A8] px-3 py-2.5 font-sans text-sm text-[#3A1A20] outline-none focus:border-[#7B1A2E]"
                  placeholder="ej: 189000"
                  required
                />
              </div>
              <div>
                <label className="block font-sans text-[0.65rem] tracking-widest uppercase text-[#7A5A60] mb-2">Categoria</label>
                <select
                  value={form.categoria_id}
                  onChange={e => handleCampo('categoria_id', e.target.value)}
                  className="w-full border border-[#D9C4A8] px-3 py-2.5 font-sans text-sm text-[#3A1A20] outline-none focus:border-[#7B1A2E] bg-white">
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
                  className="w-4 h-4 accent-[#7B1A2E]"
                />
                <label htmlFor="nuevo" className="font-sans text-[0.72rem] tracking-widest uppercase text-[#7A5A60] cursor-pointer">
                  Marcar como nuevo
                </label>
              </div>
            </div>
            <div className="mt-5">
              <label className="block font-sans text-[0.65rem] tracking-widest uppercase text-[#7A5A60] mb-2">Descripcion</label>
              <textarea
                value={form.descripcion}
                onChange={e => handleCampo('descripcion', e.target.value)}
                rows={4}
                className="w-full border border-[#D9C4A8] px-3 py-2.5 font-sans text-sm text-[#3A1A20] outline-none focus:border-[#7B1A2E] resize-none"
                placeholder="Describe el producto..."
                required
              />
            </div>
          </div>

          {/* IMAGENES */}
          <div className="bg-white border border-[#D9C4A8] p-6">
            <h2 className="font-sans text-[0.68rem] tracking-widest uppercase text-[#7A5A60] mb-5 pb-3 border-b border-[#F5EDE0]">
              Imagenes
            </h2>
            <p className="font-sans text-[0.72rem] text-[#B09090] mb-4">
              Sube imagenes directamente o ingresa una URL de Cloudflare R2.
            </p>
            <div className="mb-5">
              <p className="font-sans text-[0.65rem] tracking-widest uppercase text-[#7A5A60] mb-3">Subir nueva imagen</p>
              <ImageUploader onUpload={handleImagenSubida}/>
            </div>
            <div className="space-y-3">
              <p className="font-sans text-[0.65rem] tracking-widest uppercase text-[#7A5A60] mb-2">Imagenes agregadas</p>
              {form.imagenes.filter(i => i.trim()).length === 0 ? (
                <p className="font-sans text-[0.72rem] text-[#B09090] italic">No hay imagenes agregadas aun.</p>
              ) : (
                form.imagenes.map((img, i) => (
                  img.trim() ? (
                    <div key={i} className="flex gap-3 items-center border border-[#F5EDE0] p-2">
                      <span className="font-sans text-[0.62rem] text-[#B09090] w-5">{i + 1}</span>
                      <img src={img} alt="" className="w-12 h-12 object-cover border border-[#D9C4A8]" onError={e => e.target.style.display='none'}/>
                      <input
                        type="url"
                        value={img}
                        onChange={e => handleImagen(i, e.target.value)}
                        className="flex-1 border border-[#D9C4A8] px-3 py-2 font-sans text-[0.72rem] text-[#3A1A20] outline-none focus:border-[#7B1A2E]"
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
              className="mt-4 border border-[#D9C4A8] text-[#7A5A60] px-4 py-2 font-sans text-[0.65rem] tracking-widest uppercase hover:border-[#7B1A2E] hover:text-[#7B1A2E] transition-colors">
              + Agregar URL manualmente
            </button>
          </div>

          {/* COLORES Y TALLAS */}
          <div className="bg-white border border-[#D9C4A8] p-6">
            <h2 className="font-sans text-[0.68rem] tracking-widest uppercase text-[#7A5A60] mb-5 pb-3 border-b border-[#F5EDE0]">
              Colores y tallas
            </h2>
            <div className="space-y-5">
              {form.colores.map((color, ci) => (
                <div key={ci} className="border border-[#F5EDE0] p-4">
                  <div className="flex gap-3 items-center mb-4">
                    <input
                      type="text"
                      value={color.nombre}
                      onChange={e => handleColorNombre(ci, e.target.value)}
                      className="flex-1 border border-[#D9C4A8] px-3 py-2 font-sans text-sm text-[#3A1A20] outline-none focus:border-[#7B1A2E]"
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
                    <p className="font-sans text-[0.62rem] tracking-widest uppercase text-[#B09090] mb-2">Tallas disponibles</p>
                    <div className="flex gap-2 flex-wrap">
                      {TALLAS_DISPONIBLES.map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => toggleTalla(ci, t)}
                          className={`w-11 h-11 font-sans text-[0.75rem] border-2 transition-all ${
                            color.tallas.includes(t)
                              ? 'border-[#7B1A2E] bg-[#7B1A2E] text-[#F5EDE0]'
                              : 'border-[#D9C4A8] text-[#7A5A60] hover:border-[#7B1A2E]'
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
              className="mt-4 border border-[#D9C4A8] text-[#7A5A60] px-4 py-2 font-sans text-[0.65rem] tracking-widest uppercase hover:border-[#7B1A2E] hover:text-[#7B1A2E] transition-colors">
              + Agregar color
            </button>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => nav('/admin')}
              className="border border-[#D9C4A8] text-[#7A5A60] px-8 py-3 font-sans text-[0.68rem] tracking-widest uppercase hover:border-[#7B1A2E] transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#7B1A2E] text-[#F5EDE0] px-8 py-3 font-sans text-[0.68rem] tracking-widest uppercase hover:bg-[#4E0F1C] transition-colors disabled:opacity-50">
              {loading ? 'Guardando...' : esEdicion ? 'Actualizar producto' : 'Crear producto'}
            </button>
          </div>

        </form>
      </div>
    </main>
  )
}