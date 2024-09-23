export enum FilmType {
  black_and_white = "Black and White",
  color = "Color",
  slide = "Slide",
}

export enum FilmFormat {
  _35mm = "35mm",
  _120 = "120",
}

export enum FilmEvent {
  acquired = "Acquired",
  used = "Used",
  developed = "Developed",
  received = "Received",
}

export type Event = {
  date: Date,
  event: FilmEvent,
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
  dx_code?: number,
  album_url?: string,
  device?: string,
}
