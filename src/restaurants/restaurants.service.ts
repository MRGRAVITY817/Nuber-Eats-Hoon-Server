import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Raw, Repository } from 'typeorm';
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
import { CategoryRepository } from './repositories/category.respository';

// Service should have Injectable decorator to get injected
@Injectable()
export class RestaurantService {
  constructor(
    // Inject repository with predefined entity
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,

    private readonly categories: CategoryRepository,

    @InjectRepository(Dish)
    private readonly dishes: Repository<Dish>,
  ) {}

  getAll(): Promise<Restaurant[]> {
    return this.restaurants.find();
  }

  async createRestaurant(
    owner: User,
    createRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    // .create() doesn't touch a DB, just making an instance
    try {
      const newRestaurant = this.restaurants.create(createRestaurantInput);
      newRestaurant.owner = owner;
      const category = await this.categories.getOrCreate(
        createRestaurantInput.categoryName,
      );
      newRestaurant.category = category;
      await this.restaurants.save(newRestaurant);
      return {
        ok: true,
        restaurantId: newRestaurant.id,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not create restaurant',
      };
    }
  }

  async editRestaurant(
    owner: User,
    editRestaurantInput: EditRestaurantInput,
  ): Promise<EditRestaurantOutput> {
    try {
      const restaurant = await this.restaurants.findOne(
        editRestaurantInput.restaurantId,
        // This load only ids, not the object
        { loadRelationIds: true },
      );
      // Check if theres a valid restaurant
      if (!restaurant) {
        return {
          ok: false,
          error: 'Restaurant not found',
        };
      }
      // Check if user is valid owner
      if (owner.id !== restaurant.ownerId) {
        return {
          ok: false,
          error: "You can't edit a restaurant that you don't own",
        };
      }
      let category: Category = null;
      if (editRestaurantInput.categoryName) {
        category = await this.categories.getOrCreate(
          editRestaurantInput.categoryName,
        );
      }
      await this.restaurants.save([
        {
          id: editRestaurantInput.restaurantId,
          ...editRestaurantInput,
          // if category exists, return an object {category}
          ...(category && { category }),
        },
      ]);
      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not edit Restaurant',
      };
    }
  }

  async deleteRestaurant(
    owner: User,
    { restaurantId }: DeleteRestaurantInput,
  ): Promise<DeleteRestaurantOutput> {
    try {
      const restaurant = await this.restaurants.findOne(
        restaurantId,
        // This load only ids, not the object
        { loadRelationIds: true },
      );
      // Check if theres a valid restaurant
      if (!restaurant) {
        return {
          ok: false,
          error: 'Restaurant not found',
        };
      }
      // Check if user is valid owner
      if (owner.id !== restaurant.ownerId) {
        return {
          ok: false,
          error: "You can't delete a restaurant that you don't own",
        };
      }
      await this.restaurants.delete(restaurantId);
      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not delete Restaurant',
      };
    }
  }

  // Category services
  async allCategories(): Promise<AllCategoriesOutput> {
    try {
      const categories = await this.categories.find();
      return {
        ok: true,
        categories,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not load categories',
      };
    }
  }

  countRestaurants(category: Category) {
    return this.restaurants.count({ category });
  }

  async findCategoryBySlug({
    slug,
    page,
  }: CategoryInput): Promise<CategoryOutput> {
    try {
      const category = await this.categories.findOne(
        { slug },
        // { relations: ['restaurants'] },
      );
      if (!category) {
        return {
          ok: false,
          error: 'Category not found',
        };
      }
      const restaurants = await this.restaurants.find({
        where: {
          category,
        },
        take: 25,
        skip: (page - 1) * 25,
      });
      category.restaurants = restaurants;
      const totalResults = await this.countRestaurants(category);
      return {
        ok: true,
        category,
        totalPages: Math.ceil(totalResults / 25),
      };
    } catch {
      return {
        ok: false,
        error: 'Could not load category',
      };
    }
  }

  async allRestaurants({ page }: RestaurantsInput): Promise<RestaurantsOutput> {
    try {
      const [restaurants, totalResults] = await this.restaurants.findAndCount({
        skip: (page - 1) * 6,
        take: 6,
        order: {
          isPromoted: 'DESC',
        },
      });
      return {
        ok: true,
        results: restaurants,
        totalPages: Math.ceil(totalResults / 6),
        totalResults,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not load Restaurants',
      };
    }
  }

  async findRestaurantsByCategory({
    page,
    categoryId,
  }: ByCategoryInput): Promise<ByCategoryOutput> {
    try {
      const [restaurants, totalResults] = await this.restaurants.findAndCount({
        skip: (page - 1) * 6,
        take: 6,
        order: {
          isPromoted: 'DESC',
        },
        where: {
          categoryId,
        },
      });
      return {
        ok: true,
        results: restaurants,
        totalPages: Math.ceil(totalResults / 6),
        totalResults,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not load Restaurants',
      };
    }
  }

  async findRestaurantById({
    restaurantId,
  }: RestaurantInput): Promise<RestaurantOutput> {
    try {
      const restaurant = await this.restaurants.findOne(restaurantId, {
        relations: ['menu'],
      });
      if (!restaurant) {
        return {
          ok: false,
          error: 'Restaurant not found',
        };
      }
      return {
        ok: true,
        restaurant,
      };
    } catch (error) {
      return {
        ok: false,
        error: 'Cannot find restaurant',
      };
    }
  }

  async searchRestaurantByName({
    query,
  }: SearchRestaurantInput): Promise<SearchRestaurantOutput> {
    try {
      const [restaurants, totalResults] = await this.restaurants.findAndCount({
        where: {
          // Raw() will let us use raw SQL statements
          name: Raw(name => `${name} ILIKE '%${query}%'`),
        },
      });
      return {
        ok: true,
        restaurant: restaurants,
        totalResults,
        totalPages: Math.ceil(totalResults / 25),
      };
    } catch (error) {
      return {
        ok: false,
        error: 'Could not search for restaurants',
      };
    }
  }

  async myRestaurants(owner: User): Promise<MyRestaurantsOutput> {
    try {
      const restaurants = await this.restaurants.find({ owner });
      return {
        ok: true,
        restaurants,
      };
    } catch {
      return {
        ok: false,
        error: 'Cannot find owner restaurants',
      };
    }
  }

  async myRestaurant(
    owner: User,
    { id }: MyRestaurantInput,
  ): Promise<MyRestaurantOutput> {
    try {
      const restaurant = await this.restaurants.findOne(
        { owner, id },
        { relations: ['menu', 'orders'] },
      );
      return {
        ok: true,
        restaurant,
      };
    } catch {
      return {
        ok: false,
        error: 'Cannot find restaurants',
      };
    }
  }

  async createDish(
    owner: User,
    createDishInput: CreateDishInput,
  ): Promise<CreateDishOutput> {
    try {
      const restaurant = await this.restaurants.findOne(
        createDishInput.restaurantId,
      );
      if (!restaurant) {
        return {
          ok: false,
          error: 'Restaurant not found',
        };
      }
      if (owner.id !== restaurant.ownerId) {
        return {
          ok: false,
          error: "You can't do that",
        };
      }
      await this.dishes.save(
        this.dishes.create({ ...createDishInput, restaurant }),
      );
      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not create dish',
      };
    }
  }

  async editDish(
    owner: User,
    editDishInput: EditDishInput,
  ): Promise<EditDishOutput> {
    try {
      const dish = await this.dishes.findOne(editDishInput.dishId);
      if (!dish) {
        return {
          ok: false,
          error: 'Dish not found',
        };
      }
      if (dish.restaurant.ownerId !== owner.id) {
        return {
          ok: false,
          error: 'You cannot do that',
        };
      }
      await this.dishes.save([
        {
          id: editDishInput.dishId,
          ...editDishInput,
        },
      ]);
      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: 'Cannot edit dish',
      };
    }
  }

  async deleteDish(
    owner: User,
    { dishId }: DeleteDishInput,
  ): Promise<DeleteDishOutput> {
    try {
      const dish = await this.dishes.findOne(dishId);
      if (!dish) {
        return {
          ok: false,
          error: 'Dish not found',
        };
      }
      if (dish.restaurant.ownerId !== owner.id) {
        return {
          ok: false,
          error: 'You cannot do that',
        };
      }
      await this.dishes.delete(dishId);
      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: 'Cannot delete dish',
      };
    }
  }
}
