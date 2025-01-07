import { FilmEntry, Event } from "@/types/film-collection";
import { supabase } from "./supabase";

export const getFilmCollections = async (): Promise<FilmEntry[]> => {
  const { data, error } = await supabase
    .schema("film_collection")
    .from("film_entry")
    .select(`
      *,
      latest_event:film_entry_events(
        event:film_events(
          date,
          event_type
        )
      )
    `)
    .order("date", { ascending: false, foreignTable: "film_entry_events.event" })
    .limit(1, { foreignTable: "film_entry_events" });

  if (error) {
    console.error("Error fetching film collections:", error);
    throw error;
  }

  // Transform the data to match FilmEntry type
  return data.map(item => ({
    ...item,
    latest_event: item.latest_event?.[0]?.event ? {
      date: new Date(item.latest_event[0].event.date),
      event_type: item.latest_event[0].event.event_type
    } : undefined,
    created_at: new Date(item.created_at),
    date_acquired: new Date(item.date_acquired)
  }));
};


export const createFilmCollection = async (
  filmCollection: Omit<FilmEntry, "id" | "created_at">
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
  updatedData: Partial<FilmEntry>
): Promise<FilmEntry> => {
  const { data, error } = await supabase
    .schema("film_collection")
    .from("film_entry")
    .update(updatedData)
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

export const getFilmEvents = async (filmId: number): Promise<Event[]> => {
  const { data, error } = await supabase
    .schema("film_collection")
    .from("film_entry_events")
    .select(`
      event:film_events(
        id,
        date,
        event_type,
        notes
      )
    `)
    .eq("film_entry_id", filmId)
    .order("date", { foreignTable: "film_events", ascending: false });

  if (error) {
    console.error("Error fetching film events:", error);
    throw error;
  }

  return data.flatMap(row => row.event);
};

export const createFilmEvent = async (
  filmId: number,
  event: Omit<Event, "id">
): Promise<Event> => {
  // Check if an identical event already exists
  const { data: existingEvents } = await supabase
    .schema("film_collection")
    .from("film_events")
    .select("id")
    .eq("date", event.date)
    .eq("event_type", event.event_type);

  let eventId: number;

  if (existingEvents && existingEvents.length > 0) {
    // Use existing event
    eventId = existingEvents[0].id;
  } else {
    // Create new event
    const { data: newEvent, error: eventError } = await supabase
      .schema("film_collection")
      .from("film_events")
      .insert([{
        date: event.date,
        event_type: event.event_type,
        notes: event.notes
      }])
      .select()
      .single();

    if (eventError) throw eventError;
    eventId = newEvent.id;
  }

  // Create the link
  const { error: linkError } = await supabase
    .schema("film_collection")
    .from("film_entry_events")
    .insert([{
      film_entry_id: filmId,
      event_id: eventId
    }]);

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
  filmId: number,
  eventId: number,
  updatedEvent: Omit<Event, "id">
): Promise<Event> => {
  const { data, error } = await supabase
    .schema("film_collection")
    .from("film_events")
    .update({
      date: updatedEvent.date,
      event_type: updatedEvent.event_type,
      notes: updatedEvent.notes
    })
    .eq("id", eventId)
    .select()
    .single();

  if (error) {
    console.error("Error updating event:", error);
    throw error;
  }

  return data;
};

export const deleteFilmEvent = async (
  filmId: number,
  eventId: number
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
