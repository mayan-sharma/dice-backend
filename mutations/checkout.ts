import { KeystoneContext } from "@keystone-next/types";
import { CartItemCreateInput, OrderCreateInput } from '../.keystone/schema-types';
import stripeConfig from "../lib/stripe";
import { Order } from "../schemas/Order";
import { Session } from "../types";

export default async function checkout(
    root: any, 
    { token }: { token: string }, 
    context: KeystoneContext
): Promise<OrderCreateInput> {

    try {
        const userId = context.session.itemId;
    
        if (!userId) {
            throw new Error('You must be signed in to order!');
        }
    
        const user = await context.lists.User.findOne({
            where: { id: userId },
            resolveFields: `
                id
                name
                email
                cart {
                    id
                    quantity
                    product {
                        name
                        price
                        description
                        id
                        photo {
                            id
                            image {
                                id
                                publicUrlTransformed
                            }
                        }
                    }
                }
            `
        });
    
        const cartItems = user.cart.filter(cartItem => cartItem.product);
        const amount = cartItems.reduce((total: number, cartItem: CartItemCreateInput) => 
            total + cartItem.quantity * cartItem.product.price, 0);
    
        const charge = await stripeConfig.paymentIntents.create({
            amount,
            currency: 'INR',
            confirm: true,
            payment_method: token
        });

        // convert cart item to order items
        const orderItems = cartItems.map(cartItem => {
            const orderItem = {
                name: cartItem.product.name,
                description: cartItem.product.description,
                price: cartItem.product.price,
                quantity: cartItem.quantity,
                photo: { connect: { id: cartItem.product.photo.id } },
            }

            return orderItem;
        });

        const order = await context.lists.Order.createOne({
            data: {
                total: charge.amount,
                charge: charge.id,
                items: { create: orderItems },
                user: { connect: { id: userId } }
            }
        });

        // delte cart items
        const cartItemIds = user.cart.map(cartItem => cartItem.id);
        await context.lists.CartItem.deleteMany({
            ids: cartItemIds
        });

        return order;

    } catch(err) {
        console.error(err);
    }
}