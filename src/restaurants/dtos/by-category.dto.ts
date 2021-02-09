import { Field, InputType, ObjectType } from '@nestjs/graphql';
import {
  PaginationInput,
  PaginationOutput,
} from 'src/common/dtos/pagination.dto';
import { RestaurantsOutput } from './restaurants.dto';

@InputType()
export class ByCategoryInput extends PaginationInput {
  @Field(type => Number, { nullable: true })
  categoryId: number;
}

@ObjectType()
export class ByCategoryOutput extends RestaurantsOutput {}
