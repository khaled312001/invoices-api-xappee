import { Carrier } from "./carrier.model"

export const getCarriers = async () => {
    return Carrier.find()
}