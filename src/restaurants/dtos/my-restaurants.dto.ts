import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/core.dto';
import { Restaurant } from '../entities/restaurants.entity';

@ObjectType()
export class MyRestaurantsOutput extends CoreOutput {
  @Field(type => [Restaurant], { nullable: true })
  restaurants?: Restaurant[];
}
