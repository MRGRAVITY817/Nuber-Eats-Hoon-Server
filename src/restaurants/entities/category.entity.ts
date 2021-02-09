import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsString } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { Restaurant } from './restaurants.entity';

@InputType('CategoryInputType', { isAbstract: true })
@ObjectType() // For GraphQL
@Entity() // For TypeORM
export class Category extends CoreEntity {
  @Field(() => String)
  @Column({ unique: true })
  @IsString()
  name: string;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  @IsString()
  coverImage: string;

  @Field(() => [Restaurant])
  @OneToMany(() => Restaurant, restaurant => restaurant.category)
  restaurants: Restaurant[];

  @Column({ unique: true })
  @Field(() => String)
  @IsString()
  slug: string;
}
