import { PostCode } from "./postcode.model";

export const retrievePostCode = async (
  carrier_id: string,
  name: string,
  service?: string
) => {
  if (service) return await PostCode.findOne({ carrier_id, name, service });
  return await PostCode.findOne({
    carrier_id,
    name,
    service: { $exists: false },
  });
};

export const getPostCodesByName = async (names: string[]) => {
  // Create a RegExp pattern for each name to match the start of the string
  // and ignore any characters that follow after the pattern.
  const patterns = names.map(name => {
    // Remove spaces and then escape special RegExp characters if needed
    const sanitized = name.replace(/\s/g, '').replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    return new RegExp('^' + sanitized, 'i'); // 'i' for case-insensitive matching
  });

  return await PostCode.find({
    name: { $in: patterns },
  });
};
