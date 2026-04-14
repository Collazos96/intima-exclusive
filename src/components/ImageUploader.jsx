import { useState } from 'react'

const API = 'https://intima-exclusive-api.juanfecolla.workers.dev'

function getToken() {
  return sessionStorage.getItem('admin_token')
}

export default function ImageUploader({ onUpload }) {
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(null)

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
    setPreview(URL.createObjectURL(archivo))
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
      } else {
        setError(data.error || 'Error al subir la imagen.')
        setPreview(null)
      }
    } catch (err) {
      setError('Error de conexion al subir la imagen.')
      setPreview(null)
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
        id="file-upload"
        disabled={subiendo}
      />
      <label
        htmlFor="file-upload"
        className="flex flex-col items-center justify-center cursor-pointer gap-2">
        {preview ? (
          <img src={preview} alt="Preview" className="w-24 h-24 object-cover border border-[#D9C4A8]"/>
        ) : (
          <div className="w-24 h-24 bg-[#F5EDE0] flex items-center justify-center border border-[#D9C4A8]">
            <span className="font-sans text-[0.6rem] text-[#B09090] text-center tracking-wide uppercase">Seleccionar imagen</span>
          </div>
        )}
        <span className="font-sans text-[0.65rem] tracking-widest uppercase text-[#7A5A60]">
          {subiendo ? 'Subiendo...' : 'Clic para seleccionar'}
        </span>
        <span className="font-sans text-[0.6rem] text-[#B09090]">JPG, PNG o WEBP - Max 5MB</span>
      </label>
      {error && (
        <p className="font-sans text-[0.7rem] text-red-500 mt-2 text-center">{error}</p>
      )}
    </div>
  )
}