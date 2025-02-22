import {
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { IsEnum, IsNumber } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Dish } from 'src/restaurants/entities/dish.entity';
import { Restaurant } from 'src/restaurants/entities/restaurants.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  RelationId,
} from 'typeorm';
import { OrderItem } from './order-item.entity';

export enum OrderStatus {
  Pending = 'Pending',
  // Restaurant owner can change 'cooking' and 'cooked'
  Cooking = 'Cooking',
  Cooked = 'Cooked',
  // Delivery man can change 'pickedup' and 'delivered'
  PickedUp = 'PickedUp',
  Delivered = 'Delivered',
}

registerEnumType(OrderStatus, { name: 'OrderStatus' });

@InputType('OrderInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Order extends CoreEntity {
  @Field(type => User, { nullable: true })
  @ManyToOne(type => User, user => user.orders, {
    onDelete: 'SET NULL',
    nullable: true,
    eager: true,
  })
  customer?: User;

  @Field(type => User, { nullable: true })
  @ManyToOne(type => User, user => user.rides, {
    onDelete: 'SET NULL',
    nullable: true,
    eager: true,
  })
  driver?: User;

  @Field(type => Restaurant, { nullable: true })
  @ManyToOne(type => Restaurant, restaurant => restaurant.orders, {
    onDelete: 'SET NULL',
    nullable: true,
    eager: true,
  })
  restaurant?: Restaurant;

  @RelationId((order: Order) => order.customer)
  customerId: number;

  @RelationId((order: Order) => order.driver)
  driverId: number;

  @Field(type => [OrderItem])
  @ManyToMany(type => OrderItem, { eager: true })
  // Since we usually look at order to see what dishes they have,
  // not looking at dishes for finding which orders have been called,
  // We choose this field to join the DB Table
  @JoinTable()
  items: OrderItem[];

  @Column({ nullable: true })
  @Field(type => Number, { nullable: true })
  @IsNumber()
  total?: number;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.Pending })
  @Field(type => OrderStatus)
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
