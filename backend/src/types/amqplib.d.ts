declare module 'amqplib' {
  export type Channel = any;
  export type Connection = any;
  export type ConsumeMessage = {
    content: Buffer;
  };

  const amqplib: any;
  export = amqplib;
}
