export const fees: any[] = [
  {
    handling: {
      "15000": 1.1,
      "23000": 1.5,
      "30000": 1.99,
    },
    addionalHandling: {
      "15000": 0.55,
      "23000": 0.75,
      "30000": 0.95,
    },
    surge: {
      "Royal mail": 4, //carrier charge*4%
      Yodel: 10, //carrier charge*10%
      parcelforce: 9.75, //carrier charge*9.75%
      Hermes: 2.5, //carrier charge*2.5%
    },
  },
];
