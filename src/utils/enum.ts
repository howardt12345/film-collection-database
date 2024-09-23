const enumKeyFromValue = (enumObject: any, value: any) =>
  Object.keys(enumObject).find(key => enumObject[key] === value);

export const convertEnumValuesToKeys = <T>(obj: T, enumTypes: Record<string, any>): T => {
  if (Array.isArray(obj)) {
    // Recursively process each element if the value is an array
    return obj.map(item => convertEnumValuesToKeys(item, enumTypes)) as unknown as T;
  } else if (typeof obj === 'object' && obj !== null) {
    const newObj: any = { ...obj };

    Object.keys(newObj).forEach(key => {
      if (enumTypes[key]) {
        newObj[key] = enumKeyFromValue(enumTypes[key], newObj[key]);
      } else if (typeof newObj[key] === 'object') {
        // Recursively process nested objects and arrays
        newObj[key] = convertEnumValuesToKeys(newObj[key], enumTypes);
      }
    });

    return newObj;
  }

  // Return non-object/array values as is
  return obj;
};
