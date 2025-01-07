import { FilmEntry } from "@/types/film-collection";
import { supabase } from "./supabase";

export const getFilmCollections = async (): Promise<FilmEntry[]> => {
  const { data, error } = await supabase
    .schema("film_collection")
    .from("film_entry")
    .select("*")
    .returns<FilmEntry[]>();

  if (error) {
    console.error("Error fetching film collections:", error);
    throw error;
  }

  return data;
};

export const createFilmCollection = async (
  filmCollection: FilmEntry
): Promise<FilmEntry> => {
  const { id, ...filmCollectionWithoutId } = filmCollection;

  const { data, error } = await supabase
    .schema("film_collection")
    .from("film_entry")
    .insert([filmCollectionWithoutId])
    .select()
    .returns<FilmEntry>()
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
    .returns<FilmEntry>()
    .single();

  if (error) {
    console.error("Error updating film collection:", error);
    throw error;
  }

  return data;
};

export const deleteFilmCollection = async (id: number): Promise<void> => {
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
