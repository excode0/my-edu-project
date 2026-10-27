export type IdentitySocialMedia = {
  instagram: string
  facebook: string
  youtube: string
  tiktok: string
  x: string
  linkedin: string
}

export type IdentityOperationalHour = {
  day: string
  open: string
  close: string
}

export type IdentityData = {
  name: string
  shortName: string
  level: string
  institutionStatus: string
  npsn: string
  nss: string
  accreditation: string
  foundedYear: string
  slogan: string
  headmaster: string
  vision: string
  mission: string
  history: string
  address: string
  village: string
  district: string
  city: string
  province: string
  postalCode: string
  latitude: string
  longitude: string
  phone: string
  whatsapp: string
  email: string
  website: string
  socialMedia: IdentitySocialMedia
  operationalHours: IdentityOperationalHour[]
  logoMediaId: string
  faviconMediaId: string
  heroMediaId: string
  updatedAt: string
}

export type IdentityMediaOption = {
  id: string
  title: string
  publicUrl: string
  mimeType: string
}
