import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from './core.dto';

@InputType()
export class PaginationInput {
  @Field(type => Number, { defaultValue: 1 })
  page: number;
}

@ObjectType()
export class PaginationOutput extends CoreOutput {
  @Field(type => Number, { nullable: true })
  totalPages?: number;

  @Field(type => Number, { nullable: true })
  totalResults?: number;
}
