import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/core.dto';

@InputType()
export class DeleteDishInput {
  @Field(type => Number)
  dishId: number;
}

@ObjectType()
export class DeleteDishOutput extends CoreOutput {}
