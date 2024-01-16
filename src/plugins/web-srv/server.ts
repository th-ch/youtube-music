import * as http from 'http';

import express, { Express } from 'express';

class server{
  public instance: http.Server | null;
  public app: Express;
  public port: number;
  constructor(port: number)
  {
    this.instance = null;
    this.port = port;
    this.app = express();
  }


  start(){
    if (!this.app)return;
    this.instance = this.app.listen(this.port, () => {
      console.log(`Http Server Started on port ${this.port}`);
    });
  }

  stop(){
    if(this.instance){
      this.instance.close();
      console.log('Http Server Closed');
    }
  }
}
let main: server | null = null;
export function getServerInstance(): server{
  if(!main){
    main = new server(8888);
    return main;
  }
  return main;
}
