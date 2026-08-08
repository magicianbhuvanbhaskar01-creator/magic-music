const CLOUDINARY_CLOUD_NAME =
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME

const CLOUDINARY_UPLOAD_PRESET =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

export async function uploadToCloudinary(file) {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error('Cloudinary configuration missing')
  }

  if (!file) {
    throw new Error('No audio file selected')
  }

  const MAX_SIZE = 200 * 1024 * 1024

  if (file.size > MAX_SIZE) {
    throw new Error('Audio file must be 200 MB or smaller')
  }

  // Audio files are uploaded as Cloudinary video resources
  const uploadUrl =
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`

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
      data?.error?.message ||
      'Cloudinary upload failed'
    )
  }

  return {
    secure_url: data.secure_url,
    public_id: data.public_id,
    bytes: data.bytes || file.size,
    duration: data.duration || 0,
    format: data.format || '',
    resource_type: data.resource_type || 'video'
  }
}
