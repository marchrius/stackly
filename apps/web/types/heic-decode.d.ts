declare module "heic-decode" {
  interface DecodeOptions {
    buffer: Buffer | Uint8Array;
  }
  interface DecodedImage {
    width: number;
    height: number;
    data: Uint8Array;
  }
  function decode(options: DecodeOptions): Promise<DecodedImage>;
  export default decode;
}
