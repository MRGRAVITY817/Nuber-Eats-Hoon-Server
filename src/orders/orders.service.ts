import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { PubSub } from "graphql-subscriptions";
import { NEW_COOKED_ORDER, NEW_ORDER_UPDATE, NEW_PENDING_ORDER, PUB_SUB } from "src/common/common.constants";
import { Dish } from "src/restaurants/entities/dish.entity";
import { Restaurant } from "src/restaurants/entities/restaurants.entity";
import { User, UserRole } from "src/users/entities/user.entity";
import { Repository } from "typeorm";
import { CreateOrderInput, CreateOrderOutput } from "./dtos/create-order.dto";
import { EditOrderInput, EditOrderOutput } from "./dtos/edit-order.dto";
import { GetOrderInput, GetOrderOutput } from "./dtos/get-order.dto";
import { GetOrdersInput, GetOrdersOutput } from "./dtos/get-orders.dto";
import { TakeOrderInput, TakeOrderOutput } from "./dtos/take-order.dto";
import { OrderItem } from "./entities/order-item.entity";
import { Order, OrderStatus } from "./entities/order.entity";

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,

    @InjectRepository(OrderItem)
    private readonly orderItems: Repository<OrderItem>,

    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,

    @InjectRepository(Dish)
    private readonly dishes: Repository<Dish>,

    @Inject(PUB_SUB) private readonly pubsub: PubSub
  ) {}

  async createOrder(customer: User, { restaurantId, items }: CreateOrderInput): Promise<CreateOrderOutput> {
    try {
      const restaurant = await this.restaurants.findOne(restaurantId);
      if (!restaurant) {
        return {
          ok: false,
          error: "Restaurant not found",
        };
      }
      let orderFinalPrice = 0;
      const orderItems: OrderItem[] = [];
      for (const item of items) {
        const dish = await this.dishes.findOne(item.dishId);
        if (!dish) {
          return {
            ok: false,
            error: "Dish not found",
          };
        }
        let dishFinalPrice: number = dish.price;
        console.log(`Dish Price: $USD ${dish.price}`);
        for (const itemOption of item.options) {
          const dishOption = dish.options.find((dishOption) => dishOption.name === itemOption.name);
          if (dishOption) {
            if (dishOption.extra) {
              console.log(`${dishOption.extra}`);
              dishFinalPrice = dishFinalPrice + dishOption.extra;
            } else {
              const dishOptionChoice = dishOption.choices?.find((optionChoice) => optionChoice.name === itemOption.choice);
              if (dishOptionChoice.extra) {
                console.log(`${dishOption.name} ${dishOptionChoice.name} + $USD ${dishOptionChoice.extra}`);
                dishFinalPrice = dishFinalPrice + dishOptionChoice.extra;
              }
            }
          }
        }
        orderFinalPrice = orderFinalPrice + dishFinalPrice;
        const orderItem = await this.orderItems.save({
          dish,
          options: item.options,
        });
        orderItems.push(orderItem);
      }
      const order = await this.orders.save(
        this.orders.create({
          customer,
          restaurant,
          total: orderFinalPrice,
          items: orderItems,
        })
      );
      console.log(order);
      // Trigger subscription
      await this.pubsub.publish(NEW_PENDING_ORDER, {
        pendingOrders: { order, ownerId: restaurant.ownerId },
      });
      return {
        ok: true,
        orderId: order.id,
      };
    } catch {
      return {
        ok: false,
        error: "Cannot create order",
      };
    }
  }

  async getOrders(user: User, { status }: GetOrdersInput): Promise<GetOrdersOutput> {
    try {
      let orders: Order[];
      // Client Orders
      if (user.role === UserRole.Client) {
        orders = await this.orders.find({
          where: {
            customer: user,
            ...(status && { status }),
          },
        });
        // Delivery Man Orders
      } else if (user.role === UserRole.Delivery) {
        orders = await this.orders.find({
          where: {
            customer: user,
            ...(status && { status }),
          },
        });
        // Restaurant Owner Orders
      } else if (user.role === UserRole.Owner) {
        const restaurants = await this.restaurants.find({
          where: {
            owner: user,
            ...(status && { status }),
          },
          relations: ["orders"],
        });
        orders = restaurants.map((restaurant) => restaurant.orders).flat(1);
        if (status) {
          orders = orders.filter((order) => order.status === status);
        }
      }
      return {
        ok: true,
        orders,
      };
    } catch {
      return {
        ok: false,
        error: "Cannot Get Orders",
      };
    }
  }

  // Check user credentials
  canSeeOrder(user: User, order: Order): boolean {
    let canSee = true;
    if (user.role === UserRole.Client && order.customerId !== user.id) {
      canSee = false;
    }
    if (user.role === UserRole.Delivery && order.driverId !== user.id) {
      canSee = false;
    }
    if (user.role === UserRole.Owner && order.restaurant.ownerId !== user.id) {
      canSee = false;
    }
    return canSee;
  }

  async getOrder(
    user: User,
    // { item: newItemName } will let us use new name for the destructed item
    { id: orderId }: GetOrderInput
  ): Promise<GetOrderOutput> {
    try {
      const order = await this.orders.findOne(orderId, {
        relations: ["restaurant"],
      });
      if (!order) {
        return {
          ok: false,
          error: "Order not found",
        };
      }
      if (!this.canSeeOrder(user, order)) {
        return {
          ok: false,
          error: "You cannot see that",
        };
      }
      return {
        ok: true,
        order: order,
      };
    } catch {
      return {
        ok: false,
        error: "Cannot Get Order",
      };
    }
  }

  async editOrder(user: User, { id: orderId, status }: EditOrderInput): Promise<EditOrderOutput> {
    try {
      const order = await this.orders.findOne(orderId);
      if (!order) {
        return {
          ok: false,
          error: "User not found",
        };
      }
      if (!this.canSeeOrder(user, order)) {
        return {
          ok: false,
          error: "You can't see that",
        };
      }
      // Set the edit allowance
      let canEdit = true;
      // Customer cannot edit
      if (user.role === UserRole.Client) {
        canEdit = false;
      }
      // Restaurant owner's edit
      if (user.role === UserRole.Owner) {
        if (status !== OrderStatus.Cooking && status !== OrderStatus.Cooked) {
          canEdit = false;
        }
      }
      // Delivery man's edit
      if (user.role === UserRole.Delivery) {
        if (status !== OrderStatus.PickedUp && status !== OrderStatus.Delivered) {
          canEdit = false;
        }
      }
      if (!canEdit) {
        return {
          ok: false,
          error: "You are not allowed to do that",
        };
      }
      await this.orders.save({
        id: orderId,
        status,
      });
      const newOrder = { ...order, status };
      if (user.role === UserRole.Owner) {
        if (status === OrderStatus.Cooked) {
          await this.pubsub.publish(NEW_COOKED_ORDER, {
            cookedOrders: newOrder,
          });
        }
      }
      await this.pubsub.publish(NEW_ORDER_UPDATE, { orderUpdates: newOrder });
      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: "Cannot Edit Order",
      };
    }
  }

  async takeOrder(driver: User, { id: orderId }: TakeOrderInput): Promise<TakeOrderOutput> {
    try {
      const order = await this.orders.findOne(orderId);
      if (!order) {
        return {
          ok: false,
          error: "Order not found",
        };
      }
      if (order.driver) {
        return {
          ok: false,
          error: "This order already has a driver",
        };
      }
      await this.orders.save({
        id: orderId,
        driver,
      });
      await this.pubsub.publish(NEW_ORDER_UPDATE, {
        orderUpdates: { ...order, driver },
      });
      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: "Cannot take order",
      };
    }
  }
}
