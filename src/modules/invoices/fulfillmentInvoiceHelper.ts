import { packagingFees } from "../../constants/packaging";
import {
  handling_weight_groups,
  shipping_weight_groups,
} from "../../constants/weightGroup";
import { getCarriers } from "../carrier";
import { getFees } from "../fee/fee.service";
import { IOrder } from "../order";
import { getPostCodesByName } from "../postcode/postcode.service";

import {
  findWeightGroup,
  findZoneByPostcode,
  getOrdersPostCodes,
  getPostCode,
  matchAndGetPostCode,
} from "./invoice.helper";
import {
  InvoiceByOrderRecord,
  InvoiceByServcie,
  THandlingWeightGroup,
  TShippingWeightGroup,
} from "./invoices";

const getWeightGroups = (order: IOrder) => {
  const totalWeight = order.totalWeight;
  const orderHandlingWG: THandlingWeightGroup = findWeightGroup(
    totalWeight,
    handling_weight_groups // see ./constants.ts
  );
  const orderShippingWG: TShippingWeightGroup = findWeightGroup(
    totalWeight,
    shipping_weight_groups // see ./constants.ts
  );
  return { totalWeight, orderHandlingWG, orderShippingWG };
};

export const calculateFulfillmentInovice = async (orders: IOrder[]) => {
  const InvoiceByOrder: InvoiceByOrderRecord = {};
  const InvoiceByService: InvoiceByServcie = {};
  let problems: Record<string, any> = {};

  const carriers = await getCarriers(); // each carrier have different services/fees
  const fees = (await getFees()) as any; // all the fees for handling & packagin from database
  const ordersPostCodes = await getOrdersPostCodes(orders);
  const postCodes = await getPostCodesByName(ordersPostCodes);

  for (const order of orders) {
    let postage = 0;
    let ofaCharge = 0;
    let totalPostage = 0;
    let handlingFirst = 0;
    let addionalHandling = 0;
    let totalHandling = 0;
    let packaging = 0;
    let surge = 0;
    let prepCharge = 0;

    // let totalItems = 0;
    // let orderMinParcels = 0;
    // let orderMaxParcels = 0;
    // let qunatity = 0;
    let parcelForceAdditonaCharge = 0;

    const { totalWeight, orderHandlingWG, orderShippingWG } =
      getWeightGroups(order);

const orderShippingMethod = order.shippingMethod 
? order.shippingMethod.split("|")[1] ?? order.shippingMethod
: null;

    const ofaPostCode = order.shipPostalCode;

    // get carrier
    const carrier = carriers.find(
      (c) => c.name.toLowerCase() === order.carrierName?.toLowerCase()
    );
    if (!carrier) {
      problems[order.id] = {
        id: order.id,
        issues: "Can't find carrier",
      };
      continue;
    } // TO-DO log issues

    // get service
    const service = carrier?.services.find(
      (s) => s.name.toLowerCase() === orderShippingMethod?.toLowerCase()
    );
    if (!service) {
      problems[order.id] = { id: order.id, issue: "Can't find service" };
      continue;
    } // TO-DO log
    let orderSalesTrackingNumbers: any[] = [];
    let sameAddress = false;
    for (const sale of order.channelSales) {
      const { height, width, length } = sale;
      //       totalItems += quantityPurchased * sale.items;
      //       qunatity += quantityPurchased;
      //       orderMaxParcels += maxParcels || 1;
      //       orderMinParcels += parcels;

      //       // (6/1) * 1
      //     //  const parcels = Math.ceil(qunatity / orderMaxParcels) * orderMinParcels;
      // //=IF(R47<>"",CEILING.MATH(R47/AZ47,1)*AY47,"")
      const dimensions = [length, width, height];
      dimensions.sort((a, b) => a - b);
      const [shortest, median, longest] = dimensions;

      // if (
      //   carrier.name === "parcelforce" &&
      //   (service.name === "express24/SND" ||
      //     service.name === "express24/SND+" ||
      //     service.name === "express48/SUP" ||
      //     service.name == "express48/SUP+") &&
      //   (longest >= 110 || (longest >= 70 && median >= 70))
      // ) {
      //   parcelForceAdditonaCharge = 7.45;
      // }
    
      if (orderSalesTrackingNumbers.includes(sale.trackingNumber)) {
      sameAddress = true;
      }
      orderSalesTrackingNumbers.push(sale.trackingNumber);
    }

    const defaultClass = order.channelSales[0].class;
    if (!defaultClass) {
      problems[order.id] = {
        id: order.id,
        issue: `Can't find item class SKU: ${order.channelSales[0].sku}`,
        item: order.channelSales[0],
      };
      continue;
    }

    const packagingFee = packagingFees[defaultClass];

    const selectedFee = packagingFee
      ? packagingFee[orderHandlingWG]
      : undefined;
    const fee = selectedFee || 0;

    packaging += fee * order.totalOrderParcels;

    if (
      !service.charges[orderShippingWG] ||
      typeof service.charges[orderShippingWG] !== "number"
    ) {
      problems[order.id] = {
        id: order.id,
        issue: `Carrier ${carrier.name} with service ${service.name}, Can't handle order with weight band of ${orderShippingWG}`,
        carrier: carrier.name,
        service: service.name,
      };
      continue;
    }
if(sameAddress && carrier.name == "parcelforce" && ( service.name == "express48/SUP" ||
  service.name == "express24/SND" ||
  service.name == "express48/SUP+" ||
  service.name == "express24/SND+")){
    service.charges[orderShippingWG] = carrier.discount ?? service.charges[orderShippingWG];
  }
  

    postage += service.charges[orderShippingWG] * order.totalOrderParcels;
    let postCodeIsMatched = true;

    if (ofaPostCode) {
      ofaCharge = Number(
        matchAndGetPostCode(
          postCodes,
          getPostCode(ofaPostCode),
          carrier.name,
          service.name
        )
      );
      if (isNaN(ofaCharge)) {
        postCodeIsMatched = false;
        ofaCharge = 0;
      }

      if (service.name === "XPECT 48 XL POD 2VLP" && ofaCharge > 0) {
        ofaCharge = ofaCharge + postage;
      }

      //parcelforce ofacharges depend on zones
      if (carrier.name == "parcelforce") {
        const zone = findZoneByPostcode(getPostCode(ofaPostCode).toUpperCase());

        if (zone) {
          if (zone == 2) {
            if (
              service.name == "express48/SUP" ||
              service.name == "express24/SND" ||
              service.name == "express48/SUP+" ||
              service.name == "express24/SND+"
            ) {
              //surge 120 % , min 7.75
              ofaCharge = Math.max((postage * 120) / 100, 7.75) + postage;
            } else if (
              service.name == "express48 large/SID" ||
              service.name == "express48 large/SID+"
            ) {
              //surge 125 % , min 16
              ofaCharge = Math.max((postage * 125) / 100, 16) + postage;
            }
          } else if (zone == 3) {
            if (
              service.name == "express48/SUP" ||
              service.name == "express48/SUP+"
            ) {
              //surge 165 % , min 9.25
              ofaCharge = Math.max((postage * 165) / 100, 9.25) + postage;
            } else if (
              service.name == "express24/SND" ||
              service.name == "express24/SND+"
            ) {
              //surge 165 % , min 13.25
              ofaCharge = Math.max((postage * 165) / 100, 13.25) + postage;
            } else if (
              service.name == "express48 large/SID" ||
              service.name == "express48 large/SID+"
            ) {
              //surge 125 % , min 13.25
              ofaCharge = Math.max((postage * 125) / 100, 13.25) + postage;
            }
          } else if (zone == 30) {
            if (
              service.name == "express48/SUP" ||
              service.name == "express48/SUP+"
            ) {
              //surge 165 % , min 9.25
              ofaCharge = Math.max((postage * 70) / 100, 9.25) + postage;
            } else if (
              service.name == "express24/SND" ||
              service.name == "express24/SND+"
            ) {
              //surge 165 % , min 13.25
              ofaCharge = Math.max((postage * 165) / 100, 13.25) + postage;
            } else if (
              service.name == "express48 large/SID" ||
              service.name == "express48 large/SID+"
            ) {
              //surge 125 % , min 13.25
              ofaCharge = Math.max((postage * 125) / 100, 13.25) + postage;
            }
          } else if (zone == 1) {
            ofaCharge = 5 + postage;
          }
        }
      }
    } else {
      postCodeIsMatched = false;
    }
    if (carrier.name != "parcelforce") {
      ofaCharge = ofaCharge * order.totalOrderParcels;
    }

    //3-calculate postageCost

    let postageCost = postage;

    if (
      (carrier.name === "Evri" && service.name == "UK Standard Delivery") ||
      carrier.name === "Yodel" ||
      carrier.name === "parcelforce"
    ) {
      //=IF(J74>=0.01,IF(N74<>"",N74,J74),"")
      if (postage >= 0.01) {
        postageCost = ofaCharge > 0 ? ofaCharge : postage;
      } else {
        postageCost = 0;
      }
    }

    //5-calculate totalPostage

    //=O71*D71
    if (carrier.name === "Royal mail") {
      totalPostage += postageCost * order.totalOrderParcels;
    }

    //=IF(E75<>"","",O75)
    if (carrier.name === "Evri" && service.name == "UK Next Day Delivery") {
      totalPostage += ofaCharge > 0 ? 0 : postageCost;
    }

    if (
      (carrier.name === "Yodel" && service.name == "XPRESS 24 POD 1CP") ||
      (carrier.name === "Yodel" && service.name == "XPECT 24 POD 1VP")
    ) {
      //=IF(E75<>"","",O75)
      totalPostage += postCodeIsMatched ? 0 : postage;
    }
    //=IF(J74>=0.01,IF(O74<>"",IF(M74<>"",M74+O74,O74),""),"")
    if (
      (carrier.name === "Evri" && service.name == "UK Standard Delivery") ||
      (carrier.name === "Yodel" &&
        (service.name == "XPRESS 48 POD 2CP" ||
          service.name == "XPECT 48 POD 2VP" ||
          service.name == "XPECT 48 XL POD 2VLP")) ||
      carrier.name == "parcelforce"
    ) {
      if (postage > 0.01) {
        totalPostage +=
          parcelForceAdditonaCharge > 0
            ? parcelForceAdditonaCharge + postageCost
            : postageCost;
      } else {
        totalPostage = 0;
      }
    }

    //5-calculate surge
    surge += (fees.surge[carrier.name] / 100) * postage;
    prepCharge += ((order.prepQty != null && order.prepCharge != null) ? (order.prepCharge * order.prepQty) : 0); 

    // if(prepCharge > 0){
    //   handlingFirst +=
    //   (fees?.handling[orderHandlingWG] || 0);
    // }else{
      handlingFirst +=
      (fees?.handling[orderHandlingWG] || 0) * order.totalOrderParcels;
    // }

   
      if(prepCharge > 0){
        addionalHandling +=
        (fees?.addionalHandling[orderHandlingWG] || 0) ;
      }else{
        addionalHandling +=
        (fees?.addionalHandling[orderHandlingWG] || 0) *
        (order.totalItems - order.totalOrderParcels);
      }



    totalHandling +=
      typeof (handlingFirst + addionalHandling) === "number"
        ? handlingFirst + addionalHandling
        : 0;
        
        // if(order.id == "16331132632768"){
        //   console.log("prepCharge",order.totalOrderParcels)
        //   console.log("totalOrderParcels",order.totalOrderParcels)
        //   console.log("fees?.handling[orderHandlingWG]",fees?.handling[orderHandlingWG])
        //   console.log("handlingFirst",handlingFirst)
        //   console.log("addionalHandling",addionalHandling)
        //   console.log("totalHandling",totalHandling)
        // }

    InvoiceByOrder[order.id] = {
      id: order.id,
      carrier: carrier.name,
      channel: order.channel,
      date: order.dispatchDate || order.purchaseDate,
      postcode: order.shipPostalCode,
      service: service.name,
      totalWeight,
      shippingWeightGroup: orderShippingWG,
      handlingWeightGroup: orderHandlingWG,
      charges: {
        handling: totalHandling,
        packaging,
        surge,
        postage: totalPostage,
        prepCharge: prepCharge
      },
      trackingNumber: order.trackingNumber,
      prepCharge: order.prepCharge,
      prepQty: order.prepQty
    };

    if (!InvoiceByService[service.name]) {
      InvoiceByService[service.name] = {
        carrier: carrier.name,
        service: service.name,
        charges: { handling: 0, packaging: 0, surge: 0, postage: 0 , prepCharge: 0},
        total: 0,
      };
    }


    const serviceInvoice = InvoiceByService[service.name];
    serviceInvoice.charges.handling += totalHandling;
    serviceInvoice.charges.packaging += packaging;
    serviceInvoice.charges.postage += totalPostage;
    serviceInvoice.charges.surge += surge;
    serviceInvoice.charges.prepCharge += prepCharge;
    serviceInvoice.total += totalHandling + packaging + totalPostage + prepCharge + surge;
  }
  
  const totals = getInvoiceTotals(Object.values(InvoiceByService));

  return {
    InvoiceByOrder,
    InvoiceByService,
    problems,
    totals
  };
};

const getInvoiceTotals = (services: any) => {
  let total = services.reduce((accumulator: any, currentService: any) => {
    return accumulator + currentService.total;
  }, 0);

  const totalTax = 20 * total / 100;
  total = total + totalTax;
  const totalPostage = services.reduce(
    (accumulator: any, currentService: any) => {
      return accumulator + currentService.charges.postage;
    },
    0
  );

  const totalSurge = services.reduce(
    (accumulator: any, currentService: any) => {
      return accumulator + currentService.charges.surge;
    },
    0
  );

  const totalHandling = services.reduce(
    (accumulator: any, currentService: any) => {
      return accumulator + currentService.charges.handling;
    },
    0
  );

  const totalPackaging = services.reduce(
    (accumulator: any, currentService: any) => {
      return accumulator + currentService.charges.packaging;
    },
    0
  );

  const totalPrep = services.reduce(
    (accumulator: any, currentService: any) => {
      return accumulator + currentService.charges.prepCharge;
    },
    0
  );

  return {
    total,
    totalPostage,
    totalSurge,
    totalHandling,
    totalPackaging,
    totalPrep,
    totalTax
  };
};
