export enum FilmType {
  black_and_white,
  color,
  slide,
}

export enum FilmFormat {
  _35mm,
  _120,
}

export enum FilmEvent {
  acquired,
  used,
  developed,
  received,
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
}
