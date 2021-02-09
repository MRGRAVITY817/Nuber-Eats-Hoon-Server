import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { Role } from 'src/auth/role.decorator';
import { User } from 'src/users/entities/user.entity';
import { AllCategoriesOutput } from './dtos/all-categorioes.dto';
import { ByCategoryInput, ByCategoryOutput } from './dtos/by-category.dto';
import { CategoryInput, CategoryOutput } from './dtos/category.dto';
import { CreateDishInput, CreateDishOutput } from './dtos/create-dish.dto';
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from './dtos/create-restaurant.dto';
import { DeleteDishInput, DeleteDishOutput } from './dtos/delete-dish.dto';
import {
  DeleteRestaurantInput,
  DeleteRestaurantOutput,
} from './dtos/delete-restaurant.dto';
import { EditDishInput, EditDishOutput } from './dtos/edit-dish.dto';
import {
  EditRestaurantInput,
  EditRestaurantOutput,
} from './dtos/edit-restaurant.dto';
import {
  MyRestaurantInput,
  MyRestaurantOutput,
} from './dtos/my-restaurant.dto';
import { MyRestaurantsOutput } from './dtos/my-restaurants.dto';
import { RestaurantInput, RestaurantOutput } from './dtos/restaurant.dto';
import { RestaurantsInput, RestaurantsOutput } from './dtos/restaurants.dto';
import {
  SearchRestaurantInput,
  SearchRestaurantOutput,
} from './dtos/search-restaurant.dto';
import { Category } from './entities/category.entity';
import { Dish } from './entities/dish.entity';
import { Restaurant } from './entities/restaurants.entity';
import { RestaurantService } from './restaurants.service';

@Resolver(of => Restaurant)
export class RestaurantResolver {
  constructor(private readonly restaurantService: RestaurantService) {}

  @Query(returns => RestaurantsOutput)
  restaurants(
    @Args('input') restaurantInput: RestaurantsInput,
  ): Promise<RestaurantsOutput> {
    return this.restaurantService.allRestaurants(restaurantInput);
  }

  @Query(returns => RestaurantOutput)
  restaurant(
    @Args('input') restaurantInput: RestaurantInput,
  ): Promise<RestaurantOutput> {
    return this.restaurantService.findRestaurantById(restaurantInput);
  }

  @Role(['Owner'])
  @Mutation(returns => CreateRestaurantOutput)
  createRestaurant(
    @AuthUser() authUser: User,
    @Args('input') createRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    return this.restaurantService.createRestaurant(
      authUser,
      createRestaurantInput,
    );
  }

  @Role(['Owner'])
  @Mutation(returns => EditRestaurantOutput)
  editRestaurant(
    @AuthUser() owner: User,
    @Args('input') editRestaurantInput: EditRestaurantInput,
  ): Promise<EditRestaurantOutput> {
    return this.restaurantService.editRestaurant(owner, editRestaurantInput);
  }

  @Role(['Owner'])
  @Mutation(returns => EditRestaurantOutput)
  deleteRestaurant(
    @AuthUser() owner: User,
    @Args('input') deleteRestaurantInput: DeleteRestaurantInput,
  ): Promise<DeleteRestaurantOutput> {
    return this.restaurantService.deleteRestaurant(
      owner,
      deleteRestaurantInput,
    );
  }

  @Query(returns => SearchRestaurantOutput)
  searchRestaurant(
    @Args('input') searchRestaurantInput: SearchRestaurantInput,
  ): Promise<SearchRestaurantOutput> {
    return this.restaurantService.searchRestaurantByName(searchRestaurantInput);
  }

  @Query(returns => ByCategoryOutput)
  categoryRestaurant(
    @Args('input') byCategoryInput: ByCategoryInput,
  ): Promise<ByCategoryOutput> {
    return this.restaurantService.findRestaurantsByCategory(byCategoryInput);
  }

  @Query(returns => MyRestaurantsOutput)
  @Role(['Owner'])
  myRestaurants(@AuthUser() owner: User): Promise<MyRestaurantsOutput> {
    return this.restaurantService.myRestaurants(owner);
  }

  @Query(returns => MyRestaurantOutput)
  @Role(['Owner'])
  myRestaurant(
    @AuthUser() owner: User,
    @Args('input') myRestaurantInput: MyRestaurantInput,
  ): Promise<MyRestaurantOutput> {
    return this.restaurantService.myRestaurant(owner, myRestaurantInput);
  }
}

// Resolver of category
@Resolver(of => Category)
export class CategoryResolver {
  constructor(private readonly restaurantService: RestaurantService) {}
  // Dynamic Query
  @ResolveField(returns => Number)
  restaurantCount(@Parent() category: Category): Promise<number> {
    return this.restaurantService.countRestaurants(category);
  }

  // Return all the categories
  @Query(returns => AllCategoriesOutput)
  allCategories(): Promise<AllCategoriesOutput> {
    return this.restaurantService.allCategories();
  }

  @Query(returns => CategoryOutput)
  category(@Args('input') categoryInput: CategoryInput) {
    return this.restaurantService.findCategoryBySlug(categoryInput);
  }
}

@Resolver(of => Dish)
export class DishResolver {
  constructor(private readonly restaurantService: RestaurantService) {}

  @Role(['Owner'])
  @Mutation(type => CreateDishOutput)
  createDish(
    @AuthUser() owner: User,
    @Args('input')
    createDishInput: CreateDishInput,
  ): Promise<CreateDishOutput> {
    return this.restaurantService.createDish(owner, createDishInput);
  }

  @Role(['Owner'])
  @Mutation(type => EditDishOutput)
  editDish(
    @AuthUser() owner: User,
    @Args('input')
    editDishInput: EditDishInput,
  ): Promise<EditDishOutput> {
    return this.restaurantService.editDish(owner, editDishInput);
  }

  @Role(['Owner'])
  @Mutation(type => DeleteDishOutput)
  deleteDish(
    @AuthUser() owner: User,
    @Args('input')
    deleteDishInput: DeleteDishInput,
  ): Promise<DeleteDishOutput> {
    return this.restaurantService.deleteDish(owner, deleteDishInput);
  }
}
