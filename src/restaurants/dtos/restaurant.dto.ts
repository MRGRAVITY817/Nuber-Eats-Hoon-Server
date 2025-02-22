import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/core.dto';
import { Restaurant } from '../entities/restaurants.entity';

@InputType()
export class RestaurantInput {
  @Field(type => Number)
  restaurantId: number;
}

@ObjectType()
export class RestaurantOutput extends CoreOutput {
  @Field(type => Restaurant, { nullable: true })
  restaurant?: Restaurant;
}
