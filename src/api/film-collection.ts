import { FilmEntry, Event, FilmEvent, Camera, FilmEventType } from "@/types/film-collection";
import { ref } from "vue";
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
          film_event_type_id,
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
    date_frozen: getLatestFrozenDate(entry)
  }));
};

// Function to get all event types from the film_event_type table
export const getEventTypes = async (): Promise<FilmEventType[]> => {
  const { data, error } = await supabase
    .schema("film_collection")
    .from("film_event_type")
    .select("*")
    .order("id", { ascending: true })
    .returns<FilmEventType[]>();

  if (error) throw error;

  return data;
};

const getLatestFrozenDate = (entry: FilmEntryResponse) => {
  const events = entry.film_entry_events?.map((fee) => ({
    ...fee.film_events,
    date: new Date(fee.film_events.date),
  })) || [];

  // Get the event type IDs for "Frozen" and "Thawed"
  // This is a temporary solution until we have the actual IDs
  const frozenEventTypeId = 8; // Assuming 8 is the ID for "Frozen"
  const thawedEventTypeId = 9; // Assuming 9 is the ID for "Thawed"

  const latestFrozen = events
    .filter((event) => {
      return event.film_event_type_id === frozenEventTypeId;
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime())[0];

  if (!latestFrozen) return undefined;

  const hasLaterThaw = events.some(
    (event) =>
      event.film_event_type_id === thawedEventTypeId &&
      event.date > latestFrozen.date
  );

  return (hasLaterThaw && entry.quantity === entry.used) ? undefined : latestFrozen.date;
};

export const createFilmCollection = async (
  filmCollection: Omit<FilmEntry, "id" | "created_at" | "date_frozen">,
): Promise<FilmEntry> => {
  const { data, error } = await supabase
    .schema("film_collection")
    .from("film_entry")
    .insert([filmCollection])
    .select()
    .single();

  if (error) {

    throw error;
  }

  return data;
};

export const updateFilmCollection = async (
  id: number,
  updatedData: Partial<FilmEntry>,
): Promise<FilmEntry> => {
  // Clean the data before sending to API
  const { film_entry_events, latest_event, created_at, date_frozen, ...cleanData } =
    updatedData as any;

  const { data, error } = await supabase
    .schema("film_collection")
    .from("film_entry")
    .update(cleanData)
    .eq("id", id)
    .select()
    .single();

  if (error) {

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

    throw error;
  }
};

export const getEvents = async (): Promise<FilmEvent[]> => {

  // First get all events
  const { data: events, error: eventsError } = await supabase
    .schema("film_collection")
    .from("film_events")
    .select("*");

  if (eventsError) {

    throw eventsError;
  }



  // Then get all film-event associations with quantities
  const { data: filmAssociations, error: filmAssociationsError } = await supabase
    .schema("film_collection")
    .from("film_entry_events")
    .select("*");

  if (filmAssociationsError) {

    throw filmAssociationsError;
  }



  // Then get all event-camera associations
  const { data: cameraAssociations, error: cameraAssociationsError } = await supabase
    .schema("film_collection")
    .from("film_event_camera")
    .select("*");

  if (cameraAssociationsError) {

    throw cameraAssociationsError;
  }



  // Map the associations to the events
  const filmEvents = events.map((event) => {

    return {
      ...event,
      date: new Date(event.date),
      film_ids: filmAssociations
        .filter((assoc) => assoc.event_id === event.id)
        .map((assoc) => assoc.film_entry_id),
      camera_ids: cameraAssociations
        .filter((assoc) => assoc.event_id === event.id)
        .map((assoc) => assoc.camera_id),
    };
  });

  // Return the events with film associations
  return filmEvents;
};

// Function to get film-event associations with quantities
export const getFilmEventAssociations = async (): Promise<FilmEventAssociation[]> => {
  const { data, error } = await supabase
    .schema("film_collection")
    .from("film_entry_events")
    .select("*");

  if (error) throw error;

  return data.map(assoc => ({
    film_entry_id: assoc.film_entry_id,
    event_id: assoc.event_id,
    quantity: assoc.quantity || 1, // Default to 1 if not provided
  }));
};

// Interface for film-event associations
interface FilmEventAssociation {
  film_entry_id: number;
  event_id: number;
  quantity?: number;
}

export const createFilmEvent = async (
  filmId: number,
  event: Omit<Event, "id">,
  quantity?: number,
): Promise<Event> => {
  // Get the event type name
  const { data: eventType, error: eventTypeError } = await supabase
    .schema("film_collection")
    .from("film_event_type")
    .select("name")
    .eq("id", event.film_event_type_id)
    .single();

  if (eventTypeError) throw eventTypeError;

  // Check if an identical "Acquired" event exists with matching date and location
  // Assuming 1 is the ID for "Acquired" event type
  const acquiredEventTypeId = 1;

  const { data: existingEvents } = await supabase
    .schema("film_collection")
    .from("film_events")
    .select("id")
    .eq("date", event.date)
    .eq("film_event_type_id", event.film_event_type_id)
    .eq("location", event.location)
    .eq("film_event_type_id", acquiredEventTypeId);

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
          film_event_type_id: event.film_event_type_id,
          event_type: eventType.name, // Add the event type name
          location: event.location,
          notes: event.notes,
        },
      ])
      .select()
      .single();

    if (eventError) throw eventError;
    eventId = newEvent.id;
  }

  // Create the link with quantity if provided
  const { error: linkError } = await supabase
    .schema("film_collection")
    .from("film_entry_events")
    .insert([
      {
        film_entry_id: filmId,
        event_id: eventId,
        quantity: quantity || 1, // Default to 1 if not provided
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
  // Get the event type name
  const { data: eventType, error: eventTypeError } = await supabase
    .schema("film_collection")
    .from("film_event_type")
    .select("name")
    .eq("id", event.film_event_type_id)
    .single();

  if (eventTypeError) throw eventTypeError;

  const { error } = await supabase
    .schema("film_collection")
    .from("film_events")
    .update({
      date: event.date,
      film_event_type_id: event.film_event_type_id,
      event_type: eventType.name, // Add the event type name
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
  quantity?: number,
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

  // Create new association with quantity if provided
  const { error } = await supabase
    .schema("film_collection")
    .from("film_entry_events")
    .insert([
      {
        film_entry_id: filmId,
        event_id: eventId,
        quantity: quantity || 1, // Default to 1 if not provided
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
  // Get the event type name
  const { data: eventType, error: eventTypeError } = await supabase
    .schema("film_collection")
    .from("film_event_type")
    .select("name")
    .eq("id", event.film_event_type_id)
    .single();

  if (eventTypeError) throw eventTypeError;

  const { data, error } = await supabase
    .schema("film_collection")
    .from("film_events")
    .insert([
      {
        date: event.date,
        film_event_type_id: event.film_event_type_id,
        event_type: eventType.name, // Add the event type name
        location: event.location,
        notes: event.notes,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getCameras = async (): Promise<Camera[]> => {
  const { data, error } = await supabase
    .schema("film_collection")
    .from("camera")
    .select("*")
    .order("date_acquired", { ascending: false });

  if (error) throw error;

  return data.map(camera => ({
    ...camera,
    date_acquired: new Date(camera.date_acquired),
    date_sold: camera.date_sold ? new Date(camera.date_sold) : undefined,
  }));
};

export const createCamera = async (camera: Omit<Camera, "id">): Promise<Camera> => {
  const { data, error } = await supabase
    .schema("film_collection")
    .from("camera")
    .insert([camera])
    .select()
    .single();

  if (error) throw error;

  return {
    ...data,
    date_acquired: new Date(data.date_acquired),
    date_sold: data.date_sold ? new Date(data.date_sold) : undefined,
  };
};

export const updateCamera = async (id: number, camera: Partial<Camera>): Promise<Camera> => {
  const { data, error } = await supabase
    .schema("film_collection")
    .from("camera")
    .update(camera)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return {
    ...data,
    date_acquired: new Date(data.date_acquired),
    date_sold: data.date_sold ? new Date(data.date_sold) : undefined,
  };
};

export const deleteCamera = async (id: number): Promise<void> => {
  const { error } = await supabase
    .schema("film_collection")
    .from("camera")
    .delete()
    .eq("id", id);

  if (error) throw error;
};

export const addCameraToEvent = async (eventId: number, cameraId: number): Promise<void> => {
  const { error } = await supabase
    .schema("film_collection")
    .from("film_event_camera")
    .insert([{ event_id: eventId, camera_id: cameraId }]);

  if (error) throw error;
};

export const removeCameraFromEvent = async (eventId: number, cameraId: number): Promise<void> => {
  const { error } = await supabase
    .schema("film_collection")
    .from("film_event_camera")
    .delete()
    .eq("event_id", eventId)
    .eq("camera_id", cameraId);

  if (error) throw error;
};

export const editEventCameras = async (eventId: number, cameraIds: number[]): Promise<void> => {
  // First get current associations
  const { data: currentAssociations, error: fetchError } = await supabase
    .schema("film_collection")
    .from("film_event_camera")
    .select("camera_id")
    .eq("event_id", eventId);

  if (fetchError) throw fetchError;

  const currentCameraIds = currentAssociations.map((a) => a.camera_id);

  // Remove cameras that are no longer associated
  const camerasToRemove = currentCameraIds.filter((id) => !cameraIds.includes(id));
  if (camerasToRemove.length > 0) {
    const { error: removeError } = await supabase
      .schema("film_collection")
      .from("film_event_camera")
      .delete()
      .eq("event_id", eventId)
      .in("camera_id", camerasToRemove);

    if (removeError) throw removeError;
  }

  // Add new camera associations
  const camerasToAdd = cameraIds.filter((id) => !currentCameraIds.includes(id));
  if (camerasToAdd.length > 0) {
    const { error: addError } = await supabase
      .schema("film_collection")
      .from("film_event_camera")
      .insert(
        camerasToAdd.map((cameraId) => ({
          camera_id: cameraId,
          event_id: eventId,
        })),
      );

    if (addError) throw addError;
  }
};
