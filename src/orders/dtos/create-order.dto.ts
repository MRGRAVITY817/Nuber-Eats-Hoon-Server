import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/core.dto';
import { DishOption } from 'src/restaurants/entities/dish.entity';
import { OrderItemOption } from '../entities/order-item.entity';
import { Order } from '../entities/order.entity';

// We don't want to see all the order dish item,
// So we can make custom order item input
@InputType()
class CreateOrderItemInput {
  @Field(type => Number)
  dishId: number;

  @Field(type => [OrderItemOption], { nullable: true })
  options?: OrderItemOption[];
}

@InputType()
export class CreateOrderInput {
  @Field(type => Number)
  restaurantId: number;

  @Field(type => [CreateOrderItemInput])
  items: CreateOrderItemInput[];
}

@ObjectType()
export class CreateOrderOutput extends CoreOutput {
  @Field(type => Number, { nullable: true })
  orderId?: number;
}
