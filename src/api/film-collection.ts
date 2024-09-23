import { FilmCollection } from "@/types/film-collection";
import { supabase } from "./supabase";

export const getFilmCollections = async (): Promise<FilmCollection[]> => {
  const { data, error } = await supabase
    .from("film_collection")
    .select("*")
    .returns<FilmCollection[]>();

  if (error) {
    console.error("Error fetching film collections:", error);
    throw error;
  }

  return data;
};

export const createFilmCollection = async (
  filmCollection: FilmCollection
): Promise<FilmCollection> => {
  const { id, ...filmCollectionWithoutId } = filmCollection;

  const { data, error } = await supabase
    .from("film_collection")
    .insert([filmCollectionWithoutId])
    .select()
    .returns<FilmCollection>()
    .single();

  if (error) {
    console.error("Error creating film collection:", error);
    throw error;
  }

  return data;
};

export const updateFilmCollection = async (
  id: number,
  updatedData: Partial<FilmCollection>
): Promise<FilmCollection> => {
  const { data, error } = await supabase
    .from("film_collection")
    .update(updatedData)
    .eq("id", id)
    .select()
    .returns<FilmCollection>()
    .single();

  if (error) {
    console.error("Error updating film collection:", error);
    throw error;
  }

  return data;
};

export const deleteFilmCollection = async (id: number): Promise<void> => {
  const { error } = await supabase
    .from("film_collection")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting film collection:", error);
    throw error;
  }
};
