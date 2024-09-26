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
  date_acquired: Date,
  brand: string,
  name: string,
  source: string,
  iso: number,
  film_type: FilmType,
  film_format: FilmFormat,
  used: number,
  quantity: number,
  expiry_date?: string,
  event_log?: Event[],
  dx_code?: string,
  album_url?: string,
  device?: string,
  notes?: string,
}
