const CLOUDINARY_CLOUD_NAME = 'u3elvi6g'
const CLOUDINARY_UPLOAD_PRESET = 'magic_music'

export async function uploadToCloudinary(file) {
  if (!file) {
    throw new Error('No audio file selected')
  }

  if (file.size > 200 * 1024 * 1024) {
    throw new Error('Audio file is larger than 200 MB')
  }

  const uploadUrl =
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`

  const formData = new FormData()

  formData.append('file', file)
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
  formData.append('folder', 'magic-music')

  const response = await fetch(uploadUrl, {
    method: 'POST',
    body: formData
  })

  const data = await response.json()

  if (!response.ok || !data.secure_url) {
    throw new Error(
      data?.error?.message || 'Cloudinary upload failed'
    )
  }

  return {
    secure_url: data.secure_url,
    public_id: data.public_id,
    bytes: data.bytes,
    format: data.format,
    duration: data.duration || 0
  }
}
