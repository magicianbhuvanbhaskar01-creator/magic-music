export async function uploadToCloudinary(file){
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
  if(!cloudName || !preset) throw new Error('Cloudinary config missing in .env')

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`
  const fd = new FormData()
  fd.append('file', file)
  fd.append('upload_preset', preset)

  const res = await fetch(url, { method: 'POST', body: fd })
  if(!res.ok) throw new Error('Upload failed')
  const data = await res.json()
  return data // contains secure_url, public_id, bytes, etc.
}
