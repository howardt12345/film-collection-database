export enum FilmType {
  black_and_white = "Black and white",
  color = "Color",
  slide = "Slide",
  polaroid = "Polaroid",
  instax = "Instax",
}

export enum FilmFormat {
  _35mm = "35mm",
  _120 = "120",
  _600 = "600"
}

export type Event = {
  id: string,
  date: Date,
  event: string,
  notes: string
}

export type FilmCollection = {
  id: number,
  created_at: Date,
  name: string,
  brand: string,
  film_type: FilmType,
  film_format: FilmFormat,
  iso: number,
  date_acquired: Date,
  expiry_date?: string,
  source: string,
  event_log?: Event[],
  dx_code?: string,
  album_url?: string,
  device?: string,
  notes?: string,
  used?: boolean
}
