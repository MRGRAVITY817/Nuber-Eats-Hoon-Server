import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entities/core.entity';
import { BeforeInsert, Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { User } from './user.entity';
import { v4 as uuidv4 } from 'uuid';

@InputType({ isAbstract: true })
@ObjectType()
@Entity()
export class Verification extends CoreEntity {
  @Column()
  @Field(() => String)
  code: string;

  // Let's make one-to-one relationship
  @OneToOne(() => User, { onDelete: 'CASCADE' })
  // Cascade option will delete depending verification
  @JoinColumn()
  user: User;

  @BeforeInsert()
  createCode(): void {
    // Generate random id
    this.code = uuidv4();
  }
}
