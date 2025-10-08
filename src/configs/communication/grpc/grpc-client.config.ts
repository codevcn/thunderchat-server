import { EGrpcPackages } from '@/utils/enums'
import { ClientsProviderAsyncOptions, Transport } from '@nestjs/microservices'
import { join } from 'path'

export class GrpcClientConfig {
  static getAuthClient(): ClientsProviderAsyncOptions {
    return {
      name: EGrpcPackages.AUTH_PACKAGE,
      useFactory: () => ({
        transport: Transport.GRPC,
        options: {
          package: EGrpcPackages.AUTH,
          protoPath: join(__dirname, '/../../../../protos/artifacts/', 'auth.proto'),
          url: `0.0.0.0:${process.env.AUTH_GRPC_PORT}`,
        },
      }),
    }
  }
}
