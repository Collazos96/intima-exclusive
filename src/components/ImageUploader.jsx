import { useState, useId } from 'react'

const API = 'https://intima-exclusive-api.juanfecolla.workers.dev'

function getToken() {
  return sessionStorage.getItem('admin_token')
}

export default function ImageUploader({ onUpload }) {
  const uid = useId()
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)

  async function handleArchivo(e) {
    const archivo = e.target.files[0]
    if (!archivo) return

    const permitidas = ['image/jpeg', 'image/png', 'image/webp']
    if (!permitidas.includes(archivo.type)) {
      setError('Formato no permitido. Usa JPG, PNG o WEBP.')
      return
    }

    if (archivo.size > 5 * 1024 * 1024) {
      setError('El archivo no puede superar 5MB.')
      return
    }

    setError('')
    setExito(false)
    setSubiendo(true)

    const formData = new FormData()
    formData.append('file', archivo)

    try {
      const res = await fetch(`${API}/api/admin/imagenes/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
        },
        body: formData,
      })

      const data = await res.json()

      if (data.ok) {
        onUpload(data.url)
        setExito(true)
      } else {
        setError(data.error || 'Error al subir la imagen.')
      }
    } catch (err) {
      setError('Error de conexion al subir la imagen.')
    }

    setSubiendo(false)
  }

  return (
    <div className="border border-dashed border-[#D9C4A8] p-4 hover:border-[#7B1A2E] transition-colors">
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleArchivo}
        className="hidden"
        id={uid}
        disabled={subiendo}
      />
      <label
        htmlFor={uid}
        className="flex flex-col items-center justify-center cursor-pointer gap-2">
        <div className={`w-24 h-24 flex items-center justify-center border ${exito ? 'border-[#7B1A2E] bg-[#F5EDE0]' : 'border-[#D9C4A8] bg-[#F5EDE0]'}`}>
          <span className="font-sans text-[0.6rem] text-[#B09090] text-center tracking-wide uppercase px-1">
            {subiendo ? 'Subiendo...' : exito ? 'Imagen subida' : 'Seleccionar imagen'}
          </span>
        </div>
        <span className="font-sans text-[0.65rem] tracking-widest uppercase text-[#7A5A60]">
          {subiendo ? 'Procesando...' : 'Clic para seleccionar'}
        </span>
        <span className="font-sans text-[0.6rem] text-[#B09090]">JPG, PNG o WEBP - Max 5MB</span>
      </label>
      {error && (
        <p className="font-sans text-[0.7rem] text-red-500 mt-2 text-center">{error}</p>
      )}
      {exito && (
        <p className="font-sans text-[0.7rem] text-green-600 mt-2 text-center">Imagen subida correctamente.</p>
      )}
    </div>
  )
}