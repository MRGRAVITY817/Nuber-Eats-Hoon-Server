import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { GraphQLModule } from "@nestjs/graphql";
import { TypeOrmModule } from "@nestjs/typeorm";
// When it's not a typescript module, we use "import * as module"
import * as Joi from "joi";
import { UsersModule } from "./users/users.module";
import { User } from "./users/entities/user.entity";
import { JwtModule } from "./jwt/jwt.module";
import { AuthModule } from "./auth/auth.module";
import { Verification } from "./users/entities/verification.entity";
import { MailModule } from "./mail/mail.module";
import { Restaurant } from "./restaurants/entities/restaurants.entity";
import { Category } from "./restaurants/entities/category.entity";
import { RestaurantsModule } from "./restaurants/restaurants.module";
import { Dish } from "./restaurants/entities/dish.entity";
import { OrdersModule } from "./orders/orders.module";
import { Order } from "./orders/entities/order.entity";
import { OrderItem } from "./orders/entities/order-item.entity";
import { CommonModule } from "./common/common.module";
import { PaymentsModule } from "./payments/payments.module";
import { Payment } from "./payments/entities/payment.entity";
import { ScheduleModule } from "@nestjs/schedule";
import { UploadsModule } from "./uploads/uploads.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === "dev" ? ".env.dev" : ".env.test",
      ignoreEnvFile: process.env.NODE_ENV === "production",
      // validationSchema will make program NOT to open
      // when the env variables are not ready
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid("dev", "production", "test").required(),
        DB_PASSWORD: Joi.string().required(),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.string().required(),
        DB_USERNAME: Joi.string().required(),
        DB_NAME: Joi.string().required(),
        PRIVATE_KEY: Joi.string().required(),
        MAILGUN_API_KEY: Joi.string().required(),
        MAILGUN_DOMAIN_NAME: Joi.string().required(),
        MAILGUN_FROM_EMAIL: Joi.string().required(),
        AWS_ACCESS_KEY: Joi.string().required(),
        AWS_SECRET_ACCESS_KEY: Joi.string().required(),
      }),
    }),
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      synchronize: process.env.NODE_ENV === "production",
      logging: process.env.NODE_ENV === "dev",
      entities: [User, Verification, Restaurant, Category, Dish, Order, OrderItem, Payment],
      ssl: process.env.NODE_ENV === "production" && {
        rejectUnauthorized: false,
      },
    }),
    GraphQLModule.forRoot({
      playground: true,
      introspection: true,
      autoSchemaFile: true,
      installSubscriptionHandlers: true, // This will subscription for graphql
      // 'context' sends HTTP Request to graphql server. It's provided from Apollo
      context: ({ req, connection }) => {
        const TOKEN_KEY = "x-jwt";
        // Handling websocket and http
        return {
          token: req ? req.headers[TOKEN_KEY] : connection.context[TOKEN_KEY],
        };
      },
    }),
    JwtModule.forRoot({
      privateKey: process.env.PRIVATE_KEY,
    }),
    MailModule.forRoot({
      apiKey: process.env.MAILGUN_API_KEY,
      domain: process.env.MAILGUN_DOMAIN_NAME,
      fromEmail: process.env.MAILGUN_FROM_EMAIL,
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    RestaurantsModule,
    OrdersModule,
    CommonModule,
    PaymentsModule,
    UploadsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
