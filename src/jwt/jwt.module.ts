import { DynamicModule, Global, Module } from '@nestjs/common';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { JwtModuleOptions } from './jwt.interfaces';
import { JwtService } from './jwt.service';

@Module({})
@Global()
export class JwtModule {
  // Dynamic module is a module that returns another module
  static forRoot(options: JwtModuleOptions): DynamicModule {
    return {
      module: JwtModule,
      providers: [
        {
          provide: CONFIG_OPTIONS,
          useValue: options,
        },
        JwtService,
        // Above is equivalent to {provide: JwtService, useClass: JwtService}
      ],
      exports: [JwtService],
    };
  }
}
