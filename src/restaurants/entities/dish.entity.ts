import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsNumber, IsString, Length } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { Restaurant } from './restaurants.entity';

@InputType('DishChoiceInputType', { isAbstract: true })
@ObjectType()
export class DishChoice {
  @Field(() => String)
  name: string;
  @Field(() => Number, { nullable: true })
  extra?: number;
}

@InputType('DishOptionInputType', { isAbstract: true })
@ObjectType()
export class DishOption {
  @Field(type => String)
  name: string;

  @Field(type => [DishChoice], { nullable: true })
  choices?: DishChoice[];

  @Field(type => Number, { nullable: true })
  extra?: number;
}

@InputType('DishInputType', { isAbstract: true })
@ObjectType() // For GraphQL
@Entity() // For TypeORM
export class Dish extends CoreEntity {
  @Field(() => String)
  @Column()
  @IsString()
  @Length(5)
  name: string;

  @Field(() => Number)
  @Column()
  @IsNumber()
  price: number;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  @IsString()
  photo?: string;

  @Field(() => String)
  @Column()
  @Length(5, 140)
  description: string;

  @Field(() => Restaurant)
  @ManyToOne(() => Restaurant, restaurant => restaurant.menu, {
    onDelete: 'CASCADE',
  })
  restaurant: Restaurant;

  @RelationId((dish: Dish) => dish.restaurant)
  restaurantId: number;

  // Save structured data, but don't want to create new table
  // This is a light alternative for Many to One relationship option
  @Field(type => [DishOption], { nullable: true })
  @Column({ type: 'json', nullable: true })
  options?: DishOption[];
}
