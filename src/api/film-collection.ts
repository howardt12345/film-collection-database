import { FilmEntry, Event, FilmEvent } from "@/types/film-collection";
import { supabase } from "./supabase";

type DateToString<T> = {
  [K in keyof T]: T[K] extends Date ? string : T[K];
};

type FilmEntryBase = Omit<
  FilmEntry,
  "created_at" | "date_acquired" | "latest_event"
>;
type FilmEntryResponse = DateToString<FilmEntryBase> & {
  created_at: string;
  date_acquired: string;
  film_entry_events: {
    film_events: DateToString<Event>;
  }[];
};

export const getFilmCollections = async (): Promise<FilmEntry[]> => {
  const { data, error } = await supabase
    .schema("film_collection")
    .from("film_entry")
    .select(
      `
      *,
      film_entry_events(
        film_events(
          id,
          date,
          event_type,
          notes
        )
      )
    `,
    )
    .order("date_acquired", { ascending: false })
    .returns<FilmEntryResponse[]>();

  if (error) throw error;

  return data.map((entry) => ({
    ...entry,
    latest_event:
      entry.film_entry_events
        ?.map((fee) => ({
          ...fee.film_events,
          date: new Date(fee.film_events.date),
        }))
        ?.filter(Boolean)
        ?.sort((a, b) => b.date.getTime() - a.date.getTime())[0] || null,
    created_at: new Date(entry.created_at),
    date_acquired: new Date(entry.date_acquired),
  }));
};

export const createFilmCollection = async (
  filmCollection: Omit<FilmEntry, "id" | "created_at">,
): Promise<FilmEntry> => {
  const { data, error } = await supabase
    .schema("film_collection")
    .from("film_entry")
    .insert([filmCollection])
    .select()
    .single();

  if (error) {
    console.error("Error creating film collection:", error);
    throw error;
  }

  return data;
};

export const updateFilmCollection = async (
  id: number,
  updatedData: Partial<FilmEntry>,
): Promise<FilmEntry> => {
  // Clean the data before sending to API
  const { film_entry_events, latest_event, created_at, ...cleanData } =
    updatedData as any;

  const { data, error } = await supabase
    .schema("film_collection")
    .from("film_entry")
    .update(cleanData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating film collection:", error);
    throw error;
  }

  return data;
};

export const deleteFilmCollection = async (id: number): Promise<void> => {
  // First delete all event links
  const { error: linkError } = await supabase
    .schema("film_collection")
    .from("film_entry_events")
    .delete()
    .eq("film_entry_id", id);

  if (linkError) throw linkError;

  // Then delete the film entry
  const { error } = await supabase
    .schema("film_collection")
    .from("film_entry")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting film collection:", error);
    throw error;
  }
};

export const getEvents = async (): Promise<FilmEvent[]> => {
  // First get all events
  const { data: events, error: eventsError } = await supabase
    .schema("film_collection")
    .from("film_events")
    .select("*");

  if (eventsError) throw eventsError;

  // Then get all film-event associations
  const { data: associations, error: associationsError } = await supabase
    .schema("film_collection")
    .from("film_entry_events")
    .select("*");

  if (associationsError) throw associationsError;

  // Map the associations to the events
  return events.map((event) => ({
    ...event,
    date: new Date(event.date),
    film_ids: associations
      .filter((assoc) => assoc.event_id === event.id)
      .map((assoc) => assoc.film_entry_id),
  }));
};

export const createFilmEvent = async (
  filmId: number,
  event: Omit<Event, "id">,
): Promise<Event> => {
  // Check if an identical "Acquired" event exists with matching date and location
  const { data: existingEvents } = await supabase
    .schema("film_collection")
    .from("film_events")
    .select("id")
    .eq("date", event.date)
    .eq("event_type", event.event_type)
    .eq("location", event.location)
    .eq("event_type", "Acquired");

  let eventId: number;

  if (existingEvents && existingEvents.length > 0) {
    // Use existing Acquired event
    eventId = existingEvents[0].id;
  } else {
    // Create new event
    const { data: newEvent, error: eventError } = await supabase
      .schema("film_collection")
      .from("film_events")
      .insert([
        {
          date: event.date,
          event_type: event.event_type,
          location: event.location,
          notes: event.notes,
        },
      ])
      .select()
      .single();

    if (eventError) throw eventError;
    eventId = newEvent.id;
  }

  // Create the link
  const { error: linkError } = await supabase
    .schema("film_collection")
    .from("film_entry_events")
    .insert([
      {
        film_entry_id: filmId,
        event_id: eventId,
      },
    ]);

  if (linkError) throw linkError;

  // Return the complete event
  const { data: eventData, error: fetchError } = await supabase
    .schema("film_collection")
    .from("film_events")
    .select()
    .eq("id", eventId)
    .single();

  if (fetchError) throw fetchError;
  return eventData;
};

export const updateEvent = async (
  eventId: number,
  event: Omit<Event, "id">,
): Promise<void> => {
  const { error } = await supabase
    .schema("film_collection")
    .from("film_events")
    .update({
      date: event.date,
      event_type: event.event_type,
      notes: event.notes,
    })
    .eq("id", eventId);

  if (error) throw error;
};

export const deleteFilmEvent = async (
  filmId: number,
  eventId: number,
): Promise<void> => {
  // First delete the link
  const { error: linkError } = await supabase
    .schema("film_collection")
    .from("film_entry_events")
    .delete()
    .eq("film_entry_id", filmId)
    .eq("event_id", eventId);

  if (linkError) throw linkError;

  // Check if event is still referenced by other films
  const { count } = await supabase
    .schema("film_collection")
    .from("film_entry_events")
    .select("*", { count: "exact" })
    .eq("event_id", eventId);

  // Delete event if no other references exist
  if (count === 0) {
    const { error: eventError } = await supabase
      .schema("film_collection")
      .from("film_events")
      .delete()
      .eq("id", eventId);

    if (eventError) throw eventError;
  }
};

export const addExistingEventToFilm = async (
  filmId: number,
  eventId: number,
): Promise<void> => {
  // Check if association already exists
  const { data: existing, error: checkError } = await supabase
    .schema("film_collection")
    .from("film_entry_events")
    .select("*")
    .eq("film_entry_id", filmId)
    .eq("event_id", eventId);

  if (checkError) throw checkError;
  if (existing && existing.length > 0) return; // Already exists

  // Create new association
  const { error } = await supabase
    .schema("film_collection")
    .from("film_entry_events")
    .insert([
      {
        film_entry_id: filmId,
        event_id: eventId,
      },
    ]);

  if (error) throw error;
};

export const editFilmsOnEvent = async (
  eventId: number,
  filmIds: number[],
): Promise<void> => {
  // First get current associations
  const { data: currentAssociations, error: fetchError } = await supabase
    .schema("film_collection")
    .from("film_entry_events")
    .select("film_entry_id")
    .eq("event_id", eventId);

  if (fetchError) throw fetchError;

  const currentFilmIds = currentAssociations.map((a) => a.film_entry_id);

  // Remove films that are no longer associated
  const filmsToRemove = currentFilmIds.filter((id) => !filmIds.includes(id));
  if (filmsToRemove.length > 0) {
    const { error: removeError } = await supabase
      .schema("film_collection")
      .from("film_entry_events")
      .delete()
      .eq("event_id", eventId)
      .in("film_entry_id", filmsToRemove);

    if (removeError) throw removeError;
  }

  // Add new film associations
  const filmsToAdd = filmIds.filter((id) => !currentFilmIds.includes(id));
  if (filmsToAdd.length > 0) {
    const { error: addError } = await supabase
      .schema("film_collection")
      .from("film_entry_events")
      .insert(
        filmsToAdd.map((filmId) => ({
          film_entry_id: filmId,
          event_id: eventId,
        })),
      );

    if (addError) throw addError;
  }
};

export const deleteEvent = async (eventId: number): Promise<void> => {
  // First delete all associations in film_entry_events
  const { error: linkError } = await supabase
    .schema("film_collection")
    .from("film_entry_events")
    .delete()
    .eq("event_id", eventId);

  if (linkError) throw linkError;

  // Then delete the event itself
  const { error: eventError } = await supabase
    .schema("film_collection")
    .from("film_events")
    .delete()
    .eq("id", eventId);

  if (eventError) throw eventError;
};

export const createEventWithoutFilm = async (
  event: Omit<Event, "id">,
): Promise<Event> => {
  const { data, error } = await supabase
    .schema("film_collection")
    .from("film_events")
    .insert([
      {
        date: event.date,
        event_type: event.event_type,
        location: event.location,
        notes: event.notes,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};
