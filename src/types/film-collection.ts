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
  _600 = "600",
}

export interface Event {
  id: number;
  date: Date;
  event_type: string;
  location: string;
  notes: string;
};

export interface FilmEvent extends Event {
  film_ids: number[];
  camera_ids?: number[];
}

export interface FilmEntry {
  id: number;
  created_at: Date;
  date_acquired: Date;
  brand: string;
  name: string;
  source: string;
  iso: number;
  film_type: FilmType;
  film_format: FilmFormat;
  used: number;
  quantity: number;
  expiry_date?: string;
  dx_code?: string;
  album_url?: string;
  device?: string;
  notes?: string;
  rare?: boolean;
  latest_event?: {
    date: Date;
    event_type: string;
  };
  date_frozen?: Date;
};

export interface Camera {
  id: number;
  brand: string;
  model: string;
  serial_number?: string;
  date_acquired?: Date;
  date_sold?: Date;
  lens?: string;
  film_format?: FilmFormat;
  notes?: string;
}
