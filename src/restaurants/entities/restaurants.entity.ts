import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsBoolean, IsString } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Order } from 'src/orders/entities/order.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  RelationId,
} from 'typeorm';
import { Category } from './category.entity';
import { Dish } from './dish.entity';

@InputType('RestaurantInputType', { isAbstract: true })
@ObjectType() // For GraphQL
@Entity() // For TypeORM
export class Restaurant extends CoreEntity {
  @Field(type => String)
  @Column()
  @IsString()
  name: string;

  @Field(type => String)
  @Column()
  @IsString()
  coverImage: string;

  @Field(type => String, { defaultValue: 'Korea, Republic of' })
  @Column()
  @IsString()
  address: string;

  // It's possible to have 'no category' for a restaurant
  @Field(type => Category, { nullable: true })
  @ManyToOne(() => Category, Category => Category.restaurants, {
    nullable: true,
    onDelete: 'SET NULL',
    eager: true,
  })
  category: Category;

  // It's possible to have 'no owner' for a restaurant
  @Field(type => User, { nullable: true })
  @ManyToOne(type => User, User => User.restaurants, {
    onDelete: 'CASCADE',
  })
  owner: User;

  // Id of restaurant ownerRestaurant
  @RelationId((restaurant: Restaurant) => restaurant.owner)
  ownerId: number;

  @Field(type => [Dish])
  @OneToMany(type => Dish, dish => dish.restaurant)
  menu: Dish[];

  @Field(type => [Order])
  @OneToMany(type => Order, order => order.restaurant)
  orders: Order[];

  @Field(type => Boolean)
  @Column({ default: false })
  isPromoted: boolean;

  @Field(type => Date, { nullable: true })
  @Column({ nullable: true })
  promotedUntil: Date;
}
