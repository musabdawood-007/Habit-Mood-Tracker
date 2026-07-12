declare module "jstat" {
  const jstat: {
    studentt: {
      cdf: (x: number, df: number) => number;
      pdf: (x: number, df: number) => number;
    };
    normal: {
      cdf: (x: number, mean: number, std: number) => number;
      pdf: (x: number, mean: number, std: number) => number;
    };
    [key: string]: any;
  };
  export default jstat;
}
