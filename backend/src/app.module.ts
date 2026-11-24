import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { CheckerModule } from './modules/checker/checker.module.js';
import { CatalogModule } from './modules/catalog/catalog.module.js';
import { MatrixSystemEntity } from './modules/catalog/entities/matrix-system.entity.js';
import { MatrixFolderEntity } from './modules/catalog/entities/matrix-folder.entity.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): TypeOrmModuleOptions => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', '10.194.222.31'),
        port: Number(config.get<number>('DB_PORT', 5432)),
        username: config.get<string>('DB_USERNAME', 'matrix_lan'),
        password: config.get<string>('DB_PASSWORD', 'matrix_lan'),
        database: config.get<string>('DB_NAME', 'it'),
        entities: [MatrixSystemEntity, MatrixFolderEntity],
        synchronize: true,
        ssl:
          config.get<string>('DB_SSL', 'false') === 'true'
            ? { rejectUnauthorized: false }
            : false,
      }),
    }),
    CheckerModule,
    CatalogModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
