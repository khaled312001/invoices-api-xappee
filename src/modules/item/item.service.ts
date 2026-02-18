import { IItem, Item } from "./item.model";

export const addItems = async (
  items: IItem[],
  client: string
): Promise<IItem[]> => {
  const savedItems = await Promise.all(
    items.map(async (item) => {
      const filter = { sku: item.sku }; // Assuming sku and client combination is unique
      const update = {
        $set: {
          name: item?.name,
          qty: item?.qty || 0,
          length: item?.length || 0,
          price: item?.price || 0,
          width: item?.width || 0,
          height: item?.height || 0,
          class: item?.class,
          weight: item.weight,
          boxHeight: item.boxHeight,
          boxLength: item.boxLength,
          boxWidth: item.boxWidth,
          parcels: item?.parcels || 1,
          maxParcels: item?.maxParcels || 1,
          skipFees: item?.skipFees || false,
        },
        $addToSet: { client: [client] },
      };
      const options = {
        new: true, // Return the updated document
        upsert: true, // Create a new document if it doesn't exist
        setDefaultsOnInsert: true, // Apply default values on insert
      };

      try {
        const savedItem = await Item.findOneAndUpdate(filter, update, options);
        return savedItem;
      } catch (error) {
        console.error(`Error upserting item with SKU ${item.sku}:`, error);
        return null; // or handle the error as appropriate for your use case
      }
    })
  );

  // Filter out any null values (failed operations) and return the result
  return savedItems.filter((item) => item !== null);
};

export const addOneItem = async (item: IItem) => {
  const newItem = new Item(item);
  return await newItem.save();
};

export const getItems = async (page: number, pageSize: number, user: any) => {

  const query: any = {};

  if (user.role === "user") {
    query.client = { $in: [user.client] };
  }

  return await Item.find(query)
    .skip(pageSize * (page - 1))
    .limit(pageSize);
};

export const getOneItemWithSKU = async (sku: string,user?: any) => {
  const query: any = { sku };
  if (user && user.role === "user") {
    query.clients = { $in: [user.client] };
  }
  return await Item.findOne(query);
};

export const getItemsWithName = async (name: string) => {
  return await Item.find({
    name: { $regex: name, $options: 'i' } // Case-insensitive partial match for name
  });
};

export const getItemsWithSku = async (skus: string[]) => {
  return await Item.find({ sku: { $in: skus } }).lean();
};

export const deleteItem = async (_id: string) => {
  return await Item.deleteOne({ _id });
};

export const updateItem = async (item: IItem) => {
  return await Item.updateOne(
    { sku: item.sku },
    { $set: item },
    { upsert: true }
  );
};

export const removeOrderQuantity = async (sku: string) => {
  return await Item.updateOne(
    { sku: sku },
    { $unset: { orderQuantity: "" } }
  );
};

export const getItemsWithClient = async (client: string) => {
  return await Item.find({ client: { $in: [client] }, skipFees: false }).lean();
};
