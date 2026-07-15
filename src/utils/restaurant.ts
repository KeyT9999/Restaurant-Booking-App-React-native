export function getRestaurantId(restaurant: any): string | null {
  const id =
    restaurant?.id ||
    restaurant?._id ||
    restaurant?.restaurantId ||
    restaurant?.restaurant?._id ||
    restaurant?.restaurant?.id;

  return typeof id === 'string' && id.trim().length > 0 ? id : null;
}
