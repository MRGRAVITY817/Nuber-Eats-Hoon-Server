import { ArgsType, Field, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/core.dto';
import { User } from '../entities/user.entity';

@ArgsType()
export class UserProfileInput {
  @Field(() => Number)
  userId: number;
}

@ObjectType()
export class UserProfileOutput extends CoreOutput {
  // Sometime we might find user, or not :D
  @Field(() => User, { nullable: true })
  user?: User;
}
