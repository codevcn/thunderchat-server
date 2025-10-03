export interface IAPIGatewayRoutingItem {
  path: string
  target: string
  rewrite?: { [key: string]: string }
  changeOrigin: boolean
}

export interface IAPIGatewayRouting {
  routes: IAPIGatewayRoutingItem[]
}
