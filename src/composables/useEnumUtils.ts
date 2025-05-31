import { Event } from "@/types/film-collection";

/**
 * Find the enum key corresponding to a specific value
 * @param enumObject The enum object to search in
 * @param value The value to find the key for
 * @returns The key corresponding to the value, or undefined if not found
 */
export const enumKeyFromValue = (enumObject: any, value: any) =>
  Object.keys(enumObject).find((key) => enumObject[key] === value);

/**
 * Convert enum values in an object to their corresponding enum keys
 * @param obj The object containing enum values to convert
 * @param enumTypes Record of property names to enum objects
 * @returns A new object with enum values converted to keys
 */
export function useEnumUtils() {
  const convertEnumValuesToKeys = <T>(
    obj: T,
    enumTypes: Record<string, any>,
  ): T => {
    if (Array.isArray(obj)) {
      // Recursively process each element if the value is an array
      return obj.map((item) =>
        convertEnumValuesToKeys(item, enumTypes),
      ) as unknown as T;
    } else if (typeof obj === "object" && obj !== null) {
      const newObj: any = { ...obj };

      Object.keys(newObj).forEach((key) => {
        if (enumTypes[key]) {
          newObj[key] = enumKeyFromValue(enumTypes[key], newObj[key]);
        } else if (typeof newObj[key] === "object") {
          // Recursively process nested objects and arrays
          newObj[key] = convertEnumValuesToKeys(newObj[key], enumTypes);
        }
      });

      return newObj;
    }

    // Return non-object/array values as is
    return obj;
  };

  /**
   * Get a sorted event log with newest events first
   * @param eventLog Array of events to sort
   * @returns Sorted array of events
   */
  const getSortedEventLog = (eventLog: Event[] | undefined) => {
    if (!eventLog) return [];
    return [...eventLog].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  };

  return {
    enumKeyFromValue,
    convertEnumValuesToKeys,
    getSortedEventLog,
  };
}
