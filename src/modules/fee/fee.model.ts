import mongoose, { Document, Schema } from "mongoose";

export interface IFee extends Document {
  handling: {
    15000: number;
    23000: number;
    30000: number;
  };
  addionalHandling: {
    15000: number;
    23000: number;
    30000: number;
  };
  classes: {
    A: {
      15000: number;
      23000: number;
      30000: number;
    };
    B: {
      15000: number;
      23000: number;
      30000: number;
    };
    C: {
      15000: number;
      23000: number;
      30000: number;
    };
    D: {
      15000: number;
      23000: number;
      30000: number;
    };
  };
  surge: {
    Evri: number;
    "Royal mail": number;
    Yodel: number;
    parcelforce: number;
  };
  storage: {
    cbm:number,
    space:number
  }
}

const FeeSchema: Schema = new Schema(
  {
    handling: {
      15000: { type: Number, required: true },
      23000: { type: Number, required: true },
      30000: { type: Number, required: true },
    },
    addionalHandling: {
      15000: { type: Number, required: true },
      23000: { type: Number, required: true },
      30000: { type: Number, required: true },
    },
    classes: {
      a: {
        15000: { type: Number, required: true },
        23000: { type: Number, required: true },
        30000: { type: Number, required: true },
      },
      b: {
        15000: { type: Number, required: true },
        23000: { type: Number, required: true },
        30000: { type: Number, required: true },
      },
      c: {
        15000: { type: Number, required: true },
        23000: { type: Number, required: true },
        30000: { type: Number, required: true },
      },
      d: {
        15000: { type: Number, required: true },
        23000: { type: Number, required: true },
        30000: { type: Number, required: true },
      },
    },
    surge: {
      Evri: { type: Number, required: true },
      "Royal mail": { type: Number, required: true },
      Yodel: { type: Number, required: true },
      parcelforce: { type: Number, required: true },
    },
    storage: {
      cbm:{type: Number, required: true},
      space:{type: Number, required: true}
    }
  },
  { timestamps: true }
);

export const Fee = mongoose.model<IFee>("Fee", FeeSchema);
