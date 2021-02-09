import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/core.dto';
import { Restaurant } from '../entities/restaurants.entity';

// InputType requires to pass the whole object of args
// while the ArgsType basically pass the separate values to require
@InputType()
export class CreateRestaurantInput extends PickType(Restaurant, [
  'name',
  'coverImage',
  'address',
]) {
  @Field(() => String)
  categoryName: string;
}

@ObjectType()
export class CreateRestaurantOutput extends CoreOutput {
  @Field(type => Number)
  restaurantId?: number;
}
